const inquirer = require('inquirer');
const ora = require('ora');
const fs = require('fs-extra');

const channelName = 'APNS';
const spinner = ora('');

const configureKey = require('./apns-key-config');
const configureCertificate = require('./apns-cert-config');

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
  let channelInput;
  let answers;
  if (context.exeInfo.pinpointInputParams && context.exeInfo.pinpointInputParams[channelName]) {
    channelInput = validateInputParams(context.exeInfo.pinpointInputParams[channelName]);
    answers = {
      DefaultAuthenticationMethod: channelInput.DefaultAuthenticationMethod,
    };
  } else {
    let channelOutput = {};
    if (context.exeInfo.serviceMeta.output[channelName]) {
      channelOutput = context.exeInfo.serviceMeta.output[channelName];
    }
    const question = {
      name: 'DefaultAuthenticationMethod',
      type: 'list',
      message: 'Choose authentication method used for APNs',
      choices: ['Certificate', 'Key'],
      default: channelOutput.DefaultAuthenticationMethod || 'Certificate',
    };
    answers = await inquirer.prompt(question);
  }

  try {
    if (answers.DefaultAuthenticationMethod === 'Key') {
      const keyConfig = await configureKey.run(channelInput);
      Object.assign(answers, keyConfig);
    } else {
      const certificateConfig = await configureCertificate.run(channelInput);
      Object.assign(answers, certificateConfig);
    }
  } catch (err) {
    context.print.error(err.message);
    process.exit(1);
  }

  spinner.start('Updating APNS Channel.');

  const params = {
    ApplicationId: context.exeInfo.serviceMeta.output.Id,
    APNSChannelRequest: {
      ...answers,
      Enabled: true,
    },
  };

  const sandboxParams = {
    ApplicationId: context.exeInfo.serviceMeta.output.Id,
    APNSSandboxChannelRequest: {
      ...answers,
      Enabled: true,
    },
  };

  let data;
  try {
    data = await context.exeInfo.pinpointClient.updateApnsChannel(params).promise();
    await context.exeInfo.pinpointClient.updateApnsSandboxChannel(sandboxParams).promise();
    context.exeInfo.serviceMeta.output[channelName] = data.APNSChannelResponse;
  } catch (e) {
    spinner.fail(`Failed to update the ${channelName} channel.`);
    throw e;
  }

  if (!successMessage) {
    successMessage = `The ${channelName} channel has been successfully enabled.`;
  }
  spinner.succeed(successMessage);

  return data;
}

function validateInputParams(channelInput) {
  if (channelInput.DefaultAuthenticationMethod) {
    const authMethod = channelInput.DefaultAuthenticationMethod;
    if (authMethod === 'Certificate') {
      if (!channelInput.P12FilePath) {
        throw new Error('P12FilePath is missing for the APNS channel');
      } else if (!fs.existsSync(channelInput.P12FilePath)) {
        throw new Error(`P12 file ${channelInput.P12FilePath} can NOT be found for the APNS channel`);
      }
    } else if (authMethod === 'Key') {
      if (!channelInput.BundleId || !channelInput.TeamId || !channelInput.TokenKeyId) {
        throw new Error('Missing BundleId, TeamId or TokenKeyId for the APNS channel');
      } else if (!channelInput.P8FilePath) {
        throw new Error('P8FilePath is missing for the APNS channel');
      } else if (!fs.existsSync(channelInput.P8FilePath)) {
        throw new Error(`P8 file ${channelInput.P8FilePath} can NOT be found for the APNS channel`);
      }
    } else {
      throw new Error(`DefaultAuthenticationMethod ${authMethod} is unrecognized for the APNS channel`);
    }
  } else {
    throw new Error('DefaultAuthenticationMethod is missing for the APNS channel');
  }

  return channelInput;
}

async function disable(context) {
  const params = {
    ApplicationId: context.exeInfo.serviceMeta.output.Id,
    APNSChannelRequest: {
      Enabled: false,
    },
  };

  const sandboxParams = {
    ApplicationId: context.exeInfo.serviceMeta.output.Id,
    APNSSandboxChannelRequest: {
      Enabled: false,
    },
  };

  spinner.start('Updating APNS Channel.');

  let data;
  try {
    data = await context.exeInfo.pinpointClient.updateApnsChannel(params).promise();
    await context.exeInfo.pinpointClient.updateApnsSandboxChannel(sandboxParams).promise();
  } catch (e) {
    spinner.fail(`Failed to update the ${channelName} channel.`);
    throw e;
  }

  spinner.succeed(`The ${channelName} channel has been disabled.`);
  context.exeInfo.serviceMeta.output[channelName] = data.APNSChannelResponse;
  return data;
}

function pull(context, pinpointApp) {
  const params = {
    ApplicationId: pinpointApp.Id,
  };

  spinner.start(`Retrieving channel information for ${channelName}.`);
  return context.exeInfo.pinpointClient
    .getApnsChannel(params)
    .promise()
    .then(data => {
      spinner.succeed(`Channel information retrieved for ${channelName}`);
      pinpointApp[channelName] = data.APNSChannelResponse;
      return data.APNSChannelResponse;
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
