const constants = require('../constants/plugin-constants');
const pathManager = require('../utils/path-manager');
const fs = require('fs-extra');
const utils = require('../utils/amplify-context-utils');
const questions = require('../modules/questions/question-generator');
const ValidationError = require('../error/validation-error').default;
const clientFactory = require('../utils/client-factory');
const ora = require('ora');
const tableUtis = require('../utils/table-utils');

const VALIDATING_MESSAGE = 'Validating ...';
const HELP_INFO_PLACE_HOLDER = 'Manual deployment allows you to publish your web app to the Amplify Console without connecting a Git provider. Continuous deployment allows you to publish changes on every code commit by connecting your GitHub, Bitbucket, GitLab, or AWS CodeCommit repositories.';
const REMOVE_ERROR_MESSAGE = 'There was an error removing the auth resource';
const HOSTING_NOT_ENABLED = 'Amplify console hosting is not enabled!';
const HOSTING_ALREADY_ENABLED = 'Amplify Console hosting has already been enabled';
const META_FILE_VALIDATION = 'Amplify console hosting information is missed from amplify meta file';
const FRONTEND_EXISTED_WARNING = 'Branches has already been added to amplify app. Can not enable local host';

async function enable(context) {
  await validateHosting(context);
  let doesSelectHelp = false;
  do {
    const deployType = await questions.askDeployType();
    if (deployType !== constants.TYPE_HELP) {
      doesSelectHelp = false;
      const hostingModule = require(`./${deployType}/index`);
      await hostingModule.enable(context);
    } else {
      doesSelectHelp = true;
      console.log(HELP_INFO_PLACE_HOLDER);
      console.log('-------------------------------');
    }
  } while (doesSelectHelp);
}

async function publish(context) {
  if (!isHostingEnabled(context)) {
    throw new ValidationError(HOSTING_NOT_ENABLED);
  }

  const deployType = loadDeployType(context);
  const hostingModule = require(`./${deployType}/index`);
  await hostingModule.publish(context);
}

function initEnv(context) {
  const categories = constants.CATEGORIES;
  const category = constants.CATEGORY;
  const resource = constants.CONSOLE_RESOURCE_NAME;
  const backendConfig = utils.getBackendInfoConfig(context);

  if (!backendConfig[category] || !backendConfig[category][resource]) {
    return;
  }

  const teamProviderInfo = utils.getTeamProviderInfo(context);
  const currEnv = utils.getCurrEnv(context);
  if (
    teamProviderInfo[currEnv][categories] &&
        teamProviderInfo[currEnv][categories][category] &&
        teamProviderInfo[currEnv][categories][category][resource]
  ) {
    return;
  }

  const { type } = backendConfig[constants.CATEGORY][constants.CONSOLE_RESOURCE_NAME];
  const initEnvMod = require(`./${type}/index`);
  initEnvMod.initEnv(context);
}

async function remove(context) {
  const category = constants.CATEGORY;
  const resource = constants.CONSOLE_RESOURCE_NAME;
  const { amplify } = context;

  return amplify.removeResource(context, category, resource).catch((err) => {
    context.print.info(err.stack);
    context.print.error(REMOVE_ERROR_MESSAGE);
  });
}

async function console(context) {
  if (!isHostingEnabled(context)) {
    throw new ValidationError();
  }
  const type = loadDeployType(context);
  const hostingModule = require(`./${type}/index`);
  await hostingModule.console(context);
}

async function configure(context) {
  if (!isHostingEnabled(context)) {
    throw new ValidationError(HOSTING_NOT_ENABLED);
  }
  const type = loadDeployType(context);
  const hostingModule = require(`./${type}/index`);
  await hostingModule.configure(context);
}

async function status(context) {
  if (!isHostingEnabled(context)) {
    throw new ValidationError(HOSTING_NOT_ENABLED);
  }

  const appId = utils.getAppIdForCurrEnv(context);
  await tableUtis.generateTableContentForApp(context, appId);
}

function loadDeployType(context) {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath(context);
  const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);

  try {
    return amplifyMeta[constants.CATEGORY][constants.CONSOLE_RESOURCE_NAME].type;
  } catch (err) {
    throw new ValidationError(META_FILE_VALIDATION);
  }
}

async function validateHosting(context) {
  const spinner = ora();
  spinner.start(VALIDATING_MESSAGE);
  try {
    if (isHostingEnabled(context)) {
      spinner.stop();
      throw new ValidationError(HOSTING_ALREADY_ENABLED);
    }
    const appId = utils.getAppIdForCurrEnv(context);
    const amplifyClient = await clientFactory.getAmplifyClient(context);
    const result = await amplifyClient.listBranches({
      appId,
    }).promise();
    if (result.branches.length > 0) {
      throw new ValidationError(FRONTEND_EXISTED_WARNING);
    }
    spinner.stop();
  } catch (err) {
    spinner.stop();
    throw err;
  }
}

function isHostingEnabled(context) {
  return fs.existsSync(pathManager.getAmplifyHostingDirPath(context));
}

module.exports = {
  enable,
  publish,
  initEnv,
  remove,
  console,
  configure,
  status,
};
