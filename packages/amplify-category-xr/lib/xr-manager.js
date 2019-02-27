const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const opn = require('opn');
const chalk = require('chalk');

const constants = require('./constants');
const authHelper = require('./auth-helper');
const writeAmplifyMeta = require('./writeAmplifyMeta');

async function ensureSetup(context) {
  if (!isXRSetup(context)) {
    authHelper.ensureAuth(context);
    await setupAccess(context);
  }
}

async function setupAccess(context) {
  let templateFilePath = path.join(__dirname, constants.TemplateFileName);
  const template = require(templateFilePath);

  const answer = await inquirer.prompt({
    name: 'allowUnAuthAccess',
    type: 'confirm',
    message: 'Allow unauthenticated users to access your XR scene',
    default: false,
  });

  if (!answer.allowUnAuthAccess) {
    delete template.Resources.CognitoUnauthPolicy;
  }

  let parametersFilePath = path.join(__dirname, constants.ParametersFileName);
  const parameters = require(parametersFilePath);

  const { projectConfig, amplifyMeta } = context.exeInfo;
  const providerInfo = amplifyMeta.providers[constants.ProviderPlugin];
  const decoratedProjectName = projectConfig.projectName + context.amplify.makeId(5);
  parameters.AuthRoleName = providerInfo.AuthRoleName;
  parameters.UnauthRoleName = providerInfo.UnauthRoleName;
  parameters.AuthPolicyName = `sumerian-auth-${decoratedProjectName}`;
  parameters.UnauthPolicyName = `sumerian-unauth-${decoratedProjectName}`;

  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const serviceDirPath = path.join(projectBackendDirPath, constants.CategoryName, constants.ServiceName);
  fs.ensureDirSync(serviceDirPath);

  templateFilePath = path.join(serviceDirPath, constants.TemplateFileName);
  let jsonString = JSON.stringify(template, null, 4);
  fs.writeFileSync(templateFilePath, jsonString, 'utf8');

  parametersFilePath = path.join(serviceDirPath, constants.ParametersFileName);
  jsonString = JSON.stringify(parameters, null, 4);
  fs.writeFileSync(parametersFilePath, jsonString, 'utf8');

  // const metaData = {
  //   service: constants.ServiceName,
  //   providerPlugin: constants.ProviderPlugin,
  // };
  // await context.amplify.updateamplifyMetaAfterResourceAdd(
  //   constants.CategoryName,
  //   constants.ServiceName,
  //   metaData,
  // );

  context.exeInfo = context.amplify.getProjectDetails();
}

async function configureAccess(context) {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const serviceDirPath = path.join(projectBackendDirPath, constants.CategoryName, constants.ServiceName);
  const backendTemplateFilePath = path.join(serviceDirPath, constants.TemplateFileName);
  const backendTemplate = require(backendTemplateFilePath);

  let isUnAuthAccessAllowed = false;
  if (backendTemplate.Resources.CognitoUnauthPolicy) {
    isUnAuthAccessAllowed = true;
  }

  const templateFilePath = path.join(__dirname, constants.TemplateFileName);
  const template = require(templateFilePath);

  const answer = await inquirer.prompt({
    name: 'allowUnAuthAccess',
    type: 'confirm',
    message: 'Allow unauthenticated users to access xr scenes',
    default: isUnAuthAccessAllowed,
  });

  if (isUnAuthAccessAllowed && !answer.allowUnAuthAccess) {
    delete backendTemplate.Resources.CognitoUnauthPolicy;
  }

  if (!isUnAuthAccessAllowed && answer.allowUnAuthAccess) {
    backendTemplate.Resources.CognitoUnauthPolicy =
                  template.Resources.CognitoUnauthPolicy;
  }

  const jsonString = JSON.stringify(backendTemplate, null, 4);
  fs.writeFileSync(backendTemplateFilePath, jsonString, 'utf8');
}

