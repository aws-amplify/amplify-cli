const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const { getProjectConfiguration, getSupportedFrameworks } = require('./framework-config-mapping');
const { Label: JAVASCRIPT } = require('./constants');
const { UnrecognizedFrameworkError } = require('@aws-amplify/amplify-cli-core');

async function init(context) {
  normalizeInputParams(context);
  const framework = guessFramework(context, context.exeInfo.localEnvInfo.projectPath);
  const config = getProjectConfiguration(context, framework);
  context.exeInfo.projectConfig[JAVASCRIPT] = {
    framework,
    config,
  };
  await confirmConfiguration(context);
}

function onInitSuccessful(context) {
  return context;
}

async function configure(context) {
  normalizeInputParams(context);
  if (!context.exeInfo.projectConfig[JAVASCRIPT]) {
    context.exeInfo.projectConfig[JAVASCRIPT] = {};
  }

  const currentConfiguration = context.exeInfo.projectConfig[JAVASCRIPT];
  if (!currentConfiguration.framework) {
    currentConfiguration.framework = guessFramework(context.exeInfo.localEnvInfo.projectPath);
  }
  if (!currentConfiguration.config) {
    currentConfiguration.config = getProjectConfiguration(context, currentConfiguration.framework);
  }

  await confirmConfiguration(context);
}

function normalizeInputParams(context) {
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
      !inputParams.config.SourceDir ||
      !inputParams.config.DistributionDir ||
      !inputParams.config.BuildCommand ||
      !inputParams.config.StartCommand
    ) {
      throw new Error('The command line parameter for javascript frontend configuration is incomplete.');
    }
  }
  if (!context.exeInfo.inputParams) {
    context.exeInfo.inputParams = {};
  }
  context.exeInfo.inputParams[JAVASCRIPT] = inputParams;
}

async function confirmConfiguration(context) {
  await confirmFramework(context);
  await confirmFrameworkConfiguration(context);
}

async function confirmFramework(context) {
  const inputParams = context.exeInfo.inputParams[JAVASCRIPT];
  if (inputParams && inputParams.framework) {
    if (context.exeInfo.projectConfig[JAVASCRIPT].framework !== inputParams.framework) {
      context.exeInfo.projectConfig[JAVASCRIPT].framework = inputParams.framework;
      context.exeInfo.projectConfig[JAVASCRIPT].config = getProjectConfiguration(context, inputParams.framework);
    }
  } else if (!context.exeInfo.inputParams.yes) {
    context.print.info('Please tell us about your project');
    const frameworkComfirmation = {
      type: 'list',
      name: 'framework',
      message: 'What javascript framework are you using',
      choices: getSupportedFrameworks(),
      default: context.exeInfo.projectConfig[JAVASCRIPT].framework,
    };
    const answers = await inquirer.prompt(frameworkComfirmation);
    if (context.exeInfo.projectConfig[JAVASCRIPT].framework !== answers.framework) {
      context.exeInfo.projectConfig[JAVASCRIPT].framework = answers.framework;
      context.exeInfo.projectConfig[JAVASCRIPT].config = getProjectConfiguration(context, answers.framework);
    }
  }
}

async function confirmFrameworkConfiguration(context) {
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
        message: 'Build Command:',
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
}

function guessFramework(context, projectPath) {
  let framework = 'none';
  if (context.exeInfo.inputParams[JAVASCRIPT] && context.exeInfo.inputParams[JAVASCRIPT].framework) {
    framework = context.exeInfo.inputParams[JAVASCRIPT].framework;
    if (getSupportedFrameworks().includes(framework)) {
      return framework;
    }
    throw Error(UnrecognizedFrameworkError(`The passed in framework: "${framework}" is not supported.`));
  }

  try {
    const packageJsonFilePath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonFilePath)) {
      const packageJson = context.amplify.readJsonFile(packageJsonFilePath, 'utf8');
      if (packageJson && packageJson.dependencies) {
        if (packageJson.dependencies.react) {
          framework = 'react';
          if (packageJson.dependencies['react-native']) {
            framework = 'react-native';
          }
        } else if (packageJson.dependencies['@angular/core']) {
          framework = 'angular';
          if (packageJson.dependencies['ionic-angular']) {
            framework = 'ionic';
          }
        } else if (packageJson.dependencies.vue) {
          framework = 'vue';
        }
      }
    }
  } catch (e) {
    framework = 'none';
  }
  return framework;
}

function displayFrontendDefaults(context, projectPath) {
  context.print.info(`| App type: javascript`);

  const defaultFramework = guessFramework(context, projectPath);
  const projectConfiguration = getProjectConfiguration(context, defaultFramework, projectPath);

  context.print.info(`| Javascript framework: ${defaultFramework}`);
  context.print.info(`| Source Directory Path: ${projectConfiguration.SourceDir}`);
  context.print.info(`| Distribution Directory Path: ${projectConfiguration.DistributionDir}`);
  context.print.info(`| Build Command: ${projectConfiguration.BuildCommand}`);
  context.print.info(`| Start Command: ${projectConfiguration.StartCommand}`);
}

function setFrontendDefaults(context, projectPath) {
  const defaultFramework = guessFramework(context, projectPath);
  const projectConfiguration = getProjectConfiguration(context, defaultFramework);

  context.exeInfo.inputParams.amplify.frontend = 'javascript';

  let inputParams = {};
  context.exeInfo.inputParams[JAVASCRIPT] = inputParams;
  inputParams.framework = defaultFramework;
  inputParams.config = projectConfiguration;
  context.exeInfo.inputParams[JAVASCRIPT] = inputParams;
}

module.exports = {
  init,
  onInitSuccessful,
  configure,
  displayFrontendDefaults,
  setFrontendDefaults,
};
