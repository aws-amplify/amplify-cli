import { JSONUtilities } from 'amplify-cli-core';

jest.mock('amplify-cli-core');

const JSONUtilities_mock = JSONUtilities as jest.Mocked<typeof JSONUtilities>;

import { convertDeperecatedRestApiPaths } from '../../../provider-utils/awscloudformation/convert-deprecated-apigw-paths';

describe('test apigw path migrate', () => {
  it('migrates valid input successfully', async () => {
    JSONUtilities_mock.readJson.mockReturnValueOnce({
      paths: [
        {
          name: '/mockOpenPath',
          lambdaFunction: 'mockOpenLambda',
          privacy: {
            open: true,
          },
        },
        {
          name: '/mockPrivatePath',
          lambdaFunction: 'mockPrivateLambda',
          privacy: {
            auth: ['/GET', '/POST'],
            private: true,
          },
        },
        {
          name: '/mockLegacyPath',
          lambdaFunction: 'mockLegacyLambda',
          privacy: {
            auth: 'rw',
            private: true,
          },
        },
      ],
    });

    const convertedPaths = convertDeperecatedRestApiPaths('mockFileName.json', 'mock/file/path/mockFileName.json', 'mockApi');
    expect(convertedPaths).toMatchObject({
      '/mockOpenPath': {
        permissions: {
          setting: 'open',
        },
        lambdaFunction: 'mockOpenLambda',
      },
      '/mockPrivatePath': {
        permissions: {
          setting: 'private',
          auth: ['read', 'create'],
        },
        lambdaFunction: 'mockPrivateLambda',
      },
      '/mockLegacyPath': {
        permissions: {
          setting: 'private',
          auth: ['create', 'read', 'update', 'delete'],
        },
        lambdaFunction: 'mockLegacyLambda',
      },
    });
  });

  it('throws on invalid input', async () => {
    JSONUtilities_mock.readJson.mockReturnValueOnce({});
    expect(() => convertDeperecatedRestApiPaths('mockFileName.json', 'mock/file/path/mockFileName.json', 'mockApi')).toThrow();

    JSONUtilities_mock.readJson.mockReturnValueOnce({
      paths: [],
    });
    expect(() => convertDeperecatedRestApiPaths('mockFileName.json', 'mock/file/path/mockFileName.json', 'mockApi')).toThrow();
  });
});
