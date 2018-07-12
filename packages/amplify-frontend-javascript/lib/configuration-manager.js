const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const frameworkConfigMapping = require('./framework-config-mapping');
const constants = require('./constants');

function init(context) {
  context.print.info('Please tell us about your project');
  context.exeInfo.projectConfig[constants.Label] = {
    framework: guessFramework(context.exeInfo.projectConfig.projectPath),
  };
  return promptForConfiguration(context);
}

function onInitSuccessful(context) {
  return new Promise((resolve) => {
    resolve(context);
  });
}

function configure(context) {
  if (!context.exeInfo.projectConfig[constants.Label]) {
    context.exeInfo.projectConfig[constants.Label] = {};
  }

  if (!context.exeInfo.projectConfig[constants.Label].framework) {
    context.exeInfo.projectConfig[constants.Label].framework =
            guessFramework(context.exeInfo.projectConfig.projectPath);
  }

  return promptForConfiguration(context);
}

function promptForConfiguration(context) {
  return confirmFramework(context)
    .then(confirmConfiguration);
}

function confirmFramework(context) {
  const frameworkComfirmation = {
    type: 'list',
    name: 'framework',
    message: 'What javascript framework are you using',
    choices: Object.keys(frameworkConfigMapping),
    default: context.exeInfo.projectConfig[constants.Label].framework,
  };
  return inquirer.prompt(frameworkComfirmation)
    .then((answers) => {
      if (context.exeInfo.projectConfig[constants.Label].framework !== answers.framework) {
        context.exeInfo.projectConfig[constants.Label].framework = answers.framework;
        context.exeInfo.projectConfig[constants.Label].config =
            frameworkConfigMapping[context.exeInfo.projectConfig[constants.Label].framework];
      }
      return context;
    });
}

function confirmConfiguration(context) {
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

  return inquirer.prompt(configurationSettings)
    .then((answers) => {
      config.SourceDir = answers.SourceDir;
      config.DistributionDir = answers.DistributionDir;
      config.BuildCommand = answers.BuildCommand;
      config.StartCommand = answers.StartCommand;
      return context;
    });
}

function guessFramework(projectPath) {
  let frameWork = 'none';
  try {
    const packageJsonFilePath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonFilePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonFilePath, 'utf8'));
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
