import * as fs from 'fs-extra';
import * as path from 'path';
import sequential from 'promise-sequential';
import {
  stateManager, executeHooks, HooksMeta,
} from 'amplify-cli-core';
import { prompter } from 'amplify-prompts';
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
  AmplifyInternalOnlyPostEnvRemoveEventData,
  AmplifyPostEnvAddEventData,
} from './domain/amplify-event';
import { isHeadlessCommand, readHeadlessPayload } from './utils/headless-input-utils';
import {
  FromStartupTimedCodePaths, ManuallyTimedCodePath, UntilExitTimedCodePath,
} from './domain/amplify-usageData/UsageDataTypes';

/**
 * Execute a CLI command
 */
export const executeCommand = async (context: Context): Promise<void> => {
  const pluginCandidates = getPluginsWithNameAndCommand(context.pluginPlatform, context.input.plugin!, context.input.command!);

  if (pluginCandidates.length === 1) {
    await executePluginModuleCommand(context, pluginCandidates[0]);
  } else if (pluginCandidates.length > 1) {
    const selectedPluginInfo = await selectPluginForExecution(context, pluginCandidates);
    await executePluginModuleCommand(context, selectedPluginInfo);
  }
};

/**
 * Determine if container-based APIs are enabled for the project
 */
export const isContainersEnabled = (context: Context): boolean => {
  const projectConfig = context.amplify.getProjectConfig();
  return projectConfig?.[projectConfig.frontend]?.config?.ServerlessContainers ?? false;
};

const selectPluginForExecution = async (context: Context, pluginCandidates: PluginInfo[]): Promise<PluginInfo> => {
  let result = pluginCandidates[0];

  let promptForSelection = true;

  const noSmartPickCommands = ['add', 'help'];
  const commandAllowsSmartPick = !noSmartPickCommands.includes(context.input.command!);

  if (commandAllowsSmartPick) {
    const smartPickResult = smartPickPlugin(pluginCandidates);
    if (smartPickResult) {
      result = smartPickResult;
      promptForSelection = false;
    }
  }

  if (promptForSelection) {
    // only use the manifest's displayName if there are no duplicates
    const displayNames = pluginCandidates.map(candidate => candidate?.manifest?.displayName);
    const noDuplicateDisplayNames = (new Set(displayNames)).size === displayNames.length;

    // special handling for hosting plugins
    const consoleHostingPlugins = pluginCandidates.filter(pluginInfo => pluginInfo.packageName === 'amplify-console-hosting');
    if (consoleHostingPlugins.length > 0) {
      const otherPlugins = pluginCandidates.filter(pluginInfo => pluginInfo.packageName !== 'amplify-console-hosting');
      // put console hosting plugin at the top
      // eslint-disable-next-line no-param-reassign
      pluginCandidates = consoleHostingPlugins.concat(otherPlugins);
    }

    const amplifyMeta = context.amplify.getProjectMeta();
    const { Region } = amplifyMeta.providers.awscloudformation;

    if (!isContainersEnabled(context) || Region !== 'us-east-1') {
      // SSL Certificates only available to be created on us-east-1 only
      // eslint-disable-next-line no-param-reassign
      pluginCandidates = pluginCandidates.filter(plugin => !plugin.manifest.services?.includes('ElasticContainer'));
    }

    result = await prompter.pick('Select the plugin module to execute', pluginCandidates.map(plugin => {
      const displayName = plugin.manifest.displayName && noDuplicateDisplayNames
        ? plugin.manifest.displayName
        : `${plugin.packageName}@${plugin.packageVersion}`;
      return {
        name: displayName,
        value: plugin,
      };
    }));
  }

  return result;
};

