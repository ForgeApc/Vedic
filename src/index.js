import { Client, GatewayIntentBits, Partials } from "discord.js";
import { config } from "./config.js";
import { handleGuildCreate, handleReady } from "./events/ready.js";
import { handleMessageCreate } from "./events/messageCreate.js";
import { isRulesChannel, refreshRules } from "./rulesCache.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel],
});

client.once("ready", () => handleReady(client));
client.on("guildCreate", handleGuildCreate);
client.on("messageCreate", (message) => {
  handleMessageCreate(message).catch((error) => {
    console.error("Error handling message:", error);
  });
});

client.on("messageUpdate", (_old, newMessage) => {
  if (newMessage.guild && isRulesChannel(newMessage.channel)) {
    refreshRules(newMessage.guild).catch(() => {});
  }
});

client.on("messageDelete", (message) => {
  if (message.guild && isRulesChannel(message.channel)) {
    refreshRules(message.guild).catch(() => {});
  }
});

client.login(config.discordToken);
