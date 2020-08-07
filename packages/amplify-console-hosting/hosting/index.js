const constants = require('../constants/plugin-constants');
const pathManager = require('../utils/path-manager');
const fs = require('fs-extra');
const utils = require('../utils/amplify-context-utils');
const configUtils = require('../utils/config-utils');
const questions = require('../modules/questions/question-generator');
const ValidationError = require('../error/validation-error').default;
const clientFactory = require('../utils/client-factory');
const ora = require('ora');
const tableUtis = require('../utils/table-utils');

const HELP_INFO_PLACE_HOLDER =
  'Manual deployment allows you to publish your web app to the Amplify Console without connecting a Git provider. Continuous deployment allows you to publish changes on every code commit by connecting your GitHub, Bitbucket, GitLab, or AWS CodeCommit repositories.';
const REMOVE_ERROR_MESSAGE = 'There was an error removing the auth resource';
const HOSTING_NOT_ENABLED = 'Amplify Console hosting is not enabled.';
const HOSTING_ENABLED_IN_CONSOLE =
  'You have enabled hosting in the Amplify Console and not through the CLI. To remove hosting with Amplify Console, please visit the console and disconnect your frontend branches.';
const HOSTING_ALREADY_ENABLED = 'Amplify Console hosting has already been enabled';
const FRONTEND_EXISTED_WARNING =
  'You have already connected branches to your Amplify Console app. Please visit the Amplify Console to manage your branches.';

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

async function publish(context, doSkipBuild, doSkipPush) {
  if (!isHostingEnabled(context)) {
    throw new ValidationError(HOSTING_NOT_ENABLED);
  }

  const deployType = loadDeployType(context);
  const hostingModule = require(`./${deployType}/index`);
  await hostingModule.publish(context, doSkipBuild, doSkipPush);
}

async function initEnv(context) {
  const categories = constants.CATEGORIES;
  const category = constants.CATEGORY;
  const resource = constants.CONSOLE_RESOURCE_NAME;
  const backendConfig = utils.getBackendInfoConfig(context);

  if (!backendConfig || !backendConfig[category] || !backendConfig[category][resource]) {
    const consoleConfig = configUtils.loadConsoleConfigFromTeamProviderinfo(context);
    if (!consoleConfig) {
      // hosting is not enabled for current env
      return;
    }
    // hosting is deleted. But current env config is not cleaned
    const { type } = consoleConfig;
    // clean team provider info
    configUtils.deleteConsoleConfigFromTeamProviderInfo(context);
    // clean #current-backend-env for CICD.
    if (type === constants.TYPE_CICD) {
      await configUtils.deleteConsoleConfigFromCurrMeta(context);
    }
  } else {
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
    await initEnvMod.initEnv(context);
  }
}

async function remove(context) {
  if (!isHostingEnabled(context)) {
    if (await isFrontendCreatedOnline(context)) {
      throw new ValidationError(HOSTING_ENABLED_IN_CONSOLE);
    }
    throw new ValidationError(HOSTING_NOT_ENABLED);
  }

  const category = constants.CATEGORY;
  const resource = constants.CONSOLE_RESOURCE_NAME;
  const { amplify } = context;

  const type = loadDeployType(context);
  // remove config in #current-cloud-backend meta.
  if (type === constants.TYPE_CICD) {
    await configUtils.deleteConsoleConfigFromCurrMeta(context);
  }

  return amplify.removeResource(context, category, resource).catch(err => {
    context.print.info(err.stack);
    context.print.error(REMOVE_ERROR_MESSAGE);
    context.usageData.emitError(err);
  });
}

async function serve(context) {
  if (!isHostingEnabled(context)) {
    throw new ValidationError(HOSTING_NOT_ENABLED);
  }
  const type = loadDeployType(context);
  const hostingModule = require(`./${type}/index`);
  await hostingModule.serve(context);
}

async function configure(context) {
  if (!isHostingEnabled(context)) {
    throw new ValidationError(HOSTING_NOT_ENABLED);
  }
  const type = loadDeployType(context);
  const hostingModule = require(`./${type}/index`);
  await hostingModule.configure(context);
}

async function status(context, mute) {
  if (!isHostingEnabled(context)) {
    if (mute) {
      return;
    }
    throw new ValidationError(HOSTING_NOT_ENABLED);
  }

  const appId = utils.getAppIdForCurrEnv(context);
  await tableUtis.generateTableContentForApp(context, appId);
}

function loadDeployType(context) {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath(context);
  const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);

  return amplifyMeta[constants.CATEGORY][constants.CONSOLE_RESOURCE_NAME].type;
}

async function validateHosting(context) {
  const spinner = ora();
  spinner.start();
  try {
    if (isHostingEnabled(context)) {
      spinner.stop();
      throw new ValidationError(HOSTING_ALREADY_ENABLED);
    }
    if (await isFrontendCreatedOnline(context)) {
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

async function isFrontendCreatedOnline(context) {
  const appId = utils.getAppIdForCurrEnv(context);
  const amplifyClient = await clientFactory.getAmplifyClient(context);
  const result = await amplifyClient.listBranches({ appId }).promise();
  if (result.branches.length > 0) {
    return true;
  } else {
    return false;
  }
}

module.exports = {
  enable,
  publish,
  initEnv,
  remove,
  serve,
  configure,
  status,
};
