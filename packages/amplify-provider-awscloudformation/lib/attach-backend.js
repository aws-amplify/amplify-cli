const aws = require('aws-sdk');
const fs = require('fs-extra');
const path = require('path');
const extract = require('extract-zip');
const inquirer = require('inquirer');
const configurationManager = require('./configuration-manager');
const { getConfiguredAmplifyClient } = require('../src/aws-utils/aws-amplify');
const { checkAmplifyServiceIAMPermission } = require('./amplify-service-permission-check');
const constants = require('./constants');

async function run(context) {
  await configurationManager.init(context);
  const awsConfig = await configurationManager.getAwsConfig(context);

  const amplifyClient = await getConfiguredAmplifyClient(context, awsConfig);
  if (!amplifyClient) {
    // This happens when the Amplify service is not available in the region
    const region = awsConfig && awsConfig.region ? awsConfig.region : '<unknown>';
    const message = `Amplify service is not available in the region ${region}`;
    context.print.error(message);
    throw new Error(message);
  }

  const hasPermission = await checkAmplifyServiceIAMPermission(context, amplifyClient);
  if (!hasPermission) {
    const message = 'Permissions to access Amplify service is required.';
    context.print.error(message);
    throw new Error(message);
  }

  const amplifyApp = await getAmplifyApp(context, amplifyClient);

  const backendEnv = await getBackendEnv(context, amplifyClient, amplifyApp);

  await downloadBackend(context, backendEnv, awsConfig);
  const currentAmplifyMeta = await ensureAmplifyMeta(context, amplifyApp, awsConfig);

  context.exeInfo.projectConfig.projectName = amplifyApp.name;
  context.exeInfo.localEnvInfo.envName = backendEnv.environmentName;
  context.exeInfo.teamProviderInfo[backendEnv.environmentName] = currentAmplifyMeta.providers;
}

async function ensureAmplifyMeta(context, amplifyApp, awsConfig) {
  // check if appId is present in the provider section of the metadata
  // if not, it's a migration case and we need to
  // 1. insert the appId
  // 2. upload the metadata file and the backend config file into the deployment bucket
  const currentAmplifyMetaFilePath = context.amplify.pathManager.getCurrentAmplifyMetaFilePath(process.cwd());
  const currentAmplifyMeta = context.amplify.readJsonFile(currentAmplifyMetaFilePath);
  if (!currentAmplifyMeta.providers[constants.ProviderName][constants.AmplifyAppIdLabel]) {
    currentAmplifyMeta.providers[constants.ProviderName][constants.AmplifyAppIdLabel] = amplifyApp.appId;

    const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath(process.cwd());
    const jsonString = JSON.stringify(currentAmplifyMeta, null, 4);
    fs.writeFileSync(currentAmplifyMetaFilePath, jsonString, 'utf8');
    fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');

    const { DeploymentBucketName } = currentAmplifyMeta.providers[constants.ProviderName];
    await storeArtifactsForAmplifyService(context, awsConfig, DeploymentBucketName);
  }

  return currentAmplifyMeta;
}

async function storeArtifactsForAmplifyService(context, awsConfig, deploymentBucketName) {
  const s3Client = new aws.S3(awsConfig);
  const amplifyMetaFilePath = context.amplify.pathManager.getCurrentAmplifyMetaFilePath(process.cwd());
  const backendConfigFilePath = context.amplify.pathManager.getCurrentBackendConfigFilePath(process.cwd());
  await uploadFile(s3Client, deploymentBucketName, amplifyMetaFilePath);
  await uploadFile(s3Client, deploymentBucketName, backendConfigFilePath);
}

async function uploadFile(s3Client, bucketName, filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  const key = path.basename(filePath);
  const body = fs.createReadStream(filePath);
  await s3Client
    .putObject({
      Bucket: bucketName,
      Key: key,
      Body: body,
    })
    .promise();
}

