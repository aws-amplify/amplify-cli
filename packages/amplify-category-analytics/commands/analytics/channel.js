const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');

const pinpointHelper = require('../../lib/pinpoint-helper');


const subcommand = 'channel';
const category = 'analytics';
const providerName = 'awscloudformation';

const channelWorkers = {
  APNS: '../../lib/channel-APNS',
  GCM: '../../lib/channel-GCM',
  Email: '../../lib/channel-Email',
  SMS: '../../lib/channel-SMS',
};

module.exports = {
  name: subcommand,
  run: async (context) => {
    context.exeInfo = context.amplify.getProjectDetails();

    if (pinpointHelper.checkPinpointEnabled(context)) {
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
