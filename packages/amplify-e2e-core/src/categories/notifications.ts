import { nspawn as spawn, getCLIPath, singleSelect } from '..';

export type NotificationSettings = {
  resourceName: string;
};

export const addSMSNotification = async (cwd: string, settings: NotificationSettings): Promise<void> => new Promise((resolve, reject) => {
  const chain = spawn(getCLIPath(), ['add', 'notification'], { cwd, stripColors: true });

  singleSelect(chain.wait('Choose the notification channel to enable'), 'SMS', ['APNS', 'FCM', 'In-App Messaging', 'Email', 'SMS']);

  chain
    .wait('Provide your pinpoint resource name')
    .sendLine(settings.resourceName)
    .wait('Apps need authorization to send analytics events. Do you want to allow guests')
    .sendConfirmNo()
    .wait('The SMS channel has been successfully enabled')
    .sendEof()
    .run((err: Error) => {
      if (!err) {
        resolve(undefined);
      } else {
        reject(err);
      }
    });
});
