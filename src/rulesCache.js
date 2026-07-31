import { ChannelType, PermissionFlagsBits } from "discord.js";
import { RULES_CHANNEL_NAME } from "./config.js";

const rulesTextByGuild = new Map();

const WELCOME_MESSAGE =
  "This channel is private — only the server owner and I can see it.\n\n" +
  "Write your server's moderation rules and a short description of what this " +
  "server is about below. I read this to decide what counts as a rule " +
  "violation and to answer questions about the server's topic.\n\n" +
  "Edit this anytime — I pick up changes automatically, or run `/refreshrules` " +
  "to force it right away.";

export function getRulesChannel(guild) {
  return guild.channels.cache.find(
    (channel) =>
      channel.isTextBased() &&
      !channel.isThread() &&
      channel.name.toLowerCase() === RULES_CHANNEL_NAME
  );
}

/**
 * Creates the private rules/topic channel if it doesn't exist yet, visible
 * only to the server owner and the bot itself — no other members or roles.
 */
export async function ensureAiPromptChannel(guild) {
  const existing = getRulesChannel(guild);
  if (existing) return existing;

  const botMember = guild.members.me;
  if (!botMember?.permissions.has(PermissionFlagsBits.ManageChannels)) {
    console.warn(
      `[ai-prompt] Missing Manage Channels permission in "${guild.name}" — can't auto-create #${RULES_CHANNEL_NAME}.`
    );
    return null;
  }

  try {
    const channel = await guild.channels.create({
      name: RULES_CHANNEL_NAME,
      type: ChannelType.GuildText,
      topic: "Private AI config — only the owner and the bot can see this.",
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: guild.ownerId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        {
          id: guild.client.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
      ],
    });

    await channel.send(WELCOME_MESSAGE).catch(() => {});
    console.log(`[ai-prompt] Created private #${RULES_CHANNEL_NAME} in "${guild.name}".`);
    return channel;
  } catch (error) {
    console.error(`[ai-prompt] Failed to create #${RULES_CHANNEL_NAME} in "${guild.name}":`, error);
    return null;
  }
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
