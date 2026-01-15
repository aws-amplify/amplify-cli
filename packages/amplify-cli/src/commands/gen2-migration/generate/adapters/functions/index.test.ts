import { getFunctionDefinition } from './index';
import { FunctionConfiguration } from '@aws-sdk/client-lambda';

describe('getFunctionDefinition', () => {
  it('should analyze CloudFormation for API permissions and clean environment variables', () => {
    const functionConfigurations: FunctionConfiguration[] = [
      {
        FunctionName: 'myFunction-dev-12345',
        Handler: 'index.handler',
        Timeout: 30,
        MemorySize: 128,
        Environment: {
          Variables: {
            API_MYAPI_GRAPHQLAPIENDPOINTOUTPUT: 'https://example.appsync-api.us-east-1.amazonaws.com/graphql',
            API_MYAPI_GRAPHQLAPIKEYOUTPUT: 'da2-fakeApiKey123456',
            API_MYAPI_GRAPHQLAPIIDOUTPUT: 'abcdefghijklmnopqrstuvwxyz',
            OTHER_ENV_VAR: 'some-value',
          },
        },
      },
    ];

    const functionSchedules = [];
    const functionCategoryMap = new Map();
    const meta = {
      function: {
        myFunction: {
          service: 'Lambda',
          providerPlugin: 'awscloudformation' as const,
          output: {
            Name: 'myFunction-dev-12345',
          },
        },
      },
    };

    const result = getFunctionDefinition(functionConfigurations, functionSchedules, functionCategoryMap, meta);

    expect(result).toHaveLength(1);
    expect(result[0].apiPermissions).toBeDefined();
    // Check that API environment variables were removed
    expect(result[0].environment?.Variables?.API_MYAPI_GRAPHQLAPIENDPOINTOUTPUT).toBeUndefined();
    expect(result[0].environment?.Variables?.API_MYAPI_GRAPHQLAPIKEYOUTPUT).toBeUndefined();
    expect(result[0].environment?.Variables?.API_MYAPI_GRAPHQLAPIIDOUTPUT).toBeUndefined();
    expect(result[0].environment?.Variables?.OTHER_ENV_VAR).toBe('some-value');
  });
});
