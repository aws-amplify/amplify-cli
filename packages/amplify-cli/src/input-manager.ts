// normalize command line arguments, allow verb / noun place switch
import { Input } from './domain/input';
import { constants } from './domain/constants';
import { PluginPlatform } from './domain/plugin-platform';
import { getPluginsWithName, getAllPluginNames } from './plugin-manager';
import { InputVerificationResult } from './domain/input-verification-result';
import { pathManager, stateManager } from 'amplify-cli-core';
import { insertAmplifyIgnore } from './extensions/amplify-helpers/git-manager';

export function getCommandLineInput(pluginPlatform: PluginPlatform): Input {
  const result = new Input(process.argv);
  /* tslint:disable */
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
  /* tslint:enable */

  return result;
}

function normalizeInput(input: Input): Input {
  // -v --version => version command
  // -h --help => help command
  // -y --yes => yes option
  if (input.options) {
    if (input.options[constants.VERSION] || input.options[constants.VERSION_SHORT]) {
      input.options[constants.VERSION] = true;
      delete input.options[constants.VERSION_SHORT];
    }

    if (input.options[constants.HELP] || input.options[constants.HELP_SHORT]) {
      input.options[constants.HELP] = true;
      delete input.options[constants.HELP_SHORT];
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

export function verifyInput(pluginPlatform: PluginPlatform, input: Input): InputVerificationResult {
  const result = new InputVerificationResult();

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
        if (commandAliases && commandAliases.hasOwnProperty(input.subCommands[0])) {
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

      result.message = `The Amplify CLI can NOT find command: ${commandString}`;
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

    // Also update gitignore to latest list - mainly to exclude amplify/backend/awscloudformation dir from .gitingore for older projects
    const { projectPath } = stateManager.getLocalEnvInfo();
    const gitIgnoreFilePath = pathManager.getGitIgnoreFilePath(projectPath);
    insertAmplifyIgnore(gitIgnoreFilePath);
  }
}
