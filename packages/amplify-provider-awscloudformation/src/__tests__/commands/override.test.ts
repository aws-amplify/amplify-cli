import { run } from '../../commands/awscloudformation/override';
import { $TSContext } from 'amplify-cli-core';

const mockPrinter = jest.fn();
jest.mock('amplify-cli-core');
jest.mock('amplify-provider-awscloudformation');
jest.mock('amplify-prompts', () => ({
  printer: {
    info: mockPrinter,
  },
}));

jest.mock('fs-extra', () => ({
  ensureDirSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true),
}));

describe('run override command for root stack', () => {
  it('runs override command when FF is OFF', async () => {
    const context_stub = {
      amplify: {
        confirmPrompt: jest.fn().mockResolvedValue(true),
        invokePluginMethod: jest.fn(),
        FeatureFlags: {
          getBoolean: jest.fn().mockReturnValue(false),
        },
      },
    };

    const context_stub_typed = context_stub as unknown as $TSContext;
    await run(context_stub_typed);
    expect(mockPrinter).toBeCalledTimes(1);
  });

  it('run override command when FF is ON and awscloudformation exist', async () => {
    const context_stub = {
      amplify: {
        confirmPrompt: jest.fn().mockResolvedValue(true),
        invokePluginMethod: jest.fn(),
        FeatureFlags: {
          getBoolean: jest.fn().mockReturnValue(false),
        },
        pathManager: {
          getBackendDirPath: jest.fn().mockReturnValue('mydir'),
        },
      },
    };

    const context_stub_typed = context_stub as unknown as $TSContext;
    await run(context_stub_typed);
    expect(context_stub_typed.amplify.invokePluginMethod).toBeCalledTimes(3);
  });

  it('runs override command successfully for all resources in all categories', async () => {
    const context_stub = {
      amplify: {
        getResourceStatus: jest.fn().mockResolvedValue({
          resourcesToBeCreated: [
            {
              category: 'mockcategory1',
              service: 'mockservice1',
              resourceName: 'mockResourceName1',
            },
            {
              category: 'mockcategory2',
              service: 'mockservice2',
              resourceName: 'mockResourceName2',
            },
          ],
          resourcesToBeUpdated: [
            {
              category: 'mockcategory3',
              service: 'mockservice3',
              resourceName: 'mockResourceName3',
            },
            {
              category: 'mockcategory4',
              service: 'mockservice4',
              resourceName: 'mockResourceName4',
            },
          ],
        }),

        confirmPrompt: jest.fn().mockResolvedValue(true),
        invokePluginMethod: jest.fn(),
      },
    };

    const context_stub_typed = context_stub as unknown as $TSContext;
    await run(context_stub_typed);
    expect(context_stub_typed.amplify.invokePluginMethod).toBeCalledTimes(5);
  });

  it('runs command successfully empty Arrays', async () => {
    const context_stub = {
      amplify: {
        getResourceStatus: jest.fn().mockResolvedValue({
          resourcesToBeCreated: [],
          resourcesToBeUpdated: [],
        }),

        confirmPrompt: jest.fn().mockResolvedValue(true),
        invokePluginMethod: jest.fn(),
      },
    };

    const context_stub_typed = context_stub as unknown as $TSContext;
    await run(context_stub_typed);
    expect(context_stub_typed.amplify.invokePluginMethod).toBeCalledTimes(1);
  });
});
