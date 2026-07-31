import { Filter } from "bad-words";

const profanityFilter = new Filter();

// bad-words' base list is profanity-focused; add phrases that encourage
// self-harm since those need instant, high-confidence action too.
const SEVERE_PHRASES = ["kill yourself", "kys", "neck yourself", "go die"];

export function isSevereViolation(content) {
  const lower = content.toLowerCase();
  if (SEVERE_PHRASES.some((phrase) => lower.includes(phrase))) return true;
  return profanityFilter.isProfane(content);
}
