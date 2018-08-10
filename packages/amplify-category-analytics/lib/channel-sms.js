const inquirer = require('inquirer');

const channelName = 'SMS';

async function run(context) {
  const isChannelEnabled =
    context.exeInfo.serviceMeta.output[channelName] &&
    context.exeInfo.serviceMeta.output[channelName].enabled;

  if (isChannelEnabled) {
    context.print.info('The SMS channel is currently enabled');
    const answer = await inquirer.prompt({
      name: 'disableChannel',
      type: 'confirm',
      message: 'Do you want to disable the SMS channel',
      default: false,
    });
    if (answer.disableChannel) {
      await disableChannel(context);
    }
  } else {
    const answer = await inquirer.prompt({
      name: 'enableChannel',
      type: 'confirm',
      message: 'Do you want to enable the SMS channel',
      default: true,
    });
    if (answer.enableChannel) {
      await enableChannel(context);
    }
  }
}


function enableChannel(context) {
  const params = {
    ApplicationId: context.exeInfo.serviceMeta.output.Id,
    SMSChannelRequest: {
      Enabled: true,
    },
  };
  return new Promise((resolve, reject) => {
    context.exeInfo.pinpointClient.updateSmsChannel(params, (err, data) => {
      if (err) {
        console.log('update channel error');
        reject(err);
      } else {
        console.log('The SMS channel has been successfully enabled.');
        context.exeInfo.serviceMeta.output[channelName] = {
          enabled: true,
        };
        resolve(data);
      }
    });
  });
}

function disableChannel(context) {
  const params = {
    ApplicationId: context.exeInfo.serviceMeta.output.Id,
    SMSChannelRequest: {
      Enabled: false,
    },
  };
  return new Promise((resolve, reject) => {
    context.exeInfo.pinpointClient.updateSmsChannel(params, (err, data) => {
      if (err) {
        console.log('update channel error');
        reject(err);
      } else {
        console.log('The SMS channel has been disabled.');
        context.exeInfo.serviceMeta.output[channelName] = {
          enabled: false,
        };
        resolve(data);
      }
    });
  });
}


module.exports = {
  run,
};
