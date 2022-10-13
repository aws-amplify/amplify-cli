import { run as runPostPull } from '../event-handlers/handle-PostPull';
import { run as runPostPush } from '../event-handlers/handle-PostPush';
import { run as generateComponents } from '../commands/generateComponents';

jest.mock('../commands/generateComponents');

describe('can handle events', () => {
  let context: any;

  beforeEach(() => {
    context = {
      amplify: {
        invokePluginMethod: jest.fn(),
      },
    };
  });

  it('handles postPull', async () => {
    await runPostPull(context);
    expect(generateComponents).toHaveBeenCalledWith(context, 'PostPull');
  });

  it('handles postPush', async () => {
    await runPostPush(context);
    expect(generateComponents).toHaveBeenCalledWith(context, 'PostPush');
  });
});
