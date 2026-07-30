import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("addrole")
  .setDescription("Give a member a role")
  .addUserOption((option) =>
    option.setName("user").setDescription("The member to give the role to").setRequired(true)
  )
  .addRoleOption((option) =>
    option.setName("role").setDescription("The role to add").setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .setDMPermission(false);

export async function execute(interaction) {
  const target = await interaction.guild.members.fetch(interaction.options.getUser("user", true).id).catch(() => null);
  const role = interaction.options.getRole("role", true);

  if (!target) {
    await interaction.reply({ content: "That user isn't in this server.", ephemeral: true });
    return;
  }

  if (role.id === interaction.guild.id) {
    await interaction.reply({ content: "You can't assign the @everyone role.", ephemeral: true });
    return;
  }

  if (role.managed) {
    await interaction.reply({
      content: `**${role.name}** is managed by an integration or bot and can't be assigned manually.`,
      ephemeral: true,
    });
    return;
  }

  const invokerHighest = interaction.member.roles.highest.position;
  const isOwner = interaction.guild.ownerId === interaction.member.id;
  if (!isOwner && role.position >= invokerHighest) {
    await interaction.reply({
      content: `You can't assign **${role.name}** — it's the same rank as or higher than your own highest role.`,
      ephemeral: true,
    });
    return;
  }

  const botHighest = interaction.guild.members.me.roles.highest.position;
  if (role.position >= botHighest) {
    await interaction.reply({
      content: `I can't assign **${role.name}** — it's the same rank as or higher than my own highest role. Move my role above it in Server Settings > Roles.`,
      ephemeral: true,
    });
    return;
  }

  if (target.roles.cache.has(role.id)) {
    await interaction.reply({ content: `${target.user.tag} already has **${role.name}**.`, ephemeral: true });
    return;
  }

  try {
    await target.roles.add(role);
    await interaction.reply({ content: `Gave **${role.name}** to ${target.user.tag}.`, ephemeral: true });
  } catch (error) {
    console.error("Failed to add role:", error);
    await interaction.reply({ content: "Couldn't add that role — Discord rejected the request.", ephemeral: true });
  }
}
