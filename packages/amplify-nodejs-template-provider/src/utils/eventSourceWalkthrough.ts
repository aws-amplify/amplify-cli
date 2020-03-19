import inquirer from 'inquirer';
import { askAnalyticsCategoryKinesisQuestions } from './analyticsWalkthrough';
import { askAPICategoryDynamoDBQuestions, askDynamoDBQuestions } from './dynamoDBWalkthrough';

export async function askEventSourceQuestions(context: any) {
  const selectEventSourceQuestion = {
    type: 'list',
    name: 'eventSourceType',
    message: 'What event source do you want to associate with Lambda trigger?',
    choices: [
      {
        name: 'Amazon DynamoDB Stream',
        value: 'dynamoDB',
      },
      {
        name: 'Amazon Kinesis Stream',
        value: 'kinesis',
      },
    ],
  };

  const eventSourceTypeAnswer = await inquirer.prompt([selectEventSourceQuestion]);

  let arnQuestion;
  let arnAnswer;
  let eventSourceArn;
  let streamKindQuestion;
  let streamKindAnswer;
  let streamKind;
  let dynamoDBCategoryStorageRes;
  let dynamoDBCategoryStorageStreamArnRef;
  switch (eventSourceTypeAnswer.eventSourceType) {
    case 'kinesis':
      streamKindQuestion = {
        type: 'list',
        name: 'kinesisStreamKind',
        message: 'Choose a Kinesis event source option',
        choices: [
          {
            name: 'Use Analytics category kinesis stream in the current Amplify project',
            value: 'analyticsKinesisStream',
          },
          {
            name: 'Provide the ARN of Kinesis stream directly',
            value: 'kinesisStreamRawARN',
          },
        ],
      };
      streamKindAnswer = await inquirer.prompt([streamKindQuestion]);
      streamKind = streamKindAnswer.kinesisStreamKind;
      switch (streamKind) {
        case 'kinesisStreamRawARN':
          arnQuestion = {
            name: 'amazonKinesisStreamARN',
            message: 'Provide the ARN of Amazon Kinesis data stream or a stream consumer',
            validate: context.amplify.inputValidation({
              operator: 'regex',
              value: 'arn:(aws[a-zA-Z0-9-]*):([a-zA-Z0-9\\-])+:([a-z]{2}(-gov)?-[a-z]+-\\d{1})?:(\\d{12})?:(.*)',
              onErrorMsg: 'Invalid ARN format',
              required: true,
            }),
          };
          arnAnswer = await inquirer.prompt([arnQuestion]);
          eventSourceArn = arnAnswer.amazonKinesisStreamARN;
          return {
            triggerEventSourceMappings: [
              {
                batchSize: 100,
                startingPosition: 'LATEST',
                eventSourceArn,
                functionTemplateName: 'trigger-kinesis.js',
                triggerPolicies: [
                  {
                    Effect: 'Allow',
                    Action: [
                      'kinesis:DescribeStream',
                      'kinesis:DescribeStreamSummary',
                      'kinesis:GetRecords',
                      'kinesis:GetShardIterator',
                      'kinesis:ListShards',
                      'kinesis:ListStreams',
                      'kinesis:SubscribeToShard',
                    ],
                    Resource: eventSourceArn,
                  },
                ],
              },
            ],
          };
        case 'analyticsKinesisStream':
          return await askAnalyticsCategoryKinesisQuestions(context);
        default:
          return {};
      }
    case 'dynamoDB':
      streamKindQuestion = {
        type: 'list',
        name: 'dynamoDbStreamKind',
        message: 'Choose a DynamoDB event source option',
        choices: [
          {
            name: 'Use API category graphql @model backed DynamoDB table(s) in the current Amplify project',
            value: 'graphqlModelTable',
          },
          {
            name: 'Use storage category DynamoDB table configured in the current Amplify project',
            value: 'storageDynamoDBTable',
          },
          {
            name: 'Provide the ARN of DynamoDB stream directly',
            value: 'dynamoDbStreamRawARN',
          },
        ],
      };
      streamKindAnswer = await inquirer.prompt([streamKindQuestion]);
      streamKind = streamKindAnswer.dynamoDbStreamKind;
      switch (streamKind) {
        case 'dynamoDbStreamRawARN':
          arnQuestion = {
            name: 'dynamoDbARN',
            message: 'Provide the ARN of Amazon DynamoDB stream',
            validate: context.amplify.inputValidation({
              operator: 'regex',
              value: 'arn:(aws[a-zA-Z0-9-]*):([a-zA-Z0-9\\-])+:([a-z]{2}(-gov)?-[a-z]+-\\d{1})?:(\\d{12})?:(.*)',
              onErrorMsg: 'ARN format is invalid',
              required: true,
            }),
          };
          arnAnswer = await inquirer.prompt([arnQuestion]);
          eventSourceArn = arnAnswer.dynamoDbARN;
          return {
            triggerEventSourceMappings: [
              {
                batchSize: 100,
                startingPosition: 'LATEST',
                eventSourceArn,
                functionTemplateName: 'trigger-dynamodb.js',
                triggerPolicies: [
                  {
                    Effect: 'Allow',
                    Action: ['dynamodb:DescribeStream', 'dynamodb:GetRecords', 'dynamodb:GetShardIterator', 'dynamodb:ListStreams'],
                    Resource: eventSourceArn,
                  },
                ],
              },
            ],
          };
        case 'graphqlModelTable':
          return await askAPICategoryDynamoDBQuestions(context);
        case 'storageDynamoDBTable':
          const storageResources = context.amplify.getProjectDetails().amplifyMeta.storage;
          if (!storageResources) {
            context.print.error('There are no DynamoDB resources configured in your project currently');
            process.exit(0);
          }

          dynamoDBCategoryStorageRes = await askDynamoDBQuestions(context, true);
          dynamoDBCategoryStorageStreamArnRef = {
            Ref: `storage${dynamoDBCategoryStorageRes.resourceName}StreamArn`,
          };

          return {
            triggerEventSourceMappings: [
              {
                batchSize: 100,
                startingPosition: 'LATEST',
                eventSourceArn: dynamoDBCategoryStorageStreamArnRef,
                functionTemplateName: 'trigger-dynamodb.js',
                triggerPolicies: [
                  {
                    Effect: 'Allow',
                    Action: ['dynamodb:DescribeStream', 'dynamodb:GetRecords', 'dynamodb:GetShardIterator', 'dynamodb:ListStreams'],
                    Resource: dynamoDBCategoryStorageStreamArnRef,
                  },
                ],
              },
            ],
            dependsOn: [
              {
                category: 'storage',
                resourceName: dynamoDBCategoryStorageRes.resourceName,
                attributes: ['StreamArn'],
              },
            ],
          };
        default:
          return {};
      }
    default:
      context.print.error('Unrecognized option selected. (this is likely an amplify error, please report)');
      return {};
  }
}