const smartPickPlugin = (pluginCandidates: PluginInfo[]): PluginInfo | undefined => {
  const candidatesAreAllCategoryPlugins = pluginCandidates.every((pluginInfo: PluginInfo) => pluginInfo.manifest.type === 'category');

  const pluginName = pluginCandidates[0].manifest.name;
  const candidatesAllHaveTheSameName = pluginCandidates.every((pluginInfo: PluginInfo) => pluginInfo.manifest.name === pluginName);

  if (candidatesAreAllCategoryPlugins && candidatesAllHaveTheSameName && stateManager.metaFileExists()) {
    const amplifyMeta = stateManager.getMeta();

    const servicesSetInMeta = new Set<string>(Object.keys(amplifyMeta[pluginName] || {}));
    const pluginWithMatchingServices: PluginInfo[] = [];
    const pluginWithDisjointServices: PluginInfo[] = [];
    const pluginWithoutServicesDeclared: PluginInfo[] = [];
    // Use smart pick in two scenarios:
    // 1. if all the services under the category in metadata are in one and only one plugin candidate
    // 2. if no service in metadata is declared in any candidate's manifest, and only one candidate does not define the optional
    // "services" field in its manifest, select the candidate, this is for the existing implementation of official plugins
    pluginCandidates.forEach(candidate => {
      if (candidate.manifest.services && candidate.manifest.services!.length > 0) {
        const servicesSetInPlugin = new Set<string>(candidate.manifest.services);
        if (twoStringSetsAreEqual(servicesSetInMeta, servicesSetInPlugin)) {
          pluginWithMatchingServices.push(candidate);
        }
        if (twoStringSetsAreDisjoint(servicesSetInMeta, servicesSetInPlugin)) {
          pluginWithDisjointServices.push(candidate);
        }
      } else {
        pluginWithDisjointServices.push(candidate);
        pluginWithoutServicesDeclared.push(candidate);
      }
    });

    if (pluginWithMatchingServices.length === 1 && pluginWithDisjointServices.length === pluginCandidates.length - 1) {
      return pluginWithMatchingServices[0];
    }
    if (pluginWithDisjointServices.length === pluginCandidates.length && pluginWithoutServicesDeclared.length === 1) {
      return pluginWithoutServicesDeclared[0];
    }
  }
  return undefined;
};

const executePluginModuleCommand = async (context: Context, plugin: PluginInfo): Promise<void> => {
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
  await attachContextExtensions(context, plugin);
  await raisePreEvent(context);
  context.usageData.stopCodePathTimer(FromStartupTimedCodePaths.PLATFORM_STARTUP);
  context.usageData.startCodePathTimer(ManuallyTimedCodePath.PLUGIN_TIME);
  await handler();
  context.usageData.stopCodePathTimer(ManuallyTimedCodePath.PLUGIN_TIME);
  context.usageData.startCodePathTimer(UntilExitTimedCodePath.POST_PROCESS);
  await raisePostEvent(context);
};

const getHandler = async (pluginInfo: PluginInfo, context: Context): Promise<() => Promise<void>> => {
  const pluginModule = await import(pluginInfo.packageLocation);
  let commandName = constants.ExecuteAmplifyCommand;
  let fallbackFn = (): Promise<void> => legacyCommandExecutor(context, pluginInfo);

  if (isHeadlessCommand(context)) {
    commandName = constants.ExecuteAmplifyHeadlessCommand;
    fallbackFn = () => context.print.error(`Headless mode is not implemented for ${pluginInfo.packageName}`);
  }

  if (typeof pluginModule?.[commandName] === 'function') {
    if (commandName === constants.ExecuteAmplifyHeadlessCommand) {
      return async () => pluginModule[commandName](context, await readHeadlessPayload());
    }
    return () => pluginModule[commandName](context);
  }
  return fallbackFn;
};

// old plugin execution approach of scanning the command folder and locating the command file
// TODO check if this is used anywhere and remove if not
const legacyCommandExecutor = async (context: Context, plugin: PluginInfo): Promise<void> => {
  let commandFilePath = path.normalize(path.join(plugin.packageLocation, 'commands', plugin.manifest.name, context.input.command!));
  if (context.input.subCommands && context.input.subCommands.length > 0) {
    commandFilePath = path.join(commandFilePath, ...context.input.subCommands!);
  }

  let commandModule;

  try {
    commandModule = await import(commandFilePath);
  } catch (e) {
    // do nothing
  }

  if (!commandModule) {
    commandFilePath = path.normalize(path.join(plugin.packageLocation, 'commands', plugin.manifest.name));
    try {
      commandModule = await import(commandFilePath);
    } catch (e) {
      // do nothing
    }
  }

  if (commandModule) {
    await attachContextExtensions(context, plugin);
    await commandModule.run(context);
  } else {
    const { showAllHelp } = await import('./extensions/amplify-helpers/show-all-help');
    showAllHelp(context);
  }
};

const EVENT_EMITTING_PLUGINS = new Set([constants.CORE, constants.CODEGEN]);

const raisePreEvent = async (context: Context): Promise<void> => {
  await executeHooks(HooksMeta.getInstance(context.input, 'pre'));
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
    case 'export':
      await raisePreExportEvent(context);
      break;
    default:
      // fall through
  }
};

