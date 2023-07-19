import { CodeBuild } from 'aws-sdk';
import { BuildBatch } from 'aws-sdk/clients/codebuild';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import {
  CostExplorerClient,
  GetCostAndUsageCommand,
  GetCostAndUsageCommandInput,
  GetCostAndUsageCommandOutput,
} from '@aws-sdk/client-cost-explorer';

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

export const getBatchBuildDetails = async (cb: CodeBuild, batchId: string[]): Promise<BuildBatch[]> => {
  const retrieveBatchDetails = await cb
    .batchGetBuildBatches({
      ids: batchId,
    })
    .promise();
  return retrieveBatchDetails.buildBatches ?? [];
};

export const storeDataToDDB = async (ddbClient: DynamoDBClient, key: string, tableName: string, data: any): Promise<string> => {
  const docClient = DynamoDBDocumentClient.from(ddbClient);
  const command = new PutCommand({
    TableName: tableName,
    Item: {
      id: key,
      metrics: JSON.stringify(data),
    },
  });

  const response = await docClient.send(command);
  return JSON.stringify(response);
};

export const getCostAndUsage = async (
  ce: CostExplorerClient,
  params: GetCostAndUsageCommandInput,
): Promise<GetCostAndUsageCommandOutput> => {
  const costExplorerClient = ce;
  const costAndUsage: GetCostAndUsageCommandOutput = await costExplorerClient.send(new GetCostAndUsageCommand(params));
  return costAndUsage;
};
