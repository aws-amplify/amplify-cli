const path = require('path');
const builder = require('./builder');
const constants = require('./constants');

const hostingCategory = 'hosting';

async function run(context) {
  const { projectConfig, amplifyMeta } = context.exeInfo;
  const { projectPath } = context.amplify.getEnvInfo();
  const distributionDirName = projectConfig[constants.Label].config.DistributionDir;
  const distributionDirPath = path.join(projectPath, distributionDirName);
  let enabledHostingServices = [];

  if (amplifyMeta[hostingCategory] || Object.keys(amplifyMeta[hostingCategory]).length > 0) {
    enabledHostingServices = Object.keys(amplifyMeta[hostingCategory]);
  }

  if (!enabledHostingServices.includes('S3AndCloudFront') && !enabledHostingServices.includes('amplifyhosting')) {
    throw new Error('No hosting services are enabled for Javascript project.');
  }

  let frontendBuildComplete = false;
  if (enabledHostingServices.includes('S3AndCloudFront')) {
    await builder.run(context);
    frontendBuildComplete = true;

    const pluginInfo = context.amplify.getCategoryPluginInfo(context, 'hosting', 'S3AndCloudFront');
    const hostingPluginModule = require(pluginInfo.packageLocation);
    context.print.info('Publish started for S3AndCloudFront');
    await hostingPluginModule.publish(context, 'S3AndCloudFront', { distributionDirPath });
  }

  if (enabledHostingServices.includes('amplifyhosting')) {
    const pluginInfo = context.amplify.getCategoryPluginInfo(context, 'hosting', 'amplifyhosting');
    const hostingPluginModule = require(pluginInfo.packageLocation);
    context.print.info('Publish started for amplifyhosting');
    await hostingPluginModule.publish(context, 'amplifyhosting', { doSkipBuild: frontendBuildComplete });
  }
}

module.exports = {
  run,
};
