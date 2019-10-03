const inquirer = require('inquirer');
const pinpointHelper = require('../../lib/pinpoint-helper');
const notificationManager = require('../../lib/notifications-manager');
const multiEnvManager = require('../../lib/multi-env-manager');

const PinpointApp = 'The Pinpoint application';
const Cancel = 'Cancel';

module.exports = {
  name: 'remove',
  alias: ['disable', 'delete'],
  run: async context => {
    context.exeInfo = context.amplify.getProjectDetails();
    const pinpointApp = pinpointHelper.getPinpointApp(context);
    if (pinpointApp) {
      const availableChannels = notificationManager.getAvailableChannels(context);
      const enabledChannels = notificationManager.getEnabledChannels(context);

      enabledChannels.push(PinpointApp);
      enabledChannels.push(Cancel);

      let channelName = context.parameters.first;

      if (!channelName || !availableChannels.includes(channelName)) {
        const answer = await inquirer.prompt({
          name: 'selection',
          type: 'list',
          message: 'Choose what to remove.',
          choices: enabledChannels,
          default: enabledChannels[0],
        });
        channelName = answer.selection;
      } else if (!enabledChannels.includes(channelName)) {
        context.print.info(`The ${channelName} channel has NOT been enabled.`);
        channelName = undefined;
      }

      if (channelName && channelName !== Cancel) {
        if (channelName !== PinpointApp) {
          await pinpointHelper.ensurePinpointApp(context);
          await notificationManager.disableChannel(context, channelName);
          await multiEnvManager.writeData(context);
        } else if (pinpointHelper.isAnalyticsAdded(context)) {
          context.print.error('Execution aborted.');
          context.print.info('You have an analytics resource in your backend tied to the Amazon Pinpoint resource');
          context.print.info('The Analytics resource must be removed before Amazon Pinpoint can be deleted from the cloud');
        } else {
          const answer = await inquirer.prompt({
            name: 'deletePinpointApp',
            type: 'confirm',
            message: 'Confirm that you want to delete the associated Amazon Pinpoint application',
            default: false,
          });
          if (answer.deletePinpointApp) {
            await pinpointHelper.deletePinpointApp(context);
            context.print.info('The Pinpoint application has been successfully deleted.');
            await multiEnvManager.writeData(context);
          }
        }
      }
    } else {
      context.print.error('Notifications have not been added to your project.');
    }
    return context;
  },
};
