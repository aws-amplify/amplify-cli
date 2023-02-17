// eslint-disable-next-line import/no-cycle
import { retry } from '../utils';
import { setupAmplifyAdminUI, getAmplifyBackendJobStatus } from '../utils/sdk-calls';

/**
 * Kick off Amplify backend provisioning and poll until provisioning complete (or failed)
 */
export const enableAdminUI = async (appId: string, __envName: string, region: string): Promise<void> => {
  const { JobId, BackendEnvironmentName } = await setupAmplifyAdminUI(appId, region);

  try {
    await retry(
      () => getAmplifyBackendJobStatus(JobId, appId, BackendEnvironmentName, region),
      (jobDetails) => jobDetails.Status === 'COMPLETED',
      {
        timeoutMS: 1000 * 60 * 5, // 5 minutes
        stopOnError: false,
      },
      (jobDetails) => jobDetails.Status === 'FAILED',
    );
  } catch {
    throw new Error('Setting up Amplify Studio failed');
  }
};
