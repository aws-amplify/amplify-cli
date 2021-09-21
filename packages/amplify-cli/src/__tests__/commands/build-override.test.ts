import { run } from '../../commands/build-override';
import { $TSContext } from 'amplify-cli-core';

jest.mock('amplify-cli-core');
jest.mock('amplify-provider-awscloudformation');

describe('run build-override command', () => {
  it('runs command successfully', async () => {
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
    expect(context_stub_typed.amplify.invokePluginMethod).toBeCalledTimes(4);
  });

  it('runs command successfully empty Arrays', async () => {
    jest.clearAllMocks();
    const context_stub = {
      amplify: {
        getResourceStatus: jest.fn().mockResolvedValue({
          resourcesToBeCreated: [],
          resourcesToBeUpdated: [],
        }),

        confirmPrompt: jest.fn().mockResolvedValue(true),
      },
    };

    const context_stub_typed = context_stub as unknown as $TSContext;
    await run(context_stub_typed);
    expect(context_stub_typed.amplify.invokePluginMethod).toBeUndefined();
  });
});
