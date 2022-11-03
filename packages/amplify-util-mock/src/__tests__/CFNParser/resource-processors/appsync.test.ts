import { $TSAny } from 'amplify-cli-core';
import { appSyncFunctionHandler, dynamoDBResourceHandler } from '../../../CFNParser/resource-processors/appsync';
import { CloudFormationResource } from '../../../CFNParser/stack/types';
import { CloudFormationParseContext } from '../../../CFNParser/types';

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
              "AttributeName": "id",
              "KeyType": "HASH"
          }
        ],
        AttributeDefinitions: [
          {
              "AttributeName": "id",
              "AttributeType": "S"
          }
        ]
      },
    };
    const cfnContext: CloudFormationParseContext = {
      params: {},
      conditions: {},
      resources: {},
      exports: {},
    };
    const processedResource = dynamoDBResourceHandler(resource.Properties.TableName, resource, cfnContext);
    expect(processedResource.Properties.AttributeDefinitions).toEqual(resource.Properties.AttributeDefinitions);
    expect(processedResource.Properties.KeySchema).toEqual(resource.Properties.KeySchema);
    expect(processedResource.Properties.TableName).toEqual(resource.Properties.TableName);
    // sets defaults for stream specification
    expect(processedResource.Properties.StreamSpecification).toEqual({
      StreamEnabled: true,
      StreamViewType: 'NEW_AND_OLD_IMAGES'
    });
  });
});
