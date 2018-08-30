const inquirer = require('inquirer');
const pinpointHelper = require('../../lib/pinpoint-helper');
const notificationManager = require('../../lib/notifications-manager');

module.exports = {
  name: 'configure',
  alias: 'update',
  run: async (context) => {
    context.exeInfo = context.amplify.getProjectDetails();
    const availableChannels = notificationManager.getAvailableChannels(context);
    let channelName = context.parameters.first;

    if (!channelName || !availableChannels.includes(channelName)) {
      const answer = await inquirer.prompt({
        name: 'selection',
        type: 'list',
        message: 'Choose the push notification channel to configure.',
        choices: availableChannels,
        default: availableChannels[0],
      });
      channelName = answer.selection;
    }

    await pinpointHelper.checkPinpointApp(context);
    notificationManager.updateaServiceMeta(context);
    await notificationManager.configureChannel(context, channelName);
    notificationManager.updateaServiceMeta(context);

    return context;
  },
};
