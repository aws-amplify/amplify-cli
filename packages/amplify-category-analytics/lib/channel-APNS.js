const inquirer = require('inquirer');
const p8decoder = require('./p8decoder');
const p12decoder = require('./p12decoder');

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

  let APNSChannelRequest = { Enabled: true };

  let { DefaultAuthenticationMethod } = channelOutput; 

  let answer, keyConfig, certificateConfig; 

  answer = await inquirer.prompt(
    {
      name: 'DefaultAuthenticationMethod',
      type: 'list',
      message: 'The default authentication method used for APNs',
      choices: ['Key', 'Certificate'],
      default: DefaultAuthenticationMethod ? DefaultAuthenticationMethod : 'Certificate',
    }
  );

  APNSChannelRequest.DefaultAuthenticationMethod = answer.DefaultAuthenticationMethod;

  if(APNSChannelRequest.DefaultAuthenticationMethod == 'Key') {
    keyConfig = await configureKey(context); 
    answers = await inquirer.prompt({
      name: 'configureCertificate',
      type: 'confirm',
      message: `Also configure the Certificate authenticate method`,
      default: false,
    });
    if (answer.configureCertificate) {
      certificateConfig = await configureCertificate(context);
    }
  }else{
    certificateConfig = await configureCertificate(context);
    answers = await inquirer.prompt({
      name: 'configureKey',
      type: 'confirm',
      message: `Also configure the Key authenticate method`,
      default: false,
    });
    if (answer.configureKey) {
      keyConfig = await configureKey(context); 
    }
  }

  Object.assign(APNSChannelRequest, keyConfig, certificateConfig);
  
  const params = {
    ApplicationId: context.exeInfo.serviceMeta.output.Id,
    APNSChannelRequest
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

async function configureKey(context){
  const questions = [
    {
      name: 'BundleId',
      type: 'input',
      message: 'The bundle id used for APNs Tokens: ',
    },
    {
      name: 'TeamId',
      type: 'input',
      message: 'The team id used for APNs Tokens: ',
    },
    {
      name: 'TokenKey',
      type: 'input',
      message: 'The token key used for APNs Tokens: ',
    },
    {
      name: 'TokenKeyId',
      type: 'input',
      message: 'The token key id used for APNs Tokens: ',
    },
  ];
  answers = await inquirer.prompt(questions);
  return answers; 
}

async function configureCertificate(context){
  const questions = [
    {
      name: 'Certificate',
      type: 'input',
      message: 'The distribution certificate from Apple.',
    },
    {
      name: 'PrivateKey',
      type: 'input',
      message: 'The certificate private key.',
    }
  ];
  answers = await inquirer.prompt(questions);
  return answers; 
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
