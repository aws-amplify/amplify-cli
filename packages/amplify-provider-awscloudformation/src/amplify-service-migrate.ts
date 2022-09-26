/* eslint-disable jsdoc/require-jsdoc */
import { $TSAny, amplifyErrorWithTroubleshootingLink } from 'amplify-cli-core';
import { ensureEnvMeta } from '@aws-amplify/amplify-environment-parameters';
import * as configurationManager from './configuration-manager';
import { getConfiguredAmplifyClient } from './aws-utils/aws-amplify';
import { checkAmplifyServiceIAMPermission } from './amplify-service-permission-check';
// eslint-disable-next-line import/no-cycle
import { storeCurrentCloudBackend } from './push-resources';
import constants from './constants';
import { fileLogger } from './utils/aws-logger';

const logger = fileLogger('amplify-service-migrate');

export const run = async (context): Promise<void> => {
  let projectDetails;
  let awsConfigInfo;

  let isProjectFullySetUp = false;

  try {
    projectDetails = context.amplify.getProjectDetails();
    awsConfigInfo = await configurationManager.getAwsConfig(context);
    isProjectFullySetUp = true;
  } catch (e) {
    isProjectFullySetUp = false;
  }

  if (!isProjectFullySetUp) {
    return;
  }

  const { localEnvInfo } = projectDetails;
  const { envName } = localEnvInfo;

  const envMeta = await ensureEnvMeta(context, envName);

  if (envMeta.AmplifyAppId) {
    // Migration is not needed if appId is already present in the team provider info
    // This is needed to prevent an Amplify Console build error.
    return;
  }

  const amplifyClient = await getConfiguredAmplifyClient(context, awsConfigInfo);
  if (!amplifyClient) {
    // This happens when the Amplify service is not available in the region
    const message = `Amplify service is not available in the region ${awsConfigInfo.region ? awsConfigInfo.region : ''}`;
    throw amplifyErrorWithTroubleshootingLink('RegionNotAvailableError', { message });
  }

  const hasPermission = await checkAmplifyServiceIAMPermission(context, amplifyClient);
  if (!hasPermission) {
    const message = 'Permissions to access Amplify service is required.';
    throw amplifyErrorWithTroubleshootingLink('PermissionsError', { message });
  }

  const { inputParams } = context.exeInfo;
  if (inputParams.amplify && inputParams.amplify.appId) {
    const amplifyAppId = inputParams.amplify.appId;
    logger('run.amplifyClient.getApp', [
      {
        appId: amplifyAppId,
      },
    ])();
    try {
      const getAppResult = await amplifyClient
        .getApp({
          appId: amplifyAppId,
        })
        .promise();
      context.print.info(`Amplify AppID found: ${amplifyAppId}. Amplify App name is: ${getAppResult.app.name}`);
    } catch (e) {
      throw amplifyErrorWithTroubleshootingLink('ProjectNotFoundError', {
        message: `Amplify AppID: ${amplifyAppId} not found.`,
        resolution: `Please ensure your local profile matches the AWS account or region in which the Amplify app exists.`,
      });
    }

    let backendEnvs = [];
    let listEnvResponse: $TSAny = {};
    do {
      logger('run.amplifyClient.listBackendEnvironments', [
        {
          appId: amplifyAppId,
          nextToken: listEnvResponse.nextToken,
        },
      ])();
      listEnvResponse = await amplifyClient
        .listBackendEnvironments({
          appId: amplifyAppId,
          nextToken: listEnvResponse.nextToken,
        })
        .promise();

      backendEnvs = backendEnvs.concat(listEnvResponse.backendEnvironments);
    } while (listEnvResponse.nextToken);

    const { StackName, DeploymentBucketName } = projectDetails.amplifyMeta.providers[constants.ProviderName];
    if (!backendEnvs.includes(envName)) {
      context.print.info(`Adding backend environment ${envName} to AWS Amplify app: ${amplifyAppId}`);
      const createEnvParams = {
        appId: amplifyAppId,
        environmentName: envName,
        stackName: StackName,
        deploymentArtifacts: DeploymentBucketName,
      };
      const log = logger('run.amplifyClient.createBackendEnvironment', [createEnvParams]);
      log();
      try {
        await amplifyClient.createBackendEnvironment(createEnvParams).promise();
      } catch (ex) {
        log(ex);
      }
    } else {
      // If env is already in the app, verify the the stack name match
      const getEnvParams = {
        appId: amplifyAppId,
        environmentName: envName,
      };
      logger('run.amplifyClient.getBackendEnvironment', [getEnvParams])();
      const { backendEnvironment } = await amplifyClient.getBackendEnvironment(getEnvParams).promise();
      if (StackName !== backendEnvironment.stackName) {
        throw amplifyErrorWithTroubleshootingLink('InvalidStackError', {
          message: `Stack name mismatch for the backend environment ${envName}. Local: ${StackName}, Amplify: ${backendEnvironment.stackName}`,
        });
      }
    }

    // Add the appId to the env meta
    envMeta.AmplifyAppId = amplifyAppId;
    await storeCurrentCloudBackend(context);
  }
};
