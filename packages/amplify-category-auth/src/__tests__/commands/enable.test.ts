import { $TSContext, FeatureFlags, stateManager } from 'amplify-cli-core';
import * as fs from 'fs-extra';
import * as add from '../../commands/auth/enable';
import { messages } from '../../provider-utils/awscloudformation/assets/string-maps';
import { printer } from 'amplify-prompts';

const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;
stateManager_mock.getMeta = jest.fn();

const printer_mock = printer as jest.Mocked<typeof printer>;
printer_mock.info = jest.fn();
printer_mock.warn = jest.fn();
printer_mock.error = jest.fn();

FeatureFlags.getBoolean = () => false;

jest.mock('../../provider-utils/awscloudformation', () => ({
  addResource: jest.fn(),
}));

describe('auth enable: ', () => {
  const mockExecuteProviderUtils = jest.fn();
  const mockGetProjectDetails = jest.fn();
  const mockSelectionPrompt = jest.fn(() => Promise.resolve({ providerName: 'awscloudformation' }));
  const mockProjectPath = '/User/someone/Documents/Project/amplify-test';
  const mockContext = {
    amplify: {
      executeProviderUtils: mockExecuteProviderUtils,
      getProjectDetails: mockGetProjectDetails,
      serviceSelectionPrompt: mockSelectionPrompt,
      readJsonFile: jest.fn(path => JSON.parse(fs.readFileSync(path, 'utf-8'))),
    },
    usageData: {
      emitError: jest.fn(),
    },
    input: {
      command: 'add',
    },
  } as unknown as $TSContext;

  it('enable run method should exist', () => {
    expect(add.run).toBeDefined();
  });

  describe('case: auth already enabled', () => {
    beforeEach(() => {
      mockGetProjectDetails.mockReturnValue({
        projectConfig: {
          projectPath: mockProjectPath,
        },
      });
      stateManager_mock.getMeta = jest.fn().mockReturnValueOnce({
        auth: {
          foo: 'bar',
        },
      });
    });

    it('enable method should detect existing auth metadata and return after printing warning text', async () => {
      await add.run(mockContext);
      expect(printer_mock.warn).toBeCalledWith(messages.authExists);
      expect(mockContext.amplify.serviceSelectionPrompt).not.toBeCalled();
    });
  });

  describe('case: auth not yet enabled', () => {
    beforeEach(() => {
      mockGetProjectDetails.mockReturnValue({
        projectConfig: {
          projectPath: mockProjectPath,
        },
      });
      stateManager_mock.getMeta = jest.fn().mockReturnValueOnce({});
    });

    it('service selection prompt should be called', async () => {
      await add.run(mockContext);
      expect(mockContext.amplify.serviceSelectionPrompt).toBeCalled();
    });
  });
});
