import * as fs from 'fs-extra';

import path from 'path';
import inquirer, { QuestionCollection } from 'inquirer';
import {
  $TSAny, $TSContext, JSONUtilities, UnrecognizedFrameworkError,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { getProjectConfiguration, getSupportedFrameworks } from './framework-config-mapping';
import { Label as JAVASCRIPT } from './constants';

/**
 Initialize the project, setting framework and configuration
 */
export const init = async (context: $TSContext): Promise<void> => {
  normalizeInputParams(context);
  const framework = guessFramework(context, context.exeInfo.localEnvInfo.projectPath);
  const config = getProjectConfiguration(context, framework);
  context.exeInfo.projectConfig[JAVASCRIPT] = {
    framework,
    config,
  };
  await confirmConfiguration(context);
};

/**
 Returns the context for a successful initialization
 */
export const onInitSuccessful = (context: $TSContext): $TSContext => context;

/**
 Configures the javascript project
 */
export const configure = async (context: $TSContext): Promise<void> => {
  normalizeInputParams(context);
  if (!context.exeInfo.projectConfig[JAVASCRIPT]) {
    context.exeInfo.projectConfig[JAVASCRIPT] = {};
  }

  const currentConfiguration = context.exeInfo.projectConfig[JAVASCRIPT];
  if (!currentConfiguration.framework) {
    currentConfiguration.framework = guessFramework(context, context.exeInfo.localEnvInfo.projectPath);
  }
  if (!currentConfiguration.config) {
    currentConfiguration.config = getProjectConfiguration(context, currentConfiguration.framework);
  }

  await confirmConfiguration(context);
};

const normalizeInputParams = (context: $TSContext): void => {
  let inputParams;
  if (context.exeInfo.inputParams && context.exeInfo.inputParams[JAVASCRIPT]) {
    inputParams = context.exeInfo.inputParams[JAVASCRIPT];
  }
  if (inputParams && inputParams.framework) {
    if (!getSupportedFrameworks().includes(inputParams.framework.toLowerCase())) {
      context.print.warning(`Unsupported javascript framework: ${inputParams.framework}`);
      inputParams.framework = 'none';
    } else {
      inputParams.framework = inputParams.framework.toLowerCase();
    }
  }
  if (inputParams && inputParams.config) {
    if (
      !inputParams.config.SourceDir
      || !inputParams.config.DistributionDir
      || !inputParams.config.BuildCommand
      || !inputParams.config.StartCommand
    ) {
      throw new Error('The command line parameter for javascript frontend configuration is incomplete.');
    }
  }
  if (!context.exeInfo.inputParams) {
    context.exeInfo.inputParams = {};
  }
  context.exeInfo.inputParams[JAVASCRIPT] = inputParams;
};

const confirmConfiguration = async (context:$TSContext): Promise<void> => {
  await confirmFramework(context);
  await confirmFrameworkConfiguration(context);
};

const confirmFramework = async (context:$TSContext): Promise<void> => {
  const inputParams = context.exeInfo.inputParams[JAVASCRIPT];
  if (inputParams && inputParams.framework) {
    if (context.exeInfo.projectConfig[JAVASCRIPT].framework !== inputParams.framework) {
      context.exeInfo.projectConfig[JAVASCRIPT].framework = inputParams.framework;
      context.exeInfo.projectConfig[JAVASCRIPT].config = getProjectConfiguration(context, inputParams.framework);
    }
  } else if (!context.exeInfo.inputParams.yes) {
    context.print.info('Please tell us about your project');
    const frameworkConfirmation: QuestionCollection<{ 'framework': string; }> = {
      type: 'list',
      name: 'framework',
      message: 'What javascript framework are you using',
      choices: getSupportedFrameworks(),
      default: context.exeInfo.projectConfig[JAVASCRIPT].framework,
    };
    const answers = await inquirer.prompt(frameworkConfirmation);
    if (context.exeInfo.projectConfig[JAVASCRIPT].framework !== answers.framework) {
      context.exeInfo.projectConfig[JAVASCRIPT].framework = answers.framework;
      context.exeInfo.projectConfig[JAVASCRIPT].config = getProjectConfiguration(context, answers.framework);
    }
  }
};

const confirmFrameworkConfiguration = async (context: $TSContext): Promise<void> => {
  const inputParams = context.exeInfo.inputParams[JAVASCRIPT];
  if (inputParams && inputParams.config) {
    Object.assign(context.exeInfo.projectConfig[JAVASCRIPT].config, inputParams.config);
  } else if (!context.exeInfo.inputParams.yes) {
    if (!context.exeInfo.projectConfig[JAVASCRIPT].config) {
      context.exeInfo.projectConfig[JAVASCRIPT].config = getProjectConfiguration(
        context,
        context.exeInfo.projectConfig[JAVASCRIPT].framework,
      );
    }
    const { config } = context.exeInfo.projectConfig[JAVASCRIPT];
    const configurationSettings = [
      {
        type: 'input',
        name: 'SourceDir',
        message: 'Source Directory Path: ',
        default: config.SourceDir,
      },
      {
        type: 'input',
        name: 'DistributionDir',
        message: 'Distribution Directory Path:',
        default: config.DistributionDir,
      },
      {
        type: 'input',
        name: 'BuildCommand',
        message: 'Build Command: ',
        default: config.BuildCommand,
      },
      {
        type: 'input',
        name: 'StartCommand',
        message: 'Start Command:',
        default: config.StartCommand,
      },
    ];
    const answers = await inquirer.prompt(configurationSettings);

    Object.assign(context.exeInfo.projectConfig[JAVASCRIPT].config, { ...answers });
  }
};

const guessFramework = (context: $TSContext, projectPath: string): string => {
  let framework = 'none';
  if (context.exeInfo.inputParams[JAVASCRIPT] && context.exeInfo.inputParams[JAVASCRIPT].framework) {
    framework = context.exeInfo.inputParams[JAVASCRIPT].framework;
    if (getSupportedFrameworks().includes(framework)) {
      return framework;
    }
    throw new UnrecognizedFrameworkError(`The passed in framework: "${framework}" is not supported.`);
  }

  const packageJsonFilePath = path.join(projectPath, 'package.json');
  if (!fs.existsSync(packageJsonFilePath)) {
    return framework;
  }

  const packageJson = JSONUtilities.readJson<$TSAny>(packageJsonFilePath);
  if (!(packageJson && packageJson.dependencies)) {
    return framework;
  }
  if (packageJson.dependencies['react-native']) {
    return 'react-native';
  }
  if (packageJson.dependencies.react) {
    return 'react';
  }
  if (packageJson.dependencies['ionic-angular']) {
    return 'ionic';
  }
  if (packageJson.dependencies['@angular/core']) {
    return 'angular';
  }
  if (packageJson.dependencies.vue) {
    return 'vue';
  }
  return framework;
};

/**
 Displays guessed frontend defaults to the user
 */
export const displayFrontendDefaults = (context: $TSContext, projectPath: string): void => {
  printer.info(`| App type: javascript`);

  const defaultFramework = guessFramework(context, projectPath);
  const projectConfiguration = getProjectConfiguration(context, defaultFramework, projectPath);

  printer.info(`| Javascript framework: ${defaultFramework}`);
  printer.info(`| Source Directory Path: ${projectConfiguration.SourceDir}`);
  printer.info(`| Distribution Directory Path: ${projectConfiguration.DistributionDir}`);
  printer.info(`| Build Command: ${projectConfiguration.BuildCommand}`);
  printer.info(`| Start Command: ${projectConfiguration.StartCommand}`);
};

/**
 Se
 */
export const setFrontendDefaults = (context: $TSContext, projectPath: string): void => {
  const defaultFramework = guessFramework(context, projectPath);
  const projectConfiguration = getProjectConfiguration(context, defaultFramework);

  context.exeInfo.inputParams.amplify.frontend = 'javascript';

  context.exeInfo.inputParams[JAVASCRIPT] = { framework: defaultFramework, config: projectConfiguration };
};

export default {
  init,
  onInitSuccessful,
  configure,
  displayFrontendDefaults,
  setFrontendDefaults,
};
