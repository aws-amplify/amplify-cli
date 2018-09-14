const fs = require('fs-extra');
const path = require('path');
const systemConfigManager = require('./system-config-manager');

/* const configSources = [
  'none',
  'EC2role',
  'profile-available'
  'profile-default',
  'envVar',
  'project',
]; */

function run(context) {
  let configSource = 'none';
  const systemConfigs = systemConfigManager.getFullConfig();
  if (systemConfigs && Object.keys(systemConfigs).length > 0) {
    configSource = 'profile-available';
  }
  if (systemConfigs && systemConfigs.default) {
    configSource = 'system';
  }
  if ((process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
        (process.env.AWS_PROFILE && systemConfigs &&
            systemConfigs[process.env.AWS_PROFILE.trim()])) {
    configSource = 'envVar';
  }
  try {
    const dotConfigDirPath = context.amplify.pathManager.getDotConfigDirPath();
    const configInfoFilePath = path.join(dotConfigDirPath, 'aws-info.json');
    if (fs.existsSync(configInfoFilePath)) {
      const configInfo = JSON.parse(fs.readFileSync(configInfoFilePath, 'utf8'));
      if (configInfo.useProfile && configInfo.profileName &&
            systemConfigs && systemConfigs[configInfo.profileName]) {
        configSource = 'project';
      } else if (configInfo.awsConfigFilePath && fs.existsSync(configInfo.awsConfigFilePath)) {
        configSource = 'project';
      }
    }
  } catch (e) {
    // no need to do anything, configSource stays the same as determined by previous steps.
  }

  return configSource;
}

module.exports = {
  run,
};
