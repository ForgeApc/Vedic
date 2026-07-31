import { STRIKE_TIMEOUTS_MS } from "../config.js";
import { recordOffense } from "../db.js";
import { getRulesText } from "../rulesCache.js";
import { explainPunishment } from "./aiJudge.js";

function strikeLabel(strikeCount) {
  if (strikeCount === 1) return "timed out for 5 minutes";
  if (strikeCount === 2) return "timed out for 24 hours";
  return "banned";
}

export async function punish(message, verdict) {
  const { guild, member } = message;
  const strikeCount = recordOffense(guild.id, member.id);
  const label = strikeLabel(strikeCount);
  const rulesText = getRulesText(guild.id);

  const explanation = await explainPunishment({
    rulesText,
    violationReason: verdict.reason,
    severity: verdict.severity,
    strikeLabel: label,
  });

  // Tell them what they did wrong — both privately and publicly, right on
  // the offending message — before the punishment itself lands.
  await member.send(explanation).catch(() => {
    // DMs closed — the public reply below still gets the word out.
  });

  await message
    .reply(`${explanation}\n\n${member.user.tag} is being ${label}.`)
    .catch(() => {});

  try {
    if (strikeCount === 1) {
      await member.timeout(STRIKE_TIMEOUTS_MS[0], verdict.reason);
    } else if (strikeCount === 2) {
      await member.timeout(STRIKE_TIMEOUTS_MS[1], verdict.reason);
    } else {
      await member.ban({ reason: verdict.reason });
    }
  } catch (error) {
    // Discord hard-blocks bots from acting on the server owner, and on
    // anyone with a role equal to or above the bot's own highest role —
    // both are now reachable since moderation applies to everyone.
    console.error(`Failed to apply punishment to ${member.user.tag}:`, error);
    await message
      .reply(
        "I flagged that, but couldn't actually apply the punishment — Discord doesn't let bots act on the server owner, or on members with a role equal to or higher than mine."
      )
      .catch(() => {});
  }
}
