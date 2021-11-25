const fs = require('fs-extra');
const configurationManager = require('./configuration-manager');
const { getConfiguredAmplifyClient } = require('./aws-utils/aws-amplify');
const { checkAmplifyServiceIAMPermission } = require('./amplify-service-permission-check');
const { storeCurrentCloudBackend } = require('./push-resources');
const constants = require('./constants');
const { fileLogger } = require('./utils/aws-logger');
const logger = fileLogger('amplify-service-migrate');

async function run(context) {
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

  const { amplifyMeta, teamProviderInfo, localEnvInfo } = projectDetails;
  const { envName } = localEnvInfo;

  if (teamProviderInfo[envName][constants.ProviderName][constants.AmplifyAppIdLabel]) {
    // Migration is not needed if appId is already present in the team provider info
    // This is needed to prevent an Amplify Console build error.
    return;
  }

  const amplifyClient = await getConfiguredAmplifyClient(context, awsConfigInfo);
  if (!amplifyClient) {
    // This happens when the Amplify service is not available in the region
    const message = `Amplify service is not available in the region ${awsConfigInfo.region ? awsConfigInfo.region : ''}`;
    context.print.error(message);
    throw new Error(message);
  }

  const hasPermission = await checkAmplifyServiceIAMPermission(context, amplifyClient);
  if (!hasPermission) {
    const message = 'Permissions to access Amplify service is required.';
    context.print.error(message);
    throw new Error(message);
  }

  const { inputParams } = context.exeInfo;
  if (inputParams.amplify && inputParams.amplify.appId) {
    const amplifyAppId = inputParams.amplify.appId;
    const log = logger('run.amplifyClient.getApp', [
      {
        appId: amplifyAppId,
      },
    ]);
    try {
      log();
      const getAppResult = await amplifyClient
        .getApp({
          appId: amplifyAppId,
        })
        .promise();
      context.print.info(`Amplify AppID found: ${amplifyAppId}. Amplify App name is: ${getAppResult.app.name}`);
    } catch (e) {
      log(e);
      context.print.error(
        `Amplify AppID: ${amplifyAppId} not found. Please ensure your local profile matches the AWS account or region in which the Amplify app exists.`,
      );
      context.print.info(e);
      throw e;
    }

    let backendEnvs = [];
    let listEnvResponse = {};
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

    const { StackName, DeploymentBucketName } = projectDetails.teamProviderInfo[envName][constants.ProviderName];
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
      const log = logger('run.amplifyClient.getBackendEnvironment', [getEnvParams]);
      log();
      const { backendEnvironment } = await amplifyClient.getBackendEnvironment(getEnvParams).promise();
      if (StackName !== backendEnvironment.stackName) {
        const message = `Stack name mismatch for the backend environment ${envName}. Local: ${StackName}, Amplify: ${backendEnvironment.stackName}`;
        context.print.error(message);
        const e = new Error(message);
        log(e);
        throw e;
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
}

module.exports = {
  run,
};