async function removeAccess(context) {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const serviceDirPath = path.join(projectBackendDirPath, constants.CategoryName, constants.ServiceName);
  const templateFilePath = path.join(serviceDirPath, constants.TemplateFileName);
  const parametersFilePath = path.join(serviceDirPath, constants.ParametersFileName);
  fs.removeSync(templateFilePath);
  fs.removeSync(parametersFilePath);

  await context.amplify.removeResource(context, constants.CategoryName, undefined);

  context.exeInfo = context.amplify.getProjectDetails();
}

async function configure(context) {
  if (isXRSetup(context)) {
    configureAccess(context);
  } else {
    context.print.error('You have NOT added the XR category yet.');
  }
}

function isXRSetup(context) {
  const { amplifyMeta } = context.exeInfo;
  return amplifyMeta[constants.CategoryName] &&
    amplifyMeta[constants.CategoryName][constants.ServiceName];
}

function getExistingScenes(context) {
  let result = [];
  if (isXRSetup(context)) {
    const { amplifyMeta } = context.exeInfo;
    if (amplifyMeta[constants.CategoryName][constants.ServiceName].output) {
      result = Object.keys(amplifyMeta[constants.CategoryName][constants.ServiceName].output);
    }
  }
  return result;
}

async function addScene(context) {
  await ensureSetup(context);
  context.print.info(`Open the Amazon Sumerian console: ${chalk.green(getSumerianConsoleUrl(context))}`);
  context.print.info('Publish the scene you want to add.');
  context.print.info('Then download the JSON configuration to your local computer.');
  await inquirer.prompt({
    name: 'pressEnter',
    type: 'input',
    message: 'Press Enter when ready.',
  });

  let sceneName;
  const existingScenes = getExistingScenes(context);
  await inquirer.prompt({
    name: 'sceneName',
    type: 'input',
    message: 'Provide a name for the scene:',
    validate: (name) => {
      if (existingScenes.includes(name)) {
        return `${name} already exists, scene name must be a unique within the project`;
      }
      if (name === "") {
        return "The scene name cannot be empty";
      }
      return true;
    },
  }).then((answer) => {
    sceneName = answer.sceneName;
  });

  let sceneConfig;
  await inquirer.prompt({
    name: 'configFilePath',
    type: 'input',
    message: 'Enter the path to the downloaded JSON configuration file:',
    validate: (configFilePath) => {
      try {
        if (fs.existsSync(configFilePath)) {
          sumerianConfig = require(configFilePath);

          // Validate that the config is proper structure
          if (!sumerianConfig.url || !sumerianConfig.sceneId || !sumerianConfig.region) {
            return "Sumerian scene config is not in the correct format.";
          }
          sceneConfig = {
            sceneConfig: sumerianConfig,
          };
        }
      } catch (e) {
        sceneConfig = undefined;
      }
      if (sceneConfig) {
        return true;
      }
      return 'Can NOT ready the configuration, make sure it is valid.';
    },
  });

  const options = {
    service: 'Sumerian',
    output: sceneConfig
  }
  
  context.amplify.updateamplifyMetaAfterResourceAdd(constants.CategoryName, sceneName, options);
  context.amplify.saveEnvResourceParameters(context, constants.CategoryName, sceneName, sceneConfig);
  // const { amplifyMeta } = context.exeInfo;
  // if (!amplifyMeta[constants.CategoryName][constants.ServiceName].output) {
  //   amplifyMeta[constants.CategoryName][constants.ServiceName].output = {};
  // }
  // amplifyMeta[constants.CategoryName][constants.ServiceName].output[sceneName] = sceneConfig;
  // writeAmplifyMeta(context);
  // writeTeamProviderInfo(amplifyMeta[constants.CategoryName][constants.ServiceName], context);

  context.print.info(`${sceneName} has been added.`);
}

