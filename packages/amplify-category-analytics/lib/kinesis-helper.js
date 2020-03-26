const open = require('open');
const constants = require('./constants');

function console(context) {
  const amplifyMeta = context.amplify.getProjectMeta();
  const { envName } = context.amplify.getEnvInfo();
  const region = context.amplify.getEnvDetails()[envName].awscloudformation.Region;

  const kinesisApp = scanCategoryMetaForKinesis(amplifyMeta[constants.CategoryName]);
  if (kinesisApp) {
    const { Id } = kinesisApp;
    const consoleUrl = `https://${region}.console.aws.amazon.com/kinesis/home?region=${region}#/streams/details?streamName=${Id}&tab=details`;
    open(consoleUrl, { wait: false });
  } else {
    context.print.error('Kinesis is not enabled in the cloud.');
  }
}

function scanCategoryMetaForKinesis(categoryMeta) {
  // single kinesis resource for now
  let result;
  if (categoryMeta) {
    const services = Object.keys(categoryMeta);
    for (let i = 0; i < services.length; i++) {
      const serviceMeta = categoryMeta[services[i]];
      if (serviceMeta.service === constants.KinesisName && serviceMeta.output && serviceMeta.output.kinesisStreamId) {
        result = {
          Id: serviceMeta.output.kinesisStreamId,
        };
        if (serviceMeta.output.Name) {
          result.Name = serviceMeta.output.Name;
        } else if (serviceMeta.output.appName) {
          result.Name = serviceMeta.output.appName;
        }

        if (serviceMeta.output.Region) {
          result.Region = serviceMeta.output.Region;
        }
        break;
      }
    }
  }
  return result;
}

function hasResource(context) {
  const amplifyMeta = context.amplify.getProjectMeta();
  return scanCategoryMetaForKinesis(amplifyMeta[constants.CategoryName]) !== undefined;
}

module.exports = {
  console,
  hasResource,
};