const raisePreInitEvent = async (context: Context): Promise<void> => {
  await raiseEvent(context, new AmplifyEventArgs(AmplifyEvent.PreInit, new AmplifyPreInitEventData()));
};

const raisePrePushEvent = async (context: Context): Promise<void> => {
  await raiseEvent(context, new AmplifyEventArgs(AmplifyEvent.PrePush, new AmplifyPrePushEventData()));
};

const raisePrePullEvent = async (context: Context): Promise<void> => {
  await raiseEvent(context, new AmplifyEventArgs(AmplifyEvent.PrePull, new AmplifyPrePullEventData()));
};

const raisePreExportEvent = async (context: Context): Promise<void> => {
  await raiseEvent(context, new AmplifyEventArgs(AmplifyEvent.PreExport));
};

const raisePreCodegenModelsEvent = async (context: Context): Promise<void> => {
  await raiseEvent(context, new AmplifyEventArgs(AmplifyEvent.PreCodegenModels, new AmplifyPreCodegenModelsEventData()));
};

const raisePostEvent = async (context: Context): Promise<void> => {
  const { command, plugin } = context.input;
  if (!plugin || !EVENT_EMITTING_PLUGINS.has(plugin)) {
    await executeHooks(HooksMeta.getInstance(context.input, 'post'));
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
    default:
      // fall through
  }
  await executeHooks(HooksMeta.getInstance(context.input, 'post'));
};

const raisePostInitEvent = async (context: Context): Promise<void> => {
  await raiseEvent(context, new AmplifyEventArgs(AmplifyEvent.PostInit, new AmplifyPostInitEventData()));
};

const raisePostPushEvent = async (context: Context): Promise<void> => {
  await raiseEvent(context, new AmplifyEventArgs(AmplifyEvent.PostPush, new AmplifyPostPushEventData()));
};

const raisePostPullEvent = async (context: Context): Promise<void> => {
  await raiseEvent(context, new AmplifyEventArgs(AmplifyEvent.PostPull, new AmplifyPostPullEventData()));
};

const raisePostCodegenModelsEvent = async (context: Context): Promise<void> => {
  await raiseEvent(context, new AmplifyEventArgs(AmplifyEvent.PostCodegenModels, new AmplifyPostCodegenModelsEventData()));
};

/**
 * Should only be used internally by the platform (ie not part of our exposed event API)
 */
export const raiseInternalOnlyPostEnvRemoveEvent = async (context: Context, envName: string): Promise<void> => {
  await raiseEvent(
    context,
    new AmplifyEventArgs(AmplifyEvent.InternalOnlyPostEnvRemove, new AmplifyInternalOnlyPostEnvRemoveEventData(envName)),
  );
};

/**
 * Raises the postEnvAdd event
 */
export const raisePostEnvAddEvent = async (context: Context, prevEnvName: string, newEnvName: string): Promise<void> => {
  await raiseEvent(context, new AmplifyEventArgs(AmplifyEvent.PostEnvAdd, new AmplifyPostEnvAddEventData(prevEnvName, newEnvName)));
};

/**
 * Raise a lifecycle hook event
 */
export const raiseEvent = async (context: Context, args: AmplifyEventArgs): Promise<void> => {
  const plugins = getPluginsWithEventHandler(context.pluginPlatform, args.event);
  if (plugins.length > 0) {
    const eventHandlers = plugins
      .filter(plugin => {
        const exists = fs.existsSync(plugin.packageLocation);
        return exists;
      })
      .map(plugin => {
        const eventHandler = async (): Promise<void> => {
          try {
            await attachContextExtensions(context, plugin);
            const pluginModule = await import(plugin.packageLocation);
            await pluginModule.handleAmplifyEvent(context, args);
          } catch {
            // no need to need anything
          }
        };
        return eventHandler;
      });
    await sequential(eventHandlers);
  }
};

// for backward compatibility, adds extensions to the context object
const attachContextExtensions = async (context: Context, plugin: PluginInfo): Promise<void> => {
  const extensionsDirPath = path.normalize(path.join(plugin.packageLocation, 'extensions'));
  if (fs.existsSync(extensionsDirPath)) {
    const stats = fs.statSync(extensionsDirPath);
    if (stats.isDirectory()) {
      const itemNames = fs.readdirSync(extensionsDirPath);
      for (const itemName of itemNames) {
        const itemPath = path.join(extensionsDirPath, itemName);
        try {
          const itemModule = await import(itemPath);
          itemModule(context);
        } catch (e) {
          // do nothing
        }
      }
    }
  }
};
