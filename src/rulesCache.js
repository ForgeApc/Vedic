import { RULES_CHANNEL_NAME } from "./config.js";

const rulesTextByGuild = new Map();

export function getRulesChannel(guild) {
  return guild.channels.cache.find(
    (channel) =>
      channel.isTextBased() &&
      !channel.isThread() &&
      channel.name.toLowerCase() === RULES_CHANNEL_NAME
  );
}

export async function refreshRules(guild) {
  const rulesChannel = getRulesChannel(guild);
  if (!rulesChannel) {
    console.warn(
      `[rules] Guild "${guild.name}" (${guild.id}) has no #${RULES_CHANNEL_NAME} channel — moderation and Q&A are disabled until one exists.`
    );
    rulesTextByGuild.delete(guild.id);
    return;
  }

  const messages = await rulesChannel.messages.fetch({ limit: 100 });
  const text = [...messages.values()]
    .reverse()
    .map((message) => message.content)
    .filter(Boolean)
    .join("\n");

  rulesTextByGuild.set(guild.id, text);
}

export function getRulesText(guildId) {
  return rulesTextByGuild.get(guildId) || "";
}

export function isRulesChannel(channel) {
  return channel.isTextBased() && channel.name?.toLowerCase() === RULES_CHANNEL_NAME;
}
