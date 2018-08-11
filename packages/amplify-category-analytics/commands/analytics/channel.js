const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');


const subcommand = 'channel';
const category = 'analytics';
const providerName = 'awscloudformation';

const channelWorkers = {
  APN: '../../lib/channel-APN',
  GCM: '../../lib/channel-GCM',
  Email: '../../lib/channel-email',
  SMS: '../../lib/channel-sms',
};

module.exports = {
  name: subcommand,
  run: async (context) => {
    context.exeInfo = context.amplify.getProjectDetails();

    if (checkPinpointEnabled(context)) {
      context.exeInfo.pinpointClient = await getPinpointClient(context);

      const availableChannels = Object.keys(channelWorkers);
      let channel = context.parameters.first;
      if (!(channel && availableChannels.includes(channel))) {
        const answer = await inquirer.prompt({
          name: 'selection',
          type: 'list',
          message: 'Please select the engagement channel to configure.',
          choices: availableChannels,
          default: availableChannels[0],
        });
        channel = answer.selection;
      }

      const channelWorker = require(path.join(__dirname, channelWorkers[channel]));
      await channelWorker.run(context);
      updateaServiceMeta(context);
      return context;
    }
    context.print.error('No Pinpoint app is associated with your backend');
    context.print.info('Please anable analytics category, and push to the cloud first');
  },
};

function checkPinpointEnabled(context) {
  let result = false;
  const { amplifyMeta } = context.exeInfo;
  if (amplifyMeta[category]) {
    const services = Object.keys(amplifyMeta[category]);

    for (let i = 0; i < services.length; i++) {
      if (amplifyMeta[category][services[i]].service === 'Pinpoint') {
        result = true;
        context.exeInfo.serviceMeta = amplifyMeta[category][services[i]];
        break;
      }
    }
  }
  return result;
}

async function getPinpointClient(context) {
  const { projectConfig } = context.exeInfo;
  const provider = require(projectConfig.providers[providerName]);
  const aws = await provider.getConfiguredAWSClient(context);
  return new aws.Pinpoint();
}


async function updateaServiceMeta(context) {
  const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
  const jsonString = JSON.stringify(context.exeInfo.amplifyMeta, null, '\t');
  fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');
}
