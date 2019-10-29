import path from 'path';
import fs from 'fs-extra';
import inquirer from '../domain/inquirer-helper';
import { Context } from '../domain/context';
import { constants } from '../domain/constants';
import { AmplifyEvent } from '../domain/amplify-event';
import { AmplifyPluginType } from '../domain/amplify-plugin-type';
import { readJsonFileSync } from '../utils/readJsonFile';
import { validPluginNameSync } from './verify-plugin';
import { createIndentation } from './display-plugin-platform';

const INDENTATIONSPACE = 4;

export default async function createNewPlugin(context: Context, pluginParentDirPath: string): Promise<string | undefined> {
  const pluginName = await getPluginName(context, pluginParentDirPath);
  if (pluginName) {
    return await copyAndUpdateTemplateFiles(context, pluginParentDirPath, pluginName!);
  }
  return undefined;
}

async function getPluginName(context: Context, pluginParentDirPath: string): Promise<string | undefined> {
  let pluginName = 'my-amplify-plugin';
  const yesFlag = context.input.options && context.input.options[constants.YES];

  if (context.input.subCommands!.length > 1) {
    // subcommands: ['new', 'name']
    pluginName = context.input.subCommands![1];
  } else if (!yesFlag) {
    const pluginNameQuestion = {
      type: 'input',
      name: 'pluginName',
      message: 'What should be the name of the plugin:',
      default: pluginName,
      validate: (input: string) => {
        const pluginNameValidationResult = validPluginNameSync(input);
        if (!pluginNameValidationResult.isValid) {
          return pluginNameValidationResult.message || 'Invalid plugin name';
        }
        return true;
      },
    };
    const answer = await inquirer.prompt(pluginNameQuestion);
    pluginName = answer.pluginName;
  }

  const pluginDirPath = path.join(pluginParentDirPath, pluginName);

  if (fs.existsSync(pluginDirPath) && !yesFlag) {
    context.print.error(`The directory ${pluginName} already exists`);
    const overwriteQuestion = {
      type: 'confirm',
      name: 'ifOverWrite',
      message: 'Do you want to overwrite it?',
      default: false,
    };
    const answer = await inquirer.prompt(overwriteQuestion);
    if (answer.ifOverWrite) {
      return pluginName;
    }
    return undefined;
  }
  return pluginName;
}

async function copyAndUpdateTemplateFiles(context: Context, pluginParentDirPath: string, pluginName: string) {
  const pluginDirPath = path.join(pluginParentDirPath, pluginName);
  fs.emptyDirSync(pluginDirPath);

  const pluginType = await promptForPluginType(context);
  const eventHandlers = await promptForEventSubscription(context);

  let srcDirPath = path.join(__dirname, '../../templates/plugin-template');
  if (pluginType === AmplifyPluginType.frontend.toString()) {
    srcDirPath = path.join(__dirname, '../../templates/plugin-template-frontend');
  } else if (pluginType === AmplifyPluginType.provider.toString()) {
    srcDirPath = path.join(__dirname, '../../templates/plugin-template-provider');
  }
  fs.copySync(srcDirPath, pluginDirPath);

  updatePackageJson(pluginDirPath, pluginName);
  updateAmplifyPluginJson(pluginDirPath, pluginName, pluginType, eventHandlers);
  updateEventHandlersFolder(pluginDirPath, eventHandlers);

  return pluginDirPath;
}

async function promptForPluginType(context: Context): Promise<string> {
  const yesFlag = context.input.options && context.input.options[constants.YES];

  if (yesFlag) {
    return AmplifyPluginType.util;
  }
  {
    const pluginTypes = Object.keys(AmplifyPluginType);
    const LEARNMORE = 'Learn more';
    const choices = pluginTypes.concat([LEARNMORE]);
    const answer = await inquirer.prompt({
      type: 'list',
      name: 'selection',
      message: 'Specify the plugin type',
      choices,
      default: AmplifyPluginType.util,
    });
    if (answer.selection === LEARNMORE) {
      displayAmplifyPluginTypesLearnMore(context);
      return await promptForPluginType(context);
    }
    return answer.selection;
  }
}

