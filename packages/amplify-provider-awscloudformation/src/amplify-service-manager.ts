/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  $TSContext, AmplifyError, amplifyFaultWithTroubleshootingLink, pathManager, stateManager,
} from 'amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { printer, prompter } from 'amplify-prompts';
import { ensureEnvMeta } from '@aws-amplify/amplify-environment-parameters';
import { findAppByBackendPredicate, getLocalAppIdsInSameRegionAndAccount } from './utils/amplify-client-lookups';
import { S3 } from './aws-utils/aws-s3';
import { getConfiguredAmplifyClient } from './aws-utils/aws-amplify';
import { checkAmplifyServiceIAMPermission } from './amplify-service-permission-check';
import { fileLogger } from './utils/aws-logger';
import { loadConfigurationForEnv } from './configuration-manager';

const logger = fileLogger('amplify-service-manager');

export const init = async amplifyServiceParams => {
  const {
    context, awsConfigInfo, projectName, envName, stackName,
  } = amplifyServiceParams;

  let amplifyAppId;
  let verifiedStackName = stackName;
  let deploymentBucketName = `${stackName}-deployment`;

  const amplifyClient = await getConfiguredAmplifyClient(context, awsConfigInfo);
  if (!amplifyClient) {
    // This happens when the Amplify service is not available in the region
    return {
      amplifyAppId,
      verifiedStackName,
      deploymentBucketName,
    };
  }

  const hasPermission = await checkAmplifyServiceIAMPermission(context, amplifyClient);
  if (!hasPermission) {
    return {
      amplifyAppId,
      verifiedStackName,
      deploymentBucketName,
    };
  }

  if (context.exeInfo && context.exeInfo.inputParams && context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.appId) {
    const inputAmplifyAppId = context.exeInfo.inputParams.amplify.appId;
    logger('init.amplifyClient.getApp', [
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
      amplifyAppId = inputAmplifyAppId;
    } catch (e) {
      throw new AmplifyError('ProjectNotFoundError', {
        message: `Amplify AppID ${inputAmplifyAppId} not found.`,
        resolution: `Please ensure your local profile matches the AWS account or region in which the Amplify app exists.`,
      }, e);
    }
  }

  if (!amplifyAppId && !!pathManager.findProjectRoot()) {
    // in the "amplify env add" workflow, there might be other envs, new env can be added to existing appId
    const localAppIdCandidates = await getLocalAppIdsInSameRegionAndAccount(amplifyClient);
    amplifyAppId = await selectFromExistingAppId(localAppIdCandidates);
  }

  if (!amplifyAppId) {
    const createAppParams = {
      name: projectName,
      environmentVariables: { _LIVE_PACKAGE_UPDATES: '[{"pkg":"@aws-amplify/cli","type":"npm","version":"latest"}]' },
    };

    logger('init.amplifyClient.createApp', [createAppParams])();
    try {
      if (amplifyAppCreationEnabled()) {
        const createAppResponse = await amplifyClient.createApp(createAppParams).promise();
        amplifyAppId = createAppResponse.app.appId;
      }
    } catch (e) {
      if (e.code === 'LimitExceededException') {
        // Do nothing
      } else if (
        e.code === 'BadRequestException'
        && e.message.includes('Rate exceeded while calling CreateApp, please slow down or try again later.')
      ) {
        // Do nothing
      } else {
        throw amplifyFaultWithTroubleshootingLink('ProjectInitFault', {
          message: e.message,
          stack: e.stack,
        }, e);
      }
    }
  }

  if (!amplifyAppId) {
    return {
      amplifyAppId,
      verifiedStackName,
      deploymentBucketName,
    };
  }

  let needToCreateNewBackendEnv = false;
  const log = logger('init.amplifyClient.getBackendEnvironment', [
    {
      appId: amplifyAppId,
      environmentName: envName,
    },
  ]);

  try {
    log();
    const { backendEnvironment } = await amplifyClient
      .getBackendEnvironment({
        appId: amplifyAppId,
        environmentName: envName,
      })
      .promise();

    if (backendEnvironment) {
      verifiedStackName = backendEnvironment.stackName;
      deploymentBucketName = backendEnvironment.deploymentArtifacts;
    } else {
      needToCreateNewBackendEnv = true;
    }
  } catch (e) {
    log(e);
    needToCreateNewBackendEnv = true;
  }

  if (needToCreateNewBackendEnv) {
    context.print.info(`Adding backend environment ${envName} to AWS Amplify app: ${amplifyAppId}`);
    const createEnvParams = {
      appId: amplifyAppId,
      environmentName: envName,
      stackName,
      deploymentArtifacts: deploymentBucketName,
    };
    logger('init.amplifyClient.getBackendEnvironment', [createEnvParams])();
    await amplifyClient.createBackendEnvironment(createEnvParams).promise();
  }

  return {
    amplifyAppId,
    verifiedStackName,
    deploymentBucketName,
  };
};

export const deleteEnv = async (context, envName, awsConfigInfo?) => {
  const envMeta = await ensureEnvMeta(context, envName);
  if (!envMeta.AmplifyAppId) {
    return;
  }
  const envConfig = await loadConfigurationForEnv(context, envName);
  const amplifyClient = await getConfiguredAmplifyClient(context, { ...awsConfigInfo, ...envConfig });
  if (!amplifyClient) {
    // This happens when the Amplify service is not available in the region
    return;
  }

  const hasPermission = await checkAmplifyServiceIAMPermission(context, amplifyClient);
  if (!hasPermission) {
    return;
  }
  const deleteEnvParams = {
    appId: envMeta.AmplifyAppId,
    environmentName: envName,
  };
  logger('deleteEnv.amplifyClient.deleteBackendEnvironment', [deleteEnvParams])();
  try {
    await amplifyClient.deleteBackendEnvironment(deleteEnvParams).promise();
  } catch (ex) {
    if (ex.code === 'NotFoundException') {
      context.print.warning(ex.message);
    } else {
      throw amplifyFaultWithTroubleshootingLink('ProjectDeleteFault', {
        message: ex.message,
        stack: ex.stack,
      }, ex);
    }
  }
};

export const postPushCheck = async (context: $TSContext) => {
  const envMeta = await ensureEnvMeta(context);
  const { AmplifyAppId: appId, StackName: stackName, DeploymentBucketName: deploymentBucket } = envMeta;

  if (appId) {
    return;
  }

  let amplifyAppId;

  const amplifyClient = await getConfiguredAmplifyClient(context);
  if (!amplifyClient) {
    // This happens when the Amplify service is not available in the region
    return;
  }

  const hasPermission = await checkAmplifyServiceIAMPermission(context, amplifyClient);
  if (!hasPermission) {
    return;
  }

  const appWithMatchingStack = await findAppByBackendPredicate(amplifyClient, backend => backend.stackName === stackName);
  if (appWithMatchingStack) {
    amplifyAppId = appWithMatchingStack.appId;
  } else {
    const localAppIdCandidates = await getLocalAppIdsInSameRegionAndAccount(amplifyClient);
    amplifyAppId = await selectFromExistingAppId(localAppIdCandidates);
  }

  if (!amplifyAppId) {
    const createAppParams = {
      name: stateManager.getProjectConfig()?.projectName,
      environmentVariables: { _LIVE_PACKAGE_UPDATES: '[{"pkg":"@aws-amplify/cli","type":"npm","version":"latest"}]' },
    };
    logger('postPushCheck.amplifyClient.createApp', [createAppParams])();
    try {
      if (amplifyAppCreationEnabled()) {
        const createAppResponse = await amplifyClient.createApp(createAppParams).promise();
        amplifyAppId = createAppResponse.app.appId;
      }
    } catch (e) {
      if (e.code === 'LimitExceededException') {
        // Do nothing
      } else if (
        e.code === 'BadRequestException'
          && e.message.includes('Rate exceeded while calling CreateApp, please slow down or try again later.')
      ) {
        // Do nothing
      } else {
        throw amplifyFaultWithTroubleshootingLink('ProjectInitFault', {
          message: e.message,
          stack: e.stack,
        }, e);
      }
    }
  }

  if (!amplifyAppId) {
    return;
  }

  const createEnvParams = {
    appId: amplifyAppId,
    environmentName: stateManager.getLocalEnvInfo().envName,
    stackName,
    deploymentArtifacts: deploymentBucket,
  };
  logger('postPushCheck.amplifyClient.createBackendEnvironment', [createEnvParams])();
  await amplifyClient.createBackendEnvironment(createEnvParams).promise();
};

const selectFromExistingAppId = async (
  appIdsInTheSameLocalProjectAndRegion: string[],
): Promise<string | undefined> => {
  if (appIdsInTheSameLocalProjectAndRegion.length === 0) {
    return undefined;
  }
  if (appIdsInTheSameLocalProjectAndRegion.length === 1) {
    return appIdsInTheSameLocalProjectAndRegion[0];
  }
  printer.info(`Your project is associated with multiple Amplify Service Apps in this region region`);
  const options = appIdsInTheSameLocalProjectAndRegion
    .map(appId => ({ name: appId, value: appId }))
    .concat({ name: 'Create new Amplify App', value: undefined });
  return prompter.pick(
    'Select the Amplify App ID you want this environment to be associated with',
    options,
  );
};

export const storeArtifactsForAmplifyService = async (context: $TSContext) => {
  const s3 = await S3.getInstance(context);
  const currentCloudBackendDir = context.amplify.pathManager.getCurrentCloudBackendDirPath();
  const amplifyMetaFilePath = path.join(currentCloudBackendDir, 'amplify-meta.json');
  const backendConfigFilePath = path.join(currentCloudBackendDir, 'backend-config.json');
  await uploadFile(s3, amplifyMetaFilePath, 'amplify-meta.json');
  await uploadFile(s3, backendConfigFilePath, 'backend-config.json');
};

const uploadFile = async (s3, filePath, key) => {
  if (fs.existsSync(filePath)) {
    const s3Params = {
      Body: fs.createReadStream(filePath),
      Key: key,
    };
    const log = logger('s3.uploadFile', [{ Key: key }]);
    try {
      log();
      await s3.uploadFile(s3Params);
    } catch (ex) {
      log(ex);
      throw ex;
    }
  }
};

const amplifyAppCreationEnabled = () => !process.env || process.env.CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION !== '1';
