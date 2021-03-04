import { setupAmplifyAdminUI, getAmplifyBackendJobStatus } from '../utils/sdk-calls';

export async function enableAdminUI(appId: string, envName: string, region: string) {
  const setupAdminUIJobDetails = await setupAmplifyAdminUI(appId, region);

  const jobCompletionDetails = await pollUntilDone(setupAdminUIJobDetails.JobId, appId, envName, region, 2 * 1000, 2000 * 1000);

  if (jobCompletionDetails.Status === 'FAILED') {
    throw new Error('Setting up Admin UI failed');
  }
}

// interval is how often to poll
// timeout is how long to poll waiting for a result (0 means try forever)

async function pollUntilDone(jobId: string, appId: string, envName: string, region: string, interval: number, timeout: number) {
  const start = Date.now();
  while (true) {
    const jobDetails = await getAmplifyBackendJobStatus(jobId, appId, envName, region);

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
