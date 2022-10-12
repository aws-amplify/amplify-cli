import aws from 'aws-sdk'; // eslint-disable-line import/no-extraneous-dependencies
import * as extractArgsDependency from '../commands/utils/extractArgs';
import { run } from '../commands/cloneComponentsFromEnv';

const extractArgsDependencyMock = extractArgsDependency as any;
const awsMock = aws as any;

jest.mock('../commands/utils/featureFlags', () => ({
  getTransformerVersion: jest.fn().mockImplementation(() => 2)
}));
jest.mock('../commands/utils/extractArgs');
jest.mock('amplify-cli-core');

const mockedComponentExport = jest.fn((envName: string) => {
  if (envName === 'newEnvName') {
    return {
      entities: [],
    };
  }
  return {
    entities: [{}],
  };
});
const mockedComponentCreate = jest.fn(() => ({ entity: {} }));

describe('can clone components to new environment', () => {
  let context: any;
  beforeEach(() => {
    context = {
      amplify: {
        invokePluginMethod: () => ({}),
      },
      input: {
        options: {
          appId: 'testAppId',
          envName: 'testEnvName',
        },
      },
    };
    extractArgsDependencyMock.extractArgs = jest.fn().mockImplementation(() => ({
      sourceEnvName: 'sourceEnvName',
      newEnvName: 'newEnvName',
      appId: 'appId',
      environmentName: 'environmentName',
    }));
    awsMock.AmplifyUIBuilder = jest.fn(() => ({
      exportComponents: jest.fn(({ environmentName }) => ({
        promise: () => mockedComponentExport(environmentName),
      })),
      createComponent: jest.fn(() => ({ promise: () => mockedComponentCreate() })),
      getMetadata: jest.fn(() => ({
        promise: jest.fn(() => ({
          features: {
            autoGenerateForms: 'true',
            autoGenerateViews: 'true',
          },
        })),
      })),
    }));
  });

  it('clones components to a new env', async () => {
    await run(context);
    expect(mockedComponentExport).toBeCalledTimes(2);
    expect(mockedComponentCreate).toBeCalledTimes(1);
  });
});
