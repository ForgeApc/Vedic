import "dotenv/config";

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  discordToken: required("DISCORD_BOT_TOKEN"),
  anthropicApiKey: required("ANTHROPIC_API_KEY"),
  moderationModel: process.env.MODERATION_MODEL || "claude-haiku-4-5",
};

// Private, auto-created channel (owner + bot only) where the AI's rules and
// topic config live — not a public channel members can read.
export const RULES_CHANNEL_NAME = "ai-prompt";

export const STRIKE_TIMEOUTS_MS = [5 * 60 * 1000, 24 * 60 * 60 * 1000];
export const OFFENSE_RESET_MS = 30 * 24 * 60 * 60 * 1000;
