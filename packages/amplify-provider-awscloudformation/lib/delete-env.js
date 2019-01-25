const path = require('path');
const fs = require('fs-extra');
const constants = require('./constants');
const Cloudformation = require('../src/aws-utils/aws-cfn');
const systemConfigManager = require('./system-config-manager');

async function run(context, envName) {
  const dotConfigDirPath = context.amplify.pathManager.getDotConfigDirPath();
  const configInfoFilePath = path.join(dotConfigDirPath, constants.LocalAWSInfoFileName);

  const awsConfigInfo = {};
  if (fs.existsSync(configInfoFilePath)) {
    awsConfigInfo.config = JSON.parse(fs.readFileSync(configInfoFilePath))[envName];
  }

  if (!awsConfigInfo.config) {
    throw new Error('AWS credentials missing for the specified environment');
  }

  const awscfn = await getConfiguredAwsCfnClient(context, awsConfigInfo);

  return new Cloudformation(context, awscfn)
    .then(cfnItem => cfnItem.deleteResourceStack(envName));
}

async function getConfiguredAwsCfnClient(context, awsConfigInfo) {
  process.env.AWS_SDK_LOAD_CONFIG = true;
  const aws = require('aws-sdk');
  let awsconfig;
  if (awsConfigInfo.config.useProfile) {
    awsconfig = await systemConfigManager.getProfiledAwsConfig(context, awsConfigInfo.config.profileName);
  } else {
    awsconfig = {
      accessKeyId: awsConfigInfo.config.accessKeyId,
      secretAccessKey: awsConfigInfo.config.secretAccessKey,
      region: awsConfigInfo.config.region,
    };
  }
  aws.config.update(awsconfig);
  return aws;
}

module.exports = {
  run,
};
