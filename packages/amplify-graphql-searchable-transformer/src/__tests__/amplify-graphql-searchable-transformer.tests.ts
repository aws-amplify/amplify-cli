import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { SearchableModelTransformer } from '../';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { anything, countResources, expect as cdkExpect, haveResource } from '@aws-cdk/assert';
import { parse } from 'graphql';

test('Test SearchableModelTransformer validation happy case', () => {
  const validSchema = `
    type Post @model @searchable {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new SearchableModelTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  parse(out.schema);
  expect(out.schema).toMatchSnapshot();
});

test('Test SearchableModelTransformer vtl', () => {
  const validSchema = `
    type Post @model @searchable {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new SearchableModelTransformer()],
  });

  const out = transformer.transform(validSchema);
  expect(parse(out.schema)).toBeDefined();
  expect(out.pipelineFunctions).toMatchSnapshot();
});

test('Test SearchableModelTransformer with query overrides', () => {
  const validSchema = `type Post @model @searchable(queries: { search: "customSearchPost" }) {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new SearchableModelTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(parse(out.schema)).toBeDefined();
  expect(out.schema).toMatchSnapshot();
});

test('Test SearchableModelTransformer with only create mutations', () => {
  const validSchema = `type Post @model(mutations: { create: "customCreatePost" }) @searchable {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new SearchableModelTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.schema).toBeDefined();
  expect(out.schema).toMatchSnapshot();
});

test('Test SearchableModelTransformer with multiple model searchable directives', () => {
  const validSchema = `
    type Post @model @searchable {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }

    type User @model @searchable {
        id: ID!
        name: String!
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new SearchableModelTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.schema).toBeDefined();
  expect(out.schema).toMatchSnapshot();
});

test('Test SearchableModelTransformer with sort fields', () => {
  const validSchema = `
    type Post @model @searchable {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new SearchableModelTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.schema).toBeDefined();
  expect(out.schema).toMatchSnapshot();
});

test('it generates expected resources', () => {
  const validSchema = `
    type Post @model @searchable {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    type Todo @model @searchable {
        id: ID!
        name: String!
        description: String
        createdAt: String
        updatedAt: String
    }
    type Comment @model {
      id: ID!
      content: String!
    }
 `;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new SearchableModelTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  const searchableStack = out.stacks.SearchableStack;
  cdkExpect(searchableStack).to(
    haveResource('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
        Version: '2012-10-17',
      },
    }),
  );
  cdkExpect(searchableStack).to(
    haveResource('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'appsync.amazonaws.com',
            },
          },
        ],
        Version: '2012-10-17',
      },
    }),
  );

  cdkExpect(searchableStack).to(
    haveResource('AWS::AppSync::DataSource', {
      ApiId: {
        Ref: anything(),
      },
      Name: 'ElasticSearchDataSource',
      Type: 'AMAZON_ELASTICSEARCH',
      ElasticsearchConfig: {
        AwsRegion: {
          'Fn::Select': [
            3,
            {
              'Fn::Split': [
                ':',
                {
                  'Fn::GetAtt': ['ElasticSearchDomain', 'Arn'],
                },
              ],
            },
          ],
        },
        Endpoint: {
          'Fn::Join': [
            '',
            [
              'https://',
              {
                'Fn::GetAtt': ['ElasticSearchDomain', 'DomainEndpoint'],
              },
            ],
          ],
        },
      },
      ServiceRoleArn: {
        'Fn::GetAtt': ['ElasticSearchAccessIAMRoleAAA3FF0B', 'Arn'],
      },
    }),
  );
  cdkExpect(searchableStack).to(countResources('AWS::AppSync::Resolver', 2));
  cdkExpect(searchableStack).to(
    haveResource('AWS::AppSync::Resolver', {
      ApiId: {
        Ref: anything(),
      },
      FieldName: anything(),
      TypeName: 'Query',
      Kind: 'PIPELINE',
      PipelineConfig: {
        Functions: [
          {
            'Fn::GetAtt': [anything(), 'FunctionId'],
          },
        ],
      },
      RequestMappingTemplate: {
        'Fn::Join': [
          '',
          [
            anything(),
            {
              Ref: anything(),
            },
            '"))\n$util.qr($ctx.stash.put("endpoint", "https://',
            {
              'Fn::GetAtt': ['ElasticSearchDomain', 'DomainEndpoint'],
            },
            '"))\n$util.toJson({})',
          ],
        ],
      },
      ResponseMappingTemplate: '$util.toJson($ctx.prev.result)',
    }),
  );
  cdkExpect(searchableStack).to(
    haveResource('AWS::AppSync::FunctionConfiguration', {
      ApiId: {
        Ref: anything(),
      },
      DataSourceName: {
        'Fn::GetAtt': [anything(), 'Name'],
      },
      FunctionVersion: '2018-05-29',
      Name: anything(),
      RequestMappingTemplateS3Location: {
        'Fn::Join': [
          '',
          [
            's3://',
            {
              Ref: anything(),
            },
            '/',
            {
              Ref: anything(),
            },
            anything(),
          ],
        ],
      },
      ResponseMappingTemplateS3Location: {
        'Fn::Join': [
          '',
          [
            's3://',
            {
              Ref: anything(),
            },
            '/',
            {
              Ref: anything(),
            },
            anything(),
          ],
        ],
      },
    }),
  );
});
