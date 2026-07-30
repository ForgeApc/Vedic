import { Filter } from "bad-words";

const profanityFilter = new Filter();

// bad-words' base list is profanity-focused; add phrases that encourage
// self-harm since those need instant, high-confidence action too.
const SEVERE_PHRASES = ["kill yourself", "kys", "neck yourself", "go die"];

const TRIGGER_WORDS = [
  "idiot",
  "stupid",
  "dumb",
  "shut up",
  "trash",
  "loser",
  "noob",
  "toxic",
  "pathetic",
  "worthless",
  "hate you",
];

const QUESTION_STARTERS = [
  "what",
  "why",
  "how",
  "when",
  "where",
  "who",
  "which",
  "can",
  "could",
  "does",
  "do",
  "is",
  "are",
  "should",
  "would",
];

export function isSevereViolation(content) {
  const lower = content.toLowerCase();
  if (SEVERE_PHRASES.some((phrase) => lower.includes(phrase))) return true;
  return profanityFilter.isProfane(content);
}

export function looksLikeQuestion(content) {
  const trimmed = content.trim().toLowerCase();
  if (!trimmed) return false;
  if (trimmed.includes("?")) return true;
  const firstWord = trimmed.split(/\s+/)[0];
  return QUESTION_STARTERS.includes(firstWord);
}

export function isAmbiguous(content) {
  const lower = content.toLowerCase();
  if (TRIGGER_WORDS.some((word) => lower.includes(word))) return true;
  return looksLikeQuestion(content);
}
