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

  try {
    await member.send(explanation);
  } catch {
    // DMs closed — proceed with the punishment anyway.
  }

  if (strikeCount === 1) {
    await member.timeout(STRIKE_TIMEOUTS_MS[0], verdict.reason);
  } else if (strikeCount === 2) {
    await member.timeout(STRIKE_TIMEOUTS_MS[1], verdict.reason);
  } else {
    await member.ban({ reason: verdict.reason });
  }

  await message.channel
    .send(`${member.user.tag} was ${label} for violating server rules.`)
    .catch(() => {});
}

export function isExempt(member) {
  return (
    member.permissions.has("ManageMessages") ||
    member.permissions.has("KickMembers") ||
    member.permissions.has("BanMembers")
  );
}
