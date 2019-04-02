const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const opn = require('opn');
const chalk = require('chalk');
const { URL } = require('url');

const constants = require('./constants');
const authHelper = require('./auth-helper');

const SUMERIAN_CONSOLE_URL = 'https://console.aws.amazon.com/sumerian/home/start';

async function ensureSetup(context, resourceName) {
  if (!isXRSetup(context)) {
    await authHelper.ensureAuth(context);
  }
  await setupAccess(context, resourceName);
}

async function setupAccess(context, resourceName) {
  let templateFilePath = path.join(__dirname, constants.TemplateFileName);
  const template = JSON.parse(fs.readFileSync(templateFilePath));

  const answer = await inquirer.prompt({
    name: 'allowUnAuthAccess',
    type: 'confirm',
    message: 'Would you like to allow unauthenticated users access to the Sumerian project for this scene?',
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
  context.print.info(`Open the Amazon Sumerian console: ${chalk.green(SUMERIAN_CONSOLE_URL)}`);
  context.print.info(`Publish the scene you want to add. See ${chalk.green('https://aws-amplify.github.io/docs/js/xr#configuration')}`);
  context.print.info('Then download the JSON configuration to your local computer.');
  await inquirer.prompt({
    name: 'pressEnter',
    type: 'input',
    message: 'Press Enter when ready.',
  });

  context.print.warning('Note the following scene name is used to identify the scene in the Amplify framework');
  context.print.warning('It does NOT have to match the scene name in the Sumerian console');
  let sceneName;
  await inquirer.prompt({
    name: 'sceneName',
    type: 'input',
    message: 'Provide a name for the scene:',
    validate: (name) => {
      const existingScenes = getExistingScenes(context);
      if (existingScenes.includes(name)) {
        return `${name} already exists. The scene name must be unique within the project`;
      }

      if (!isSceneNameValid(name)) {
        return 'Project name should be between 3 and 20 characters and alphanumeric';
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
  context.print.warning('Only the IAM policy for this scene resource will be provisioned in the cloud. This will not change the scene in the Sumerian console.');
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
        } else {
          return 'Can NOT read the configuration file path, make sure it is valid.';
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
    context.print.info(`${chalk.green(answer.sceneToUpdate)} has been updated.`);
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

function console(context) {
  context.print.info(chalk.green(SUMERIAN_CONSOLE_URL));
  opn(SUMERIAN_CONSOLE_URL, { wait: false });
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

function isSceneNameValid(sceneName) {
  return sceneName &&
          sceneName.length >= 3 &&
          sceneName.length <= 20 &&
          /^[a-zA-Z0-9]+$/i.test(sceneName);
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
