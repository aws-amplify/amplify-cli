import { defineData } from '@aws-amplify/backend';
import type { Backend } from '../backend';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readdirSync } from 'fs';
import * as assets from 'aws-cdk-lib/aws-s3-assets';
import { aws_appsync } from 'aws-cdk-lib';
import { CfnResolver } from 'aws-cdk-lib/aws-appsync';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';
const schema = `type MoodItem @model @auth(rules: [{ allow: public }]) {
  id: ID!
  title: String!
  description: String
  image: String!
  boardID: ID! @index(name: "byBoard")
  board: Board @belongsTo(fields: ["boardID"])
}

type Board @model @auth(rules: [{ allow: public }]) {
  id: ID!
  name: String!
  moodItems: [MoodItem] @hasMany(indexName: "byBoard", fields: ["id"])
}

type KinesisEventCount @model @auth(rules: [{ allow: public }]) {
  id: ID!
  processedAt: AWSDateTime!
}

type Query {
  getRandomEmoji: String @function(name: "moodboardGetRandomEmoji-${branchName}") @auth(rules: [{ allow: private }])
  getKinesisEvents: AWSJSON @function(name: "moodboardKinesisReader-${branchName}") @auth(rules: [{ allow: private }])
}
`;

export const data = defineData({
  migratedAmplifyGen1DynamoDbTableMappings: [
    {
      //The "branchName" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
      branchName: 'x',
      modelNameToTableNameMapping: {
        MoodItem: 'MoodItem-tw6yns43nvct3fzlwlouod43x4-x',
        Board: 'Board-tw6yns43nvct3fzlwlouod43x4-x',
        KinesisEventCount: 'KinesisEventCount-tw6yns43nvct3fzlwlouod43x4-x',
      },
    },
  ],
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
      description: 'moodBoard API Key',
    },
  },
  schema,
});

export function applyEscapeHatches(backend: Backend) {
  const cfnGraphqlApi = backend.data.resources.cfnResources.cfnGraphqlApi;
  cfnGraphqlApi.additionalAuthenticationProviders = [
    {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      userPoolConfig: {
        userPoolId: backend.auth.resources.userPool.userPoolId,
        awsRegion: backend.auth.stack.region,
      },
    },
  ];
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const resolversDir = join(__dirname, 'resolvers');
  const overiddenResolverFiles = readdirSync(resolversDir).filter(
    (f) =>
      (f.endsWith('.req.vtl') || f.endsWith('.res.vtl')) &&
      f.split('.').length === 4
  );
  for (const file of overiddenResolverFiles) {
    const [typeName, fieldName, templateType] = file.split('.');
    const capitalizedFieldName =
      fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    const functionId = `${typeName}${capitalizedFieldName}DataResolverFn`;
    const fn =
      backend.data.resources.cfnResources.cfnFunctionConfigurations[functionId];
    const vtlTemplate = new assets.Asset(backend.data, `VTLTemplate-${file}`, {
      path: join(resolversDir, file),
    });
    if (templateType === 'req') {
      fn.requestMappingTemplateS3Location = vtlTemplate.s3ObjectUrl;
    } else {
      fn.responseMappingTemplateS3Location = vtlTemplate.s3ObjectUrl;
    }
  }
  // extending resolvers
  const noneDataSource =
    backend.data.resources.graphqlApi.addNoneDataSource('none');
  const MutationcreateBoardinit2 = new aws_appsync.AppsyncFunction(
    backend.data.stack,
    'MutationcreateBoardinit2',
    {
      name: 'MutationcreateBoardinit2',
      api: backend.data.resources.graphqlApi,
      dataSource: noneDataSource,
      requestMappingTemplate: aws_appsync.MappingTemplate.fromFile(
        join(resolversDir, 'Mutation.createBoard.init.2.req.vtl')
      ),
      responseMappingTemplate: aws_appsync.MappingTemplate.fromString(
        '$util.toJson($ctx.prev.result)'
      ),
    }
  );
  const MutationcreateBoardfinish1 = new aws_appsync.AppsyncFunction(
    backend.data.stack,
    'MutationcreateBoardfinish1',
    {
      name: 'MutationcreateBoardfinish1',
      api: backend.data.resources.graphqlApi,
      dataSource: noneDataSource,
      requestMappingTemplate:
        aws_appsync.MappingTemplate.fromString('$util.toJson({})'),
      responseMappingTemplate: aws_appsync.MappingTemplate.fromFile(
        join(resolversDir, 'Mutation.createBoard.finish.1.res.vtl')
      ),
    }
  );
  const mutationCreateBoardResolver = backend.data.resources.cfnResources
    .cfnResolvers['Mutation.createBoard'] as CfnResolver;
  const mutationCreateBoardPipelineFunctions =
    (
      mutationCreateBoardResolver.pipelineConfig as CfnResolver.PipelineConfigProperty
    ).functions || [];
  mutationCreateBoardPipelineFunctions.splice(
    1,
    0,
    MutationcreateBoardinit2.functionId
  );
  mutationCreateBoardPipelineFunctions.splice(
    5,
    0,
    MutationcreateBoardfinish1.functionId
  );
  mutationCreateBoardResolver.pipelineConfig = {
    functions: mutationCreateBoardPipelineFunctions,
  };
}
