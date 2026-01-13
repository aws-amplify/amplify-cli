import { getFunctionDefinition } from '../../../../../../commands/gen2-migration/generate/adapters/functions/index';

describe('getFunctionDefinition', () => {
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

    expect(definition.length).toEqual(1);
    expect(definition[0].environment?.Variables).toEqual({ SOME_ENV: 'some-value' });
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

    expect(definition.length).toEqual(1);
    expect(definition[0].environment?.Variables).toEqual({ SOME_ENV: 'some-value' });
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

    expect(definition.length).toEqual(1);
    expect(definition[0].environment?.Variables).toEqual({ SOME_ENV: 'some-value' });
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

    expect(definition.length).toEqual(1);
    expect(definition[0].environment?.Variables).toEqual({ SOME_ENV: 'some-value' });
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

    expect(definition.length).toEqual(1);
    expect(definition[0].entry).toEqual('./index.js');
  });

  test('entry is derived from Handler', () => {
    const definition = getFunctionDefinition(
      [
        {
          Handler: 'index.handler',
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

    expect(definition.length).toEqual(1);
    expect(definition[0].entry).toEqual('./index.js');
  });
});
