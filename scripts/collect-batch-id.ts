import { CodeBuild } from 'aws-sdk';

export const getBatchesInProject = async (cb: CodeBuild, codeBuildProjectName: string): Promise<string[]> => {
  console.log(`Proj Name: ${codeBuildProjectName}`);
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
