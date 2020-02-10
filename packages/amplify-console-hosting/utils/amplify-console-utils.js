const { put } = require('request-promise');
const fs = require('fs-extra');
const ora = require('ora');


const DEPLOY_ARTIFACTS_MESSAGE = "Deploying build artifacts to the Amplify Console..";
const DEPLOY_COMPLETE_MESSAGE = "Deployment complete!";
const DEPLOY_FAILURE_MESSAGE = "Deploy failed!";

function getDefaultDomainForApp(appId) {
    return `https://${appId}.amplifyapp.com`;
}

function getDefaultDomainForBranch(appId, branch) {
    return `https://${branch}.${appId}.amplifyapp.com`;
}

async function publishFileToAmplify(appId, branchName, artifactsPath, amplifyClient) {
    const spinner = ora();
    spinner.start(DEPLOY_ARTIFACTS_MESSAGE);
    try {
        const params = {
            appId: appId,
            branchName: branchName
        };
        await cancelAllPendingJob(appId, branchName, amplifyClient);
        const { zipUploadUrl, jobId } = await amplifyClient.createDeployment(params).promise();
        await httpPutFile(artifactsPath, zipUploadUrl);
        const result = await amplifyClient.startDeployment({ ...params, jobId }).promise();
        await waitJobToSucceed({ ...params, jobId }, amplifyClient);
        spinner.succeed(DEPLOY_COMPLETE_MESSAGE);
    } catch(err) {
        spinner.fail(DEPLOY_FAILURE_MESSAGE);
        throw err;
    }

}

async function cancelAllPendingJob(appId, branchName, amplifyClient) { 
    const params = {
        appId: appId,
        branchName: branchName
    }
    const { jobSummaries } = await amplifyClient.listJobs(params).promise();
    for (let jobSummary of jobSummaries) {
        const { jobId, status } = jobSummary;
        if (status === 'PENDING' || status === 'RUNNING') {
            const job = { ...params, jobId };
            await amplifyClient.stopJob(job).promise();
        }
    }
}

function waitJobToSucceed(job, amplifyClient) {
    return new Promise(async (resolve, reject) => {
        try {
            const timeout = setTimeout(() => {
                console.log('Job Timeout before succeeded');
                reject();
            }, 1000 * 60 * 10);
    
            while (true) {
                const getJobResult = await amplifyClient.getJob(job).promise();
                const jobSummary = getJobResult.job.summary;
                if (jobSummary.status === 'FAILED') {
                    console.log('Job failed.' + JSON.stringify(jobSummary));
                    clearTimeout(timeout);
                    resolve();
                }
                if (jobSummary.status === 'SUCCEED') {
                    clearTimeout(timeout);
                    resolve();
                }
                await sleep(1000 * 3);
            }
        } catch(err) {
            reject(err);
        }
    });
}

 async function httpPutFile(filePath, url) {
    const result = await put({
        body: fs.readFileSync(filePath),
        url
    });
}

function sleep(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    });
}

module.exports = {
    getDefaultDomainForApp,
    getDefaultDomainForBranch,
    publishFileToAmplify
}