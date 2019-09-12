// normalize command line arguments, allow verb / noun place switch
import Input from './domain/input';
import Constant from './domain/constants';
import PluginPlatform from './domain/plugin-platform';
import { getPluginsWithName, getAllPluginNames } from './plugin-manager';
import InputVerificationResult from './domain/input-verification-result';
import constants from './domain/constants';

export function getCommandLineInput(pluginPlatform: PluginPlatform): Input {
  const result = new Input(process.argv);
  /* tslint:disable */
  if (result.argv && result.argv.length > 2) {
    let index = 2;

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

export function normailizeInput(input: Input): Input {
  // -v --version => version command
  // -h --help => help command
  // -y --yes => yes option
  if (!input.command && input.options) {
    if (input.options[Constant.VERSION] || input.options[Constant.VERSION_SHORT]) {
      input.command = Constant.VERSION;
      input.options[Constant.VERSION] = true;
      delete input.options[Constant.VERSION_SHORT];
    } else if (input.options[Constant.HELP] || input.options[Constant.HELP_SHORT]) {
      input.command = Constant.HELP;
      input.options[Constant.HELP] = true;
      delete input.options[Constant.HELP_SHORT];
    }
  }

  input.command = input.command || Constant.HELP;

  if (input.options && input.options[Constant.YES_SHORT]) {
    input.options[Constant.YES] = true;
    delete input.options[Constant.YES_SHORT];
  }

  return input;
}

export function verifyInput(pluginPlatform: PluginPlatform, input: Input): InputVerificationResult {
  const result = new InputVerificationResult();

  input.plugin = input.plugin || constants.CORE;

  normailizeInput(input);

  const pluginCandidates = getPluginsWithName(pluginPlatform, input.plugin!);

  if (pluginCandidates.length > 0) {
    for (let i = 0; i < pluginCandidates.length; i++) {
      const { commands, commandAliases } = pluginCandidates[i].manifest;

      if ((commands && commands!.includes(Constant.HELP)) ||
        (commandAliases && Object.keys(commandAliases).includes(Constant.HELP))) {
        result.helpCommandAvailable = true;
      }
      if ((commands && commands!.includes(input.command!)) ||
        (commandAliases && Object.keys(commandAliases).includes(input.command!))) {
        result.verified = true;
        break;
      }
    }
    if (!result.verified) {
      if (input.plugin === constants.CORE) {
        result.message = `The Amplify CLI can NOT find command: ${input.command}.`
      } else {
        result.message = `The Amplify CLI can NOT find command: ${input.plugin} ${input.command}.`
      }
    }
  } else {
    result.verified = false;
    result.message = `The Amplify CLI can NOT find any plugin with name: ${input.plugin}`
  }

  return result;
}