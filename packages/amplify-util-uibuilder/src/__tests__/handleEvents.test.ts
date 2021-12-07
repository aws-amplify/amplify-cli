describe('can handle events', () => {
  let context: any;
  beforeEach(() => {
    context = {
      amplify: {
        invokePluginMethod: () => true,
      },
    };
  });
  it('handles postEnvAdd', async () => {
    const { run } = require('../event-handlers/handle-PostEnvAdd');
    await run(context);
  });
  it('handles postPull', async () => {
    const { run } = require('../event-handlers/handle-PostPull');
    await run(context);
  });
});
