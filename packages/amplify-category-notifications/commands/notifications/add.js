const inquirer = require('inquirer');
const pinpointHelper = require('../../lib/pinpoint-helper');
const notificationManager = require('../../lib/notifications-manager');
const multiEnvManager = require('../../lib/multi-env-manager');

module.exports = {
  name: 'add',
  alias: 'enable',
  run: async context => {
    context.exeInfo = context.amplify.getProjectDetails();
    const availableChannels = notificationManager.getAvailableChannels(context);
    const disabledChannels = notificationManager.getDisabledChannels(context);

    let channelName = context.parameters.first;
    if (disabledChannels.length > 0) {
      if (!channelName || !availableChannels.includes(channelName)) {
        const answer = await inquirer.prompt({
          name: 'selection',
          type: 'list',
          message: 'Choose the push notification channel to enable.',
          choices: disabledChannels,
          default: disabledChannels[0],
        });
        channelName = answer.selection;
      } else if (!disabledChannels.includes(channelName)) {
        context.print.info(`The ${channelName} channel has already been enabled.`);
        channelName = undefined;
      }

      if (channelName) {
        await pinpointHelper.ensurePinpointApp(context);
        await notificationManager.enableChannel(context, channelName);
        await multiEnvManager.writeData(context);
      }
    } else {
      context.print.info('All the available notification channels have already been enabled.');
    }

    return context;
  },
};
