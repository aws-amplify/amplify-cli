import ora from 'ora';
import AWS from 'aws-sdk';
import { $TSContext, stateManager, pathManager, $TSAny } from 'amplify-cli-core';
import { isDataStoreEnabled } from 'graphql-transformer-core';
import * as path from 'path';
import { ProviderName as providerName } from './constants';
import { isAmplifyAdminApp } from './utils/admin-helpers';
import { AmplifyBackend } from './aws-utils/aws-amplify-backend';

export async function adminModelgen(context: $TSContext, resources: $TSAny[]) {
  const appSyncResources = resources.filter(resource => resource.service === 'AppSync');

  if (appSyncResources.length === 0) {
    return;
  }

  const appSyncResource = appSyncResources[0];
  const { resourceName } = appSyncResource;

  const amplifyMeta = stateManager.getMeta();
  const localEnvInfo = stateManager.getLocalEnvInfo();

  const appId = amplifyMeta?.providers?.[providerName]?.AmplifyAppId;

  if (!appId) {
    return;
  }

  const envName = localEnvInfo.envName;
  const { isAdminApp } = await isAmplifyAdminApp(appId);
  const isDSEnabled = await isDataStoreEnabled(path.join(pathManager.getBackendDirPath(), 'api', resourceName));

  if (!isAdminApp || !isDSEnabled) {
    return;
  }

  // Generate DataStore Models for Admin UI CMS to consume
  const spinner = ora('Generating models in the cloud...\n').start();
  const amplifyBackendInstance = await AmplifyBackend.getInstance(context);

  try {
    const jobStartDetails = await amplifyBackendInstance.amplifyBackend
      .generateBackendAPIModels({
        AppId: appId,
        BackendEnvironmentName: envName,
        ResourceName: resourceName,
      })
      .promise();

    const jobCompletionDetails = await pollUntilDone(
      jobStartDetails.JobId,
      appId,
      envName,
      2 * 1000,
      2000 * 1000,
      amplifyBackendInstance.amplifyBackend,
    );
    if (jobCompletionDetails.Status === 'COMPLETED') {
      spinner.succeed('Successfully generated models in the cloud.');
    } else {
      throw new Error('Modelgen job creation failed');
    }
  } catch (e) {
    spinner.stop();
    context.print.error(`Failed to create models in the cloud: ${e.message}`);
  }
}

// interval is how often to poll
// timeout is how long to poll waiting for a result (0 means try forever)

async function pollUntilDone(
  jobId: string,
  appId: string,
  backendEnvironmentName: string,
  interval: number,
  timeout: number,
  amplifyBackendClient: AWS.AmplifyBackend,
) {
  const start = Date.now();
  while (true) {
    const jobDetails = await amplifyBackendClient
      .getBackendJob({
        JobId: jobId,
        AppId: appId,
        BackendEnvironmentName: backendEnvironmentName,
      })
      .promise();

    if (jobDetails.Status === 'FAILED' || jobDetails.Status === 'COMPLETED') {
      // we know we're done here, return from here whatever you
      // want the final resolved value of the promise to be
      return jobDetails;
    } else {
      if (timeout !== 0 && Date.now() - start > timeout) {
        throw new Error(`Job Timed out for ${jobId}`);
      } else {
        // run again with a short delay
        await delay(interval);
      }
    }
  }
}

// create a promise that resolves after a short delay
function delay(t: number) {
  return new Promise(function (resolve) {
    setTimeout(resolve, t);
  });
}
