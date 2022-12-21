import {
  singleSelect,
  getCLIPath,
  nspawn as spawn,
} from '@aws-amplify/amplify-e2e-core';

/**
 * Adds notification resource for a given channel
 */
export const addLegacySmsNotificationChannel = async (
  cwd: string,
  resourceName: string,
  hasAnalytics = false,
): Promise<void> => {
  const chain = spawn(getCLIPath(false), ['add', 'notification'], { cwd, stripColors: true });

  singleSelect(chain.wait('Choose the push notification channel to enable'), 'SMS', ['APNS', 'FCM', 'Email', 'SMS']);

  if (!hasAnalytics) {
    chain
      .wait('Provide your pinpoint resource name')
      .sendLine(resourceName);
  }

  return chain
    .wait(`The SMS channel has been successfully enabled`)
    .sendEof()
    .runAsync();
};

/**
 * Removes all notifications channels
 */
export const removeLegacyAllNotificationChannel = async (
  cwd: string,
): Promise<void> => spawn(getCLIPath(false), ['remove', 'notifications'], { cwd, stripColors: true })
  .wait('Choose what to remove. (Use arrow keys)')
  .sendKeyDown() // The Pinpoint application
  .sendCarriageReturn()
  .wait(`Confirm that you want to delete the associated Amazon Pinpoint application`)
  .sendConfirmYes()
  .sendEof()
  .runAsync();
