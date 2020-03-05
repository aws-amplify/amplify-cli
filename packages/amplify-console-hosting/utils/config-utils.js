const constants = require('../constants/plugin-constants');
const pathManager = require('../utils/path-manager');
const fs = require('fs-extra');
const utils = require('../utils/amplify-context-utils');
const path = require('path');
const clientFactory = require('../utils/client-factory');
const buildUtils = require('./build-utils');

function initCFNTemplate(context, templateFilePath) {
  const templateContent = context.amplify.readJsonFile(templateFilePath);
  const serviceDirPath = pathManager.getAmplifyHostingDirPath(context);

  fs.ensureDirSync(pathManager.getHostingDirPath(context));
  fs.ensureDirSync(serviceDirPath);

  const jsonString = JSON.stringify(templateContent, null, 4);
  fs.writeFileSync(pathManager.getTemplatePath(context), jsonString, 'utf8');
}

async function initMetaFile(context, category, resourceName, type) {
  const timeStamp = type === constants.TYPE_CICD ? new Date() : undefined;
  const metaData = {
    service: resourceName,
    providerPlugin: type === constants.TYPE_CICD ? undefined : constants.PROVIDER,
    type,
    lastPushTimeStamp: timeStamp,
  };

  context.amplify.updateamplifyMetaAfterResourceAdd(
    category,
    resourceName,
    metaData,
  );

  if (timeStamp) {
    // init #current-cloud-backend config file for CICD
    await initCurrBackendMeta(context, category, resourceName, type, timeStamp);
  }
}

async function initCurrBackendMeta(context, category, resourceName, type, timeStamp) {
  const metaData = {
    service: resourceName,
    providerPlugin: type === constants.TYPE_CICD ? undefined : constants.PROVIDER,
    type,
    lastPushTimeStamp: timeStamp,
  };
  // init backend meta
  const currMetaFilePath = pathManager.getCurrentAmplifyMetaFilePath(context);
  const currMetaContent = context.amplify.readJsonFile(currMetaFilePath);
  if (!currMetaContent[category]) {
    currMetaContent[category] = {};
  }

  if (!currMetaContent[category][resourceName]) {
    currMetaContent[category][resourceName] = {};
  }

  currMetaContent[category][resourceName] = metaData;
  fs.writeFileSync(currMetaFilePath, JSON.stringify(currMetaContent, null, 4));

  // init backend config
  const curBackendConfigFilePath = pathManager.getCurrBackendConfigFilePath(context);
  if (!fs.existsSync(curBackendConfigFilePath)) {
    fs.ensureFileSync(curBackendConfigFilePath);
    fs.writeFileSync(curBackendConfigFilePath, JSON.stringify({}, null, 4));
  }
  const backendConfig = context.amplify.readJsonFile(curBackendConfigFilePath);

  if (!backendConfig[category]) {
    backendConfig[category] = {};
  }

  if (!backendConfig[category][resourceName]) {
    backendConfig[category][resourceName] = {};
  }

  backendConfig[category][resourceName] = {
    service: resourceName,
    providerPlugin: type === constants.TYPE_CICD ? undefined : constants.PROVIDER,
    type,
  };

  fs.writeFileSync(curBackendConfigFilePath, JSON.stringify(backendConfig, null, 4));

  const currHostingDir = pathManager.getCurrCloudBackendHostingDirPath(context);
  const currAmplifyHostingDir = pathManager.getCurrCloudBackendAmplifyHostingDirPath(context);
  fs.ensureDirSync(currHostingDir);
  fs.ensureDirSync(currAmplifyHostingDir);
  await storeCurrentCloudBackend(context);
}

function initTeamProviderInfo(context, category, resourceName, type) {
  const categories = constants.CATEGORIES;

  const { amplify } = context;
  const currEnv = amplify.getEnvInfo().envName;
  const teamProviderInfoFilePath = pathManager.getProviderInfoFilePath(context);
  const teamProviderInfo = amplify.readJsonFile(teamProviderInfoFilePath);
  if (!teamProviderInfo[currEnv][categories]) {
    teamProviderInfo[currEnv][categories] = {};
  }

  if (!teamProviderInfo[currEnv][categories][category]) {
    teamProviderInfo[currEnv][categories][category] = {};
  }

  if (!teamProviderInfo[currEnv][categories][category][resourceName]) {
    teamProviderInfo[currEnv][categories][category][resourceName] = {};
  }

  const appId = utils.getAppIdForCurrEnv(context);
  teamProviderInfo[currEnv][categories][category][resourceName] = {
    appId,
    type,
  };
  fs.writeFileSync(
    teamProviderInfoFilePath,
    JSON.stringify(teamProviderInfo, null, 4),
  );
}

