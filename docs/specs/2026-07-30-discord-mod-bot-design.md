# Discord AI Moderation + Q&A Bot — Design

## Summary

A Discord bot for a single-topic community server that:

1. Watches messages, escalates punishment for rule-breaking (5-min timeout → 24h timeout → ban), and tells the offender why when banned.
2. Answers on-topic questions automatically, without needing to be mentioned.
3. Takes its rules *and* its topic from one admin-maintained `#rules` channel — no rules are hardcoded in the bot.

## Stack

- **Runtime**: Node.js
- **Discord**: discord.js v14
- **AI**: Anthropic Claude API (`@anthropic-ai/sdk`), model `claude-opus-5` by default — overridable via env var (e.g. to a cheaper/faster model) if an admin wants to trade accuracy for cost on a high-traffic server.
- **Storage**: SQLite via `better-sqlite3` — single local file, no external DB service to run. Stores per-user offense history so counts survive bot restarts.

## Rules channel

- Convention: a text channel literally named `rules` (case-insensitive) is required in the guild. No setup command needed.
- The bot reads that channel's message history and concatenates it into a single "rules & topic" text block, used as context for both moderation and Q&A.
- Cached in memory per guild; refreshed on bot startup and automatically whenever a message is created, edited, or deleted in `#rules`.
- If a guild has no `#rules` channel yet, the bot logs a warning and does nothing in that guild until one exists (fails safe, not silently).

## Moderation pipeline (per message)

Runs on every message in every channel except `#rules` itself. Skipped entirely for members with Manage Messages, Kick Members, or Ban Members permission (mods/admins are exempt).

1. **Keyword filter (no API call)** — a static list of severe/obvious terms (slurs, explicit obvious profanity). A hit is instant, high-confidence "bad" — skips straight to step 3.
2. **Ambiguous trigger check (no API call)** — a broader static list of milder trigger words/patterns (insults, aggressive phrasing) OR the message looking like a question (starts with a question word, or contains "?"). Either condition routes the message to step 2b. Messages matching neither list, and not offense-worthy nor question-shaped, are skipped entirely — no AI call, no action.
3. **Combined Claude call** — for anything flagged as ambiguous or question-shaped, one call sends the message plus the current `#rules` text and asks for structured JSON:
   ```json
   { "is_violation": bool, "severity": "mild"|"severe", "reason": string,
     "is_question": bool, "answer": string|null }
   ```
   This keeps it to one API call per message that needs judgment, covering both moderation and Q&A in the same round trip.
4. **Act on the verdict**:
   - `is_violation: true` → go to punishment (below).
   - `is_question: true` and not a violation → bot replies in-channel with `answer`.
   - Neither → no action.

Severe keyword-filter hits and Claude `severity: "severe"` verdicts are both treated as one offense (not skipped to a harsher tier) — the severity distinction is for future tuning but doesn't change escalation logic in v1 (YAGNI: single escalation ladder).

## Escalation ladder

Tracked per `(guild_id, user_id)` in SQLite: `strike_count`, `last_offense_at`.

- If `last_offense_at` is more than 30 days ago, `strike_count` resets to 0 before applying the new offense.
- Strike 1 → **5-minute timeout**
- Strike 2 → **24-hour timeout**
- Strike 3 → **ban**

On every punishment:
- The bot DMs the user a short Claude-written explanation (which rule, why it was flagged) before applying the action. If the DM fails (e.g. DMs closed), the punishment still proceeds.
- The bot posts a brief public notice in the channel where the violation occurred (e.g. "*user* was timed out for 5 minutes for violating server rules.") so the action is visible without needing a separate mod-log channel.

## Q&A behavior

- Passive: any message shaped like a question is eligible (see trigger check above) — no mention or slash command required.
- The same Claude call that checks for a violation also judges topical relevance and drafts an answer using the `#rules` channel content as the source of truth for "what this server is about."
- Off-topic questions get `is_question: true` but the model is instructed to only set it when the question relates to the server's stated topic — off-topic chatter is left alone (`is_question: false`).

## Data model (SQLite)

```
offenses(guild_id TEXT, user_id TEXT, strike_count INTEGER, last_offense_at INTEGER,
         PRIMARY KEY (guild_id, user_id))
```

Rules text is cached in memory only (not persisted) — cheap to re-read from Discord on startup.

## Config

Environment variables (`.env`, see `.env.example`):
- `DISCORD_BOT_TOKEN`
- `ANTHROPIC_API_KEY`
- `MODERATION_MODEL` (optional, defaults to `claude-opus-5`)

## Out of scope for v1 (YAGNI)

- Web dashboard / per-guild config UI (channel name convention is enough).
- Configurable escalation ladder lengths (fixed 5min/24h/ban).
- Appeals/unban commands (admins can already do this natively in Discord).
- Multi-language support beyond whatever Claude handles naturally.
