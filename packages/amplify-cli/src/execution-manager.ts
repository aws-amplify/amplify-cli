import * as fs from 'fs-extra';
import * as path from 'path';
import * as inquirer from 'inquirer';
import { stateManager } from 'amplify-cli-core';
import { twoStringSetsAreEqual, twoStringSetsAreDisjoint } from './utils/set-ops';
import { Context } from './domain/context';
import { constants } from './domain/constants';
import { scan, getPluginsWithNameAndCommand, getPluginsWithEventHandler } from './plugin-manager';
import { PluginInfo } from './domain/plugin-info';
import {
  AmplifyEvent,
  AmplifyEventArgs,
  AmplifyPreInitEventData,
  AmplifyPostInitEventData,
  AmplifyPrePushEventData,
  AmplifyPostPushEventData,
  AmplifyPrePullEventData,
  AmplifyPostPullEventData,
  AmplifyPreCodegenModelsEventData,
  AmplifyPostCodegenModelsEventData,
} from './domain/amplify-event';
import { isHeadlessCommand, readHeadlessPayload } from './utils/headless-input-utils';

export async function executeCommand(context: Context) {
  const pluginCandidates = getPluginsWithNameAndCommand(context.pluginPlatform, context.input.plugin!, context.input.command!);

  if (pluginCandidates.length === 1) {
    await executePluginModuleCommand(context, pluginCandidates[0]);
  } else if (pluginCandidates.length > 1) {
    const selectedPluginInfo = await selectPluginForExecution(context, pluginCandidates);
    await executePluginModuleCommand(context, selectedPluginInfo);
  }
}

export function isContainersEnabled(context) {
  const projectConfig = context.amplify.getProjectConfig();
  return projectConfig?.[projectConfig.frontend]?.config?.ServerlessContainers ?? false;
}

async function selectPluginForExecution(context: Context, pluginCandidates: PluginInfo[]): Promise<PluginInfo> {
  let result = pluginCandidates[0];

  let promptForSelection = true;

  const noSmartPickCommands = ['add', 'help'];
  const commandAllowsSmartPick = !noSmartPickCommands.includes(context.input.command!);

  if (commandAllowsSmartPick) {
    let candidatesAreAllCategoryPlugins = pluginCandidates.every((pluginInfo: PluginInfo) => {
      return pluginInfo.manifest.type === 'category';
    });

    const pluginName = pluginCandidates[0].manifest.name;
    let candidatesAllHaveTheSameName = pluginCandidates.every((pluginInfo: PluginInfo) => {
      return pluginInfo.manifest.name === pluginName;
    });

    if (candidatesAreAllCategoryPlugins && candidatesAllHaveTheSameName) {
      if (stateManager.metaFileExists()) {
        const amplifyMeta = stateManager.getMeta();

        const servicesSetInMeta = new Set<string>(Object.keys(amplifyMeta[pluginName] || {}));
        const pluginWithMatchingServices: PluginInfo[] = [];
        const pluginWithDisjointServices: PluginInfo[] = [];
        const pluginWithoutServicesDeclared: PluginInfo[] = [];
        //Use smart pick in two scenarios:
        //1. if all the services under the category in metadata are in one and only one plugin candidate
        //2. if no service in metadata is declared in any candidate's manifest, and only one candiate does not define the optional
        //"services" field in its manifest, select the candiate, this is for the existing implementation of official plugins
        let i = 0;
        while (i < pluginCandidates.length) {
          if (pluginCandidates[i].manifest.services && pluginCandidates[i].manifest.services!.length > 0) {
            const servicesSetInPlugin = new Set<string>(pluginCandidates[i].manifest.services);
            if (twoStringSetsAreEqual(servicesSetInMeta, servicesSetInPlugin)) {
              pluginWithMatchingServices.push(pluginCandidates[i]);
            }
            if (twoStringSetsAreDisjoint(servicesSetInMeta, servicesSetInPlugin)) {
              pluginWithDisjointServices.push(pluginCandidates[i]);
            }
          } else {
            pluginWithDisjointServices.push(pluginCandidates[i]);
            pluginWithoutServicesDeclared.push(pluginCandidates[i]);
          }
          i++;
        }

        if (pluginWithMatchingServices.length === 1 && pluginWithDisjointServices.length === pluginCandidates.length - 1) {
          result = pluginWithMatchingServices[0];
          promptForSelection = false;
        } else if (pluginWithDisjointServices.length === pluginCandidates.length && pluginWithoutServicesDeclared.length === 1) {
          result = pluginWithoutServicesDeclared[0];
          promptForSelection = false;
        }
      }
    }
  }

  if (promptForSelection) {
    //only use the manifest's displayName if there are no duplicates
    let noDuplicateDisplayNames = true;
    let displayNameSet = new Set<string>();
    let i = 0;
    while (noDuplicateDisplayNames && i < pluginCandidates.length) {
      const { displayName } = pluginCandidates[i].manifest;
      if (displayName) {
        if (displayNameSet.has(displayName)) {
          noDuplicateDisplayNames = false;
          break;
        } else {
          displayNameSet.add(displayName);
        }
      }
      i++;
    }

    //special handling for hosting plugins
    const consoleHostingPlugins = pluginCandidates.filter(pluginInfo => {
      return pluginInfo.packageName === 'amplify-console-hosting';
    });
    if (consoleHostingPlugins.length > 0) {
      const otherPlugins = pluginCandidates.filter(pluginInfo => {
        return pluginInfo.packageName !== 'amplify-console-hosting';
      });
      //put console hosting plugin at the top
      pluginCandidates = consoleHostingPlugins.concat(otherPlugins);
    }

    const amplifyMeta = context.amplify.getProjectMeta();
    const { Region } = amplifyMeta.providers['awscloudformation'];

    if (!isContainersEnabled(context) || Region !== 'us-east-1') { // SSL Certificates only available to be created on us-east-1 only
      pluginCandidates = pluginCandidates.filter(plugin => !plugin.manifest.services?.includes('ElasticContainer'));
    }

    const answer = await inquirer.prompt({
      type: 'list',
      name: 'section',
      message: 'Select the plugin module to execute',
      choices: pluginCandidates.map(plugin => {
        let displayName = plugin.packageName + '@' + plugin.packageVersion;
        if (plugin.manifest.displayName && noDuplicateDisplayNames) {
          displayName = plugin.manifest.displayName;
        }
        const pluginOption = {
          name: displayName,
          value: plugin,
          short: displayName,
        };
        return pluginOption;
      }),
    });
    result = answer.section as PluginInfo;
  }

  return result;
}

