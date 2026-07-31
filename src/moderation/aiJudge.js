import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";

const client = new Anthropic({ apiKey: config.anthropicApiKey });

// Haiku 4.5 (and other older models) don't support output_config.effort
// (errors) or adaptive/disabled thinking (thinking is just off by default
// unless explicitly enabled with a token budget). Opus/Sonnet 5-tier models
// support both. Build request params accordingly so MODERATION_MODEL can be
// swapped without breaking the API calls.
const isLegacyModel = config.moderationModel.includes("haiku");

function extraParams(schema) {
  const format = schema ? { format: { type: "json_schema", schema } } : undefined;

  if (isLegacyModel) {
    return format ? { output_config: format } : {};
  }

  return {
    thinking: { type: "disabled" },
    output_config: format ? { effort: "low", ...format } : { effort: "low" },
  };
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    is_violation: { type: "boolean" },
    severity: { type: "string", enum: ["mild", "severe"] },
    reason: { type: "string" },
    is_question: { type: "boolean" },
    answer: { anyOf: [{ type: "string" }, { type: "null" }] },
  },
  required: ["is_violation", "severity", "reason", "is_question", "answer"],
  additionalProperties: false,
};

// Kept brief: shorter prompts mean fewer tokens and faster responses, which
// matters since this runs on nearly every message. Baseline severe-language
// rule is built in here (not just the keyword filter) so it holds even if
// the admin's rules/topic text never mentions it.
const SYSTEM_PROMPT = `Moderate a Discord server and answer on-topic questions, using the rules/topic text given.

Always flag as "severe": slurs, hate speech, sexual content involving minors, and encouraging self-harm/suicide — regardless of what the rules say. Flag other rule breaks (insults, spam, custom rule violations) as "mild". Otherwise is_violation=false.

If the message is a genuine question about the server's topic, answer briefly (is_question=true). Otherwise is_question=false, answer=null.

A message can be a violation, a question, both, or neither.`;

/**
 * Sends a message + the server's rules/topic text to Claude for a combined
 * moderation + Q&A verdict, in a single round trip.
 */
export async function judgeMessage({ content, rulesText, authorTag }) {
  const response = await client.messages.create({
    model: config.moderationModel,
    max_tokens: 512,
    ...extraParams(RESPONSE_SCHEMA),
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Rules/topic:\n"""\n${rulesText || "(none set)"}\n"""\nMessage from ${authorTag}:\n"""\n${content}\n"""`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    return { is_violation: false, severity: "mild", reason: "", is_question: false, answer: null };
  }

  const textBlock = response.content.find((block) => block.type === "text");
  return JSON.parse(textBlock.text);
}

/**
 * Asks Claude to explain, in a short DM-able message, why a user was
 * punished — grounded in the rules text and the specific violation reason.
 */
export async function explainPunishment({ rulesText, violationReason, severity, strikeLabel }) {
  const response = await client.messages.create({
    model: config.moderationModel,
    max_tokens: 150,
    ...extraParams(),
    system:
      "Write a short (2-3 sentence), direct, non-judgmental explanation of why this " +
      "Discord user was moderated, referencing the specific rule broken.",
    messages: [
      {
        role: "user",
        content: `Rules/topic:\n"""\n${rulesText || "(none set)"}\n"""\nAction: ${strikeLabel} (${severity}). Reason: ${violationReason}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.text ?? `You were ${strikeLabel} for violating server rules.`;
}

/**
 * Directly answers a user-submitted question (via /ai), grounded in the
 * server's #rules/topic content. Unlike the passive Q&A path, this doesn't
 * gate on topical relevance — the user explicitly asked, so it just answers.
 */
export async function askQuestion({ question, rulesText }) {
  const response = await client.messages.create({
    model: config.moderationModel,
    max_tokens: 512,
    ...extraParams(),
    system: "Answer the question directly and concisely, using the server context below when relevant.",
    messages: [
      {
        role: "user",
        content: `Rules/topic:\n"""\n${rulesText || "(none set)"}\n"""\nQuestion: ${question}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    return "I can't help with that one.";
  }

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.text ?? "I couldn't come up with an answer to that.";
}
