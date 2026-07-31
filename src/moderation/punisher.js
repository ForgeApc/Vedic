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

  if (strikeCount === 1) {
    await member.timeout(STRIKE_TIMEOUTS_MS[0], verdict.reason);
  } else if (strikeCount === 2) {
    await member.timeout(STRIKE_TIMEOUTS_MS[1], verdict.reason);
  } else {
    await member.ban({ reason: verdict.reason });
  }
}

export function isExempt(member) {
  return (
    member.permissions.has("ManageMessages") ||
    member.permissions.has("KickMembers") ||
    member.permissions.has("BanMembers")
  );
}