async function getAmplifyApp(context, amplifyClient) {
  // If appId is in the inputParams, verify it
  const { inputParams } = context.exeInfo;
  if (inputParams.amplify && inputParams.amplify.appId) {
    const inputAmplifyAppId = inputParams.amplify.appId;
    try {
      const getAppResult = await amplifyClient
        .getApp({
          appId: inputAmplifyAppId,
        })
        .promise();
      context.print.info(`Amplify AppID found: ${inputAmplifyAppId}. Amplify App name is: ${getAppResult.app.name}`);
      return getAppResult.app;
    } catch (e) {
      context.print.error(
        `Amplify AppID: ${inputAmplifyAppId} not found. Please ensure your local profile matches the AWS account or region in which the Amplify app exists.`,
      );
      context.print.info(e);
      throw e;
    }
  }

  // If appId is not in the inputParams, prompt user to select
  let apps = [];

  let listAppsResponse = {};
  do {
    listAppsResponse = await amplifyClient
      .listApps({
        nextToken: listAppsResponse.nextToken,
        maxResults: 25,
      })
      .promise();
    apps = apps.concat(listAppsResponse.apps);
  } while (listAppsResponse.nextToken);

  if (apps.length >= 1) {
    const options = [];
    apps.forEach(app => {
      const option = {
        name: `${app.name}`,
        value: app,
        short: app.appId,
      };
      options.push(option);
    });

    const { selection } = await inquirer.prompt({
      type: 'list',
      name: 'selection',
      message: 'Which app are you working on?',
      choices: options,
    });

    return selection;
  }
  const errorMessage = `No Amplify apps found. Please ensure your local profile matches the AWS account or region in which the Amplify app exists.`;
  context.print.error(errorMessage);
  throw new Error(errorMessage);
}

async function getBackendEnv(context, amplifyClient, amplifyApp) {
  // If envName is in the inputParams, verify it
  const { inputParams } = context.exeInfo;
  if (inputParams.amplify && inputParams.amplify.envName) {
    const inputEnvName = inputParams.amplify.envName;
    try {
      const getBackendEnvironmentResult = await amplifyClient
        .getBackendEnvironment({
          appId: amplifyApp.appId,
          environmentName: inputEnvName,
        })
        .promise();
      context.print.info(`Backend environment ${inputEnvName} found in Amplify Console app: ${amplifyApp.name}`);
      return getBackendEnvironmentResult.backendEnvironment;
    } catch (e) {
      context.print.error(`Cannot find backend environment ${inputEnvName} in Amplify Console app: ${amplifyApp.name}`);
      context.print.info(e);
      throw e;
    }
  }

  // If envName is not in the inputParams, prompt user to select
  let backendEnvs = [];
  let listEnvResponse = {};
  do {
    listEnvResponse = await amplifyClient
      .listBackendEnvironments({
        appId: amplifyApp.appId,
        nextToken: listEnvResponse.nextToken,
      })
      .promise();

    backendEnvs = backendEnvs.concat(listEnvResponse.backendEnvironments);
  } while (listEnvResponse.nextToken);

  if (backendEnvs.length > 1) {
    const options = [];
    backendEnvs.forEach(env => {
      const option = {
        name: env.environmentName,
        value: env,
        short: env.environmentName,
      };
      options.push(option);
    });

    const { selection } = await inquirer.prompt({
      type: 'list',
      name: 'selection',
      message: 'Pick a backend environment:',
      choices: options,
    });

    return selection;
  } else if (backendEnvs.length === 1) {
    context.print.info(`Backend environment '${backendEnvs[0].environmentName}' found. Initializing...`);
    return backendEnvs[0];
  }
  const errorMessage = `Cannot find any backend environment in the Amplify Console App ${amplifyApp.name}.`;
  context.print.error(errorMessage);
  throw new Error(errorMessage);
}

async function downloadBackend(context, backendEnv, awsConfig) {
  if (!backendEnv) {
    return;
  }
  const amplifyDirPath = context.amplify.pathManager.getAmplifyDirPath(process.cwd());
  const tempDirPath = path.join(amplifyDirPath, 'temp');
  const currentCloudBackendDir = context.amplify.pathManager.getCurrentCloudBackendDirPath(process.cwd());
  const backendDir = context.amplify.pathManager.getBackendDirPath(process.cwd());
  const zipFileName = constants.S3BackendZipFileName;

  const s3Client = new aws.S3(awsConfig);
  const deploymentBucketName = backendEnv.deploymentArtifacts;

  const params = {
    Key: zipFileName,
    Bucket: deploymentBucketName,
  };

  const zipObject = await s3Client.getObject(params).promise();
  const buff = Buffer.from(zipObject.Body);

  fs.ensureDirSync(tempDirPath);
  const tempFilePath = path.join(tempDirPath, zipFileName);
  fs.writeFileSync(tempFilePath, buff);

  const unzippedDirPath = path.join(tempDirPath, path.basename(zipFileName, '.zip'));

  await new Promise((res, rej) => {
    extract(tempFilePath, { dir: unzippedDirPath }, err => {
      if (err) {
        rej(err);
      }
      res(unzippedDirPath);
    });
  });

  fs.copySync(unzippedDirPath, currentCloudBackendDir);
  fs.copySync(unzippedDirPath, backendDir);
  fs.removeSync(tempDirPath);
}

module.exports = {
  run,
};
