const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const opn = require('opn');
const chalk = require('chalk');

const constants = require('./constants');
const authHelper = require('./auth-helper');

async function ensureSetup(context, resourceName) {
  if (!isXRSetup(context)) {
    await authHelper.ensureAuth(context);
  }
  await setupAccess(context, resourceName);
}

async function setupAccess(context, resourceName) {
  let templateFilePath = path.join(__dirname, constants.TemplateFileName);
  context.print.info(templateFilePath);
  const template = JSON.parse(fs.readFileSync(templateFilePath));

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

  const { projectConfig } = context.exeInfo;
  const decoratedProjectName = projectConfig.projectName + context.amplify.makeId(5);

  parameters.AuthRoleName = {
    Ref: 'AuthRoleName',
  };
  parameters.UnauthRoleName = {
    Ref: 'UnauthRoleName',
  };
  parameters.AuthPolicyName = `sumerian-auth-${decoratedProjectName}`;
  parameters.UnauthPolicyName = `sumerian-unauth-${decoratedProjectName}`;

  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const resourceDirPath = path.join(projectBackendDirPath, constants.CategoryName, resourceName);

  fs.ensureDirSync(resourceDirPath);

  templateFilePath = path.join(resourceDirPath, constants.TemplateFileName);
  let jsonString = JSON.stringify(template, null, 4);
  fs.writeFileSync(templateFilePath, jsonString, 'utf8');

  parametersFilePath = path.join(resourceDirPath, constants.ParametersFileName);
  jsonString = JSON.stringify(parameters, null, 4);
  fs.writeFileSync(parametersFilePath, jsonString, 'utf8');

  context.exeInfo = context.amplify.getProjectDetails();
}

async function configure(context) {
  if (isXRSetup(context)) {
    updateScene(context);
  } else {
    context.print.error('You have NOT added the XR category yet.');
  }
}

function isXRSetup(context) {
  const { amplifyMeta } = context.exeInfo;
  return amplifyMeta[constants.CategoryName];
}

function getExistingScenes(context) {
  let result = [];
  if (isXRSetup(context)) {
    const { amplifyMeta } = context.exeInfo;
    if (amplifyMeta[constants.CategoryName]) {
      result = Object.keys(amplifyMeta[constants.CategoryName]);
    }
  }
  return result;
}

async function addScene(context) {
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
      if (name === '') {
        return 'The scene name cannot be empty';
      }
      return true;
    },
  }).then((answer) => {
    sceneName = answer.sceneName;
  });

  await addSceneConfig(context, sceneName);

  context.print.success(`Successfully added resource ${sceneName} locally`);
  context.print.info('');
  context.print.success('Some next steps:');
  context.print.info('"amplify push" builds all of your local backend resources and provisions them in the cloud');
  context.print.info('"amplify publish" builds all of your local backend and front-end resources (if you added hosting category) and provisions them in the cloud');
  context.print.info('');
}

async function addSceneConfig(context, sceneName) {
  let sumerianConfig;
  await inquirer.prompt({
    name: 'configFilePath',
    type: 'input',
    message: `Enter the path to the downloaded JSON configuration file for ${sceneName}:`,
    validate: (configFilePath) => {
      try {
        if (fs.existsSync(configFilePath)) {
          sumerianConfig = require(configFilePath);

          // Sumerian config must have a url and sceneId
          if (!sumerianConfig.url || !sumerianConfig.sceneId) {
            return 'Sumerian scene config is not in the correct format.';
          }

          const sumerianResourceUrl = new URL(sumerianConfig.url);
          // If region is not an existing parameter, extract from the resource url
          if (!sumerianConfig.region) {
            try {
              sumerianConfig.region = getRegionFromHost(sumerianResourceUrl.host);
            } catch (e) {
              return 'Could not read the scene region. Make sure the scene url is valid.';
            }
          }
          // If projectName is not an existing parameter, extract from the resource url
          if (!sumerianConfig.projectName) {
            try {
              const projectName = getProjectNameFromPath(sumerianResourceUrl.pathname);
              sumerianConfig.projectName = decodeURIComponent(projectName);
            } catch (e) {
              return 'Could not read the scene projectName. Make sure the scene url is valid.';
            }
          }
        }
      } catch (e) {
        sumerianConfig = undefined;
      }
      if (sumerianConfig) {
        return true;
      }
      return 'Can NOT ready the configuration, make sure it is valid.';
    },
  });

  const options = {
    service: 'Sumerian',
    providerPlugin: 'awscloudformation',
  };

  await ensureSetup(context, sceneName);

  context.amplify.saveEnvResourceParameters(context, constants.CategoryName, sceneName, sumerianConfig);
  context.amplify.updateamplifyMetaAfterResourceAdd(constants.CategoryName, sceneName, options);
}

async function updateScene(context) {
  if (!isXRSetup(context)) {
    context.print.error('You have NOT added the XR category yet.');
    return;
  }
  const existingScenes = getExistingScenes(context);
  if (existingScenes.length <= 0) {
    context.print.error('You do not have any scenes configured.');
    return;
  }

  await inquirer.prompt({
    name: 'sceneToUpdate',
    message: 'Choose the scene you would like to update',
    type: 'list',
    choices: existingScenes,
  }).then(async (answer) => {
    await addSceneConfig(context, answer.sceneToUpdate);
    context.print.info(`${answer.sceneToUpdate} has been updated.`);
  });
}

async function remove(context) {
  return context.amplify.removeResource(context, constants.CategoryName)
    .then((resource) => {
      context.amplify.removeResourceParameters(context, constants.CategoryName, resource.resourceName);
    })
    .catch((err) => {
      context.print.info(err.stack);
    });
}

function getSumerianConsoleUrl(context) {
  const amplifyMeta = context.amplify.getProjectMeta();
  const region = amplifyMeta.providers.awscloudformation.Region;
  const consoleUrl = `https://console.aws.amazon.com/sumerian/home/start?region=${region}`;
  return consoleUrl;
}

function getProjectNameFromPath(urlPath) {
  /* Sumerian URL path format:
   * /${date}/projects/${projectName}/release/authTokens
   */
  const regex = /projects\/([^/]*)\/release/;
  const match = regex.exec(urlPath);
  if (!match) {
    return null;
  }
  const projectName = match[1];
  return projectName;
}

function getRegionFromHost(host) {
  /* Sumerian URL host format:
   * sumerian.${region}.amazonaws.com
   */
  const regex = /sumerian\.([^.]*)\.amazonaws/;
  const match = regex.exec(host);
  if (!match) {
    return null;
  }
  const region = match[1];
  return region;
}

function console(context) {
  const consoleUrl = getSumerianConsoleUrl(context);
  context.print.info(chalk.green(consoleUrl));
  opn(consoleUrl, { wait: false });
}

module.exports = {
  isXRSetup,
  ensureSetup,
  configure,
  getExistingScenes,
  addScene,
  addSceneConfig,
  remove,
  console,
};
