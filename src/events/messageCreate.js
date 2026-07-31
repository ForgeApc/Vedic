import { isSevereViolation } from "../moderation/keywordFilter.js";
import { judgeMessage } from "../moderation/aiJudge.js";
import { isExempt, punish } from "../moderation/punisher.js";
import { getRulesText, isRulesChannel, refreshRules } from "../rulesCache.js";

export async function handleMessageCreate(message) {
  if (message.author.bot || !message.guild) return;

  if (isRulesChannel(message.channel)) {
    await refreshRules(message.guild);
    return;
  }

  if (!message.member || isExempt(message.member)) return;

  const content = message.content;
  if (!content) return;

  if (isSevereViolation(content)) {
    await punish(message, {
      severity: "severe",
      reason: "Message matched a blocked term or phrase.",
    });
    return;
  }

  const verdict = await judgeMessage({
    content,
    rulesText: getRulesText(message.guild.id),
    authorTag: message.author.tag,
  });

  if (verdict.is_violation) {
    await punish(message, verdict);
    return;
  }

  if (verdict.is_question && verdict.answer) {
    await message.reply(verdict.answer).catch(() => {});
  }
}
