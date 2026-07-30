import { refreshRules } from "../rulesCache.js";
import { commandData } from "../commands/index.js";

async function registerCommands(guild) {
  try {
    await guild.commands.set(commandData);
  } catch (error) {
    console.error(`Failed to register commands in ${guild.name}:`, error);
  }
}

export async function handleReady(client) {
  console.log(`Logged in as ${client.user.tag}`);

  for (const guild of client.guilds.cache.values()) {
    await refreshRules(guild);
    await registerCommands(guild);
  }
}

export async function handleGuildCreate(guild) {
  await refreshRules(guild);
  await registerCommands(guild);
}
