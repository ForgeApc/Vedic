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

const SYSTEM_PROMPT = `You moderate a Discord server and answer on-topic questions.

You will be given the server's #rules channel content (which also describes what
the server is about) and a single message to evaluate.

Judge two independent things about the message:

1. Moderation: does it violate the rules above? Consider severe things (slurs,
   explicit harassment, encouraging self-harm) as "severe", and lesser rule
   violations (insults, mild harassment, spam) as "mild". If it's fine, set
   is_violation to false.
2. Q&A: is this message a genuine question about the server's stated topic?
   If so, write a short, accurate answer grounded in the rules/topic text and
   general knowledge. If it's off-topic, rhetorical, or not actually a
   question, set is_question to false and answer to null.

A message can be a violation and not a question, a question and not a
violation, both, or neither.`;

/**
 * Sends a message + the server's rules/topic text to Claude for a combined
 * moderation + Q&A verdict, in a single round trip.
 */
export async function judgeMessage({ content, rulesText, authorTag }) {
  const response = await client.messages.create({
    model: config.moderationModel,
    max_tokens: 1024,
    ...extraParams(RESPONSE_SCHEMA),
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `#rules channel content:\n"""\n${rulesText || "(no rules configured)"}\n"""\n\nMessage from ${authorTag}:\n"""\n${content}\n"""`,
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
    max_tokens: 300,
    ...extraParams(),
    system:
      "You write short, direct, non-judgmental explanations to Discord users about " +
      "why they were moderated. Reference the specific rule they broke. Keep it under 4 sentences.",
    messages: [
      {
        role: "user",
        content: `#rules channel content:\n"""\n${rulesText || "(no rules configured)"}\n"""\n\nThis user received: ${strikeLabel}.\nViolation severity: ${severity}.\nWhy it was flagged: ${violationReason}\n\nWrite the DM explanation.`,
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
    max_tokens: 1024,
    ...extraParams(),
    system:
      "You answer questions for a Discord server. Use the #rules channel content below " +
      "(which describes what the server is about) as context when relevant. Answer " +
      "directly and concisely.",
    messages: [
      {
        role: "user",
        content: `#rules channel content:\n"""\n${rulesText || "(no rules configured)"}\n"""\n\nQuestion: ${question}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    return "I can't help with that one.";
  }

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.text ?? "I couldn't come up with an answer to that.";
}
