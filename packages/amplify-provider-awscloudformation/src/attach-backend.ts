import aws from 'aws-sdk';
import fs from 'fs-extra';
import path from 'path';
import * as glob from 'glob';
import inquirer from 'inquirer';
import _ from 'lodash';
import { exitOnNextTick, pathManager, PathConstants, AmplifyError, extract } from '@aws-amplify/amplify-cli-core';
import * as configurationManager from './configuration-manager';
import { getConfiguredAmplifyClient } from './aws-utils/aws-amplify';
import { checkAmplifyServiceIAMPermission } from './amplify-service-permission-check';
import constants from './constants';
import { isAmplifyAdminApp } from './utils/admin-helpers';
import { resolveAppId } from './utils/resolve-appId';
import { adminLoginFlow } from './admin-login';
import { fileLogger } from './utils/aws-logger';

const logger = fileLogger('attach-backend');

/**
 * attach backend to project
 */
export const run = async (context): Promise<void> => {
  let appId;
  let awsConfigInfo;
  let isAdminApp = false;
  try {
    appId = resolveAppId(context);
  } catch (e) {
    // Swallow
  }
  const { envName } = _.get(context, ['exeInfo', 'inputParams', 'amplify'], {});
  const { useProfile, configLevel } = _.get(context, ['exeInfo', 'inputParams', 'awscloudformation'], {});
  if (!useProfile && (!configLevel || configLevel === 'amplifyAdmin') && appId) {
    const res = await isAmplifyAdminApp(appId);
    isAdminApp = res.isAdminApp;
    if (isAdminApp) {
      if (!envName) {
        throw new AmplifyError('EnvironmentNameError', {
          message: 'Missing --envName <environment name> in parameters.',
        });
      }
      // Admin app, go through login flow
      try {
        await adminLoginFlow(context, appId, envName, res.region);
      } catch (e) {
        throw new AmplifyError(
          'AmplifyStudioLoginError',
          {
            message: `Failed to authenticate: ${e.message || 'Unknown error occurred.'}`,
          },
          e,
        );
      }
    }
  }

  if (isAdminApp) {
    context.exeInfo.awsConfigInfo = {
      configLevel: 'amplifyAdmin',
      config: {},
    };
    awsConfigInfo = await configurationManager.loadConfigurationForEnv(context, envName, appId);
  } else {
    await configurationManager.init(context);
    awsConfigInfo = await configurationManager.getAwsConfig(context);
  }

  const amplifyClient = await getConfiguredAmplifyClient(context, awsConfigInfo);
  if (!amplifyClient) {
    // This happens when the Amplify service is not available in the region
    const region = awsConfigInfo && awsConfigInfo.region ? awsConfigInfo.region : '<unknown>';
    throw new AmplifyError('RegionNotAvailableError', {
      message: `Amplify service is not available in the region ${region}`,
    });
  }

  const hasPermission = await checkAmplifyServiceIAMPermission(context, amplifyClient);
  if (!hasPermission) {
    throw new AmplifyError('PermissionsError', {
      message: 'Permissions to access Amplify service is required.',
    });
  }

  const amplifyApp = await getAmplifyApp(context, amplifyClient);

  const backendEnv = await getBackendEnv(context, amplifyClient, amplifyApp);

  await downloadBackend(context, backendEnv, awsConfigInfo);
  const currentAmplifyMeta = await ensureAmplifyMeta(context, amplifyApp, awsConfigInfo);

  context.exeInfo.projectConfig.projectName = amplifyApp.name;
  context.exeInfo.localEnvInfo.envName = backendEnv.environmentName;
  _.setWith(context, ['exeInfo', 'teamProviderInfo', backendEnv.environmentName], currentAmplifyMeta.providers);
};

