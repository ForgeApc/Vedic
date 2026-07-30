import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { OFFENSE_RESET_MS } from "./config.js";

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "moderation.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS offenses (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    strike_count INTEGER NOT NULL DEFAULT 0,
    last_offense_at INTEGER NOT NULL,
    PRIMARY KEY (guild_id, user_id)
  )
`);

const getStmt = db.prepare(
  "SELECT strike_count, last_offense_at FROM offenses WHERE guild_id = ? AND user_id = ?"
);
const upsertStmt = db.prepare(`
  INSERT INTO offenses (guild_id, user_id, strike_count, last_offense_at)
  VALUES (?, ?, ?, ?)
  ON CONFLICT (guild_id, user_id)
  DO UPDATE SET strike_count = excluded.strike_count, last_offense_at = excluded.last_offense_at
`);
const deleteStmt = db.prepare("DELETE FROM offenses WHERE guild_id = ? AND user_id = ?");

/**
 * Records a new offense for a user, applying the 30-day reset rule,
 * and returns the resulting strike count (1-indexed).
 */
export function recordOffense(guildId, userId) {
  const now = Date.now();
  const existing = getStmt.get(guildId, userId);

  const isStale = existing && now - existing.last_offense_at > OFFENSE_RESET_MS;
  const nextStrike = !existing || isStale ? 1 : existing.strike_count + 1;

  upsertStmt.run(guildId, userId, nextStrike, now);
  return nextStrike;
}

/** Returns { strike_count, last_offense_at } for a user, or null if clean. */
export function getOffense(guildId, userId) {
  return getStmt.get(guildId, userId) || null;
}

/** Clears a user's strike history. */
export function resetOffense(guildId, userId) {
  deleteStmt.run(guildId, userId);
}
