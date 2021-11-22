import * as fs from 'fs-extra';
import { $TSContext } from 'amplify-cli-core';
import * as update from '../../commands/auth/update';
import { messages } from '../../provider-utils/awscloudformation/assets/string-maps';
import { printer } from 'amplify-prompts';

jest.mock('../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state');
jest.mock('fs-extra', () => ({
  readFileSync: () => '{ "Cognito": { "provider": "aws"}}',
  existsSync: () => true,
}));

jest.mock('amplify-prompts');

jest.mock('amplify-cli-core', () => ({
  ...(jest.requireActual('amplify-cli-core') as {}),
  FeatureFlags: {
    getBoolean: jest.fn().mockReturnValue(true),
  },
  AmplifySupportedService: {
    COGNITO: 'Cognito',
    COGNITOUSERPOOLGROUPS: 'Cognito-UserPool-Groups',
  },
  stateManager: {
    getMeta: jest
      .fn()
      .mockReturnValue({})
      .mockReturnValueOnce({
        analytics: {
          mockResource1: {},
        },
        api: {
          mockResource1: {},
        },
        function: {
          mockResource1: {},
        },
        storage: {
          mockResource1: {},
        },
      })
      .mockReturnValueOnce({
        analytics: {
          mockResource1: {},
        },
        api: {
          mockResource1: {},
        },
        function: {
          mockResource1: {},
        },
        storage: {
          mockResource1: {},
        },
        auth: {
          mockResource1: {},
        },
      }),
  },
}));

describe('auth update: ', () => {
  const mockExecuteProviderUtils = jest.fn();
  const mockGetProjectDetails = jest.fn();
  const mockSelectionPrompt = jest.fn(() => Promise.reject(new Error()));
  const mockProjectPath = '/User/someone/Documents/Project/amplify-test';

  const mockPluginInstance = { loadResourceParameters: jest.fn() };
  const mockContext = {
    amplify: {
      executeProviderUtils: mockExecuteProviderUtils,
      getProjectDetails: mockGetProjectDetails,
      serviceSelectionPrompt: mockSelectionPrompt,
      getPluginInstance: jest.fn().mockReturnValue(mockPluginInstance),
      getImportedAuthProperties : jest.fn().mockReturnValue({ imported : false }),
      readJsonFile: jest.fn(path => JSON.parse(fs.readFileSync(path, 'utf-8'))),
      pathManager: {
        getBackendDirPath: jest.fn(),
      },
      // eslint-disable-next-line
      getResourceStatus: () => {
        return { allResources: [{ service: 'Cognito', serviceType: 'managed' }] };
      }, //eslint-disable-line
    },
    usageData: {
      emitError: jest.fn(),
    },
    input: {
      options: {},
    },
  } as unknown as $TSContext;
  const dependencies = ['analytics', 'api', 'function', 'storage'];

  it('update run method should exist', async () => {
    await expect(update.run).toBeDefined();
  });

  describe('case: auth resource does not exist', () => {
    beforeEach(() => {
      mockGetProjectDetails.mockReturnValue({
        projectConfig: {
          projectPath: mockProjectPath,
        },
      });
    });
    it('update run method should detect absence of auth resource and print a message', async () => {
      await update.run(mockContext);
      expect(printer.warn).toBeCalledWith('Project does not contain auth resources. Add auth using `amplify add auth`.');
    });
  });

  describe('case: resources may rely on auth', () => {
    beforeEach(() => {
      mockGetProjectDetails.mockReturnValue({
        projectConfig: {
          projectPath: mockProjectPath,
        },
      });
    });
    it(`update run method should detect presence of dependent resource and print a message`, async () => {
      await update.run(mockContext);
      expect(printer.info).toBeCalledWith(messages.dependenciesExists);
    });
    it(`serviceSelectionPrompt should still be called even when warning displayed for existing resource`, async () => {
      await update.run(mockContext);
      expect(mockContext.amplify.serviceSelectionPrompt).toBeCalled();
    });
  });
});