async function ensureAmplifyMeta(context, amplifyApp, awsConfigInfo) {
  // check if appId is present in the provider section of the metadata
  // if not, it's a migration case and we need to
  // 1. insert the appId
  // 2. upload the metadata file and the backend config file into the deployment bucket
  const projectPath = process.cwd();
  const currentAmplifyMetaFilePath = context.amplify.pathManager.getCurrentAmplifyMetaFilePath(projectPath);
  const currentAmplifyMeta = context.amplify.readJsonFile(currentAmplifyMetaFilePath);
  if (!currentAmplifyMeta.providers[constants.ProviderName][constants.AmplifyAppIdLabel]) {
    currentAmplifyMeta.providers[constants.ProviderName][constants.AmplifyAppIdLabel] = amplifyApp.appId;

    const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath(projectPath);
    const jsonString = JSON.stringify(currentAmplifyMeta, null, 4);
    fs.writeFileSync(currentAmplifyMetaFilePath, jsonString, 'utf8');
    fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');

    const { DeploymentBucketName } = currentAmplifyMeta.providers[constants.ProviderName];
    await storeArtifactsForAmplifyService(context, awsConfigInfo, DeploymentBucketName);
  }

  return currentAmplifyMeta;
}

async function storeArtifactsForAmplifyService(context, awsConfigInfo, deploymentBucketName) {
  const projectPath = process.cwd();
  const s3Client = new aws.S3(awsConfigInfo);
  const amplifyMetaFilePath = context.amplify.pathManager.getCurrentAmplifyMetaFilePath(projectPath);
  const backendConfigFilePath = context.amplify.pathManager.getCurrentBackendConfigFilePath(projectPath);
  await uploadFile(s3Client, deploymentBucketName, amplifyMetaFilePath);
  await uploadFile(s3Client, deploymentBucketName, backendConfigFilePath);
}

async function uploadFile(s3Client, bucketName, filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  const key = path.basename(filePath);
  const body = fs.createReadStream(filePath);
  const s3Params = {
    Bucket: bucketName,
    Key: key,
    Body: body,
  };
  logger('uploadFile.s3.uploadFile', [{ Key: key, Bucket: bucketName }])();
  await s3Client.putObject(s3Params).promise();
}

