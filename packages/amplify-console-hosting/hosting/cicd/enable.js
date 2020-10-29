const open = require('open');
const utils = require('../../utils/amplify-context-utils');
const questions = require('../../modules/questions/question-generator');
const configUtils = require('../../utils/config-utils');
const constants = require('../../constants/plugin-constants');
const clientFactory = require('../../utils/client-factory');
const pathManager = require('../../utils/path-manager');
const fs = require('fs-extra');
const ValidationError = require('../../error/validation-error').default;
const statusMod = require('../index');

async function enable(context) {
  const region = utils.getRegionForCurrEnv(context);
  const appId = utils.getAppIdForCurrEnv(context);
  const category = constants.CATEGORY;
  const resourceName = constants.CONSOLE_RESOURCE_NAME;
  const type = constants.TYPE_CICD;
  await open(`https://${region}.console.aws.amazon.com/amplify/home?region=${region}#/${appId}`);

  await questions.askCICDConfirmQuestion(context);

  await validateCICDApp(context, appId);
  // Directory
  const serviceDirPath = pathManager.getAmplifyHostingDirPath(context);
  fs.ensureDirSync(pathManager.getHostingDirPath(context));
  fs.ensureDirSync(serviceDirPath);

  // Init backend config
  configUtils.initBackendConfig(context, category, resourceName, type);
  // Init meta
  // await configUtils.initNoPushMetaFile(context, category, resourceName, type);
  await configUtils.initMetaFile(context, category, resourceName, type);

  // Init team-provider-info
  configUtils.initTeamProviderInfo(context, category, resourceName, type);
  await statusMod.status(context);
}

async function validateCICDApp(context, appId) {
  const amplifyClient = await clientFactory.getAmplifyClient(context);
  const result = await amplifyClient.listBranches({
    appId,
  }).promise();
  if (result.branches.length === 0) {
    throw new ValidationError("No hosting URL found. Run 'amplify add hosting' again to set up hosting with Amplify Console.");
  }
}

module.exports = {
  enable,
};
