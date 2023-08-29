import { $TSAny } from '@aws-amplify/amplify-cli-core';
import { appSyncFunctionHandler, dynamoDBResourceHandler } from '../../../CFNParser/resource-processors/appsync';
import { CloudFormationResource } from '../../../CFNParser/stack/types';
import { CloudFormationParseContext } from '../../../CFNParser/types';
import { configureSearchEnabledTables } from '../../../CFNParser/appsync-resource-processor';

describe('appSyncFunctionHandler', () => {
  it('maps exposed attributes to properties that exist', () => {
    const resource: CloudFormationResource = {
      Type: 'AWS::AppSync::FunctionConfiguration',
      Properties: {
        Name: 'dummyFunction',
        DataSourceName: 'dummyDataSource',
      },
    };
    const cfnContext: CloudFormationParseContext = {
      params: {},
      conditions: {},
      resources: {},
      exports: {},
    };
    const processedResource = appSyncFunctionHandler('', resource, cfnContext);
    const exposedAttribute = processedResource.cfnExposedAttributes.FunctionArn;
    expect(processedResource[exposedAttribute]).toBeDefined();
  });
});

describe('dynamoDBResourceHandler', () => {
  it('defaults the streamViewType param if not present', () => {
    // resource with only required props
    const resource: $TSAny = {
      Type: 'AWS::DynamoDB::Table',
      Properties: {
        TableName: 'dummyFunction',
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S',
          },
        ],
      },
    };
    const processedResource = dynamoDBResourceHandler(resource.Properties.TableName, resource);
    expect(processedResource.Properties.AttributeDefinitions).toEqual(resource.Properties.AttributeDefinitions);
    expect(processedResource.Properties.KeySchema).toEqual(resource.Properties.KeySchema);
    expect(processedResource.Properties.TableName).toEqual(resource.Properties.TableName);
    // sets defaults for stream specification
    expect(processedResource.Properties.StreamSpecification).toEqual({
      StreamEnabled: true,
      StreamViewType: 'NEW_AND_OLD_IMAGES',
    });
  });
});

describe('process searchable resources', () => {
  const mockTableName = 'Todo';
  const mockTableResource: $TSAny = {
    Type: 'AWS::DynamoDB::Table',
    Properties: {
      TableName: mockTableName + 'Table',
      KeySchema: [
        {
          AttributeName: 'id',
          KeyType: 'HASH',
        },
      ],
      AttributeDefinitions: [
        {
          AttributeName: 'id',
          AttributeType: 'S',
        },
      ],
    },
  };

  it('sets searchable flag on tables for searchable models', () => {
    const searchableLambdaMapping = {};
    searchableLambdaMapping[`Searchable${mockTableName}LambdaMappingPlusRandomString123`] = {};

    const mockSearchableStack: $TSAny = {
      Resources: { ...searchableLambdaMapping },
    };

    const mockTransformResult = { stacks: { SearchableStack: mockSearchableStack } };
    const mockProcessedResources = { tables: [mockTableResource] } as $TSAny;

    configureSearchEnabledTables(mockTransformResult, mockProcessedResources);
    expect(mockProcessedResources?.tables[0]?.isSearchable).toEqual(true);
  });

  it('does not set searchable flag on tables for non-searchable models', () => {
    const searchableLambdaMapping = {};
    searchableLambdaMapping[`Searchable${mockTableName}PlusRandomString123`] = {};

    const mockSearchableStack: $TSAny = {
      Resources: { ...searchableLambdaMapping },
    };

    const mockTransformResult = { stacks: { SearchableStack: mockSearchableStack } };
    const mockProcessedResources = { tables: [mockTableResource] } as $TSAny;

    configureSearchEnabledTables(mockTransformResult, mockProcessedResources);
    expect(mockProcessedResources?.tables[0]?.isSearchable).toEqual(false);
  });
});
