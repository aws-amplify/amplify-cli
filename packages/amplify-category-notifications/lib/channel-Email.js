const inquirer = require('inquirer');
const ora = require('ora');

const channelName = 'Email';
const spinner = ora('');

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
      name: 'FromAddress',
      type: 'input',
      message: "The 'From' Email address used to send emails",
      default: channelOutput.FromAddress,
    },
    {
      name: 'Identity',
      type: 'input',
      message: 'The ARN of an identity verified with SES',
      default: channelOutput.Identity,
    },
    {
      name: 'RoleArn',
      type: 'input',
      message: "The ARN of an IAM Role used to submit events to Mobile notifications' event ingestion service",
      default: channelOutput.RoleArn,
    },
  ];
  const answers = await inquirer.prompt(questions);

  const params = {
    ApplicationId: context.exeInfo.serviceMeta.output.Id,
    EmailChannelRequest: {
      Enabled: true,
      ...answers,
    },
  };

  spinner.start('Updating Email Channel.');
  return new Promise((resolve, reject) => {
    context.exeInfo.pinpointClient.updateEmailChannel(params, (err, data) => {
      if (err) {
        spinner.fail('update channel error');
        reject(err);
      } else {
        if (!successMessage) {
          successMessage = `The ${channelName} channel has been successfully enabled.`;
        }
        spinner.succeed(successMessage);
        context.exeInfo.serviceMeta.output[channelName] = data.EmailChannelResponse;
        resolve(data);
      }
    });
  });
}

async function disable(context) {
  const params = {
    ApplicationId: context.exeInfo.serviceMeta.output.Id,
    EmailChannelRequest: {
      Enabled: false,
    },
  };
  spinner.start('Updating Email Channel.');
  return new Promise((resolve, reject) => {
    context.exeInfo.pinpointClient.updateEmailChannel(params, (err, data) => {
      if (err) {
        spinner.fail('update channel error');
        reject(err);
      } else {
        spinner.succeed(`The ${channelName} channel has been disabled.`);
        context.exeInfo.serviceMeta.output[channelName] = data.EmailChannelResponse;
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
