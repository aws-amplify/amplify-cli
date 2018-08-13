const inquirer = require('inquirer');

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
    }
  } else {
    const answer = await inquirer.prompt({
      name: 'enableChannel',
      type: 'confirm',
      message: `Do you want to enable the ${channelName} channel`,
      default: true,
    });
    if (answer.enableChannel) {
      await enableChannel(context);
    }
  }
}

async function enableChannel(context) {
  let channelOutput = {}; 
  if(context.exeInfo.serviceMeta.output[channelName]){
    channelOutput = context.exeInfo.serviceMeta.output[channelName]; 
  }
  const questions = [
    {
        name: 'BundleId',
        type: 'input',
        message: "The bundle id used for APNs Tokens.",
        default: channelOutput.BundleId,
    },
    {
        name: 'Certificate',
        type: 'input',
        message: "The distribution certificate from Apple.",
        default: channelOutput.Certificate,
    },
    {
        name: 'PrivateKey',
        type: 'input',
        message: "The certificate private key.",
        default: channelOutput.PrivateKey,
    },
    {
        name: 'DefaultAuthenticationMethod',
        type: 'input',
        message: "The default authentication method used for APNs.",
        default: channelOutput.DefaultAuthenticationMethod,
    },
    {
        name: 'TeamId',
        type: 'input',
        message: "The team id used for APNs Tokens.",
        default: channelOutput.TeamId,
    },
    {
        name: 'TokenKey',
        type: 'input',
        message: "The token key used for APNs Tokens.",
        default: channelOutput.TokenKey,
    },
    {
        name: 'TokenKeyId',
        type: 'input',
        message: "The token key id used for APNs Tokens.",
        default: channelOutput.TokenKeyId,
    }
  ];
  const answers = await inquirer.prompt(questions);

  const params = {
    ApplicationId: context.exeInfo.serviceMeta.output.Id,
    APNSChannelRequest: {
      Enabled: true,
      ...answers
    },
  };
  console.log(params); 
  
  return new Promise((resolve, reject) => {
    context.exeInfo.pinpointClient.updateApnsChannel(params, (err, data) => {
      if (err) {
        console.log('update channel error');
        reject(err);
      } else {
        console.log(`The ${channelName} channel has been successfully enabled.`);
        context.exeInfo.serviceMeta.output[channelName] = data.GCMChannelResponse; 
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
        console.log('update channel error');
        reject(err);
      } else {
        console.log(`The ${channelName} channel has been disabled.`);
        context.exeInfo.serviceMeta.output[channelName] = data.GCMChannelResponse; 
        resolve(data);
      }
    });
  });
}


module.exports = {
  run,
};
