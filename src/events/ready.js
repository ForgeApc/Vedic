import { ensureAiPromptChannel, refreshRules } from "../rulesCache.js";
import { commandData } from "../commands/index.js";

async function registerCommands(guild) {
  try {
    await guild.commands.set(commandData);
  } catch (error) {
    console.error(`Failed to register commands in ${guild.name}:`, error);
  }
}

async function setUpGuild(guild) {
  await ensureAiPromptChannel(guild);
  await refreshRules(guild);
  await registerCommands(guild);
}

export async function handleReady(client) {
  console.log(`Logged in as ${client.user.tag}`);

  for (const guild of client.guilds.cache.values()) {
    await setUpGuild(guild);
  }
}

export async function handleGuildCreate(guild) {
  await setUpGuild(guild);
}
