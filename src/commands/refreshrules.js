import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { ensureAiPromptChannel, refreshRules } from "../rulesCache.js";

export const data = new SlashCommandBuilder()
  .setName("refreshrules")
  .setDescription("Force the bot to re-read its private rules/topic channel right now")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .setDMPermission(false);

export async function execute(interaction) {
  await ensureAiPromptChannel(interaction.guild);
  await refreshRules(interaction.guild);
  await interaction.reply({
    content: "Rules/topic cache refreshed.",
    ephemeral: true,
  });
}
