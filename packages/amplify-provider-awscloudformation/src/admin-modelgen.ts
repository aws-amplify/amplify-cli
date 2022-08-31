import {
  $TSAny, $TSContext, AmplifyError, AmplifyFault, AMPLIFY_SUPPORT_DOCS, pathManager, stateManager,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import { isDataStoreEnabled } from 'graphql-transformer-core';
import ora from 'ora';
import * as path from 'path';
import { AmplifyBackend } from './aws-utils/aws-amplify-backend';
import { ProviderName as providerName } from './constants';
import { isAmplifyAdminApp } from './utils/admin-helpers';

/**
 * Generates DataStore Models for Admin UI CMS to consume
 */
export const adminModelgen = async (context: $TSContext, resources: $TSAny[]): Promise<void> => {
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

  const { envName } = localEnvInfo;
  const { isAdminApp } = await isAmplifyAdminApp(appId);
  const isDSEnabled = await isDataStoreEnabled(path.join(pathManager.getBackendDirPath(), 'api', resourceName));

  if (!isAdminApp || !isDSEnabled) {
    return;
  }

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
      throw new AmplifyError('ModelgenError', {
        message: `Failed to generate models in the cloud.`,
        link: `${AMPLIFY_SUPPORT_DOCS.CLI_PROJECT_TROUBLESHOOTING.url}`,
      });
    }
  } catch (e) {
    spinner.stop();
    printer.error(`Failed to create models in the cloud: ${e.message}`);
  }
};

// interval is how often to poll
// timeout is how long to poll waiting for a result (0 means try forever)

const pollUntilDone = async (
  jobId: string,
  appId: string,
  backendEnvironmentName: string,
  interval: number,
  timeout: number,
  amplifyBackendClient: AWS.AmplifyBackend,
): Promise<PromiseResult<AWS.AmplifyBackend.GetBackendJobResponse, AWS.AWSError>> => {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
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
    }
    if (timeout !== 0 && Date.now() - start > timeout) {
      throw new AmplifyFault('TimeoutFault', {
        message: `Job Timed out for ${jobId}`,
        link: `${AMPLIFY_SUPPORT_DOCS.CLI_PROJECT_TROUBLESHOOTING.url}`,
      });
    } else {
      // run again with a short delay
      await delay(interval);
    }
  }
};

// create a promise that resolves after a short delay
const delay = (t: number): Promise<void> => new Promise(resolve => setTimeout(resolve, t));
