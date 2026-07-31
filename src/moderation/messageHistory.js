// In-memory per-(guild, user) rolling window of recent messages, used to
// spot spam that a single message viewed in isolation can't reveal (e.g.
// the same message repeated several times in a row). Not persisted —
// resets on restart, which is fine since spam detection only cares about
// the last few seconds/messages anyway.
const HISTORY_LIMIT = 5;
const FLOOD_WINDOW_MS = 10_000;
const FLOOD_REPEAT_THRESHOLD = 3;

const historyByUser = new Map();

function key(guildId, userId) {
  return `${guildId}:${userId}`;
}

/** Records a message and returns the updated history (oldest→newest, including this one). */
export function recordMessage(guildId, userId, content) {
  const k = key(guildId, userId);
  const list = historyByUser.get(k) || [];
  list.push({ content, timestamp: Date.now() });
  if (list.length > HISTORY_LIMIT) list.shift();
  historyByUser.set(k, list);
  return list;
}

/** True if the last few messages are the same text, all within the flood window. */
export function isRepeatedFlood(history) {
  if (history.length < FLOOD_REPEAT_THRESHOLD) return false;
  const recent = history.slice(-FLOOD_REPEAT_THRESHOLD);
  const now = Date.now();
  if (!recent.every((m) => now - m.timestamp <= FLOOD_WINDOW_MS)) return false;
  const normalized = recent.map((m) => m.content.trim().toLowerCase());
  return normalized.every((c) => c === normalized[0]);
}
