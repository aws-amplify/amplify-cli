const aws = require('aws-sdk');
const path = require('path');
const fs = require('fs-extra');
const constants = require('./constants');
const Cloudformation = require('../src/aws-utils/aws-cfn');

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

  const awscfn = getConfiguredAwsCfnClient(awsConfigInfo);

  return new Cloudformation(context, awscfn)
    .then(cfnItem => cfnItem.deleteResourceStack(envName));
}

function getConfiguredAwsCfnClient(awsConfigInfo) {
  process.env.AWS_SDK_LOAD_CONFIG = true;
  if (awsConfigInfo.config.useProfile && awsConfigInfo.config.profileName) {
    process.env.AWS_PROFILE = awsConfigInfo.config.profileName;
    const credentials = new aws.SharedIniFileCredentials({
      profile: awsConfigInfo.config.profileName,
    });
    aws.config.credentials = credentials;
  } else {
    aws.config.update({
      accessKeyId: awsConfigInfo.config.accessKeyId,
      secretAccessKey: awsConfigInfo.config.secretAccessKey,
      region: awsConfigInfo.config.region,
    });
  }
  return aws;
}

module.exports = {
  run,
};
