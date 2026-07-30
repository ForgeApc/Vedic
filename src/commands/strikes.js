import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { getOffense } from "../db.js";
import { OFFENSE_RESET_MS } from "../config.js";

export const data = new SlashCommandBuilder()
  .setName("strikes")
  .setDescription("Show a member's current moderation strike count")
  .addUserOption((option) =>
    option.setName("user").setDescription("The member to check").setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .setDMPermission(false);

export async function execute(interaction) {
  const target = interaction.options.getUser("user", true);
  const offense = getOffense(interaction.guildId, target.id);

  if (!offense || offense.strike_count === 0) {
    await interaction.reply({
      content: `${target.tag} has no recorded strikes.`,
      ephemeral: true,
    });
    return;
  }

  const lastOffenseSec = Math.floor(offense.last_offense_at / 1000);
  const resetsAtSec = Math.floor((offense.last_offense_at + OFFENSE_RESET_MS) / 1000);

  await interaction.reply({
    content:
      `${target.tag} has **${offense.strike_count}** strike(s).\n` +
      `Last offense: <t:${lastOffenseSec}:R>\n` +
      `Resets to 0 <t:${resetsAtSec}:R> if they stay clean.`,
    ephemeral: true,
  });
}
