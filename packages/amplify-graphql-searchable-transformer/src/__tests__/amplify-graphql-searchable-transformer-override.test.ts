import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { anything, expect as cdkExpect, haveResource } from '@aws-cdk/assert';
import * as path from 'path';
import { SearchableModelTransformer } from '..';

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

test('it overrides expected resources', () => {
  const validSchema = `
    type Post @model @searchable {
        id: ID!
        title: String!
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
    featureFlags,
    overrideConfig: {
      overrideDir: path.join(__dirname, 'overrides'),
      overrideFlag: true,
      resourceName: 'myResource',
    },
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  const searchableStack = out.stacks.SearchableStack;
  cdkExpect(searchableStack).to(
    haveResource('AWS::AppSync::DataSource', {
      ApiId: {
        Ref: anything(),
      },
      Name: 'OpenSearchDataSource',
      Type: 'AMAZON_ELASTICSEARCH',
      ElasticsearchConfig: {
        AwsRegion: {
          'Fn::Select': [
            3,
            {
              'Fn::Split': [
                ':',
                {
                  'Fn::GetAtt': ['OpenSearchDomain', 'Arn'],
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
                'Fn::GetAtt': ['OpenSearchDomain', 'DomainEndpoint'],
              },
            ],
          ],
        },
      },
      ServiceRoleArn: 'mockArn',
    }),
  );
  cdkExpect(searchableStack).to(
    haveResource('AWS::Elasticsearch::Domain', {
      DomainName: anything(),
      EBSOptions: anything(),
      ElasticsearchClusterConfig: anything(),
      ElasticsearchVersion: '7.10',
      EncryptionAtRestOptions: {
        Enabled: true,
        KmsKeyId: '1a2a3a4-1a2a-3a4a-5a6a-1a2a3a4a5a6a',
      },
    }),
  );
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
          {
            'Fn::GetAtt': [anything(), 'FunctionId'],
          },
        ],
      },
      RequestMappingTemplate: 'mockTemplate',
      ResponseMappingTemplate: '$util.toJson($ctx.prev.result)',
    }),
  );
});
