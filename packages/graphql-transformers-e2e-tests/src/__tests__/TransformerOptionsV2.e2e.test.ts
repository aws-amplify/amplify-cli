import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { AppSyncAuthConfiguration } from '@aws-amplify/graphql-transformer-interfaces';
import { AuthTransformer } from '@aws-amplify/graphql-auth-transformer';
import { Output } from 'aws-sdk/clients/cloudformation';
import { CloudFormationClient } from '../CloudFormationClient';
import { S3Client } from '../S3Client';
import { cleanupStackAfterTest, deploy } from '../deployNestedStacks';
import { default as CognitoClient } from 'aws-sdk/clients/cognitoidentityserviceprovider';
import { default as S3 } from 'aws-sdk/clients/s3';
import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync';
import moment from 'moment';
import { createUserPool, createUserPoolClient, configureAmplify } from '../cognitoUtils';
import { ResourceConstants } from 'graphql-transformer-common';
import gql from 'graphql-tag';

jest.setTimeout(2000000);

const AWS_REGION = 'us-west-2';

describe('V2 transformer options', () => {
  const cf = new CloudFormationClient(AWS_REGION);
  const customS3Client = new S3Client(AWS_REGION);
  const cognitoClient = new CognitoClient({ apiVersion: '2016-04-19', region: AWS_REGION });
  const awsS3Client = new S3({ region: AWS_REGION });

  const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss');
  const STACK_NAME = `TransformerOptionsV2Tests-${BUILD_TIMESTAMP}`;
  const BUCKET_NAME = `appsync-transformer-options-test-bucket-${BUILD_TIMESTAMP}`;
  const LOCAL_FS_BUILD_DIR = '/tmp/transformer_options_v2_tests/';
  const S3_ROOT_DIR_KEY = 'deployments';

  let USER_POOL_ID: string;
  let GRAPHQL_ENDPOINT: string;
  let GRAPHQL_CLIENT: AWSAppSyncClient<any>;

  let validSchema: string;
  let authConfig: AppSyncAuthConfiguration;
  let userPoolClientId: string;
  let getApiEndpoint: any;
  let getApiKey: any;

  function outputValueSelector(key: string) {
    return (outputs: Output[]) => {
      const output = outputs.find((o: Output) => o.OutputKey === key);
      return output ? output.OutputValue : null;
    };
  }

  beforeAll(async () => {
    validSchema = `
      type Post @model @auth(rules: [{ allow: public }]) {
        id: ID!
        title: String!
        createdAt: AWSDateTime
        updatedAt: AWSDateTime
      }`;

    try {
      await awsS3Client.createBucket({ Bucket: BUCKET_NAME }).promise();
    } catch (e) {
      throw Error(`Could not create bucket: ${e}`);
    }
    authConfig = {
      defaultAuthentication: {
        authenticationType: 'API_KEY',
      },
      additionalAuthenticationProviders: [],
    };

    const userPoolResponse = await createUserPool(cognitoClient, `UserPool${STACK_NAME}`);
    USER_POOL_ID = userPoolResponse.UserPool.Id;
    const userPoolClientResponse = await createUserPoolClient(cognitoClient, USER_POOL_ID, `UserPool${STACK_NAME}`);
    userPoolClientId = userPoolClientResponse.UserPoolClient.ClientId;

    getApiEndpoint = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput);
    getApiKey = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput);
  });

  afterAll(async () => {
    await cleanupStackAfterTest(BUCKET_NAME, STACK_NAME, cf, { cognitoClient, userPoolId: USER_POOL_ID });
  });

  describe('userDefinedSlots', () => {
    describe('created slot from a user', () => {
      beforeAll(async () => {
        try {
          const userDefinedSlots = {
            'Query.listPosts': [
              {
                resolverTypeName: 'Query',
                resolverFieldName: 'listPosts',
                requestResolver: {
                  fileName: 'Query.listPosts.preAuth.1.req.vtl',
                  template: '$util.error("Custom error")\n$util.toJson({})\n',
                },
                slotName: 'preAuth',
              },
            ],
          };

          const transformer = new GraphQLTransform({
            authConfig,
            transformers: [new ModelTransformer(), new AuthTransformer()],
            userDefinedSlots,
            featureFlags: {
              getBoolean(value: string, defaultValue?: boolean) {
                if (value === 'useSubUsernameForDefaultIdentityClaim') {
                  return false;
                }
                return defaultValue;
              },
              getString: jest.fn(),
              getNumber: jest.fn(),
              getObject: jest.fn(),
            }
          });

          const out = transformer.transform(validSchema);
          const finishedStack = await deploy(
            customS3Client,
            cf,
            STACK_NAME,
            out,
            {},
            LOCAL_FS_BUILD_DIR,
            BUCKET_NAME,
            S3_ROOT_DIR_KEY,
            BUILD_TIMESTAMP,
          );

          GRAPHQL_ENDPOINT = getApiEndpoint(finishedStack.Outputs);
          const apiKey = getApiKey(finishedStack.Outputs);

          GRAPHQL_CLIENT = new AWSAppSyncClient({
            url: GRAPHQL_ENDPOINT,
            region: AWS_REGION,
            auth: {
              type: AUTH_TYPE.API_KEY,
              apiKey: apiKey,
            },
            disableOffline: true,
          });

          configureAmplify(USER_POOL_ID, userPoolClientId);
        } catch (e) {
          console.error(`Could not setup tests ${e}`);
          expect(true).toBe(false);
        }
      });

      test('created slot from user', async () => {
        const query = gql`
          query {
            listPosts {
              items {
                id
                title
              }
            }
          }
        `;

        try {
          await expect(
            GRAPHQL_CLIENT.query<any>({
              query,
              fetchPolicy: 'no-cache',
            }),
          ).rejects.toThrow('GraphQL error: Custom error');
        } catch (err) {
          expect(err).not.toBeDefined();
        }
      });
    });
  });
});
