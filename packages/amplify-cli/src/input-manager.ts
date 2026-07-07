// normalize command line arguments, allow verb / noun place switch
import { constants, PluginPlatform, pathManager, stateManager, commandsInfo, getPackageManager } from '@aws-amplify/amplify-cli-core';
import { getPluginsWithName, getAllPluginNames } from './plugin-manager';
import { InputVerificationResult } from './domain/input-verification-result';
import { insertAmplifyIgnore } from './extensions/amplify-helpers/git-manager';
import { CLIInput } from './domain/command-input';
import { EOL } from 'os';

export function getCommandLineInput(pluginPlatform: PluginPlatform): CLIInput {
  const result = new CLIInput(process.argv);
  if (result.argv && result.argv.length > 2) {
    let index = 2;
    aliasArgs(result.argv);
    // pick up plugin name, allow plugin name to be in the 2nd or 3rd position
    const pluginNames = getAllPluginNames(pluginPlatform);

    if (pluginNames.has(result.argv[2])) {
      result.plugin = result.argv[2];
      index = 3;
    } else if (result.argv.length > 3 && pluginNames.has(result.argv[3])) {
      result.plugin = result.argv[3];
      result.argv[3] = result.argv[2];
      result.argv[2] = result.plugin;
      index = 3;
    }

    // pick up command
    if (result.argv.length > index && !/^-/.test(result.argv[index])) {
      result.command = result.argv[index];
      index += 1;
    }

    // pick up subcommands
    while (result.argv.length > index && !/^-/.test(result.argv[index])) {
      result.subCommands = result.subCommands || new Array<string>();
      result.subCommands.push(result.argv[index]);
      index += 1;
    }

    // pick up options
    while (result.argv.length > index) {
      result.options = result.options || {};
      if (/^-/.test(result.argv[index])) {
        const key = result.argv[index].replace(/^-+/, '');
        index += 1;
        if (result.argv.length > index && !/^-/.test(result.argv[index])) {
          result.options[key] = result.argv[index];
          index += 1;
        } else {
          result.options[key] = true;
        }
      } else {
        const key = result.argv[index];
        index += 1;
        result.options[key] = true;
      }
    }
  }

  return result;
}

function preserveHelpInformation(input: CLIInput): CLIInput {
  const subCommands = input.subCommands ? input.subCommands : [];
  // preserve non-help command in subcommands
  if (input.command && input.command.toLowerCase() !== constants.HELP) {
    subCommands.unshift(input.command.toLocaleLowerCase());
  }

  const hasLongHelpOption = typeof input.options?.[constants.HELP] === 'string';
  const hasShortHelpOption = typeof input.options?.[constants.HELP_SHORT] === 'string';
  // prevent information in help option from being overwritten to true by saving it in subcommands
  if (hasLongHelpOption) {
    subCommands.push(input.options?.[constants.HELP] as string);
  } else if (hasShortHelpOption) {
    subCommands.push(input.options?.[constants.HELP_SHORT] as string);
  }

  // preserve command information in plugin field
  if (input.plugin && input.plugin !== 'core') {
    const isCommandPrecedingPluginName = subCommands?.length && input.argv.indexOf(input.plugin) > input.argv.indexOf(subCommands[0]);
    if (isCommandPrecedingPluginName) {
      subCommands.push(input.plugin);
    } else {
      subCommands.unshift(input.plugin);
    }
  }

  if (input.command == 'status' && input.options) {
    const statusSubcommands = commandsInfo
      .find((commandInfo) => commandInfo.command == 'status')
      ?.subCommands.map((subCommandInfo) => subCommandInfo.subCommand);
    const potentialStatusSubcommands: Array<string> = statusSubcommands ? statusSubcommands : [];
    const optionKeys = Object.keys(input.options);
    for (const potentialSubcommand of potentialStatusSubcommands) {
      if (optionKeys.includes(potentialSubcommand)) {
        subCommands.push(potentialSubcommand);
        break;
      }
    }
  }

  if (input.options) {
    input.options[constants.HELP] = true;
    delete input.options[constants.HELP_SHORT];
  }
  input.command = constants.HELP;
  input.subCommands = subCommands;
  return input;
}

function normalizeInput(input: CLIInput): CLIInput {
  // -v --version => version command
  // -h --help => help command
  // -y --yes => yes option
  if (input.options) {
    if (input.options[constants.VERSION] || input.options[constants.VERSION_SHORT]) {
      input.options[constants.VERSION] = true;
      delete input.options[constants.VERSION_SHORT];
    }

    if (input.options[constants.HELP] || input.options[constants.HELP_SHORT]) {
      preserveHelpInformation(input);
    }

    if (input.options[constants.YES] || input.options[constants.YES_SHORT]) {
      input.options[constants.YES] = true;
      delete input.options[constants.YES_SHORT];
    }

    // To make sure that 'yes' is always have a boolean value set it to false before
    // normalizing it
    if (input.options[constants.YES] === undefined) {
      input.options[constants.YES] = false;
    }
  }

  input.command = input.command || constants.PLUGIN_DEFAULT_COMMAND;

  return input;
}

