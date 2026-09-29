import { $TSContext, stateManager } from '@aws-amplify/amplify-cli-core';
import { resolveAppId } from '../../utils/resolve-appId';

const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;

const contextStub = {
  exeInfo: {
    inputParams: {
      amplify: {
        appId: 'TestAmplifyContextAppId',
      },
    },
  },
} as unknown as $TSContext;

const emptyContextStub = {} as unknown as $TSContext;

describe('resolve-appId', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should return AmplifyAppId if meta file exists', () => {
    stateManagerMock.getMeta = jest.fn().mockReturnValueOnce({
      providers: {
        awscloudformation: {
          AmplifyAppId: 'TestAmplifyMetaAppId',
        },
      },
    });
    stateManagerMock.metaFileExists = jest.fn().mockReturnValueOnce(true);
    expect(resolveAppId(contextStub)).toBe('TestAmplifyMetaAppId');
  });

  it('should throw an error if meta file exists but AmplifyAppId does not exist', () => {
    stateManagerMock.getMeta = jest.fn().mockReturnValueOnce({});
    stateManagerMock.metaFileExists = jest.fn().mockReturnValueOnce(true);
    expect(() => {
      resolveAppId(contextStub);
    }).toThrow('Could not find AmplifyAppId in amplify-meta.json.');
  });

  it('should return AmplifyAppId from context if meta file does not exist', () => {
    stateManagerMock.metaFileExists = jest.fn().mockReturnValueOnce(false);
    expect(resolveAppId(contextStub)).toBe('TestAmplifyContextAppId');
  });

  it('should throw an error if meta file does not exist and context does not have appID', () => {
    stateManagerMock.metaFileExists = jest.fn().mockReturnValueOnce(false);
    expect(() => {
      resolveAppId(emptyContextStub);
    }).toThrow('Failed to resolve appId');
  });
});
