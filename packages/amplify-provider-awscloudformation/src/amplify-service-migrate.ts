import fs from 'fs-extra';
import { AmplifyError, stateManager } from '@aws-amplify/amplify-cli-core';
import * as configurationManager from './configuration-manager';
import { getConfiguredAmplifyClient } from './aws-utils/aws-amplify';
import { checkAmplifyServiceIAMPermission } from './amplify-service-permission-check';
import constants from './constants';
import { fileLogger } from './utils/aws-logger';
import { storeCurrentCloudBackend } from './utils/upload-current-cloud-backend';
import {
  CreateBackendEnvironmentCommand,
  GetAppCommand,
  GetBackendEnvironmentCommand,
  ListBackendEnvironmentsCommand,
} from '@aws-sdk/client-amplify';

const logger = fileLogger('amplify-service-migrate');

/**
 *
 */
export const run = async (context): Promise<void> => {
  let projectDetails;
  let currentAmplifyMetaFilePath;
  let currentAmplifyMeta;
  let awsConfigInfo;

  let isProjectFullySetUp = false;

  try {
    projectDetails = context.amplify.getProjectDetails();
    currentAmplifyMetaFilePath = context.amplify.pathManager.getCurrentAmplifyMetaFilePath();
    currentAmplifyMeta = context.amplify.readJsonFile(currentAmplifyMetaFilePath);
    awsConfigInfo = await configurationManager.getAwsConfig(context);
    isProjectFullySetUp = true;
  } catch (e) {
    isProjectFullySetUp = false;
  }

  if (!isProjectFullySetUp) {
    return;
  }

  const { amplifyMeta, localEnvInfo } = projectDetails;
  const { envName } = localEnvInfo;

  const teamProviderInfo = stateManager.getTeamProviderInfo();

  if (teamProviderInfo[envName][constants.ProviderName][constants.AmplifyAppIdLabel]) {
    // Migration is not needed if appId is already present in the team provider info
    // This is needed to prevent an Amplify Console build error.
    return;
  }

  const amplifyClient = await getConfiguredAmplifyClient(context, awsConfigInfo);
  if (!amplifyClient) {
    // This happens when the Amplify service is not available in the region
    const message = `Amplify service is not available in the region ${awsConfigInfo.region ? awsConfigInfo.region : ''}`;
    throw new AmplifyError('RegionNotAvailableError', { message });
  }

  const hasPermission = await checkAmplifyServiceIAMPermission(context, amplifyClient);
  if (!hasPermission) {
    const message = 'Permissions to access Amplify service is required.';
    throw new AmplifyError('PermissionsError', { message });
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
      const getAppResult = await amplifyClient.send(new GetAppCommand({ appId: amplifyAppId }));
      context.print.info(`Amplify AppID found: ${amplifyAppId}. Amplify App name is: ${getAppResult.app.name}`);
    } catch (e) {
      throw new AmplifyError(
        'ProjectNotFoundError',
        {
          message: `Amplify AppID: ${amplifyAppId} not found.`,
          resolution: `Please ensure your local profile matches the AWS account or region in which the Amplify app exists.`,
        },
        e,
      );
    }

    let backendEnvs = [];
    let listEnvResponse: any = {};
    do {
      logger('run.amplifyClient.listBackendEnvironments', [
        {
          appId: amplifyAppId,
          nextToken: listEnvResponse.nextToken,
        },
      ])();
      listEnvResponse = await amplifyClient.send(
        new ListBackendEnvironmentsCommand({
          appId: amplifyAppId,
          nextToken: listEnvResponse.nextToken,
        }),
      );

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
        await amplifyClient.send(new CreateBackendEnvironmentCommand(createEnvParams));
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
      const { backendEnvironment } = await amplifyClient.send(new GetBackendEnvironmentCommand(getEnvParams));
      if (StackName !== backendEnvironment.stackName) {
        throw new AmplifyError('InvalidStackError', {
          message: `Stack name mismatch for the backend environment ${envName}. Local: ${StackName}, Amplify: ${backendEnvironment.stackName}`,
        });
      }
    }

    // Add the appId to the meta data and team provider info and write the files
    teamProviderInfo[envName][constants.ProviderName][constants.AmplifyAppIdLabel] = amplifyAppId;
    amplifyMeta.providers[constants.ProviderName][constants.AmplifyAppIdLabel] = amplifyAppId;

    const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
    let jsonString = JSON.stringify(amplifyMeta, null, 4);
    fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');

    currentAmplifyMeta.providers[constants.ProviderName][constants.AmplifyAppIdLabel] = amplifyAppId;
    jsonString = JSON.stringify(currentAmplifyMeta, null, 4);
    fs.writeFileSync(currentAmplifyMetaFilePath, jsonString, 'utf8');

    const teamProviderInfoFilePath = context.amplify.pathManager.getProviderInfoFilePath();
    jsonString = JSON.stringify(teamProviderInfo, null, 4);
    fs.writeFileSync(teamProviderInfoFilePath, jsonString, 'utf8');

    await storeCurrentCloudBackend(context);
  }
};
