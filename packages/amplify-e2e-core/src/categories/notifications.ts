import { nspawn as spawn, getCLIPath, singleSelect } from '..';

/**
 * notifications settings
 */
type NotificationSettings = {
  resourceName: string;
};

const NOTIFICATION_CHOICES = ['APNS', 'FCM', 'In-App Messaging', 'Email', 'SMS'];

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
): Promise<void> => {
  const chain = spawn(getCLIPath(), ['add', 'notification'], { cwd, stripColors: true });

  singleSelect(chain.wait('Choose the notification channel to enable'), channel, NOTIFICATION_CHOICES);

  return chain
    .wait('Provide your pinpoint resource name')
    .sendLine(resourceName)
    .wait('Apps need authorization to send analytics events. Do you want to allow guests')
    .sendNo()
    .sendCarriageReturn()
    .wait(`The ${channel} channel has been successfully enabled`)
    .sendEof()
    .runAsync();
};
