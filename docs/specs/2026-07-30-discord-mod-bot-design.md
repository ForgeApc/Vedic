# Discord AI Moderation + Q&A Bot — Design

## Summary

A Discord bot for a single-topic community server that:

1. Watches messages, escalates punishment for rule-breaking (5-min timeout → 24h timeout → ban), and tells the offender why when banned.
2. Answers on-topic questions automatically, without needing to be mentioned.
3. Takes its rules *and* its topic from a private, auto-created `#ai-prompt` channel (owner + bot only) — no rules are hardcoded in the bot, and no member other than the owner can see or influence that config.

## Stack

- **Runtime**: Node.js
- **Discord**: discord.js v14
- **AI**: Anthropic Claude API (`@anthropic-ai/sdk`), model `claude-haiku-4-5` by default (fast/cheap, appropriate since every non-severe message now gets a Claude call — see Moderation pipeline) — overridable via `MODERATION_MODEL` for servers that want higher accuracy from an Opus/Sonnet-tier model instead. Request construction is model-aware: Haiku 4.5 doesn't support `output_config.effort` or adaptive/disabled thinking the way Opus/Sonnet 5-tier models do, so `src/moderation/aiJudge.js` builds different request params depending on which model is configured. Prompts are kept deliberately brief (both for lower token cost and lower latency, since this runs on nearly every message) and reduced `max_tokens` per call type (512 for judgment/Q&A, 150 for the punishment DM).

## Rules/topic channel

- A private text channel named `ai-prompt` (case-insensitive), auto-created by the bot on join (and on every startup, if missing) — **not** a convention the admin has to set up manually.
- Permission overwrites at creation: `@everyone` denied `ViewChannel`; the guild owner and the bot itself explicitly allowed `ViewChannel`/`SendMessages`/`ReadMessageHistory`. No other role or member — including other mods — can see or edit it. Requires the bot to have `Manage Channels`.
- On creation, the bot posts a short welcome message in the channel explaining what to write there.
- The bot reads that channel's message history and concatenates it into a single "rules & topic" text block, used as context for both moderation and Q&A.
- Cached in memory per guild; refreshed on bot startup and automatically whenever a message is created, edited, or deleted in `#ai-prompt`. `/refreshrules` re-creates the channel too if it was deleted, then re-reads it.
- If channel creation fails (e.g. missing `Manage Channels`), the bot logs a warning and does nothing in that guild until one exists (fails safe, not silently).

## Built-in severe-language baseline

Two independent layers, so a bad admin config (or none at all) can't disable basic safety:
1. **Keyword filter** (`src/moderation/keywordFilter.js`) — a static blocklist (`bad-words` package + a short self-harm-phrase list) that always triggers instant punishment, with zero dependency on the `#ai-prompt` content.
2. **System prompt baseline** — the Claude call is explicitly instructed to always flag slurs, hate speech, sexual content involving minors, and self-harm encouragement as `"severe"`, *regardless of what the rules/topic text says* — so even an empty or incomplete `#ai-prompt` channel still has this floor.

## Moderation pipeline (per message)

Runs on every message in every channel except `#ai-prompt` itself, for every member — **including admins/mods and the server owner** (per explicit request; the original design exempted staff, but that made testing confusing and was changed). Note Discord itself still hard-blocks two cases regardless of this bot's logic: bots can never act on the guild owner, and can never act on a member whose highest role is at or above the bot's own highest role — `punish()` catches that failure and replies explaining why the punishment couldn't be applied, rather than crashing silently.

1. **Keyword filter (no API call)** — a static list of severe/obvious terms (slurs, explicit obvious profanity, self-harm encouragement). A hit is instant, high-confidence "bad" — skips straight to punishment without an AI call.
2. **Combined Claude call** — every other non-empty message is sent to Claude along with the current `#ai-prompt` text and asks for structured JSON:
   ```json
   { "is_violation": bool, "severity": "mild"|"severe", "reason": string,
     "is_question": bool, "answer": string|null }
   ```
   This keeps it to one API call per message not caught by the keyword filter, covering both moderation and Q&A in the same round trip, and — critically — lets admins enforce *arbitrary* custom rules written in `#ai-prompt` (not just profanity), since Claude sees every message against the actual rules text. An earlier version pre-filtered which messages reached Claude using a generic trigger-word/question heuristic; that silently broke custom rules like "no saying hi" (which match neither heuristic) — removed in favor of always calling Claude once the fast keyword filter has ruled out the obvious case.
3. **Act on the verdict**:
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

On every punishment, in order:
1. The bot DMs the user a short Claude-written explanation of which rule they broke and why. If the DM fails (e.g. DMs closed), this step is skipped silently — the next step still gets the word out.
2. The bot **replies to the offending message itself** with that same explanation plus the resulting action (e.g. "*(explanation)* — user#1234 is being timed out for 5 minutes."), so it's visible in-channel, tied to the exact message, without needing a separate mod-log channel.
3. Only after both of the above does the bot apply the actual timeout/ban — so the user (and channel) sees *why* before the action lands.

## Q&A behavior

- Passive: any non-severe message is eligible — no mention or slash command required.
- The same Claude call that checks for a violation also judges topical relevance and drafts an answer using the `#ai-prompt` channel content as the source of truth for "what this server is about."
- Off-topic questions get `is_question: true` but the model is instructed to only set it when the question relates to the server's stated topic — off-topic chatter is left alone (`is_question: false`).

## Admin commands

Guild-scoped slash commands, registered on bot startup and on joining a new guild. Restricted via Discord's own permission system (`default_member_permissions: ModerateMembers`) and hidden from `@everyone` by default — server owners can still widen access via Discord's integration settings, same as any other bot command.

- `/strikes user:<member>` — shows the member's current strike count, when the last offense was, and when it resets to 0.
- `/resetstrikes user:<member>` — clears a member's strike history back to zero.
- `/refreshrules` — forces an immediate re-read of `#ai-prompt` instead of waiting for the next edit event.
- `/ai question:<text>` — **not permission-restricted** (available to every member). A direct fallback to the passive Q&A: the user explicitly asks, and Claude answers using the `#ai-prompt`/topic content as context, without the topical-relevance gate the passive path applies (an explicit ask doesn't need to prove it's on-topic).
- `/addrole user:<member> role:<role>` / `/removerole user:<member> role:<role>` — restricted via `ManageRoles` instead of `ModerateMembers`. Both refuse to touch `@everyone` or integration-managed roles, and enforce role hierarchy on both sides: the invoker can't grant/remove a role at or above their own highest role (unless they're the guild owner), and the bot refuses if the target role is at or above its own highest role (Discord's API would reject it anyway — this gives a clear error instead of a silent failure).

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
- `MODERATION_MODEL` (optional, defaults to `claude-haiku-4-5`)

## Out of scope for v1 (YAGNI)

- Web dashboard / per-guild config UI (channel name convention is enough).
- Configurable escalation ladder lengths (fixed 5min/24h/ban).
- Appeals/unban commands (admins can already do this natively in Discord).
- Multi-language support beyond whatever Claude handles naturally.
