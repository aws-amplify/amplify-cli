import { Amplify, CloudFormation } from 'aws-sdk';
import moment from 'moment';

import { getConfigFromProfile } from '../profile-helper';

export function getConfiguredAmplifyClient() {
  const config = getConfigFromProfile();
  return new Amplify(config);
}

export function getConfiguredCFNClient() {
  const config = getConfigFromProfile();
  return new CloudFormation(config);
}

//delete all existing amplify console projects
export async function deleteAllAmplifyProjects(amplifyClient?: Amplify) {
  if (!amplifyClient) {
    amplifyClient = getConfiguredAmplifyClient();
  }
  let token;
  do {
    token = await PaginatedDeleteProjects(amplifyClient, token);
  } while (token);
}

export async function deleteAmplifyStack(stackName: string, cfnClient?: CloudFormation) {
  if (!cfnClient) cfnClient = getConfiguredCFNClient();
  try {
    await cfnClient.deleteStack({ StackName: stackName }).promise();
  } catch (err) {
    // do nothing
  }
}

async function PaginatedDeleteProjects(amplifyClient: Amplify, token?: string) {
  const sequential = require('promise-sequential');
  const maxResults = 25;
  const listAppsResult = await amplifyClient
    .listApps({
      maxResults,
      nextToken: token,
    })
    .promise();

  const deleteTasks = [];
  listAppsResult.apps.forEach((app) => {
    deleteTasks.push(async () => {
      await amplifyClient.deleteApp({ appId: app.appId }).promise();
    });
  });
  await sequential(deleteTasks);

  return listAppsResult.nextToken;
}

export function generateBackendEnvParams(appId: string, projectName: string, envName: string) {
  const timeStamp = moment().format('YYMMDDHHmm');
  const stackName = `amplify-${projectName}-${envName}-${timeStamp}`;
  const deploymentBucketName = `${stackName}-deployment`;
  return { appId, envName, stackName, deploymentBucketName };
}

export async function createConsoleApp(projectName: string, amplifyClient?: Amplify) {
  if (!amplifyClient) {
    amplifyClient = getConfiguredAmplifyClient();
  }
  const createAppParams = {
    name: projectName,
    environmentVariables: { _LIVE_PACKAGE_UPDATES: '[{"pkg":"@aws-amplify/cli","type":"npm","version":"latest"}]' },
  };

  const createAppResponse = await amplifyClient.createApp(createAppParams).promise();
  return createAppResponse.app.appId;
}

export async function deleteConsoleApp(appId: string, amplifyClient?: Amplify) {
  if (!amplifyClient) {
    amplifyClient = getConfiguredAmplifyClient();
  }
  const deleteAppParams = {
    appId,
  };
  try {
    await amplifyClient.deleteApp(deleteAppParams).promise();
  } catch (err) {
    // Do nothing
  }
}

export async function createBackendEnvironment(backendParams: any, amplifyClient?: Amplify) {
  if (!amplifyClient) {
    amplifyClient = getConfiguredAmplifyClient();
  }

  const { appId, envName, stackName, deploymentBucketName } = backendParams;

  const createEnvParams = {
    appId,
    environmentName: envName,
    stackName,
    deploymentArtifacts: deploymentBucketName,
  };

  await amplifyClient.createBackendEnvironment(createEnvParams).promise();
}
