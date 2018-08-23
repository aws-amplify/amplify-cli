const inquirer = require('inquirer');
const pinpointHelper = require('../../lib/pinpoint-helper');
const notificationManager = require('../../lib/notifications-manager');

const pinpointApp = 'The Pinpoint application';

module.exports = {
  name: 'remove',
  alias: ['disable', 'delete'],
  run: async (context) => {
    context.exeInfo = context.amplify.getProjectDetails();
    const availableChannels = notificationManager.getAvailableChannels(context);
    const enabledChannels = notificationManager.getEnabledChannels(context);

    enabledChannels.push(pinpointApp);

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

    if (channelName) {
      if (channelName !== pinpointApp) {
        await pinpointHelper.checkPinpointApp(context);
        await notificationManager.disableChannel(context, channelName);
        notificationManager.updateaServiceMeta(context);
      } else {
        if(pinpointHelper.isAnalyticsAdded(context)) {
            context.print.error('You have added the analytics to your backend');
            context.print.error('Analytics is also managed by the Amazon Pinpoint application');
            context.print.info('Analytics must be removed before Amazon Pinpoint can be deleted'); 
            context.print.info('Execution aborted.');
        }else{
            const answer = await inquirer.prompt({
                name: 'deletePinpointApp',
                type: 'confirm',
                message: 'Confirm that you want to delete the associated AWS Pinpoint application',
                default: false,
            });
            if (answer.deletePinpointApp) {
                await pinpointHelper.deletePinpointApp(context);
                context.print.info('The Pinpoint application has been successfully deleted.');
                notificationManager.updateaServiceMeta(context);
            }
        }
      }
    }
    return context;
  },
};
