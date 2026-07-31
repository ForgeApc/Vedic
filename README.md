# Discord AI Moderation + Q&A Bot

A Discord bot that moderates a community server and answers on-topic questions,
both driven by an admin-maintained `#rules` channel — no rules or topic are
hardcoded in the bot itself.

See [`docs/specs/2026-07-30-discord-mod-bot-design.md`](docs/specs/2026-07-30-discord-mod-bot-design.md)
for the full design.

## What it does

- **Moderation**: a fast keyword filter catches obvious violations instantly;
  every other message is sent to Claude along with the `#rules` content for a
  judgment call, so custom rules work too, not just profanity. Escalation:
  5-minute timeout → 24-hour timeout → ban, with a 30-day reset on good
  behavior. The offender gets a DM and an in-channel reply explaining why
  before the punishment lands.
- **Q&A**: any message that looks like a question about the server's topic
  gets answered automatically — no mention or command needed.
- Applies to **everyone**, including admins/mods and the server owner — there
  is no staff exemption. (Discord itself still refuses to let any bot act on
  the guild owner, or on a member whose role outranks the bot's own; the bot
  tells you when that happens instead of failing silently.)
- **Admin commands**: `/strikes`, `/resetstrikes`, `/refreshrules` (require
  Moderate Members), and `/addrole`, `/removerole` (require Manage Roles).
- **`/ai question:<text>`** — open to everyone. A direct way to ask the bot
  something if you don't want to rely on the passive detection.

## Setup

1. **Create the bot** at the [Discord Developer Portal](https://discord.com/developers/applications):
   - New Application → Bot → enable the **Message Content Intent** and
     **Server Members Intent** under Privileged Gateway Intents.
   - Copy the bot token.
2. **Invite it to your server** with the `bot` and `applications.commands`
   scopes, and these permissions: Read Messages/View Channels, Send Messages,
   Moderate Members (timeout), Ban Members, Manage Roles.
   For `/addrole` and `/removerole` to work on a given role, the bot's own
   role must be positioned **above** that role in Server Settings > Roles.
3. **Create a `#rules` channel** in your server. Write your server's rules
   and a description of what the server is about — the bot reads this
   channel's content as the source of truth for both moderation and Q&A.
4. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Fill in `DISCORD_BOT_TOKEN` and `ANTHROPIC_API_KEY`.
5. **Install and run**:
   ```bash
   npm install
   npm start
   ```

Offense history is stored locally in `data/moderation.db` (SQLite) and
survives restarts.
