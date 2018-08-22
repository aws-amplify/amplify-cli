const inquirer = require('inquirer');

const channelName = 'FCM';

async function configure(context) {
  const isChannelEnabled =
    context.exeInfo.serviceMeta.output[channelName] &&
    context.exeInfo.serviceMeta.output[channelName].Enabled;

  if (isChannelEnabled) {
    context.print.info(`The ${channelName} channel is currently enabled`);
    const answer = await inquirer.prompt({
      name: 'disableChannel',
      type: 'confirm',
      message: `Do you want to disable the ${channelName} channel`,
      default: false,
    });
    if (answer.disableChannel) {
      await disable(context);
    } else {
      const successMessage = `The ${channelName} channel has been successfully updated.`;
      await enable(context, successMessage);
    }
  } else {
    const answer = await inquirer.prompt({
      name: 'enableChannel',
      type: 'confirm',
      message: `Do you want to enable the ${channelName} channel`,
      default: true,
    });
    if (answer.enableChannel) {
      await enable(context);
    }
  }
}

async function enable(context, successMessage) {
  let channelOutput = {};
  if (context.exeInfo.serviceMeta.output[channelName]) {
    channelOutput = context.exeInfo.serviceMeta.output[channelName];
  }
  const questions = [
    {
      name: 'ApiKey',
      type: 'input',
      message: 'ApiKey',
      default: channelOutput.ApiKey,
    },
  ];
  const answers = await inquirer.prompt(questions);

  const params = {
    ApplicationId: context.exeInfo.serviceMeta.output.Id,
    GCMChannelRequest: {
      Enabled: true,
      ...answers,
    },
  };
  return new Promise((resolve, reject) => {
    context.exeInfo.pinpointClient.updateGcmChannel(params, (err, data) => {
      if (err) {
        context.print.error('update channel error');
        reject(err);
      } else {
        if (!successMessage) {
          successMessage = `The ${channelName} channel has been successfully enabled.`;
        }
        context.print.info(successMessage);
        context.exeInfo.serviceMeta.output[channelName] = data.GCMChannelResponse;
        resolve(data);
      }
    });
  });
}

function disable(context) {
  const params = {
    ApplicationId: context.exeInfo.serviceMeta.output.Id,
    GCMChannelRequest: {
      Enabled: false,
    },
  };
  return new Promise((resolve, reject) => {
    context.exeInfo.pinpointClient.updateGcmChannel(params, (err, data) => {
      if (err) {
        context.print.error('update channel error');
        reject(err);
      } else {
        context.print.info(`The ${channelName} channel has been disabled.`);
        context.exeInfo.serviceMeta.output[channelName] = data.GCMChannelResponse;
        resolve(data);
      }
    });
  });
}

module.exports = {
  configure,
  enable,
  disable,
};