// function writeTeamProviderInfo(metadata, context) {
//   const teamProviderInfoFilepath = context.amplify.pathManager.getProviderInfoFilePath();
//   if (fs.existsSync(teamProviderInfoFilepath)) {
//     const { envName } = context.exeInfo.localEnvInfo;
//     const teamProviderInfo = JSON.parse(fs.readFileSync(teamProviderInfoFilepath));
//     teamProviderInfo[envName] = teamProviderInfo[envName] || {};
//     teamProviderInfo[envName].categories = teamProviderInfo[envName].categories || {};
//     teamProviderInfo[envName].categories[constants.CategoryName] =
//               teamProviderInfo[envName].categories[constants.CategoryName] || {};
//     teamProviderInfo[envName].categories[constants.CategoryName][constants.ServiceName] = metadata;
//     const jsonString = JSON.stringify(teamProviderInfo, null, 4);
//     fs.writeFileSync(teamProviderInfoFilepath, jsonString, 'utf8');
//   }
// }

async function remove(context) {
  // context.amplify.removeResourceParameters(context, constants.CategoryName);
  return context.amplify.removeResource(context, constants.CategoryName)
    .then((resp) => {
      context.amplify.removeResourceParameters(context, constants.CategoryName, resp.resourceName);
    })
    .catch((err) => {
      context.print.info(err.stack);
    });

  // if (isXRSetup(context)) {
  //   let existingScenes = getExistingScenes(context);
  //   if (existingScenes && existingScenes.length > 1) {
  //     inquirer.prompt({
  //       name: 'sceneToRemove',
  //       message: 'Choose the scene to remove:',
  //       type: 'list',
  //       choices: existingScenes,
  //     }).then((answer) => {
  //       delete context.exeInfo.amplifyMeta[constants.CategoryName][constants.ServiceName].output[answer.sceneToRemove];
  //       writeAmplifyMeta(context);
  //       existingScenes = getExistingScenes(context);
  //       context.print.info(`${answer.sceneToRemove} has been removed.`);
  //     });
  //   } else if (existingScenes && existingScenes.length === 1) {
  //     // One scene remaining in the scene configuration
  //     // Prompt to remove the IAM policies
  //     inquirer.prompt({
  //       name: 'removeLastScene',
  //       message: `Would you like to remove ${existingScenes[0]}?`,
  //       type: 'confirm',
  //       default: true,
  //     }).then((answer) => {
  //       if (answer.removeLastScene) {
  //         delete context.exeInfo.amplifyMeta[constants.CategoryName];
  //         context.print.info(`${answer.removeLastScene} has been removed.`);
  //         writeAmplifyMeta(context);
  //         context.print.warning('Your project no longer has any XR scenes configured.');
  //         removePolicyPrompt();
  //       }
  //     });
  //   } else {
  //     // No XR scenes configured
  //     context.print.warning('Your project does NOT have any XR scenes configured.');
  //     removePolicyPrompt();
  //   }
  // } else {
  //   context.print.error('You have NOT added the XR category yet.');
  // }
  
}

function removePolicyPrompt() {
  inquirer.prompt({
    name: 'removePolicies',
    message: 'Do you want to remove IAM policies for sumerian scene access',
    type: 'confirm',
    default: false,
  }).then((answer) => {
    if (answer.removePolicies) {
      removeAccess(context);
    }
  });
}

function getSumerianConsoleUrl(context) {
  const amplifyMeta = context.amplify.getProjectMeta();
  const region = amplifyMeta.providers.awscloudformation.Region;
  const consoleUrl = `https://console.aws.amazon.com/sumerian/home/start?region=${region}`;
  return consoleUrl;
}

function console(context) {
  context.print.info(chalk.green(getSumerianConsoleUrl(context)));
  opn(consoleUrl, { wait: false });
}

module.exports = {
  isXRSetup,
  ensureSetup,
  configure,
  getExistingScenes,
  addScene,
  remove,
  console,
};