async function deleteConsoleConfigFromCurrMeta(context) {
  const category = constants.CATEGORY;
  const resourceName = constants.CONSOLE_RESOURCE_NAME;
  const currMetaFilePath = pathManager.getCurrentAmplifyMetaFilePath(context);
  const currMetaContent = context.amplify.readJsonFile(currMetaFilePath);
  if (!currMetaContent[category]) {
    return;
  }

  if (!currMetaContent[category][resourceName]) {
    return;
  }

  currMetaContent[category][resourceName] = undefined;
  fs.writeFileSync(currMetaFilePath, JSON.stringify(currMetaContent, null, 4));
  await storeCurrentCloudBackend(context);
}

function deleteConsoleConfigFromTeamProviderInfo(context) {
  const categories = constants.CATEGORIES;
  const category = constants.CATEGORY;
  const resourceName = constants.CONSOLE_RESOURCE_NAME;

  const { amplify } = context;
  const currEnv = amplify.getEnvInfo().envName;
  const teamProviderInfoFilePath = pathManager.getProviderInfoFilePath(context);
  const teamProviderInfo = amplify.readJsonFile(teamProviderInfoFilePath);
  if (!teamProviderInfo[currEnv][categories]) {
    return;
  }

  if (!teamProviderInfo[currEnv][categories][category]) {
    return;
  }

  if (!teamProviderInfo[currEnv][categories][category][resourceName]) {
    return;
  }
  teamProviderInfo[currEnv][categories][category][resourceName] = undefined;
  fs.writeFileSync(
    teamProviderInfoFilePath,
    JSON.stringify(teamProviderInfo, null, 4),
  );
}

function initBackendConfig(context, category, resourceName, type) {
  const backendConfigFilePath = pathManager.getBackendConfigPath(context);
  const backendConfig = context.amplify.readJsonFile(backendConfigFilePath);

  if (!backendConfig[category]) {
    backendConfig[category] = {};
  }

  if (!backendConfig[category][resourceName]) {
    backendConfig[category][resourceName] = {};
  }

  backendConfig[category][resourceName] = {
    service: resourceName,
    providerPlugin: type === constants.TYPE_CICD ? undefined : constants.PROVIDER,
    type,
  };
  fs.writeFileSync(
    backendConfigFilePath,
    JSON.stringify(backendConfig, null, 4),
  );
}

function loadConsoleConfigFromTeamProviderinfo(context) {
  const categories = constants.CATEGORIES;
  const category = constants.CATEGORY;
  const resource = constants.CONSOLE_RESOURCE_NAME;
  const teamProviderInfo = utils.getTeamProviderInfo(context);
  const currEnv = utils.getCurrEnv(context);
  if (
    teamProviderInfo[currEnv][categories] &&
    teamProviderInfo[currEnv][categories][category] &&
    teamProviderInfo[currEnv][categories][category][resource]
  ) {
    return teamProviderInfo[currEnv][categories][category][resource];
  }
  return undefined;
}

async function storeCurrentCloudBackend(context) {
  const s3 = await clientFactory.getS3Client(context);
  const zipFilename = '#current-cloud-backend.zip';
  const backendDir = context.amplify.pathManager.getBackendDirPath();
  const tempDir = `${backendDir}/.temp`;
  const currentCloudBackendDir = context.amplify.pathManager.getCurrentCloudBackendDirPath();
  const amplifyMetaFilePath = path.join(currentCloudBackendDir, 'amplify-meta.json');
  const backendConfigFilePath = path.join(currentCloudBackendDir, 'backend-config.json');

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  try {
    const zipFilePath = path.normalize(path.join(tempDir, zipFilename));
    await buildUtils.zipFile(currentCloudBackendDir, zipFilePath);
    await uploadFile(s3, zipFilePath, zipFilename, context);
    await uploadFile(s3, amplifyMetaFilePath, 'amplify-meta.json', context);
    await uploadFile(s3, backendConfigFilePath, 'backend-config.json', context);
  } finally {
    fs.removeSync(tempDir);
  }
}

async function uploadFile(s3, filePath, key, context) {
  const projectDetails = context.amplify.getProjectDetails();
  const { envName } = context.amplify.getEnvInfo();
  if (fs.existsSync(filePath)) {
    const s3Params = {
      Body: fs.createReadStream(filePath),
      Key: key,
    };
    const projectBucket = projectDetails.amplifyMeta.providers
      ? projectDetails.amplifyMeta.providers[constants.PROVIDER].DeploymentBucketName
      : projectDetails.teamProviderInfo[envName][constants.PROVIDER].DeploymentBucketName;
    s3Params.Bucket = projectBucket;
    await s3.putObject(s3Params).promise();
    return projectBucket;
  }
}

module.exports = {
  initCFNTemplate,
  initMetaFile,
  initCurrBackendMeta,
  initTeamProviderInfo,
  initBackendConfig,
  loadConsoleConfigFromTeamProviderinfo,
  deleteConsoleConfigFromTeamProviderInfo,
  deleteConsoleConfigFromCurrMeta,
};
