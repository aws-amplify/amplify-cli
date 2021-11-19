import { getAuthConfig } from '../../../../provider-utils/awscloudformation/utils/get-appsync-auth-config';

const getCLIInputPayload_mock = jest
  .fn()
  .mockReturnValueOnce({
    version: 1,
    serviceConfiguration: {
      apiName: 'authv2migration1',
      serviceName: 'AppSync',
      gqlSchemaPath: 'mock/schema.graphql',
      defaultAuthType: {
        mode: 'AWS_IAM',
      },
      conflictResolution: {},
      additionalAuthTypes: [],
    },
  })
  .mockReturnValueOnce({
    version: 1,
    serviceConfiguration: {
      apiName: 'authv2migration1',
      serviceName: 'AppSync',
      gqlSchemaPath: 'mock/schema.graphql',
      defaultAuthType: {
        mode: 'AWS_IAM',
      },
      conflictResolution: {},
      additionalAuthTypes: [
        {
          mode: 'API_KEY',
          expirationTime: 7,
          keyDescription: '',
        },
      ],
    },
  });

jest.mock('../../../../provider-utils/awscloudformation/api-input-manager/appsync-api-input-state.ts', () => {
  return {
    AppsyncApiInputState: jest.fn().mockImplementation(() => {
      return {
        getCLIInputPayload: getCLIInputPayload_mock,
        cliInputFileExists: jest.fn().mockReturnValue(true),
      };
    }),
  };
});

test('test function with default auth config', async () => {
  expect(await getAuthConfig('mockapiResource')).toMatchSnapshot();
});

test('test function with default and additional auth config', async () => {
  expect(await getAuthConfig('mockapiResource')).toMatchSnapshot();
});
