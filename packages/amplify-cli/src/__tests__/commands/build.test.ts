import { run } from '../../commands/build';
import { $TSContext } from 'amplify-cli-core';

jest.mock('amplify-cli-core');
jest.mock('amplify-provider-awscloudformation');

describe('run build command', () => {
  it('runs build command for only a resource', async () => {
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
      input: {
        subCommands: ['mockcategory1', 'mockResourceName1'],
      },
    };

    const context_stub_typed = context_stub as unknown as $TSContext;
    await run(context_stub_typed);
    expect(context_stub_typed.amplify.invokePluginMethod).toBeCalledTimes(1);
  });

  it('runs build command for only all resources in a category', async () => {
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
              category: 'mockcategory1',
              service: 'mockservice2',
              resourceName: 'mockResourceName2',
            },
          ],
          resourcesToBeUpdated: [
            {
              category: 'mockcategory1',
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
      input: {
        subCommands: ['mockcategory1'],
      },
    };

    const context_stub_typed = context_stub as unknown as $TSContext;
    await run(context_stub_typed);
    expect(context_stub_typed.amplify.invokePluginMethod).toBeCalledTimes(3);
  });

  it('runs build command successfully for all resources in all categories', async () => {
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
