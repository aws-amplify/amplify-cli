import { $TSContext, $TSAny } from '../types';
import { printer } from 'amplify-prompts';
import chalk from 'chalk';

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

const SPACE = ' ';
const DEFAULT_COLUMN_SEP_SPACING = 2;
const DEFAULT_INDENT_SPACING = 2;
const DEFAULT_COLUMN_SEP = SPACE.repeat(DEFAULT_COLUMN_SEP_SPACING);
const DEFAULT_INDENT = SPACE.repeat(DEFAULT_INDENT_SPACING);
const MAX_LINE_LENGTH = 80;

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

const printHeaderText = (text: string) => printer.info(chalk.blue.bold(text));
const printBodyText = (text: string) => printer.info(text);
const printCategoryMessage = () => {
  printBodyText(DEFAULT_INDENT + 'Where <category> is one of: notifications, api, auth, custom, storage,');
  printBodyText(DEFAULT_INDENT + 'analytics, function, geo, hosting, interactions, predictions, xr (deprecated)');
  printer.blankLine();
};

const AMPLIFY_CLI_DOCS_URL = `https://docs.amplify.aws/cli`;
const HEADLESS_DOCS_LINK = `${AMPLIFY_CLI_DOCS_URL}/usage/headless`;
const getDocsLinkForCommand = (commandName: string) => `${AMPLIFY_CLI_DOCS_URL}/commands/${commandName}`;

export function lookUpCommand(commandsInfo: Array<CommandInfo>, commandName: string): CommandInfo | undefined {
  return commandsInfo.find(element => element.command === commandName);
}

export function lookUpSubcommand(
  commandsInfo: Array<CommandInfo>,
  commandName: string,
  subcommandName: string,
): SubCommandInfo | undefined {
  const command = lookUpCommand(commandsInfo, commandName);
  if (command === undefined) {
    return undefined;
  }
  return command.subCommands.find(element => element.subCommand === subcommandName);
}

export function parseHelpCommands(input: $TSAny, commandsInfo: Array<CommandInfo>) {
  // depending on the commands and the order of commands, information is stored in different fields of Input
  let specifiedCommands = { command: '', subCommand: '' };
  // get all allowed commands/subcommands from json object
  const acceptableCommands: Array<string> = [];
  commandsInfo.forEach(command => acceptableCommands.push(command.command));
  commandsInfo.forEach(command => command.subCommands.forEach(subCommand => acceptableCommands.push(subCommand.subCommand)));
  const hasSubcommands = input.subCommands && Array.isArray(input.subCommands) && input.subCommands.length; // check if subcommands exist
  if (hasSubcommands) {
    specifiedCommands = { command: input.subCommands[0], subCommand: '' }; // if just 1 subcommand, set that as command
    if (input.subCommands.length === 1) {
      if (input.options) {
        // check if subcommands are in options field
        const subcommandsInOptions = acceptableCommands.filter(i => Object.prototype.hasOwnProperty.call(input.options, i));
        if (subcommandsInOptions && subcommandsInOptions.length === 1) {
          specifiedCommands = { command: input.subCommands[0], subCommand: subcommandsInOptions[0] };
        }
      }
    } else if (input.subCommands.length === 2) {
      specifiedCommands = { command: input.subCommands[0], subCommand: input.subCommands[1] };
    }
  }
  return specifiedCommands;
}

function getHelpFlagRow(flagObject: CommandFlagInfo): [string, string] {
  const has_short = flagObject.short.length > 0;
  const has_long = flagObject.long.length > 0;
  let columns: [string, string];
  if (has_short && has_long) {
    columns = [FLAG_PREFIX_SHORT + flagObject.short + FLAG_DELIMITER + FLAG_PREFIX_LONG + flagObject.long, flagObject.flagDescription];
  } else if (has_short) {
    columns = [FLAG_PREFIX_SHORT + flagObject.short, flagObject.flagDescription];
  } else {
    columns = [FLAG_PREFIX_LONG + flagObject.long, flagObject.flagDescription];
  }

  if (flagObject.long === 'headless') {
    columns[1] += ` (see ${HEADLESS_DOCS_LINK})`;
  }

  return columns;
}

function printColumns(rowsArray: Array<[string, string]>, minColumnSeparatingSpaces: number, indentation = 2) {
  const longestFirstColLength = Math.max(...rowsArray.map(row => row[0].length));
  rowsArray.forEach(function(row) {
    const separatingSpaces = longestFirstColLength - row[0].length + minColumnSeparatingSpaces;
    printBodyText(SPACE.repeat(indentation) + row[0] + SPACE.repeat(separatingSpaces) + row[1]);
  });
}

