import { loadMinimalLambdaConfig } from '../../../utils/lambda/loadMinimal';
import { processResources, LambdaFunctionConfig } from '../../../CFNParser/lambda-resource-processor';
import * as path from 'path';

jest.mock('../../../CFNParser/lambda-resource-processor');
jest.mock('path');

const processResources_mock = processResources as jest.MockedFunction<typeof processResources>;

const path_mock = {
  path: {
    join: jest.fn(),
  },
};

const config: LambdaFunctionConfig = {
  name: 'demo',
  handler: 'handler',
  basePath: 'path',
  environment: { env: 'dev' },
};

processResources_mock.mockImplementation(() => config);

describe('load minimal lambda Config', () => {
  it('successfully return lambda config', () => {
    const resourceName = 'mockfunction';
    const params = { env: 'dev' };
    const contextStub = {
      amplify: {
        readJsonFile: () => ({
          Resources: 'demo',
        }),
        pathManager: {
          getBackendDirPath: () => {
            'demoPath';
          },
        },
        getProjectMeta: () => ({
          function: {
            mockfunction: {
              build: true,
              providerPlugin: 'awscloudformation',
              service: 'Lambda',
              dependsOn: [
                {
                  category: 'auth',
                  resourceName: 'issue4992901fd08f',
                  attributes: ['UserPoolId'],
                },
                {
                  category: 'storage',
                  resourceName: 's33c7946f3',
                  attributes: ['BucketName'],
                },
                {
                  category: 'function',
                  resourceName: 'demofunction1',
                  attributes: ['Name'],
                },
                {
                  category: 'function',
                  resourceName: 'demofunction2',
                  attributes: ['Name'],
                },
              ],
            },
            demofunction1: {
              build: true,
              providerPlugin: 'awscloudformation',
              service: 'Lambda',
              dependsOn: [],
            },
            demofunction2: {
              build: true,
              providerPlugin: 'awscloudformation',
              service: 'LambdaLayer',
              dependsOn: [],
            },
          },
          auth: {
            issue4992901fd08f: {
              service: 'Cognito',
              providerPlugin: 'awscloudformation',
              dependsOn: [],
            },
          },
          storage: {
            s33c7946f3: {
              service: 'S3',
              providerPlugin: 'awscloudformation',
            },
          },
        }),
      },
    };
    expect(loadMinimalLambdaConfig(contextStub, resourceName, params)).toBeDefined();
    expect(loadMinimalLambdaConfig(contextStub, resourceName, params)).toEqual(config);
  });
});
