const inquirer = require('inquirer');
const configureKey = require('./apns-key-config');
const configureCertificate = require('./apns-cert-config');

const channelName = 'APNS';

async function run(context) {
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
      await disableChannel(context);
    } else {
      await configureAndEnable(context);
    }
  } else {
    const answer = await inquirer.prompt({
      name: 'enableChannel',
      type: 'confirm',
      message: `Do you want to enable the ${channelName} channel`,
      default: true,
    });
    if (answer.enableChannel) {
      await configureAndEnable(context);
    }
  }
}

async function configureAndEnable(context) {
  let channelOutput = {};
  if (context.exeInfo.serviceMeta.output[channelName]) {
    channelOutput = context.exeInfo.serviceMeta.output[channelName];
  }

  const APNSChannelRequest = { Enabled: true };

  const { DefaultAuthenticationMethod } = channelOutput;

  let answers;
  let keyConfig;
  let certificateConfig;

  answers = await inquirer.prompt({
    name: 'DefaultAuthenticationMethod',
    type: 'list',
    message: 'The default authentication method used for APNs',
    choices: ['Key', 'Certificate'],
    default: DefaultAuthenticationMethod || 'Certificate',
  });

  APNSChannelRequest.DefaultAuthenticationMethod = answers.DefaultAuthenticationMethod;

  if (APNSChannelRequest.DefaultAuthenticationMethod === 'Key') {
    keyConfig = await configureKey.run();
  } else {
    certificateConfig = await configureCertificate.run();
  }

  Object.assign(APNSChannelRequest, keyConfig, certificateConfig);

  const params = {
    ApplicationId: context.exeInfo.serviceMeta.output.Id,
    APNSChannelRequest,
  };

  return new Promise((resolve, reject) => {
    context.exeInfo.pinpointClient.updateApnsChannel(params, (err, data) => {
      if (err) {
        context.print.error('update channel error');
        reject(err);
      } else {
        context.print.info(`The ${channelName} channel has been successfully enabled.`);
        context.exeInfo.serviceMeta.output[channelName] = data.APNSChannelResponse;
        resolve(data);
      }
    });
  });
}

function disableChannel(context) {
  const params = {
    ApplicationId: context.exeInfo.serviceMeta.output.Id,
    APNSChannelRequest: {
      Enabled: false,
    },
  };
  return new Promise((resolve, reject) => {
    context.exeInfo.pinpointClient.updateApnsChannel(params, (err, data) => {
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
  run,
};
