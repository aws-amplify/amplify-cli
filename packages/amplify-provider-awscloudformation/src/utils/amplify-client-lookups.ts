import { stateManager } from 'amplify-cli-core';
import { Amplify } from 'aws-sdk';
import { fileLogger } from './aws-logger';

const logger = fileLogger('get-local-app-ids-in-same-region-and-account');

/**
 * Gets a list of AppIds that exist in the local aws info file that are in the specified region and accessible by the given amplifyClient
 */
export const getLocalAppIdsInSameRegionAndAccount = async (amplifyClient: Amplify): Promise<string[]> => {
  const awsInfo = stateManager.getLocalAWSInfo() as Record<string, {appId: string, region: string}>;
  if (!awsInfo) {
    return [];
  }
  const localAppIdsInTheSameLocalProjectAndRegion = Object.values(awsInfo)
    .filter(value => !!value.appId && value.region === amplifyClient.config.region)
    .map(value => value.appId);
  if (localAppIdsInTheSameLocalProjectAndRegion.length === 0) {
    return localAppIdsInTheSameLocalProjectAndRegion; // empty array
  }

  // if there are local appIds, we need to verify that they are accessible by the amplifyClient (ie in the given account)
  const clientAccessibleAppIds = (await listAllApps(amplifyClient)).map(app => app.appId);
  return localAppIdsInTheSameLocalProjectAndRegion.filter(appId => clientAccessibleAppIds.includes(appId));
};

/**
 * Finds an Amplify App that has a backend environment matching the given predicate, or undefined if no backend matches
 *
 * First lists all of the Amplify Apps in the account / region,
 * then for each app searches backend list until one matches. Returns the first match
 * @param amplifyClient configured Amplify service client
 * @param backendPredicate predicate function to match backends
 * @returns BackendEnvironment or undefined
 */
export const findAppByBackendPredicate = async (
  amplifyClient: Amplify,
  backendPredicate: (backend: Amplify.BackendEnvironment) => boolean,
): Promise<Amplify.App | undefined> => {
  const allApps = await listAllApps(amplifyClient);
  for (const app of allApps) {
    const matchingBackend = await findBackendEnvironmentInApp(amplifyClient, app.appId, backendPredicate);
    if (matchingBackend) {
      return app;
    }
  }
  return undefined;
};

const findBackendEnvironmentInApp = async (
  amplifyClient: Amplify,
  appId: string,
  backendPredicate: (backend: Amplify.BackendEnvironment) => boolean,
): Promise<Amplify.BackendEnvironment | undefined> => {
  let nextToken: string;
  do {
    logger('searchAmplifyService.amplifyClient.listBackendEnvironments', [
      {
        appId,
        nextToken,
      },
    ])();
    const listEnvResponse = await amplifyClient
      .listBackendEnvironments({
        appId,
        nextToken,
      })
      .promise();
    nextToken = listEnvResponse.nextToken;
    for (const backendEnv of listEnvResponse.backendEnvironments) {
      if (backendPredicate(backendEnv)) {
        return backendEnv;
      }
    }
  } while (nextToken);
  return undefined; // no match
};

const listAllApps = async (amplifyClient: Amplify): Promise<Amplify.App[]> => {
  const result: Amplify.App[] = [];
  let nextToken: string;
  do {
    logger('init.amplifyClient.listApps', [
      {
        nextToken,
        maxResults: 25,
      },
    ])();
    const listAppsResponse = await amplifyClient
      .listApps({
        nextToken,
        maxResults: 25,
      })
      .promise();
    nextToken = listAppsResponse.nextToken;
    result.push(...listAppsResponse.apps);
  } while (nextToken);
  return result;
};
