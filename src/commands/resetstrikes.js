import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { resetOffense } from "../db.js";

export const data = new SlashCommandBuilder()
  .setName("resetstrikes")
  .setDescription("Reset a member's moderation strikes back to zero")
  .addUserOption((option) =>
    option.setName("user").setDescription("The member to reset").setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .setDMPermission(false);

export async function execute(interaction) {
  const target = interaction.options.getUser("user", true);
  resetOffense(interaction.guildId, target.id);
  await interaction.reply({
    content: `Reset strikes for ${target.tag}.`,
    ephemeral: true,
  });
}
