import fs from 'fs-extra';
import path from 'path';
import { Context } from './domain/context';
import { constants } from './domain/constants';
import { scan, getPluginsWithNameAndCommand, getPluginsWithEventHandler } from './plugin-manager';
import { PluginInfo } from './domain/plugin-info';
import inquirer from './domain/inquirer-helper';
import {
  AmplifyEvent,
  AmplifyEventArgs,
  AmplifyPreInitEventData,
  AmplifyPostInitEventData,
  AmplifyPrePushEventData,
  AmplifyPostPushEventData,
} from './domain/amplify-event';

export async function executeCommand(context: Context) {
  const pluginCandidates = getPluginsWithNameAndCommand(context.pluginPlatform, context.input.plugin!, context.input.command!);

  if (pluginCandidates.length === 1) {
    await executePluginModuleCommand(context, pluginCandidates[0]);
  } else if (pluginCandidates.length > 1) {
    const answer = await inquirer.prompt({
      type: 'list',
      name: 'section',
      message: 'Select the module to execute',
      choices: pluginCandidates.map(plugin => {
        const pluginOptions = {
          name: plugin.packageName + '@' + plugin.packageVersion,
          value: plugin,
          short: plugin.packageName + '@' + plugin.packageVersion,
        };
        return pluginOptions;
      }),
    });
    const pluginModule = answer.section as PluginInfo;
    await executePluginModuleCommand(context, pluginModule);
  }
}

async function executePluginModuleCommand(context: Context, plugin: PluginInfo) {
  const { commands, commandAliases } = plugin.manifest;
  if (!commands!.includes(context.input.command!)) {
    context.input.command = commandAliases![context.input.command!];
  }

  if (fs.existsSync(plugin.packageLocation)) {
    await raisePreEvent(context);

    const pluginModule = require(plugin.packageLocation);
    if (
      pluginModule.hasOwnProperty(constants.ExecuteAmplifyCommand) &&
      typeof pluginModule[constants.ExecuteAmplifyCommand] === 'function'
    ) {
      attachContextExtensions(context, plugin);
      await pluginModule.executeAmplifyCommand(context);
    } else {
      // if the module does not have the executeAmplifyCommand method,
      // fall back to the old approach by scanning the command folder and locate the command file
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
    }

    await raisePostEvent(context);
  } else {
    await scan();
    context.print.error('The Amplify CLI plugin platform detected an error.');
    context.print.info('It has performed a fresh scan.');
    context.print.info('Please execute your command again.');
  }
}

async function raisePreEvent(context: Context) {
  if (context.input.plugin === constants.CORE) {
    if (context.input.command === 'init') {
      await raisePreInitEvent(context);
    } else if (context.input.command === 'push') {
      await raisePrePushEvent(context);
    }
  }
}

async function raisePreInitEvent(context: Context) {
  await raiseEvent(context, new AmplifyEventArgs(AmplifyEvent.PreInit, new AmplifyPreInitEventData()));
}

async function raisePrePushEvent(context: Context) {
  await raiseEvent(context, new AmplifyEventArgs(AmplifyEvent.PrePush, new AmplifyPrePushEventData()));
}

async function raisePostEvent(context: Context) {
  if (context.input.plugin === constants.CORE) {
    if (context.input.command === 'init') {
      await raisePostInitEvent(context);
    } else if (context.input.command === 'push') {
      await raisePostPushEvent(context);
    }
  }
}

async function raisePostInitEvent(context: Context) {
  await raiseEvent(context, new AmplifyEventArgs(AmplifyEvent.PostInit, new AmplifyPostPushEventData()));
}

async function raisePostPushEvent(context: Context) {
  await raiseEvent(context, new AmplifyEventArgs(AmplifyEvent.PostPush, new AmplifyPostInitEventData()));
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
