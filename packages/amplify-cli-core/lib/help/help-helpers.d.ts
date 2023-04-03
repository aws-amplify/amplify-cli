import { $TSContext, $TSAny } from '../types';
export type CommandFlagInfo = {
    short: string;
    long: string;
    flagDescription: string;
};
export type SubCommandInfo = {
    subCommand: string;
    subCommandDescription: string;
    subCommandUsage: string;
    subCommandFlags: Array<CommandFlagInfo>;
};
export type CommandInfo = {
    command: string;
    commandDescription: string;
    commandUsage: string;
    commandFlags: Array<CommandFlagInfo>;
    subCommands: Array<SubCommandInfo>;
};
export declare function lookUpCommand(commandsInfo: Array<CommandInfo>, commandName: string): CommandInfo | undefined;
export declare function lookUpSubcommand(commandsInfo: Array<CommandInfo>, commandName: string, subcommandName: string): SubCommandInfo | undefined;
export declare function parseHelpCommands(input: $TSAny, commandsInfo: Array<CommandInfo>): {
    command: string;
    subCommand: string;
};
export declare function runHelp(context: $TSContext, commandsInfo: Array<CommandInfo>): void;
//# sourceMappingURL=help-helpers.d.ts.map