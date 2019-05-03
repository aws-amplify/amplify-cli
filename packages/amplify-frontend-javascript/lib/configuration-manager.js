const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const frameworkConfigMapping = require('./framework-config-mapping');
const constants = require('./constants');

async function init(context) {
  normalizeInputParams(context);
  const framework = guessFramework(context, context.exeInfo.localEnvInfo.projectPath);
  const config = frameworkConfigMapping[framework];
  context.exeInfo.projectConfig[constants.Label] = {
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
  if (!context.exeInfo.projectConfig[constants.Label]) {
    context.exeInfo.projectConfig[constants.Label] = {};
  }

  const currentConfiguration = context.exeInfo.projectConfig[constants.Label];
  if (!currentConfiguration.framework) {
    currentConfiguration.framework = guessFramework(context.exeInfo.localEnvInfo.projectPath);
  }
  if (!currentConfiguration.config) {
    currentConfiguration.config = frameworkConfigMapping[currentConfiguration.framework];
  }
  await confirmConfiguration(context);
}

function normalizeInputParams(context) {
  let inputParams;
  if (context.exeInfo.inputParams &&
    context.exeInfo.inputParams[constants.Label]) {
    inputParams = context.exeInfo.inputParams[constants.Label];
  }
  if (inputParams && inputParams.framework) {
    if (!Object.keys(frameworkConfigMapping).includes(inputParams.framework.toLowerCase())) {
      context.print.warning(`Unsupported javascript framework: ${inputParams.framework}`);
      inputParams.framework = 'none';
    } else {
      inputParams.framework = inputParams.framework.toLowerCase();
    }
  }
  if (inputParams && inputParams.config) {
    if (!inputParams.config.SourceDir ||
       !inputParams.config.DistributionDir ||
       !inputParams.config.BuildCommand ||
       !inputParams.config.StartCommand) {
      throw new Error('The command line parameter for javascript frontend configuration is incomplete.');
    }
  }
  if (!context.exeInfo.inputParams) {
    context.exeInfo.inputParams = {};
  }
  context.exeInfo.inputParams[constants.Label] = inputParams;
}

async function confirmConfiguration(context) {
  await confirmFramework(context);
  await confirmFrameworkConfiguration(context);
}

async function confirmFramework(context) {
  const inputParams = context.exeInfo.inputParams[constants.Label];
  if (inputParams && inputParams.framework) {
    if (context.exeInfo.projectConfig[constants.Label].framework !== inputParams.framework) {
      context.exeInfo.projectConfig[constants.Label].framework = inputParams.framework;
      context.exeInfo.projectConfig[constants.Label].config =
          frameworkConfigMapping[inputParams.framework];
    }
  } else if (!context.exeInfo.inputParams.yes) {
    context.print.info('Please tell us about your project');
    const frameworkComfirmation = {
      type: 'list',
      name: 'framework',
      message: 'What javascript framework are you using',
      choices: Object.keys(frameworkConfigMapping),
      default: context.exeInfo.projectConfig[constants.Label].framework,
    };
    const answers = await inquirer.prompt(frameworkComfirmation);
    if (context.exeInfo.projectConfig[constants.Label].framework !== answers.framework) {
      context.exeInfo.projectConfig[constants.Label].framework = answers.framework;
      context.exeInfo.projectConfig[constants.Label].config =
          frameworkConfigMapping[answers.framework];
    }
  }
}

async function confirmFrameworkConfiguration(context) {
  const inputParams = context.exeInfo.inputParams[constants.Label];
  if (inputParams && inputParams.config) {
    Object.assign(context.exeInfo.projectConfig[constants.Label].config, inputParams.config);
  } else if (!context.exeInfo.inputParams.yes) {
    if (!context.exeInfo.projectConfig[constants.Label].config) {
      context.exeInfo.projectConfig[constants.Label].config =
          frameworkConfigMapping[context.exeInfo.projectConfig[constants.Label].framework];
    }
    const { config } = context.exeInfo.projectConfig[constants.Label];
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
    Object.assign(context.exeInfo.projectConfig[constants.Label].config, answers);
  }
}

function guessFramework(context, projectPath) {
  let frameWork = 'none';
  try {
    const packageJsonFilePath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonFilePath)) {
      const packageJson = context.amplify.readJsonFile(packageJsonFilePath, 'utf8');
      if (packageJson && packageJson.dependencies) {
        if (packageJson.dependencies.react) {
          frameWork = 'react';
          if (packageJson.dependencies['react-native']) {
            frameWork = 'react-native';
          }
        } else if (packageJson.dependencies['@angular/core']) {
          frameWork = 'angular';
          if (packageJson.dependencies['ionic-angular']) {
            frameWork = 'ionic';
          }
        } else if (packageJson.dependencies.vue) {
          frameWork = 'vue';
        }
      }
    }
  } catch (e) {
    frameWork = 'none';
  }
  return frameWork;
}

module.exports = {
  init,
  onInitSuccessful,
  configure,
};
