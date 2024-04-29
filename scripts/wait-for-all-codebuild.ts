import { CodeBuild } from 'aws-sdk';
import * as fs from 'fs';

const getBatchesInProject = async (cb: CodeBuild, codeBuildProjectName: string): Promise<string[]> => {
  const retrievedBatchIds = await cb
    .listBuildBatchesForProject({
      projectName: codeBuildProjectName,
      filter: { status: 'IN_PROGRESS' },
    })
    .promise();
  return retrievedBatchIds.ids ?? [];
};

const getBatchSourceVersionFromBatchId = async (cb: CodeBuild, batchId: string): Promise<string> => {
  const retrievedBatchInfo = await cb.batchGetBuildBatches({ ids: [batchId] }).promise();
  return retrievedBatchInfo.buildBatches?.[0].resolvedSourceVersion ?? '';
};

const getIncompleteJobIdsFromBatchId = async (cb: CodeBuild, batchId: string): Promise<string[]> => {
  const retrievedBatchInfo = await cb.batchGetBuildBatches({ ids: [batchId] }).promise();
  const ids = retrievedBatchInfo.buildBatches?.[0].buildGroups
    ?.filter((group) => group.currentBuildSummary?.buildStatus === 'IN_PROGRESS' || group.currentBuildSummary?.buildStatus === 'PENDING')
    .map((group) => group.identifier ?? '');
  return ids ?? [];
};

const getFailedJobIdsFromBatchId = async (cb: CodeBuild, batchId: string): Promise<string[]> => {
  const retrievedBatchInfo = await cb.batchGetBuildBatches({ ids: [batchId] }).promise();
  const ids = retrievedBatchInfo.buildBatches?.[0].buildGroups
    ?.filter(
      (group) =>
        group.currentBuildSummary?.buildStatus === 'FAILED' ||
        group.currentBuildSummary?.buildStatus === 'FAULT' ||
        group.currentBuildSummary?.buildStatus === 'STOPPED' ||
        group.currentBuildSummary?.buildStatus === 'TIMED_OUT',
    )
    .map((group) => group.identifier ?? '');
  return ids ?? [];
};

const main = async () => {
  const cb = new CodeBuild({
    region: 'us-east-1',
    maxRetries: 10,
    retryDelayOptions: {
      base: 10 * 1000,
    },
  });
  const expectedSourceVersion = process.argv[2];
  const jobsDependedOnFilepathOrId = process.argv[3];
  const codeBuildProjectName = process.argv[4];
  const codebuildWebhookTrigger = process.argv[5];
  const accountForFailures: boolean = process.argv.length >= 7 && process.argv[6] === 'requirePrevJobsToSucceed';

  let jobsDependedOn: string[];
  if (fs.existsSync(jobsDependedOnFilepathOrId)) {
    const jobsDependedOnRaw = fs.readFileSync(jobsDependedOnFilepathOrId, 'utf8');
    jobsDependedOn = JSON.parse(jobsDependedOnRaw);
  } else {
    jobsDependedOn = [jobsDependedOnFilepathOrId];
  }
  console.log(`accountForFailures: ${accountForFailures}`);
  console.log(`Depending on these jobs: ${JSON.stringify(jobsDependedOn)}`);
  console.log(`Number of jobs depended on: ${jobsDependedOn.length}`);
  const allBatchBuildIds = await getBatchesInProject(cb, codeBuildProjectName);
  console.log(`allBatchBuildIds: ${JSON.stringify(allBatchBuildIds)}`);
  let batchId = '';
  let failFlag = true;
  for (batchId of allBatchBuildIds) {
    const batchSourceVersion = await getBatchSourceVersionFromBatchId(cb, batchId);
    console.log(`batchId: ${batchId} - batchSourceVersion: ${batchSourceVersion}`);
    if (batchSourceVersion === expectedSourceVersion) {
      failFlag = false;
      break;
    }
  }
  if (failFlag) {
    console.log('Could not find matching source version');
    process.exit(1);
  }
  let intersectingIncompleteJobs: string[];
  do {
    await new Promise((resolve) => setTimeout(resolve, 180 * 1000)); // sleep for 180 seconds
    const failedJobsInBatch = await getFailedJobIdsFromBatchId(cb, batchId);
    const intersectingFailedJobs = failedJobsInBatch.filter((jobId) => jobsDependedOn.includes(jobId));
    const batchFailed = failedJobsInBatch.length || intersectingFailedJobs.length;
    console.log(`Batch triggered by ${codebuildWebhookTrigger} ${batchFailed ? 'failed' : 'succeeded'}.`);

    if (accountForFailures) {
      console.log(`failedJobsInBatch: ${JSON.stringify(failedJobsInBatch)}`);
      console.log(`intersectingFailedJobs: ${JSON.stringify(intersectingFailedJobs)}`);
      if (intersectingFailedJobs.length > 0) {
        console.log(`${jobsDependedOn[0]} failed. Exiting.`);
        process.exit(1);
      }
    }
    const incompleteJobsInBatch = await getIncompleteJobIdsFromBatchId(cb, batchId);
    console.log(`These are all of the incomplete jobs in the batch: ${JSON.stringify(incompleteJobsInBatch)}`);
    intersectingIncompleteJobs = incompleteJobsInBatch.filter((jobId) => jobsDependedOn.includes(jobId));
    console.log(`Still waiting for these jobs: ${JSON.stringify(intersectingIncompleteJobs)}`);
  } while (intersectingIncompleteJobs.length > 0);
};

main().then(() => console.log('done'));
