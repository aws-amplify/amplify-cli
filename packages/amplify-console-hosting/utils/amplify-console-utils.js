const { put } = require('request-promise');
const fs = require('fs-extra');
const ora = require('ora');

const DEPLOY_ARTIFACTS_MESSAGE =
  'Deploying build artifacts to the Amplify Console..';
const DEPLOY_COMPLETE_MESSAGE = 'Deployment complete!';
const DEPLOY_FAILURE_MESSAGE = 'Deployment failed! Please report an issue on the Amplify Console GitHub issue tracker at https://github.com/aws-amplify/amplify-console/issues.';

function getDefaultDomainForApp(appId) {
  return `https://${appId}.amplifyapp.com`;
}

function getDefaultDomainForBranch(appId, branch) {
  return `https://${branch}.${appId}.amplifyapp.com`;
}

async function publishFileToAmplify(
  appId,
  branchName,
  artifactsPath,
  amplifyClient,
) {
  const spinner = ora();
  spinner.start(DEPLOY_ARTIFACTS_MESSAGE);
  try {
    const params = {
      appId,
      branchName,
    };
    await cancelAllPendingJob(appId, branchName, amplifyClient);
    const { zipUploadUrl, jobId } = await amplifyClient
      .createDeployment(params)
      .promise();
    await httpPutFile(artifactsPath, zipUploadUrl);
    await amplifyClient.startDeployment({ ...params, jobId }).promise();
    await waitJobToSucceed({ ...params, jobId }, amplifyClient);
    spinner.succeed(DEPLOY_COMPLETE_MESSAGE);
  } catch (err) {
    spinner.fail(DEPLOY_FAILURE_MESSAGE);
    throw err;
  }
}

async function cancelAllPendingJob(appId, branchName, amplifyClient) {
  const params = {
    appId,
    branchName,
  };
  const { jobSummaries } = await amplifyClient.listJobs(params).promise();
  for (const jobSummary of jobSummaries) {
    const { jobId, status } = jobSummary;
    if (status === 'PENDING' || status === 'RUNNING') {
      const job = { ...params, jobId };
      await amplifyClient.stopJob(job).promise();
    }
  }
}

function waitJobToSucceed(job, amplifyClient) {
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      console.log('Job Timeout before succeeded');
      reject();
    }, 1000 * 60 * 10);
    let processing = true;
    try {
      while (processing) {
        const getJobResult = await amplifyClient.getJob(job).promise();
        const jobSummary = getJobResult.job.summary;
        if (jobSummary.status === 'FAILED') {
          console.log(`Job failed.${JSON.stringify(jobSummary)}`);
          clearTimeout(timeout);
          processing = false;
          resolve();
        }
        if (jobSummary.status === 'SUCCEED') {
          clearTimeout(timeout);
          processing = false;
          resolve();
        }
        await sleep(1000 * 3);
      }
    } catch (err) {
      processing = false;
      reject(err);
    }
  });
}

async function httpPutFile(filePath, url) {
  await put({
    body: fs.readFileSync(filePath),
    url,
  });
}

function sleep(ms) {
  return new Promise((resolve, reject) => {
    try {
      setTimeout(resolve, ms);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  getDefaultDomainForApp,
  getDefaultDomainForBranch,
  publishFileToAmplify,
};
