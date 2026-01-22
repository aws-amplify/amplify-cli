import { getFunctionDefinition } from '../../../../../../commands/gen2-migration/generate/adapters/functions/index';
import { FunctionConfiguration } from '@aws-sdk/client-lambda';
import * as amplifyCliCore from '@aws-amplify/amplify-cli-core';

// Mock the readCFNTemplate function
jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...jest.requireActual('@aws-amplify/amplify-cli-core'),
  readCFNTemplate: jest.fn(),
}));

const mockReadCFNTemplate = amplifyCliCore.readCFNTemplate as jest.MockedFunction<typeof amplifyCliCore.readCFNTemplate>;

describe('getFunctionDefinition', () => {
  beforeEach(() => {
    mockReadCFNTemplate.mockReturnValue({
      templateFormat: 'json' as any,
      cfnTemplate: { Resources: {} },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  test('auth env variables are removed', () => {
    const definition = getFunctionDefinition(
      [
        {
          Handler: undefined,
          FunctionName: 'MyFunc',
          Environment: {
            Variables: {
              SOME_ENV: 'some-value',
              AUTH_MEDIAVAULT_USERPOOLID: 'authUserPoolId',
            },
          },
        },
      ],
      [],
      new Map(),
      {
        function: {
          MyFunc: {
            service: 'Lambda',
            providerPlugin: 'awscloudformation',
            output: {
              Name: 'MyFunc',
            },
          },
        },
      },
    );

    expect(definition).toMatchSnapshot();
  });

  test('storage dynamo env variables are removed', () => {
    const definition = getFunctionDefinition(
      [
        {
          Handler: undefined,
          FunctionName: 'MyFunc',
          Environment: {
            Variables: {
              SOME_ENV: 'some-value',
              STORAGE_ACTIVITY_ARN: 'storageArn',
              STORAGE_ACTIVITY_NAME: 'storageName',
              STORAGE_ACTIVITY_STREAMARN: 'storageStreamName',
            },
          },
        },
      ],
      [],
      new Map(),
      {
        function: {
          MyFunc: {
            service: 'Lambda',
            providerPlugin: 'awscloudformation',
            output: {
              Name: 'MyFunc',
            },
          },
        },
      },
    );

    expect(definition).toMatchSnapshot();
  });

  test('storage s3 env variables are removed', () => {
    const definition = getFunctionDefinition(
      [
        {
          Handler: undefined,
          FunctionName: 'MyFunc',
          Environment: {
            Variables: {
              SOME_ENV: 'some-value',
              STORAGE_MEDIAVAULT_BUCKETNAME: 'storageBucketName',
            },
          },
        },
      ],
      [],
      new Map(),
      {
        function: {
          MyFunc: {
            service: 'Lambda',
            providerPlugin: 'awscloudformation',
            output: {
              Name: 'MyFunc',
            },
          },
        },
      },
    );

    expect(definition).toMatchSnapshot();
  });

  test('graphql env variables are removed', () => {
    const definition = getFunctionDefinition(
      [
        {
          Handler: undefined,
          FunctionName: 'MyFunc',
          Environment: {
            Variables: {
              SOME_ENV: 'some-value',
              API_PRODUCTCATALOG_GRAPHQLAPIKEYOUTPUT: 'apiKey',
              API_PRODUCTCATALOG_GRAPHQLAPIENDPOINTOUTPUT: 'apidEndpoint',
              API_PRODUCTCATALOG_GRAPHQLAPIIDOUTPUT: 'apiId',
            },
          },
        },
      ],
      [],
      new Map(),
      {
        function: {
          MyFunc: {
            service: 'Lambda',
            providerPlugin: 'awscloudformation',
            output: {
              Name: 'MyFunc',
            },
          },
        },
      },
    );

    expect(definition).toMatchSnapshot();
  });

  test('entry defaults to ./index.js', () => {
    const definition = getFunctionDefinition(
      [
        {
          Handler: undefined,
          FunctionName: 'MyFunc',
        },
      ],
      [],
      new Map(),
      {
        function: {
          MyFunc: {
            service: 'Lambda',
            providerPlugin: 'awscloudformation',
            output: {
              Name: 'MyFunc',
            },
          },
        },
      },
    );

    expect(definition).toMatchSnapshot();
  });

  test('entry is derived from Handler', () => {
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

    expect(result).toMatchSnapshot();
  });
});
