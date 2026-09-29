import {
  AmplifyClient,
  ListAppsCommand,
  DeleteAppCommand,
  CreateAppCommand,
  CreateBackendEnvironmentCommand,
} from '@aws-sdk/client-amplify';
import { CloudFormationClient, DeleteStackCommand } from '@aws-sdk/client-cloudformation';
import moment from 'moment';

import { getConfigFromProfile } from '../profile-helper';

export function getConfiguredAmplifyClient() {
  const config = getConfigFromProfile();
  return new AmplifyClient(config);
}

export function getConfiguredCFNClient() {
  const config = getConfigFromProfile();
  return new CloudFormationClient(config);
}

//delete all existing amplify console projects
export async function deleteAllAmplifyProjects(amplifyClient?: AmplifyClient) {
  if (!amplifyClient) {
    amplifyClient = getConfiguredAmplifyClient();
  }
  let token;
  do {
    token = await PaginatedDeleteProjects(amplifyClient, token);
  } while (token);
}

export async function deleteAmplifyStack(stackName: string, cfnClient?: CloudFormationClient) {
  if (!cfnClient) cfnClient = getConfiguredCFNClient();
  try {
    await cfnClient.send(new DeleteStackCommand({ StackName: stackName }));
  } catch (err) {
    // do nothing
  }
}

async function PaginatedDeleteProjects(amplifyClient: AmplifyClient, token?: string) {
  const sequential = require('promise-sequential');
  const maxResults = 25;
  const listAppsResult = await amplifyClient.send(
    new ListAppsCommand({
      maxResults,
      nextToken: token,
    }),
  );

  const deleteTasks = [];
  listAppsResult.apps.forEach((app) => {
    deleteTasks.push(async () => {
      await amplifyClient.send(new DeleteAppCommand({ appId: app.appId }));
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

export async function createConsoleApp(projectName: string, amplifyClient?: AmplifyClient) {
  if (!amplifyClient) {
    amplifyClient = getConfiguredAmplifyClient();
  }
  const createAppParams = {
    name: projectName,
    environmentVariables: { _LIVE_PACKAGE_UPDATES: '[{"pkg":"@aws-amplify/cli","type":"npm","version":"latest"}]' },
  };

  const createAppResponse = await amplifyClient.send(new CreateAppCommand(createAppParams));
  return createAppResponse.app.appId;
}

export async function deleteConsoleApp(appId: string, amplifyClient?: AmplifyClient) {
  if (!amplifyClient) {
    amplifyClient = getConfiguredAmplifyClient();
  }
  const deleteAppParams = {
    appId,
  };
  try {
    await amplifyClient.send(new DeleteAppCommand(deleteAppParams));
  } catch (err) {
    // Do nothing
  }
}

export async function createBackendEnvironment(backendParams: any, amplifyClient?: AmplifyClient) {
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

  await amplifyClient.send(new CreateBackendEnvironmentCommand(createEnvParams));
}
