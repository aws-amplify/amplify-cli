import { run as runPostEnvAdd } from '../event-handlers/handle-PostEnvAdd';
import { run as runPostPull } from '../event-handlers/handle-PostPull';

describe('can handle events', () => {
  let context: any;
  beforeEach(() => {
    context = {
      amplify: {
        invokePluginMethod: jest.fn(),
      },
    };
  });
  it('handles postEnvAdd', async () => {
    await runPostEnvAdd(context);
    expect(context.amplify.invokePluginMethod).toBeCalledTimes(1);
  });
  it('handles postPull', async () => {
    await runPostPull(context);
    expect(context.amplify.invokePluginMethod).toBeCalledTimes(1);
  });
});
