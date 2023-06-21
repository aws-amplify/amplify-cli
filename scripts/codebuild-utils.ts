import { CodeBuild } from 'aws-sdk';

export const getBatchesInProject = async (cb: CodeBuild, codeBuildProjectName: string): Promise<string[]> => {
  const retrievedBatchIds = await cb
    .listBuildBatchesForProject({
      projectName: codeBuildProjectName,
      filter: { status: 'IN_PROGRESS' },
    })
    .promise();
  return retrievedBatchIds.ids ?? [];
};

export const getBatchSourceVersionFromBatchId = async (cb: CodeBuild, batchId: string): Promise<string> => {
  const retrievedBatchInfo = await cb.batchGetBuildBatches({ ids: [batchId] }).promise();
  return retrievedBatchInfo.buildBatches?.[0].resolvedSourceVersion ?? '';
};

export const getIncompleteJobIdsFromBatchId = async (cb: CodeBuild, batchId: string): Promise<string[]> => {
  const retrievedBatchInfo = await cb.batchGetBuildBatches({ ids: [batchId] }).promise();
  const ids = retrievedBatchInfo.buildBatches?.[0].buildGroups
    ?.filter((group) => group.currentBuildSummary?.buildStatus === 'IN_PROGRESS' || group.currentBuildSummary?.buildStatus === 'PENDING')
    .map((group) => group.identifier ?? '');
  return ids ?? [];
};
