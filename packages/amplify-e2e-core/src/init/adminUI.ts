// eslint-disable-next-line import/no-cycle
import { retry, sleep } from '../utils';
import { setupAmplifyAdminUI, getAmplifyBackendJobStatus } from '../utils/sdk-calls';

/**
 * Kick off Amplify backend provisioning and poll until provisioning complete (or failed)
 */
export const enableAdminUI = async (appId: string, envName: string, region: string): Promise<void> => {
  const setupAdminUIJobDetails = await setupAmplifyAdminUI(appId, region);

  // try to avoid eventual consistency issues between when the Amplify backend starts provisioning and when we start polling the status
  await sleep(1000 * 60 * 10); // 10 seconds

  try {
    await retry(
      () => getAmplifyBackendJobStatus(setupAdminUIJobDetails.JobId, appId, envName, region),
      jobDetails => jobDetails.Status === 'COMPLETED',
      {
        timeoutMS: 1000 * 60 * 60 * 2, // 2 minutes
      },
      jobDetails => jobDetails.Status === 'FAILED',
    );
  } catch {
    throw new Error('Setting up Amplify Studio failed');
  }
};
