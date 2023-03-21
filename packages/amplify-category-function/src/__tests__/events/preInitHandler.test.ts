import { $TSContext } from 'amplify-cli-core';
import { preInitHandler } from '../../events/preInitHandler';
import { prePushHandler } from '../../events/prePushHandler';

jest.mock('../../events/prePushHandler');

const prePushHandlerMock = prePushHandler as jest.MockedFunction<typeof prePushHandler>;

describe('preInitHandler', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('calls prePushHandler when forcePush is set to true', async () => {
    const context = {
      parameters: {
        options: {
          forcePush: true,
        },
      },
    } as unknown as $TSContext;

    await preInitHandler(context);

    expect(prePushHandlerMock).toHaveBeenCalled();
  });

  it('does not call prePushHandler when forcePush is not set', async () => {
    const context = {
      parameters: {
        options: {},
      },
    } as unknown as $TSContext;

    await preInitHandler(context);

    expect(prePushHandlerMock).not.toHaveBeenCalled();
  });
});
