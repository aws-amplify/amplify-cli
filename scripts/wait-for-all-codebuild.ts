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

const main = async () => {
  const cb = new CodeBuild({ region: 'us-east-1' });
  const expectedSourceVersion = process.argv[2];
  const jobsDependedOnFilepath = process.argv[3];
  const codeBuildProjectName = process.argv[4];
  const jobsDependedOnRaw = fs.readFileSync(jobsDependedOnFilepath, 'utf8');
  const jobsDependedOn = JSON.parse(jobsDependedOnRaw);
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
    const incompleteJobsInBatch = await getIncompleteJobIdsFromBatchId(cb, batchId);
    console.log(`These are all of the incomplete jobs in the batch: ${JSON.stringify(incompleteJobsInBatch)}`);
    intersectingIncompleteJobs = incompleteJobsInBatch.filter((jobId) => jobsDependedOn.includes(jobId));
    console.log(`Still waiting for these jobs: ${JSON.stringify(intersectingIncompleteJobs)}`);
  } while (intersectingIncompleteJobs.length > 0);
};

main().then(() => console.log('done'));
