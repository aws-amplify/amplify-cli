const inquirer = require('inquirer');
const ora = require('ora');

const channelName = 'SMS';
const spinner = ora('');

async function configure(context) {
  const isChannelEnabled = context.exeInfo.serviceMeta.output[channelName] && context.exeInfo.serviceMeta.output[channelName].Enabled;

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

function enable(context) {
  const params = {
    ApplicationId: context.exeInfo.serviceMeta.output.Id,
    SMSChannelRequest: {
      Enabled: true,
    },
  };

  spinner.start('Updating SMS channel.');
  return new Promise((resolve, reject) => {
    context.exeInfo.pinpointClient.updateSmsChannel(params, (err, data) => {
      if (err) {
        spinner.fail('update channel error');
        reject(err);
      } else {
        spinner.succeed(`The ${channelName} channel has been successfully enabled.`);
        context.exeInfo.serviceMeta.output[channelName] = data.SMSChannelResponse;
        resolve(data);
      }
    });
  });
}

function disable(context) {
  const params = {
    ApplicationId: context.exeInfo.serviceMeta.output.Id,
    SMSChannelRequest: {
      Enabled: false,
    },
  };

  spinner.start('Updating SMS channel.');
  return new Promise((resolve, reject) => {
    context.exeInfo.pinpointClient.updateSmsChannel(params, (err, data) => {
      if (err) {
        spinner.fail('update channel error');
        reject(err);
      } else {
        spinner.succeed(`The ${channelName} channel has been disabled.`);
        context.exeInfo.serviceMeta.output[channelName] = data.SMSChannelResponse;
        resolve(data);
      }
    });
  });
}

async function pull(context, pinpointApp) {
  const params = {
    ApplicationId: pinpointApp.Id,
  };
  spinner.start(`Retrieving channel information for ${channelName}.`);
  return context.exeInfo.pinpointClient
    .getSmsChannel(params)
    .promise()
    .then(data => {
      spinner.succeed(`Channel information retrieved for ${channelName}`);
      pinpointApp[channelName] = data.SMSChannelResponse;
      return data.SMSChannelResponse;
    })
    .catch(err => {
      if (err.code === 'NotFoundException') {
        spinner.succeed(`Channel is not setup for ${channelName} `);
        return err;
      }
      spinner.stop();
      throw err;
    });
}

module.exports = {
  configure,
  enable,
  disable,
  pull,
};
