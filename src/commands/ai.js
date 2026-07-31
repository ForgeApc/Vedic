import { SlashCommandBuilder } from "discord.js";
import { askQuestion } from "../moderation/aiJudge.js";
import { getRulesText } from "../rulesCache.js";

export const data = new SlashCommandBuilder()
  .setName("ai")
  .setDescription("Ask the bot a question directly")
  .addStringOption((option) =>
    option.setName("question").setDescription("What do you want to ask?").setRequired(true)
  )
  .setDMPermission(false);

export async function execute(interaction) {
  const question = interaction.options.getString("question", true);
  await interaction.deferReply();

  const answer = await askQuestion({
    question,
    rulesText: getRulesText(interaction.guildId),
  });

  await interaction.editReply(answer);
}