async function getAmplifyApp(context, amplifyClient) {
  // If appId is in the inputParams, verify it
  const { inputParams } = context.exeInfo;
  if (inputParams.amplify && inputParams.amplify.appId) {
    const inputAmplifyAppId = inputParams.amplify.appId;
    logger('getAmplifyApp.amplifyClient.getApp', [
      {
        appId: inputAmplifyAppId,
      },
    ])();
    try {
      const getAppResult = await amplifyClient
        .getApp({
          appId: inputAmplifyAppId,
        })
        .promise();
      context.print.info(`Amplify AppID found: ${inputAmplifyAppId}. Amplify App name is: ${getAppResult.app.name}`);
      return getAppResult.app;
    } catch (e) {
      throw new AmplifyError(
        'ProjectNotFoundError',
        {
          message: e.message && e.name && e.name === 'NotFoundException' ? e.message : `Amplify AppID: ${inputAmplifyAppId} not found.`,
          resolution:
            e.name && e.name === 'NotFoundException'
              ? 'Check that the region of the Amplify App is matching the configured region.'
              : 'Ensure your local profile matches the AWS account or region in which the Amplify app exists.',
        },
        e,
      );
    }
  }

  // If appId is not in the inputParams, prompt user to select
  let apps = [];

  let listAppsResponse: any = {};
  do {
    logger('getAmplifyApp.amplifyClient.listApps', [
      {
        nextToken: listAppsResponse.nextToken,
        maxResults: 25,
      },
    ])();

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
    apps.forEach((app) => {
      const option = {
        name: `${app.name} (${app.appId})`,
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

  throw new AmplifyError('ProjectNotFoundError', {
    message: 'No Amplify apps found.',
    resolution: 'Ensure your local profile matches the AWS account or region in which the Amplify app exists.',
  });
}

async function getBackendEnv(context, amplifyClient, amplifyApp) {
  // If envName is in the inputParams, verify it
  const { inputParams } = context.exeInfo;
  if (inputParams.amplify && inputParams.amplify.envName) {
    const inputEnvName = inputParams.amplify.envName;
    logger('getBackendEnv.amplifyClient.getBackendEnvironment', [
      {
        appId: amplifyApp.appId,
        environmentName: inputEnvName,
      },
    ])();
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
      throw new AmplifyError(
        'EnvironmentNotInitializedError',
        {
          message: `Cannot find backend environment ${inputEnvName} in Amplify Console app: ${amplifyApp.name}`,
          details: e.message,
        },
        e,
      );
    }
  }

  // If envName is not in the inputParams, prompt user to select
  let backendEnvs = [];
  let listEnvResponse: any = {};
  do {
    logger('getBackendEnv.amplifyClient.listBackendEnvironments', [
      {
        appId: amplifyApp.appId,
        nextToken: listEnvResponse.nextToken,
      },
    ])();
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
    backendEnvs.forEach((env) => {
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
  }
  if (backendEnvs.length === 1) {
    context.print.info(`Backend environment '${backendEnvs[0].environmentName}' found. Initializing...`);
    return backendEnvs[0];
  }
  throw new AmplifyError('EnvironmentNotInitializedError', {
    message: `Cannot find backend environment in Amplify Console app: ${amplifyApp.name}`,
  });
}

async function downloadBackend(context, backendEnv, awsConfigInfo) {
  if (!backendEnv) {
    return;
  }
  const projectPath = process.cwd();
  const amplifyDirPath = context.amplify.pathManager.getAmplifyDirPath(projectPath);
  const tempDirPath = path.join(amplifyDirPath, '.temp');
  const currentCloudBackendDir = context.amplify.pathManager.getCurrentCloudBackendDirPath(projectPath);
  const backendDir = context.amplify.pathManager.getBackendDirPath(projectPath);
  const zipFileName = constants.S3BackendZipFileName;

  const s3Client = new aws.S3(awsConfigInfo);
  const deploymentBucketName = backendEnv.deploymentArtifacts;

  const params = {
    Key: zipFileName,
    Bucket: deploymentBucketName,
  };

  const log = logger('downloadBackend.s3.getObject', [params]);
  let zipObject = null;
  try {
    log();
    zipObject = await s3Client.getObject(params).promise();
  } catch (err) {
    log(err);
    context.print.error(`Error downloading ${zipFileName} from deployment bucket: ${deploymentBucketName}, the error is: ${err.message}`);
    await context.usageData.emitError(err);
    exitOnNextTick(1);
    return;
  }

  const buff = Buffer.from(zipObject.Body);

  fs.ensureDirSync(tempDirPath);

  try {
    const tempFilePath = path.join(tempDirPath, zipFileName);
    fs.writeFileSync(tempFilePath, buff);

    const unzippedDirPath = path.join(tempDirPath, path.basename(zipFileName, '.zip'));

    await extract(tempFilePath, { dir: unzippedDirPath, skipEntryPrefixes: ['types/'] });

    // Move out cli.*json if exists in the temp directory into the amplify directory before copying backend and
    // current cloud backend directories.
    const cliJSONFiles = glob.sync(PathConstants.CLIJSONFileNameGlob, {
      cwd: unzippedDirPath,
      absolute: true,
    });
    const amplifyDir = pathManager.getAmplifyDirPath();
    const isPulling = context.input.command === 'pull' || (context.input.command === 'env' && context.input.subCommands[0] === 'pull');

    if ((context.exeInfo && context.exeInfo.restoreBackend) || isPulling) {
      // If backend must be restored then copy out the config files and overwrite existing ones.
      for (const cliJSONFilePath of cliJSONFiles) {
        const targetPath = path.join(amplifyDir, path.basename(cliJSONFilePath));

        fs.moveSync(cliJSONFilePath, targetPath, { overwrite: true });
      }
    } else {
      // If backend is not being restored, just delete the config files in the current cloud backend if present
      for (const cliJSONFilePath of cliJSONFiles) {
        fs.removeSync(cliJSONFilePath);
      }
    }

    fs.copySync(unzippedDirPath, currentCloudBackendDir);
    fs.copySync(unzippedDirPath, backendDir);
  } finally {
    fs.removeSync(tempDirPath);
  }
}
