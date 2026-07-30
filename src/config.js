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
  moderationModel: process.env.MODERATION_MODEL || "claude-opus-5",
};

export const RULES_CHANNEL_NAME = "rules";

export const STRIKE_TIMEOUTS_MS = [5 * 60 * 1000, 24 * 60 * 60 * 1000];
export const OFFENSE_RESET_MS = 30 * 24 * 60 * 60 * 1000;
