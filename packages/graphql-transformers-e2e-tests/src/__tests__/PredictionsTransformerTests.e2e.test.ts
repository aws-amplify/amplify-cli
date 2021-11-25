import { ResourceConstants } from 'graphql-transformer-common';
import { GraphQLTransform } from 'graphql-transformer-core';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { ModelAuthTransformer } from 'graphql-auth-transformer';
import { PredictionsTransformer } from 'graphql-predictions-transformer';
import { CloudFormationClient } from '../CloudFormationClient';
import { Output } from 'aws-sdk/clients/cloudformation';
import { GraphQLClient } from '../GraphQLClient';
import { default as moment } from 'moment';
import { cleanupStackAfterTest, deploy } from '../deployNestedStacks';
import { S3Client } from '../S3Client';
import { default as S3 } from 'aws-sdk/clients/s3';

// tslint:disable: no-magic-numbers
jest.setTimeout(2000000);

const AWS_REGION = 'us-east-2';
const cf = new CloudFormationClient(AWS_REGION);
const customS3Client = new S3Client(AWS_REGION);
const awsS3Client = new S3({ region: AWS_REGION });
const featureFlags = {
  getBoolean: jest.fn().mockImplementation((name, defaultValue) => {
    if (name === 'improvePluralization') {
      return true;
    }
    return;
  }),
  getNumber: jest.fn(),
  getObject: jest.fn(),
  getString: jest.fn(),
};
const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss');
const STACK_NAME = `PredictionsTransformerTests-${BUILD_TIMESTAMP}`;
const BUCKET_NAME = `appsync-predictions-transformer-test-bucket-${BUILD_TIMESTAMP}`;
const LOCAL_FS_BUILD_DIR = '/tmp/predictions_transformer_tests/';
const S3_ROOT_DIR_KEY = 'deployments';

let GRAPHQL_CLIENT: GraphQLClient = undefined;

function outputValueSelector(key: string) {
  return (outputs: Output[]) => {
    const output = outputs.find((o: Output) => o.OutputKey === key);
    return output ? output.OutputValue : null;
  };
}

beforeAll(async () => {
  const validSchema = `
    type Query {
      translateImageText: String @predictions(actions: [ identifyText translateText ])
      translateThis: String @predictions(actions: [ translateText ])
      speakTranslatedText: String @predictions(actions: [ translateText convertTextToSpeech])
    }
    `;
  try {
    await awsS3Client.createBucket({ Bucket: BUCKET_NAME }).promise();
  } catch (e) {
    console.warn(`Could not create bucket: ${e}`);
  }
  const transformer = new GraphQLTransform({
    featureFlags,
    transformers: [
      new DynamoDBModelTransformer(),
      new PredictionsTransformer({ bucketName: BUCKET_NAME }),
      new ModelAuthTransformer({
        authConfig: {
          defaultAuthentication: {
            authenticationType: 'API_KEY',
          },
          additionalAuthenticationProviders: [],
        },
      }),
    ],
  });
  const out = transformer.transform(validSchema);
  const finishedStack = await deploy(
    customS3Client,
    cf,
    STACK_NAME,
    out,
    { CreateAPIKey: '1' },
    LOCAL_FS_BUILD_DIR,
    BUCKET_NAME,
    S3_ROOT_DIR_KEY,
    BUILD_TIMESTAMP,
  );
  // Arbitrary wait to make sure everything is ready.
  await cf.wait(5, () => Promise.resolve());
  expect(finishedStack).toBeDefined();
  const getApiEndpoint = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput);
  const getApiKey = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput);
  const endpoint = getApiEndpoint(finishedStack.Outputs);
  const apiKey = getApiKey(finishedStack.Outputs);
  expect(apiKey).toBeDefined();
  expect(endpoint).toBeDefined();
  GRAPHQL_CLIENT = new GraphQLClient(endpoint, { 'x-api-key': apiKey });
});

afterAll(async () => {
  await cleanupStackAfterTest(BUCKET_NAME, STACK_NAME, cf);
});

test('test translate and convert text to speech', async () => {
  // logic to test graphql
  const response = await GRAPHQL_CLIENT.query(
    `query SpeakTranslatedText($input: SpeakTranslatedTextInput!) {
      speakTranslatedText(input: $input)
    }`,
    {
      input: {
        translateText: {
          sourceLanguage: 'en',
          targetLanguage: 'es',
          text: 'this is a voice test',
        },
        convertTextToSpeech: {
          voiceID: 'Conchita',
        },
      },
    },
  );
  expect(response).toBeDefined();
  const pollyURL = response.data.speakTranslatedText;
  // check that return format is a url
  expect(pollyURL).toMatch(/(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/);
});

test('test translate text individually', async () => {
  const germanTranslation = /((\bDies\b)|(\bdas\b)|(\bder\b)) ist ein ((\bStimmtest\b)|(\Sprachtest\b))/i;
  const response = await GRAPHQL_CLIENT.query(
    `query TranslateThis($input: TranslateThisInput!) {
      translateThis(input: $input)
    }`,
    {
      input: {
        translateText: {
          sourceLanguage: 'en',
          targetLanguage: 'de',
          text: 'this is a voice test',
        },
      },
    },
  );
  expect(response).toBeDefined();
  const translatedText = response.data.translateThis;
  expect(translatedText).toMatch(germanTranslation);
});
