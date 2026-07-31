import * as strikes from "./strikes.js";
import * as resetstrikes from "./resetstrikes.js";
import * as refreshrules from "./refreshrules.js";
import * as addrole from "./addrole.js";
import * as removerole from "./removerole.js";
import * as ai from "./ai.js";

export const commands = [strikes, resetstrikes, refreshrules, addrole, removerole, ai];
export const commandsByName = new Map(commands.map((command) => [command.data.name, command]));
export const commandData = commands.map((command) => command.data.toJSON());
