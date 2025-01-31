import { nspawn as spawn, getCLIPath } from '..';

/**
 * notifications settings
 */
type NotificationSettings = {
  resourceName: string;
};

/**
 * removes all the notification channel
 */
export const removeAllNotificationChannel = async (cwd: string): Promise<void> =>
  spawn(getCLIPath(), ['remove', 'notifications'], { cwd, stripColors: true })
    .wait('Choose the notification channel to remove')
    .sendLine('All channels on Pinpoint resource')
    .wait(`All notifications have been disabled`)
    .sendEof()
    .runAsync();

/**
 * removes the notification channel
 */
export const removeNotificationChannel = async (cwd: string, channel: string): Promise<void> =>
  spawn(getCLIPath(), ['remove', 'notifications'], { cwd, stripColors: true })
    .wait('Choose the notification channel to remove')
    .sendLine(channel)
    .wait(`The channel has been successfully disabled`)
    .sendEof()
    .runAsync();

/**
 * Adds notification resource for a given channel
 *
 * @param cwd the current working directory to run CLI in
 * @param settings settings required to add a notification channel
 * @param settings.resourceName the name to give to the created pinpoint resource
 * @param channel the channel to add
 */
export const addNotificationChannel = async (
  cwd: string,
  { resourceName }: NotificationSettings,
  channel: string,
  hasAnalytics = false,
  hasAuth = false,
  testingWithLatestCodebase = false,
): Promise<void> => {
  const chain = spawn(getCLIPath(testingWithLatestCodebase), ['add', 'notification'], { cwd, stripColors: true });

  chain.wait('Choose the notification channel to enable').sendLine(channel);

  if (!hasAnalytics) {
    chain.wait('Provide your pinpoint resource name').sendLine(resourceName);
  }

  if (!hasAuth) {
    chain.wait('Apps need authorization to send analytics events. Do you want to allow guests').sendCarriageReturn();
  }

  // channel specific prompts
  switch (channel) {
    case 'APNS |  Apple Push Notifications   ': {
      break;
    }
    case 'FCM  | » Firebase Push Notifications ': {
      break;
    }
    case 'Email': {
      break;
    }
    case 'In-App Messaging': {
      return chain.wait(`Run "amplify push" to update the channel in the cloud`).runAsync();
    }
    default:
      break;
  }

  return chain.wait(`The ${channel} channel has been successfully enabled`).sendEof().runAsync();
};

/**
 * Update notification resource for a given channel
 *
 * @param cwd the current working directory to run CLI in
 * @param settings settings required to add a notification channel
 * @param settings.resourceName the name to give to the created pinpoint resource
 * @param channel the channel to add
 */
export const updateNotificationChannel = async (
  cwd: string,
  channel: string,
  enable = true,
  testingWithLatestCodebase = false,
): Promise<void> => {
  const chain = spawn(getCLIPath(testingWithLatestCodebase), ['update', 'notification'], { cwd, stripColors: true });
  chain.wait('Choose the notification channel to configure').sendLine(channel);
  chain.wait(`Do you want to ${enable ? 'enable' : 'disable'} the ${channel} channel`).sendYes();

  return chain
    .wait(`The ${channel} channel has been ${enable ? 'enabled' : 'disabled'}`)
    .sendEof()
    .runAsync();
};
