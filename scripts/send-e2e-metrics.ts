import { CodeBuild } from 'aws-sdk';
import { BuildBatch } from 'aws-sdk/clients/codebuild';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { getBatchesInProject, getBatchSourceVersionFromBatchId } from './collect-batch-id';
import {
  CostExplorerClient,
  GetCostAndUsageCommand,
  GetCostAndUsageCommandInput,
  GetCostAndUsageCommandOutput,
} from '@aws-sdk/client-cost-explorer';

const getBatchBuildDetails = async (cb: CodeBuild, batchId: string[]): Promise<BuildBatch[]> => {
  const retrieveBatchDetails = await cb
    .batchGetBuildBatches({
      ids: batchId,
    })
    .promise();
  return retrieveBatchDetails.buildBatches ?? [];
};

const storeDataToDDB = async (ddbClient: DynamoDBClient, key: string, tableName: string, data: any): Promise<string> => {
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

const getCostAndUsage = async (ce: CostExplorerClient, params: GetCostAndUsageCommandInput): Promise<GetCostAndUsageCommandOutput> => {
  const costExplorerClient = ce;
  const costAndUsage: GetCostAndUsageCommandOutput = await costExplorerClient.send(new GetCostAndUsageCommand(params));
  return costAndUsage;
};

const main = async () => {
  const cb = new CodeBuild({ region: 'us-east-1' });
  const ce = new CostExplorerClient({ region: 'us-east-1' });
  const ddb = new DynamoDBClient({ region: 'us-east-1' });

  const expectedSourceVersion = process.argv[2];
  const codeBuildProjectName = process.argv[3];
  const ddbBatchMetricsTable = process.argv[4];
  const ddbBuildMetricsTable = process.argv[5];
  const ddbE2ECostTable = process.argv[6];

  const currentDateJSON = new Date().toJSON().slice(0, 10);
  const prevDate = new Date();
  prevDate.setDate(new Date().getDate() - 3);
  const prevDateJSON = prevDate.toJSON().slice(0, 10);

  const allBatchBuildIds = await getBatchesInProject(cb, codeBuildProjectName);
  console.log(`allBatchBuildIds: ${JSON.stringify(allBatchBuildIds)}`);
  let failFlag = true;
  let batchId = '';
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

  try {
    console.log(`Getting batch details for batchId: ${batchId}`);
    const batchDetails = await getBatchBuildDetails(cb, [batchId]);

    const batchDDBresponse = await storeDataToDDB(ddb, batchId, ddbBatchMetricsTable, batchDetails);
    console.log(batchDDBresponse);

    const hourlyCostAndUsageParam: GetCostAndUsageCommandInput = {
      Metrics: ['UnblendedCost'],
      TimePeriod: {
        // DateInterval
        Start: prevDateJSON, // required
        End: currentDateJSON, // required
      },
      Granularity: 'DAILY',
    };
    const costAndUsage: GetCostAndUsageCommandOutput = await getCostAndUsage(ce, hourlyCostAndUsageParam);
    console.log(costAndUsage);

    const costDDBresponse = await storeDataToDDB(ddb, batchId, ddbE2ECostTable, costAndUsage);
    console.log(costDDBresponse);
  } catch (err) {
    console.error(`Error: ${err}`);
    console.error('Failed to get batch build and cost details and store to DynamoDB.');
    process.exit(1);
  }
};

main().then(() => console.log('done'));
