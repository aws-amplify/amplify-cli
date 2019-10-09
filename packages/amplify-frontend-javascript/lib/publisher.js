const path = require('path');
const builder = require('./builder');
const constants = require('./constants');

const hostingPlugin = 'amplify-category-hosting';
const publishService = 'S3AndCloudFront';

function run(context) {
  return builder
    .run(context)
    .then(publishToHostingBucket)
    .then(onSuccess)
    .catch(onFailure);
}

function publishToHostingBucket(context) {
  const { projectConfig } = context.exeInfo;
  const { projectPath } = context.amplify.getEnvInfo();
  const distributionDirName = projectConfig[constants.Label].config.DistributionDir;
  const distributionDirPath = path.join(projectPath, distributionDirName);
  const hostingPluginModule = require(context.amplify.getPlugin(context, hostingPlugin));
  return hostingPluginModule.publish(context, publishService, { distributionDirPath });
}

function onSuccess() {}

function onFailure(e) {
  throw e;
}

module.exports = {
  run,
};
