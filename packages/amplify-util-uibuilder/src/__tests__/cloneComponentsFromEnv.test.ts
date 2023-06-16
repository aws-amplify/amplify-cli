import aws from 'aws-sdk'; // eslint-disable-line import/no-extraneous-dependencies
import * as extractArgsDependency from '../commands/utils/extractArgs';
import { run } from '../commands/cloneComponentsFromEnv';
import { isDataStoreEnabled } from '@aws-amplify/amplify-category-api';

const extractArgsDependencyMock = extractArgsDependency as any;
const awsMock = aws as any;

jest.mock('../commands/utils/featureFlags', () => ({
  getTransformerVersion: jest.fn().mockReturnValue(2),
}));
jest.mock('@aws-amplify/amplify-category-api', () => ({
  ...jest.requireActual('@aws-amplify/amplify-category-api'),
  isDataStoreEnabled: jest.fn(),
}));
jest.mock('../commands/utils/extractArgs');
jest.mock('@aws-amplify/amplify-cli-core');

const isDataStoreEnabledMocked = jest.mocked(isDataStoreEnabled);

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
const mockedComponentCreate = jest.fn().mockReturnValue({ entity: {} });

describe('can clone components to new environment', () => {
  let context: any;
  beforeEach(() => {
    isDataStoreEnabledMocked.mockResolvedValue(true);
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
    extractArgsDependencyMock.extractArgs = jest.fn().mockReturnValue({
      sourceEnvName: 'sourceEnvName',
      newEnvName: 'newEnvName',
      appId: 'appId',
      environmentName: 'environmentName',
    });
    awsMock.AmplifyUIBuilder = jest.fn().mockReturnValue({
      exportComponents: jest.fn(({ environmentName }) => ({
        promise: () => mockedComponentExport(environmentName),
      })),
      createComponent: jest.fn().mockReturnValue({ promise: () => mockedComponentCreate() }),
      getMetadata: jest.fn().mockReturnValue({
        promise: jest.fn().mockReturnValue({
          features: {
            autoGenerateForms: 'true',
            autoGenerateViews: 'true',
            formFeatureFlags: {
              isRelationshipSupported: 'false',
              isNonModelSupported: 'false',
            },
          },
        }),
      }),
    });
  });

  it('clones components to a new env', async () => {
    await run(context);
    expect(mockedComponentExport).toBeCalledTimes(2);
    expect(mockedComponentCreate).toBeCalledTimes(1);
  });
});