async function executePluginModuleCommand(context: Context, plugin: PluginInfo): Promise<void> {
  const { commands, commandAliases } = plugin.manifest;
  if (!commands!.includes(context.input.command!)) {
    context.input.command = commandAliases![context.input.command!];
  }

  if (!fs.existsSync(plugin.packageLocation)) {
    await scan();
    context.print.error('The Amplify CLI plugin platform detected an error.');
    context.print.info('It has performed a fresh scan.');
    context.print.info('Please execute your command again.');
    return;
  }

  const handler = await getHandler(plugin, context);
  attachContextExtensions(context, plugin);
  await raisePreEvent(context);
  await handler();
  await raisePostEvent(context);
}

const getHandler = async (pluginInfo: PluginInfo, context: any): Promise<() => Promise<void>> => {
  const pluginModule = await import(pluginInfo.packageLocation);
  let commandName = constants.ExecuteAmplifyCommand;
  let fallbackFn = () => legacyCommandExecutor(context, pluginInfo);

  if (isHeadlessCommand(context)) {
    commandName = constants.ExecuteAmplifyHeadlessCommand;
    fallbackFn = () => context.print.error(`Headless mode is not implemented for ${pluginInfo.packageName}`);
  }

  if (pluginModule.hasOwnProperty(commandName) && typeof pluginModule[commandName] === 'function') {
    if (commandName === constants.ExecuteAmplifyHeadlessCommand) {
      return async () => pluginModule[commandName](context, await readHeadlessPayload());
    } else {
      return () => pluginModule[commandName](context);
    }
  } else {
    return fallbackFn;
  }
};

// old plugin execution approach of scanning the command folder and locating the command file
// TODO check if this is used anywhere and remove if not
const legacyCommandExecutor = async (context: Context, plugin: PluginInfo) => {
  let commandFilepath = path.normalize(path.join(plugin.packageLocation, 'commands', plugin.manifest.name, context.input.command!));
  if (context.input.subCommands && context.input.subCommands.length > 0) {
    commandFilepath = path.join(commandFilepath, ...context.input.subCommands!);
  }

  let commandModule;

  try {
    commandModule = require(commandFilepath);
  } catch (e) {
    // do nothing
  }

  if (!commandModule) {
    commandFilepath = path.normalize(path.join(plugin.packageLocation, 'commands', plugin.manifest.name));
    try {
      commandModule = require(commandFilepath);
    } catch (e) {
      // do nothing
    }
  }

  if (commandModule) {
    attachContextExtensions(context, plugin);
    await commandModule.run(context);
  } else {
    const { showAllHelp } = require('./extensions/amplify-helpers/show-all-help');
    showAllHelp(context);
  }
};

