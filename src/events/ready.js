import { refreshRules } from "../rulesCache.js";

export async function handleReady(client) {
  console.log(`Logged in as ${client.user.tag}`);

  for (const guild of client.guilds.cache.values()) {
    await refreshRules(guild);
  }
}

export async function handleGuildCreate(guild) {
  await refreshRules(guild);
}