function printGenericHelp(context: $TSContext, commandsInfo: Array<CommandInfo>, defaultNumTabs = 1, extraTabLengthThreshold = 5) {
  TAG_LINE.forEach(line => printBodyText(line));
  printer.blankLine();

  printHeaderText(USAGE);
  printBodyText(DEFAULT_INDENT + 'amplify <command> <subcommand> [flags]');
  printer.blankLine();

  printHeaderText(COMMANDS);
  const commandRows: Array<[string, string]> = commandsInfo.map(commandObject => [commandObject.command, commandObject.commandDescription]);
  printColumns(commandRows, DEFAULT_COLUMN_SEP_SPACING);
  printer.blankLine();

  printHeaderText(FLAGS);
  printBodyText(DEFAULT_INDENT + '-h' + FLAG_DELIMITER + '--help' + DEFAULT_COLUMN_SEP + 'Show help for a command');
  printer.blankLine();

  printHeaderText(LEARN_MORE);
  printBodyText(DEFAULT_INDENT + 'Visit ' + DEFAULT_LINK);
  printer.blankLine();
}

function printCommandSpecificHelp(
  context: $TSContext,
  commandsInfo: Array<CommandInfo>,
  commandName: string,
  defaultNumTabs = 1,
  extraTabLengthThreshold = 5,
) {
  const command = lookUpCommand(commandsInfo, commandName);
  if (command === undefined) {
    printGenericHelp(context, commandsInfo, defaultNumTabs, extraTabLengthThreshold);
    return;
  }

  printHeaderText(USAGE);
  printBodyText(DEFAULT_INDENT + command.commandUsage);

  printer.blankLine();
  if (command.commandUsage.includes('<category>')) {
    printCategoryMessage();
  }

  printHeaderText(DESCRIPTION);
  printBodyText(DEFAULT_INDENT + command.commandDescription);
  printer.blankLine();

  if (command.subCommands.length > 0) {
    printHeaderText(SUBCOMMANDS);
    const subCommandRows: Array<[string, string]> = command.subCommands.map(subCommandObject => [
      subCommandObject.subCommand,
      subCommandObject.subCommandDescription,
    ]);
    printColumns(subCommandRows, DEFAULT_COLUMN_SEP_SPACING);
    printer.blankLine();
    const subcommandOrCategory = command.commandUsage.includes('<category>') ? '<category>' : '<subcommand>';
    printBodyText(DEFAULT_INDENT + 'Use "amplify ' + command.command + ' ' + subcommandOrCategory + ' -h" to see subcommand-specific help');
    printer.blankLine();
  }

  if (command.commandFlags.length > 0) {
    printHeaderText(FLAGS);
    const flagRows: Array<[string, string]> = command.commandFlags.map(flagObject => getHelpFlagRow(flagObject));
    printColumns(flagRows, DEFAULT_COLUMN_SEP_SPACING);
    printer.blankLine();
  }

  printHeaderText(LEARN_MORE);
  printBodyText(DEFAULT_INDENT + getDocsLinkForCommand(commandName));
  printer.blankLine();
}

function printSubcommandSpecificHelp(
  context: $TSContext,
  commandsInfo: Array<CommandInfo>,
  commandName: string,
  subcommandName: string,
  defaultNumTabs = 1,
  extraTabLengthThreshold = 5,
) {
  const subCommand = lookUpSubcommand(commandsInfo, commandName, subcommandName);
  if (subCommand === undefined) {
    const command = lookUpCommand(commandsInfo, commandName);
    if (command === undefined) {
      printGenericHelp(context, commandsInfo, defaultNumTabs, extraTabLengthThreshold);
      return;
    } else {
      printCommandSpecificHelp(context, commandsInfo, command.command, defaultNumTabs, extraTabLengthThreshold);
      return;
    }
  }

  printHeaderText(USAGE);
  printBodyText(DEFAULT_INDENT + subCommand.subCommandUsage);
  printer.blankLine();

  printHeaderText(DESCRIPTION);
  printBodyText(DEFAULT_INDENT + subCommand.subCommandDescription);
  printer.blankLine();

  if (Object.keys(subCommand.subCommandFlags).length > 0) {
    printHeaderText(FLAGS);
    const flagRows: Array<[string, string]> = subCommand.subCommandFlags.map(flagObject => getHelpFlagRow(flagObject));
    printColumns(flagRows, DEFAULT_COLUMN_SEP_SPACING);
    printer.blankLine();
  }

  printHeaderText(LEARN_MORE);
  printBodyText(DEFAULT_INDENT + getDocsLinkForCommand(commandName));
  printer.blankLine();
}

export function runHelp(context: $TSContext, commandsInfo: Array<CommandInfo>) {
  const specifiedCommands = parseHelpCommands(context.input, commandsInfo);
  if (specifiedCommands.command.length > 0 && specifiedCommands.subCommand.length > 0) {
    printSubcommandSpecificHelp(context, commandsInfo, specifiedCommands.command, specifiedCommands.subCommand);
  } else if (specifiedCommands.command.length > 0) {
    printCommandSpecificHelp(context, commandsInfo, specifiedCommands.command);
  } else {
    printGenericHelp(context, commandsInfo);
  }
}