function displayAmplifyPluginTypesLearnMore(context: Context) {
  context.print.green('The Amplify CLI supports these plugin types:');
  context.print.red(AmplifyPluginType.category);
  context.print.green(`${AmplifyPluginType.category} plugins allows the CLI user to add, \
remove and configure a set of backend resources. They in turn use provider plugins to \
provision these resources in the cloud.`);
  context.print.red(AmplifyPluginType.provider);
  context.print.green(`${AmplifyPluginType.provider} plugins expose methods for other plugins \
like the category plugin to provision resources in the cloud. The Amplify CLI prompts the user \
to select provider plugins to initialize during the execution of the amplify init command \
(if there are multiple cloud provider plugins present), \
and then invoke the init method of the selected provider plugins.`);
  context.print.red(AmplifyPluginType.frontend);
  context.print.green(`${AmplifyPluginType.frontend} plugins are responsible for detecting \
the frontend framework used by the frontend project and handle the frontend project and handle \
generation of all the configuration files required by the frontend framework.`);
  context.print.red(AmplifyPluginType.util);
  context.print.green(`${AmplifyPluginType.util} plugins are general purpose utility plugins, \
they provide utility functions for other plugins.`);
  context.print.green('For more information please read - \
https://aws-amplify.github.io/docs/cli-toolchain/plugins');
}

async function promptForEventSubscription(context: Context): Promise<string[]> {
  const yesFlag = context.input.options && context.input.options[constants.YES];
  const eventHandlers = Object.keys(AmplifyEvent);

  if (yesFlag) {
    return eventHandlers;
  }
  {
    const LEARNMORE = 'Learn more';
    const choices = eventHandlers.concat([LEARNMORE]);
    const answer = await inquirer.prompt({
      type: 'checkbox',
      name: 'selections',
      message: 'What Amplify CLI events do you want the plugin to handle?',
      choices,
      default: eventHandlers,
    });
    if (answer.selections.includes(LEARNMORE)) {
      displayAmplifyEventsLearnMore(context);
      return await promptForEventSubscription(context);
    }
    return answer.selections;
  }
}

function displayAmplifyEventsLearnMore(context: Context) {
  const indentationStr = createIndentation(INDENTATIONSPACE);
  context.print.green('The Amplify CLI aims to provide a flexible and loosely-coupled \
pluggable platforms for the plugins.');
  context.print.green('To make this possible, \
the platform broadcasts events for plugins to handle.');
  context.print.green('If a plugin subscribes to an event, its event handler is \
invoked by the Amplify CLI Core on such event.');
  context.print.green('');
  context.print.green('The Amplify CLI currently broadcasts these events to plugins:');
  context.print.red(AmplifyEvent.PreInit);
  context.print.green(`${indentationStr}${AmplifyEvent.PreInit} handler is invoked prior to the \
execution of the amplify init command.`);
  context.print.red(AmplifyEvent.PostInit);
  context.print.green(`${indentationStr}${AmplifyEvent.PostInit} handler is invoked on the \
complete execution of the amplify init command.`);
  context.print.red(AmplifyEvent.PrePush);
  context.print.green(`${indentationStr}${AmplifyEvent.PrePush} handler is invoked prior to the \
executionof the amplify push command.`);
  context.print.red(AmplifyEvent.PostPush);
  context.print.green(`${indentationStr}${AmplifyEvent.PostPush} handler is invoked on the \
complete execution of the amplify push command.`);
  context.print.warning('This feature is currently under actively development, \
events might be added or removed in future releases');
}

function updatePackageJson(pluginDirPath: string, pluginName: string): void {
  const filePath = path.join(pluginDirPath, 'package.json');
  const packageJson = readJsonFileSync(filePath);
  packageJson.name = pluginName;
  const jsonString = JSON.stringify(packageJson, null, INDENTATIONSPACE);
  fs.writeFileSync(filePath, jsonString, 'utf8');
}

function updateAmplifyPluginJson(pluginDirPath: string, pluginName: string, pluginType: string, eventHandlers: string[]): void {
  const filePath = path.join(pluginDirPath, constants.MANIFEST_FILE_NAME);
  const amplifyPluginJson = readJsonFileSync(filePath);
  amplifyPluginJson.name = pluginName;
  amplifyPluginJson.type = pluginType;
  amplifyPluginJson.eventHandlers = eventHandlers;
  const jsonString = JSON.stringify(amplifyPluginJson, null, INDENTATIONSPACE);
  fs.writeFileSync(filePath, jsonString, 'utf8');
}

function updateEventHandlersFolder(pluginDirPath: string, eventHandlers: string[]): void {
  const dirPath = path.join(pluginDirPath, 'event-handlers');
  const fileNames = fs.readdirSync(dirPath);

  fileNames.forEach(fileName => {
    const eventName = fileName.replace('handle-', '').split('.')[0];
    if (!eventHandlers.includes(eventName)) {
      fs.removeSync(path.join(dirPath, fileName));
    }
  });
}
