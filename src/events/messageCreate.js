import { isSevereViolation } from "../moderation/keywordFilter.js";
import { judgeMessage } from "../moderation/aiJudge.js";
import { punish } from "../moderation/punisher.js";
import { getRulesText, isRulesChannel, refreshRules } from "../rulesCache.js";
import { recordMessage, isRepeatedFlood } from "../moderation/messageHistory.js";

export async function handleMessageCreate(message) {
  if (message.author.bot || !message.guild) return;

  if (isRulesChannel(message.channel)) {
    console.log(`[moderation] #rules message from ${message.author.tag} — refreshing rules cache.`);
    await refreshRules(message.guild);
    return;
  }

  if (!message.member) {
    console.warn(
      `[moderation] No member data for message from ${message.author.tag} in #${message.channel.name} — skipping. (Server Members Intent enabled?)`
    );
    return;
  }

  const content = message.content;
  if (!content) {
    console.warn(
      `[moderation] Empty content for message from ${message.author.tag} in #${message.channel.name} — skipping. (Message Content Intent enabled in the Developer Portal?)`
    );
    return;
  }

  console.log(`[moderation] Evaluating message from ${message.author.tag} in #${message.channel.name}: "${content}"`);

  const history = recordMessage(message.guild.id, message.author.id, content);

  if (isSevereViolation(content)) {
    console.log("[moderation] Severe keyword match — punishing immediately.");
    await punish(message, {
      severity: "severe",
      reason: "Message matched a blocked term or phrase.",
    });
    return;
  }

  if (isRepeatedFlood(history)) {
    console.log("[moderation] Repeated-message flood — punishing immediately.");
    await punish(message, {
      severity: "mild",
      reason: "Repeated the same message multiple times in a row (spam).",
    });
    return;
  }

  const verdict = await judgeMessage({
    content,
    rulesText: getRulesText(message.guild.id),
    authorTag: message.author.tag,
    recentMessages: history.slice(0, -1),
  });

  console.log("[moderation] Verdict:", verdict);

  if (verdict.is_violation) {
    await punish(message, verdict);
    return;
  }

  if (verdict.is_question && verdict.answer) {
    await message.reply(verdict.answer).catch(() => {});
  }
}