const EVENT_EMITTING_PLUGINS = new Set([constants.CORE, constants.CODEGEN]);

async function raisePreEvent(context: Context) {
  const { command, plugin } = context.input;
  if (!plugin || !EVENT_EMITTING_PLUGINS.has(plugin)) {
    return;
  }
  switch (command) {
    case 'init':
      await raisePreInitEvent(context);
      break;
    case 'push':
      await raisePrePushEvent(context);
      break;
    case 'pull':
      await raisePrePullEvent(context);
      break;
    case 'models':
      await raisePreCodegenModelsEvent(context);
      break;
  }
}

async function raisePreInitEvent(context: Context) {
  await raiseEvent(context, new AmplifyEventArgs(AmplifyEvent.PreInit, new AmplifyPreInitEventData()));
}

async function raisePrePushEvent(context: Context) {
  await raiseEvent(context, new AmplifyEventArgs(AmplifyEvent.PrePush, new AmplifyPrePushEventData()));
}

async function raisePrePullEvent(context: Context) {
  await raiseEvent(context, new AmplifyEventArgs(AmplifyEvent.PrePull, new AmplifyPrePullEventData()));
}

async function raisePreCodegenModelsEvent(context: Context) {
  await raiseEvent(context, new AmplifyEventArgs(AmplifyEvent.PreCodegenModels, new AmplifyPreCodegenModelsEventData()));
}

async function raisePostEvent(context: Context) {
  const { command, plugin } = context.input;
  if (!plugin || !EVENT_EMITTING_PLUGINS.has(plugin)) {
    return;
  }
  switch (command) {
    case 'init':
      await raisePostInitEvent(context);
      break;
    case 'push':
      await raisePostPushEvent(context);
      break;
    case 'pull':
      await raisePostPullEvent(context);
      break;
    case 'models':
      await raisePostCodegenModelsEvent(context);
      break;
  }
}

async function raisePostInitEvent(context: Context) {
  await raiseEvent(context, new AmplifyEventArgs(AmplifyEvent.PostInit, new AmplifyPostPushEventData()));
}

async function raisePostPushEvent(context: Context) {
  await raiseEvent(context, new AmplifyEventArgs(AmplifyEvent.PostPush, new AmplifyPostInitEventData()));
}

async function raisePostPullEvent(context: Context) {
  await raiseEvent(context, new AmplifyEventArgs(AmplifyEvent.PostPull, new AmplifyPostPullEventData()));
}

async function raisePostCodegenModelsEvent(context: Context) {
  await raiseEvent(context, new AmplifyEventArgs(AmplifyEvent.PostCodegenModels, new AmplifyPostCodegenModelsEventData()));
}

export async function raiseEvent(context: Context, args: AmplifyEventArgs) {
  const plugins = getPluginsWithEventHandler(context.pluginPlatform, args.event);
  if (plugins.length > 0) {
    const sequential = require('promise-sequential');
    const eventHandlers = plugins
      .filter(plugin => {
        const exists = fs.existsSync(plugin.packageLocation);
        return exists;
      })
      .map(plugin => {
        const eventHandler = async () => {
          try {
            attachContextExtensions(context, plugin);
            const pluginModule = require(plugin.packageLocation);
            await pluginModule.handleAmplifyEvent(context, args);
          } catch {
            // no need to need anything
          }
        };
        return eventHandler;
      });
    await sequential(eventHandlers);
  }
}

// for backward compatabilities, extensions to the context object
function attachContextExtensions(context: Context, plugin: PluginInfo) {
  const extensionsDirPath = path.normalize(path.join(plugin.packageLocation, 'extensions'));
  if (fs.existsSync(extensionsDirPath)) {
    const stats = fs.statSync(extensionsDirPath);
    if (stats.isDirectory()) {
      const itemNames = fs.readdirSync(extensionsDirPath);
      itemNames.forEach(itemName => {
        const itemPath = path.join(extensionsDirPath, itemName);
        let itemModule;
        try {
          itemModule = require(itemPath);
          itemModule(context);
        } catch (e) {
          // do nothing
        }
      });
    }
  }
}
