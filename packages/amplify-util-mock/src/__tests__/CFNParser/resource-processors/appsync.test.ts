import { appSyncFunctionHandler } from '../../../CFNParser/resource-processors/appsync';
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
