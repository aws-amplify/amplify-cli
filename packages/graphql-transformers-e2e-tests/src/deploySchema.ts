import { default as S3 } from 'aws-sdk/clients/s3';
import moment from 'moment';
import { GraphQLTransform } from '../../amplify-graphql-transformer-core/lib';
import { CloudFormationClient } from './CloudFormationClient';
import { GraphQLClient } from './GraphQLClient';
import { S3Client } from './S3Client';
import * as path from 'path';
import * as os from 'os';
import { cleanupStackAfterTest, deploy } from './deployNestedStacks';
import { Output } from 'aws-sdk/clients/cloudformation';
import { ResourceConstants } from 'graphql-transformer-common';
import * as fs from 'fs-extra';

const cf = new CloudFormationClient('us-west-2');
const customS3Client = new S3Client('us-west-2');
const awsS3Client = new S3({ region: 'us-west-2' });

export type DeploySchemaReturn = {
  graphqlClient: GraphQLClient;
  cleanUp: () => Promise<void>;
};

/**
 * Deploys an AppSync API using the given transformer and schema and returns a GraphQL client pointing to the deployed API.
 * Also returns a function that can be used to tear down the API after the test is finished.
 *
 * No other tests are refactored to use this function at this point,
 * but it would be nice to extend this function to handle spinning up and cleaning up all test GQL endpoints
 *
 * @param testId A human readable identifier for the schema / test being provisioned. Should be alphanumeric (no dashes, underscores, etc)
 * @param transformer The transformer to run on the schema
 * @param schema The schema to transform
 * @returns A GraphQL client pointing to an AppSync API with the provided schema deployed to it
 */
export const deploySchema = async (testId: string, transformer: GraphQLTransform, schema: string): Promise<DeploySchemaReturn> => {
  const buildTimestamp = moment().format('YYYYMMDDHHmmss');
  const stackName = `${testId}-${buildTimestamp}`;
  const testBucketName = `${testId}-bucket-${buildTimestamp}`.toLowerCase();
  const localBuildDir = path.join(os.tmpdir(), testId);
  const s3RootDirKey = 'deployments';

  try {
    await awsS3Client.createBucket({ Bucket: testBucketName }).promise();
  } catch (err) {
    console.error(`Failed to create bucket ${testBucketName}: ${err}`);
  }

  const out = transformer.transform(schema);

  try {
    const finishedStack = await deploy(customS3Client, cf, stackName, out, {}, localBuildDir, testBucketName, s3RootDirKey, buildTimestamp);

    // Arbitrary wait to make sure everything is ready.
    await cf.wait(5, () => Promise.resolve());

    expect(finishedStack).toBeDefined();

    const getApiEndpoint = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput);
    const getApiKey = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput);
    const endpoint = getApiEndpoint(finishedStack.Outputs);
    const apiKey = getApiKey(finishedStack.Outputs);

    expect(apiKey).toBeDefined();
    expect(endpoint).toBeDefined();

    return {
      graphqlClient: new GraphQLClient(endpoint, { 'x-api-key': apiKey }),
      cleanUp: async () => {
        await cleanupStackAfterTest(testBucketName, stackName, cf);
        await fs.remove(localBuildDir);
      },
    };
  } catch (e) {
    console.error(e);
    expect(true).toEqual(false);
  }
};

function outputValueSelector(key: string) {
  return (outputs: Output[]) => {
    const output = outputs.find((o: Output) => o.OutputKey === key);
    return output ? output.OutputValue : null;
  };
}
