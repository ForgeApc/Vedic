import * as strikes from "./strikes.js";
import * as resetstrikes from "./resetstrikes.js";
import * as refreshrules from "./refreshrules.js";

export const commands = [strikes, resetstrikes, refreshrules];
export const commandsByName = new Map(commands.map((command) => [command.data.name, command]));
export const commandData = commands.map((command) => command.data.toJSON());
