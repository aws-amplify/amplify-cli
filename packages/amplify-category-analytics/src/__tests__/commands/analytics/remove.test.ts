import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { run as runRemove } from '../../../commands/analytics/remove';
import { checkResourceInUseByNotifications } from '../../../plugin-client-api-notifications';

jest.mock('../../../plugin-client-api-notifications');

const checkResourceInUseByNotificationsMock = checkResourceInUseByNotifications as jest.MockedFunction<
  typeof checkResourceInUseByNotifications
>;

checkResourceInUseByNotificationsMock.mockResolvedValue(true);

describe('remove analytics handler', () => {
  it('throws error if notifications exists', async () => {
    const stubContext = {
      amplify: {
        removeResource: jest.fn().mockImplementation(async (__context, __category, resourceName, __config, callback) => {
          await callback(resourceName);
        }),
      },
      parameters: {
        first: 'testing',
      },
    } as unknown as $TSContext;
    await expect(() => runRemove(stubContext)).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Analytics resource testing is being used by the notifications category and cannot be removed"`,
    );
  });
});
