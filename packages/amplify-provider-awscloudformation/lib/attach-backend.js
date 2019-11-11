const aws = require('aws-sdk');
const fs = require('fs-extra');
const path = require('path');
const extract = require('extract-zip');
const proxyAgent = require('proxy-agent');
const inquirer = require('inquirer');
const configurationManager = require('./configuration-manager');
const { getConfiguredAmplifyClient } = require('../src/aws-utils/aws-amplify');
const systemConfigManager = require('./system-config-manager');
const constants = require('./constants');

async function run(context) {
  await configurationManager.init(context);
  const awsConfig = getAwsConfig(context);

  const amplifyClient = await getConfiguredAmplifyClient(context, awsConfig);

  const amplifyApp = await getAmplifyApp(context, amplifyClient);
  if (!amplifyApp) {
    process.exit(1);
  }

  const backendEnv = await getBackendEnv(context, amplifyClient, amplifyApp);
  if (!backendEnv) {
    process.exit(1);
  }

  await downloadBackend(context, backendEnv, awsConfig);

  context.exeInfo.projectConfig.projectName = amplifyApp.name;
  context.exeInfo.localEnvInfo.envName = backendEnv.environmentName;

  const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath(process.cwd());
  const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);
  context.exeInfo.teamProviderInfo[backendEnv.environmentName] = {};
  context.exeInfo.teamProviderInfo[backendEnv.environmentName] = amplifyMeta.providers;
}

async function getAmplifyApp(context, amplifyClient) {
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

  if (apps.length > 1) {
    const options = [];
    apps.forEach(app => {
      const option = {
        name: `${app.name} / ${app.appId}`,
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
  } else if (apps.length === 1) {
    context.print.info(`Found one amplify project '${apps[0].name} / ${apps[0].appId}'`);
    const confirmMigrateMessage = 'Do you want to choose it?';
    if (await context.prompt.confirm(confirmMigrateMessage)) {
      return apps[0];
    }
  } else {
    context.print.error(`Found no currently existing amplify project.`);
  }
}

async function getBackendEnv(context, amplifyClient, amplifyApp) {
  if (!amplifyApp) {
    return;
  }
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
    context.print.info(`Found one backend environment '${backendEnvs[0].environmentName}'`);
    const confirmMigrateMessage = 'Do you want to choose it?';
    if (await context.prompt.confirm(confirmMigrateMessage)) {
      return backendEnvs[0];
    }
  } else {
    context.print.error(`Found no currently existing backend environment in the amplify project.`);
  }
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

  const s3Client = getConfiguredS3Client(awsConfig);
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

async function getAwsConfig(context) {
  const { awsConfigInfo } = context.exeInfo;
  const httpProxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;

  let awsConfig;
  if (awsConfigInfo.configLevel === 'project') {
    if (awsConfigInfo.config.useProfile) {
      awsConfig = await systemConfigManager.getProfiledAwsConfig(context, awsConfigInfo.config.profileName);
    } else {
      awsConfig = {
        accessKeyId: awsConfigInfo.config.accessKeyId,
        secretAccessKey: awsConfigInfo.config.secretAccessKey,
        region: awsConfigInfo.config.region,
      };
    }
  }

  if (httpProxy) {
    awsConfig = {
      ...awsConfig,
      httpOptions: { agent: proxyAgent(httpProxy) },
    };
  }

  return awsConfig;
}

function getConfiguredS3Client(awsConfig) {
  const httpProxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;

  if (httpProxy) {
    aws.config.update({
      httpOptions: {
        agent: proxyAgent(httpProxy),
      },
    });
  }

  return new aws.S3({ ...awsConfig });
}

module.exports = {
  run,
};
