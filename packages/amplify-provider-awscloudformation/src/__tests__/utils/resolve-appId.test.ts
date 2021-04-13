import { $TSContext } from 'amplify-cli-core';

const context_stub = ({
  exeInfo: {
    inputParams: {
      amplify: {
        appId: 'TestAmplifyContextAppId',
      },
    },
  },
} as unknown) as $TSContext;

const empty_context_stub = ({} as unknown) as $TSContext;

describe('resolve-appId', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should return AmplifyAppId if meta file exists', () => {
    jest.mock('amplify-cli-core', () => ({
      stateManager: {
        getMeta: () => ({
          providers: {
            awscloudformation: {
              AmplifyAppId: 'TestAmplifyMetaAppId',
            },
          },
        }),
        metaFileExists: () => true,
      },
    }));
    const { resolveAppId } = require('../../utils/resolve-appId');
    expect(resolveAppId(context_stub)).toBe('TestAmplifyMetaAppId');
  });

  it('should throw an error if meta file exists but AmplifyAppId does not exist', () => {
    jest.mock('amplify-cli-core', () => ({
      stateManager: {
        getMeta: () => ({}),
        metaFileExists: () => true,
      },
    }));
    const { resolveAppId } = require('../../utils/resolve-appId');
    expect(() => {
      resolveAppId(context_stub);
    }).toThrow('Could not find AmplifyAppId in amplify-meta.json.');
  });

  it('should return AmplifyAppId from context if meta file does not exist', () => {
    jest.mock('amplify-cli-core', () => ({
      stateManager: {
        metaFileExists: () => false,
      },
    }));
    const { resolveAppId } = require('../../utils/resolve-appId');
    expect(resolveAppId(context_stub)).toBe('TestAmplifyContextAppId');
  });

  it('should throw an error if meta file does not exist and context does not have appID', () => {
    jest.mock('amplify-cli-core', () => ({
      stateManager: {
        metaFileExists: () => false,
      },
    }));
    const { resolveAppId } = require('../../utils/resolve-appId');
    expect(() => {
      resolveAppId(empty_context_stub);
    }).toThrow('Failed to resolve appId');
  });
});
