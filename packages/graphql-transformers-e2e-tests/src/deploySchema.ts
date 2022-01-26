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

/**
 * Interface for object that can manage graphql api deployments and cleanup for e2e tests
 */
export type SchemaDeployer = {
  /**
   * Deploy the given schema and return a client to query the API
   */
  deploy: (schema: string) => Promise<GraphQLClient>;
  /**
   * Cleanup the API
   */
  cleanup: () => Promise<void>;
};

/**
 * Returns an object that can be used to deploy and cleanup GraphQL APIs. The deploy function supports multiple deployments to the same API.
 * Each call to deploy returns a GraphQL client that can be used to query the API.
 * The cleanup function will remove all local and cloud resources related to the API.
 *
 * No other tests are refactored to use this function at this point,
 * but it would be nice to extend this function to handle spinning up and cleaning up all test GQL endpoints
 *
 * @param testId A human readable identifier for the schema / test being provisioned. Should be alphanumeric (no dashes, underscores, etc)
 * @param transformer The transformer to run on the schema
 * @param schema The schema to transform
 * @returns A GraphQL client pointing to an AppSync API with the provided schema deployed to it
 */
export const getSchemaDeployer = async (testId: string, transformerFactory: () => GraphQLTransform): Promise<SchemaDeployer> => {
  const initialTimestamp = moment().format('YYYYMMDDHHmmss');
  const stackName = `${testId}-${initialTimestamp}`;
  const testBucketName = `${testId}-bucket-${initialTimestamp}`.toLowerCase();
  const localBuildDir = path.join(os.tmpdir(), testId);
  const s3RootDirKey = 'deployments';
  let initialDeployment = true;

  // create deployment bucket
  try {
    await awsS3Client.createBucket({ Bucket: testBucketName }).promise();
  } catch (err) {
    console.error(`Failed to create bucket ${testBucketName}: ${err}`);
  }

  return {
    deploy: async (schema: string) => {
      const deployTimestamp = moment().format('YYYYMMDDHHmmss');
      const out = transformerFactory().transform(schema);
      const finishedStack = await deploy(
        customS3Client,
        cf,
        stackName,
        out,
        {},
        localBuildDir,
        testBucketName,
        s3RootDirKey,
        deployTimestamp,
        initialDeployment,
      );
      // Arbitrary wait to make sure everything is ready.
      await cf.wait(10, () => Promise.resolve());
      expect(finishedStack).toBeDefined();
      const endpoint = getApiEndpoint(finishedStack.Outputs);
      const apiKey = getApiKey(finishedStack.Outputs);
      expect(apiKey).toBeDefined();
      expect(endpoint).toBeDefined();
      console.log(`endpoint is ${endpoint}`);
      console.log(`api key is ${apiKey}`);
      initialDeployment = false;
      return new GraphQLClient(endpoint, { 'x-api-key': apiKey });
    },
    cleanup: async () => {
      await cleanupStackAfterTest(testBucketName, initialDeployment ? undefined : stackName, cf);
      await fs.remove(localBuildDir);
    },
  };
};

function outputValueSelector(key: string) {
  return (outputs: Output[]) => {
    const output = outputs.find((o: Output) => o.OutputKey === key);
    return output ? output.OutputValue : null;
  };
}

const getApiEndpoint = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput);
const getApiKey = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput);
