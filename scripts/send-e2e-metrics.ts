import { CodeBuild } from 'aws-sdk';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  getBatchesInProject,
  getBatchSourceVersionFromBatchId,
  getBatchBuildDetails,
  getCostAndUsage,
  storeDataToDDB,
} from './codebuild-sdk-helpers';
import { CostExplorerClient, GetCostAndUsageCommandInput, GetCostAndUsageCommandOutput } from '@aws-sdk/client-cost-explorer';

const main = async () => {
  const cb = new CodeBuild({ region: 'us-east-1' });
  const ce = new CostExplorerClient({ region: 'us-east-1' });
  const ddb = new DynamoDBClient({ region: 'us-east-1' });

  const expectedSourceVersion = process.argv[2];
  const codeBuildProjectName = process.argv[3];
  const ddbBatchMetricsTable = process.argv[4];
  const ddbE2ECostTable = process.argv[5];

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

  console.log(`Getting batch details for batchId: ${batchId}`);
  let batchDetails: CodeBuild.BuildBatch[] = [];
  let retrievedBatchDetails = false;
  try {
    batchDetails = await getBatchBuildDetails(cb, [batchId]);
    retrievedBatchDetails = true;
  } catch (err) {
    console.error(`Error: ${err}`);
    console.error('Failed to get batch build details');
  }
  if (retrievedBatchDetails) {
    console.log('Storing batch details to DynamoDB Table');
    try {
      const batchDDBresponse = await storeDataToDDB(ddb, batchId, ddbBatchMetricsTable, batchDetails);
      console.log(batchDDBresponse);
    } catch (err) {
      console.error(`Error: ${err}`);
      console.error('Failed to store batch build details to DynamoDB');
    }
  }

  const hourlyCostAndUsageParam: GetCostAndUsageCommandInput = {
    Metrics: ['UnblendedCost'],
    TimePeriod: {
      // DateInterval
      Start: prevDateJSON, // required
      End: currentDateJSON, // required
    },
    Granularity: 'DAILY',
  };
  console.log('Getting account cost and usage');
  let retrievedCostAndUsage = false;
  let costAndUsage = null;
  try {
    costAndUsage = await getCostAndUsage(ce, hourlyCostAndUsageParam);
    console.log(costAndUsage);
    retrievedCostAndUsage = true;
  } catch (err) {
    console.error(`Error: ${err}`);
    console.error('Failed to get account cost and usage');
  }
  if (retrievedCostAndUsage) {
    console.log('Storing cost and usage to DynamoDB');
    try {
      const costDDBresponse = await storeDataToDDB(ddb, batchId, ddbE2ECostTable, costAndUsage);
      console.log(costDDBresponse);
    } catch (err) {
      console.error(`Error: ${err}`);
      console.error('Failed to store cost and usage to DynamoDB');
    }
  }
};

main().then(() => console.log('done'));
