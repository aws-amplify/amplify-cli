"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runHelp = exports.parseHelpCommands = exports.lookUpSubcommand = exports.lookUpCommand = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const chalk_1 = __importDefault(require("chalk"));
const SPACE = ' ';
const DEFAULT_COLUMN_SEP_SPACING = 2;
const DEFAULT_INDENT_SPACING = 2;
const DEFAULT_COLUMN_SEP = SPACE.repeat(DEFAULT_COLUMN_SEP_SPACING);
const DEFAULT_INDENT = SPACE.repeat(DEFAULT_INDENT_SPACING);
const USAGE = 'USAGE';
const DESCRIPTION = 'DESCRIPTION';
const COMMANDS = 'COMMANDS';
const FLAGS = 'FLAGS';
const LEARN_MORE = 'LEARN MORE';
const SUBCOMMANDS = 'SUBCOMMANDS';
const TAG_LINE = [
    'The Amplify Command Line Interface (CLI) is a unified toolchain to',
    'create, integrate, and manage the AWS cloud services for your app.',
];
const DEFAULT_LINK = 'https://docs.amplify.aws/cli/';
const FLAG_DELIMITER = ' | ';
const FLAG_PREFIX_SHORT = '-';
const FLAG_PREFIX_LONG = '--';
const printHeaderText = (text) => amplify_prompts_1.printer.info(chalk_1.default.blue.bold(text));
const printBodyText = (text) => amplify_prompts_1.printer.info(text);
const printCategoryMessage = () => {
    printBodyText(DEFAULT_INDENT + 'Where <category> is one of: notifications, api, auth, custom, storage,');
    printBodyText(DEFAULT_INDENT + 'analytics, function, geo, hosting, interactions, predictions');
    amplify_prompts_1.printer.blankLine();
};
const AMPLIFY_CLI_DOCS_URL = `https://docs.amplify.aws/cli`;
const HEADLESS_DOCS_LINK = `${AMPLIFY_CLI_DOCS_URL}/usage/headless`;
const getDocsLinkForCommand = (commandName) => `${AMPLIFY_CLI_DOCS_URL}/commands/${commandName}`;
function lookUpCommand(commandsInfo, commandName) {
    return commandsInfo.find((element) => element.command === commandName);
}
exports.lookUpCommand = lookUpCommand;
function lookUpSubcommand(commandsInfo, commandName, subcommandName) {
    const command = lookUpCommand(commandsInfo, commandName);
    if (command === undefined) {
        return undefined;
    }
    return command.subCommands.find((element) => element.subCommand === subcommandName);
}
exports.lookUpSubcommand = lookUpSubcommand;
function parseHelpCommands(input, commandsInfo) {
    let specifiedCommands = { command: '', subCommand: '' };
    const acceptableCommands = [];
    commandsInfo.forEach((command) => acceptableCommands.push(command.command));
    commandsInfo.forEach((command) => command.subCommands.forEach((subCommand) => acceptableCommands.push(subCommand.subCommand)));
    const hasSubcommands = input.subCommands && Array.isArray(input.subCommands) && input.subCommands.length;
    if (hasSubcommands) {
        specifiedCommands = { command: input.subCommands[0], subCommand: '' };
        if (input.subCommands.length === 1) {
            if (input.options) {
                const subcommandsInOptions = acceptableCommands.filter((i) => Object.prototype.hasOwnProperty.call(input.options, i));
                if (subcommandsInOptions && subcommandsInOptions.length === 1) {
                    specifiedCommands = { command: input.subCommands[0], subCommand: subcommandsInOptions[0] };
                }
            }
        }
        else if (input.subCommands.length === 2) {
            specifiedCommands = { command: input.subCommands[0], subCommand: input.subCommands[1] };
        }
    }
    return specifiedCommands;
}
exports.parseHelpCommands = parseHelpCommands;
function getHelpFlagRow(flagObject) {
    const has_short = flagObject.short.length > 0;
    const has_long = flagObject.long.length > 0;
    let columns;
    if (has_short && has_long) {
        columns = [FLAG_PREFIX_SHORT + flagObject.short + FLAG_DELIMITER + FLAG_PREFIX_LONG + flagObject.long, flagObject.flagDescription];
    }
    else if (has_short) {
        columns = [FLAG_PREFIX_SHORT + flagObject.short, flagObject.flagDescription];
    }
    else {
        columns = [FLAG_PREFIX_LONG + flagObject.long, flagObject.flagDescription];
    }
    if (flagObject.long === 'headless') {
        columns[1] += ` (see ${HEADLESS_DOCS_LINK})`;
    }
    return columns;
}
function printColumns(rowsArray, minColumnSeparatingSpaces, indentation = 2) {
    const longestFirstColLength = Math.max(...rowsArray.map((row) => row[0].length));
    rowsArray.forEach(function (row) {
        const separatingSpaces = longestFirstColLength - row[0].length + minColumnSeparatingSpaces;
        printBodyText(SPACE.repeat(indentation) + row[0] + SPACE.repeat(separatingSpaces) + row[1]);
    });
}
function printGenericHelp(context, commandsInfo) {
    TAG_LINE.forEach((line) => printBodyText(line));
    amplify_prompts_1.printer.blankLine();
    printHeaderText(USAGE);
    printBodyText(DEFAULT_INDENT + 'amplify <command> <subcommand> [flags]');
    amplify_prompts_1.printer.blankLine();
    printHeaderText(COMMANDS);
    const commandRows = commandsInfo.map((commandObject) => [
        commandObject.command,
        commandObject.commandDescription,
    ]);
    printColumns(commandRows, DEFAULT_COLUMN_SEP_SPACING);
    amplify_prompts_1.printer.blankLine();
    printHeaderText(FLAGS);
    printBodyText(DEFAULT_INDENT + '-h' + FLAG_DELIMITER + '--help' + DEFAULT_COLUMN_SEP + 'Show help for a command');
    amplify_prompts_1.printer.blankLine();
    printHeaderText(LEARN_MORE);
    printBodyText(DEFAULT_INDENT + 'Visit ' + DEFAULT_LINK);
    amplify_prompts_1.printer.blankLine();
}
function printCommandSpecificHelp(context, commandsInfo, commandName) {
    const command = lookUpCommand(commandsInfo, commandName);
    if (command === undefined) {
        printGenericHelp(context, commandsInfo);
        return;
    }
    printHeaderText(USAGE);
    printBodyText(DEFAULT_INDENT + command.commandUsage);
    amplify_prompts_1.printer.blankLine();
    if (command.commandUsage.includes('<category>')) {
        printCategoryMessage();
    }
    printHeaderText(DESCRIPTION);
    printBodyText(DEFAULT_INDENT + command.commandDescription);
    amplify_prompts_1.printer.blankLine();
    if (command.subCommands.length > 0) {
        printHeaderText(SUBCOMMANDS);
        const subCommandRows = command.subCommands.map((subCommandObject) => [
            subCommandObject.subCommand,
            subCommandObject.subCommandDescription,
        ]);
        printColumns(subCommandRows, DEFAULT_COLUMN_SEP_SPACING);
        amplify_prompts_1.printer.blankLine();
        const subcommandOrCategory = command.commandUsage.includes('<category>') ? '<category>' : '<subcommand>';
        printBodyText(DEFAULT_INDENT + 'Use "amplify ' + command.command + ' ' + subcommandOrCategory + ' -h" to see subcommand-specific help');
        amplify_prompts_1.printer.blankLine();
    }
    if (command.commandFlags.length > 0) {
        printHeaderText(FLAGS);
        const flagRows = command.commandFlags.map((flagObject) => getHelpFlagRow(flagObject));
        printColumns(flagRows, DEFAULT_COLUMN_SEP_SPACING);
        amplify_prompts_1.printer.blankLine();
    }
    printHeaderText(LEARN_MORE);
    printBodyText(DEFAULT_INDENT + getDocsLinkForCommand(commandName));
    amplify_prompts_1.printer.blankLine();
}
function printSubcommandSpecificHelp(context, commandsInfo, commandName, subcommandName) {
    const subCommand = lookUpSubcommand(commandsInfo, commandName, subcommandName);
    if (subCommand === undefined) {
        const command = lookUpCommand(commandsInfo, commandName);
        if (command === undefined) {
            printGenericHelp(context, commandsInfo);
            return;
        }
        else {
            printCommandSpecificHelp(context, commandsInfo, command.command);
            return;
        }
    }
    printHeaderText(USAGE);
    printBodyText(DEFAULT_INDENT + subCommand.subCommandUsage);
    amplify_prompts_1.printer.blankLine();
    printHeaderText(DESCRIPTION);
    printBodyText(DEFAULT_INDENT + subCommand.subCommandDescription);
    amplify_prompts_1.printer.blankLine();
    if (Object.keys(subCommand.subCommandFlags).length > 0) {
        printHeaderText(FLAGS);
        const flagRows = subCommand.subCommandFlags.map((flagObject) => getHelpFlagRow(flagObject));
        printColumns(flagRows, DEFAULT_COLUMN_SEP_SPACING);
        amplify_prompts_1.printer.blankLine();
    }
    printHeaderText(LEARN_MORE);
    printBodyText(DEFAULT_INDENT + getDocsLinkForCommand(commandName));
    amplify_prompts_1.printer.blankLine();
}
function runHelp(context, commandsInfo) {
    const specifiedCommands = parseHelpCommands(context.input, commandsInfo);
    if (specifiedCommands.command.length > 0 && specifiedCommands.subCommand.length > 0) {
        printSubcommandSpecificHelp(context, commandsInfo, specifiedCommands.command, specifiedCommands.subCommand);
    }
    else if (specifiedCommands.command.length > 0) {
        printCommandSpecificHelp(context, commandsInfo, specifiedCommands.command);
    }
    else {
        printGenericHelp(context, commandsInfo);
    }
}
exports.runHelp = runHelp;
//# sourceMappingURL=help-helpers.js.map