export async function verifyInput(pluginPlatform: PluginPlatform, input: CLIInput): Promise<InputVerificationResult> {
  const result = new InputVerificationResult();

  // Normalize status command options
  if (input.command === 'status') {
    input = normalizeStatusCommandOptions(input);
  }

  input.plugin = input.plugin || constants.CORE;

  normalizeInput(input);

  const pluginCandidates = getPluginsWithName(pluginPlatform, input.plugin!);

  if (pluginCandidates.length > 0) {
    for (let i = 0; i < pluginCandidates.length; i++) {
      const { name, commands, commandAliases } = pluginCandidates[i].manifest;

      if ((commands && commands!.includes(constants.HELP)) || (commandAliases && Object.keys(commandAliases).includes(constants.HELP))) {
        result.helpCommandAvailable = true;
      }

      // verify if `input.command` is an actual command.
      if (commands && commands!.includes(input.command!)) {
        result.verified = true;
        break;
      }

      // verify if `input.command` is an alias for a command.
      if (commandAliases && Object.keys(commandAliases).includes(input.command!)) {
        input.command = commandAliases[input.command!];
        result.verified = true;
        break;
      }

      if (Array.isArray(input.subCommands) && input.subCommands.length > 0) {
        // if `input.command` is not a command name or an alias for a command, check the
        // first sub-command for a verb / noun swap (i.e. `env add` versus `add env`).
        if (commands && commands!.includes(input.subCommands[0])) {
          const command = input.subCommands[0];
          input.subCommands[0] = input.command!;
          input.command = command;

          result.verified = true;
          break;
        }

        // same as above, but check if the first sub-command is an alias.
        if (commandAliases && Object.prototype.hasOwnProperty.call(commandAliases, input.subCommands[0])) {
          const command = commandAliases[input.subCommands[0]];
          input.subCommands[0] = input.command!;
          input.command = command;

          result.verified = true;
          break;
        }
      }

      // if `input.command` is the default plugin command, check `input.options` for what to do.
      if (input.command! === constants.PLUGIN_DEFAULT_COMMAND) {
        if (commands && commands!.includes(name)) {
          input.command = name;
          result.verified = true;
          break;
        }
        if (input.options && input.options[constants.VERSION] && commands && commands!.includes(constants.VERSION)) {
          input.command = constants.VERSION;
          result.verified = true;
          break;
        }
        if (input.options && input.options[constants.HELP] && commands && commands!.includes(constants.HELP)) {
          input.command = constants.HELP;
          result.verified = true;
          break;
        }

        // as a fall back, use the help command
        if (commands && commands!.includes(constants.HELP)) {
          input.command = constants.HELP;
          result.verified = true;
          break;
        }
      }
    }

    if (!result.verified) {
      let commandString = input.plugin === constants.CORE ? '' : input.plugin;

      if (input.command! !== constants.PLUGIN_DEFAULT_COMMAND) {
        commandString += ' ' + input.command!;
      }

      if (input.subCommands) {
        commandString += ' ' + input.subCommands!.join(' ');
      }

      const packageManager = (await getPackageManager())?.packageManager ?? 'npm';
      const executeCommand = packageManager === 'npm' ? 'npx' : `${packageManager} dlx`;

      const amplifyGen2Message = `If you are trying to use Amplify Gen 2, install the @aws-amplify/backend-cli package or execute using the package name directly:${EOL}${executeCommand} @aws-amplify/backend-cli${commandString}`;

      result.message = `The Amplify CLI can NOT find command: ${commandString}${EOL}${EOL}${amplifyGen2Message}`;
    }
  } else {
    result.verified = false;
    result.message = `The Amplify CLI can NOT find any plugin with name: ${input.plugin}`;
  }

  return result;
}

function aliasArgs(argv: string[]) {
  if (argv.length >= 4 && argv[2] === 'override' && argv[3] === 'project') {
    argv[3] = 'root';

    // Also update gitignore to latest list - mainly to exclude amplify/backend/awscloudformation dir from .gitignore for older projects
    const { projectPath } = stateManager.getLocalEnvInfo();
    const gitIgnoreFilePath = pathManager.getGitIgnoreFilePath(projectPath);
    insertAmplifyIgnore(gitIgnoreFilePath);
  }
}

const convertKeysToLowerCase = <T>(obj: Record<string, T>): Record<string, T> => {
  const newObj = {};
  Object.entries(obj).forEach(([key, value]) => {
    newObj[key.toLowerCase()] = value;
  });
  return newObj;
};

const normalizeStatusCommandOptions = (input: CLIInput): CLIInput => {
  const options = input.options ? input.options : {};
  const allowedVerboseIndicators = [constants.VERBOSE, 'v'];
  // Normalize 'amplify status -v' to verbose, since -v is interpreted as 'version'
  allowedVerboseIndicators.forEach((verboseFlag) => {
    if (options[verboseFlag] !== undefined) {
      if (typeof options[verboseFlag] === 'string') {
        const pluginName = (options[verboseFlag] as string).toLowerCase();
        options[pluginName] = true;
      }
      delete options[verboseFlag];
      options.verbose = true;
    }
  });

  // Merge plugins and sub-commands as options (except help/verbose)
  const returnInput = input;
  if (returnInput.plugin) {
    options[returnInput.plugin] = true;
    delete returnInput.plugin;
  }
  if (returnInput.subCommands) {
    const allowedSubCommands = [constants.HELP, constants.VERBOSE]; // list of sub-commands supported in Status
    const inputSubCommands: string[] = [];
    returnInput.subCommands.forEach((subCommand) => {
      // plugins are inferred as sub-commands when positionally supplied
      if (!allowedSubCommands.includes(subCommand)) {
        options[subCommand.toLowerCase()] = true;
      } else {
        inputSubCommands.push(subCommand);
      }
    });
    returnInput.subCommands = inputSubCommands;
  }
  returnInput.options = convertKeysToLowerCase(options); // normalize keys to lower case
  return returnInput;
};
