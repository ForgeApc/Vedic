import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { refreshRules } from "../rulesCache.js";

export const data = new SlashCommandBuilder()
  .setName("refreshrules")
  .setDescription("Force the bot to re-read the #rules channel right now")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .setDMPermission(false);

export async function execute(interaction) {
  await refreshRules(interaction.guild);
  await interaction.reply({
    content: "Rules cache refreshed from #rules.",
    ephemeral: true,
  });
}
