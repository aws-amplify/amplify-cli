const aws = require('aws-sdk');
const moment = require('moment');
const path = require('path');
const fs = require('fs-extra');
const ora = require('ora');
const Cloudformation = require('../src/aws-utils/aws-cfn');
const constants = require('./constants');
const configurationManager = require('./configuration-manager');

async function run(context) {
  await configurationManager.init(context);
  const awscfn = getConfiguredAwsCfnClient(context);
  const initTemplateFilePath = path.join(__dirname, 'rootStackTemplate.json');
  const timeStamp = `-${moment().format('YYYYMMDDHHmmss')}`;
  const stackName = normalizeStackName(context.exeInfo.projectConfig.projectName + timeStamp);
  const deploymentBucketName = `${stackName}-deployment`;
  const authRoleName = `${stackName}-authRole`;
  const unauthRoleName = `${stackName}-unauthRole`;
  const params = {
    StackName: stackName,
    Capabilities: ['CAPABILITY_NAMED_IAM'],
    TemplateBody: fs.readFileSync(initTemplateFilePath).toString(),
    Parameters: [
      {
        ParameterKey: 'DeploymentBucketName',
        ParameterValue: deploymentBucketName,
      },
      {
        ParameterKey: 'AuthRoleName',
        ParameterValue: authRoleName,
      },
      {
        ParameterKey: 'UnauthRoleName',
        ParameterValue: unauthRoleName,
      },
    ],
  };

  const spinner = ora();
  spinner.start('Initializing project in the cloud...');
  return new Cloudformation(context, awscfn, 'init')
    .then(cfnItem => cfnItem.createResourceStack(params))
    .then((waitData) => {
      processStackCreationData(context, waitData);
      spinner.succeed('Successfully created initial AWS cloud resources for deployments.');
      return context;
    })
    .catch((e) => {
      spinner.fail('Root stack creation failed');
      throw e;
    });
}

function getConfiguredAwsCfnClient(context) {
  const { awsConfigInfo } = context.exeInfo;
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

function processStackCreationData(context, stackDescriptiondata) {
  const metaData = {};
  const { Outputs } = stackDescriptiondata.Stacks[0];
  Outputs.forEach((element) => {
    metaData[element.OutputKey] = element.OutputValue;
  });

  if (!context.exeInfo.amplifyMeta.providers) {
    context.exeInfo.amplifyMeta.providers = {};
  }
  context.exeInfo.amplifyMeta.providers[constants.ProviderName] = metaData;

  if (!context.exeInfo.rcData.providers) {
    context.exeInfo.rcData.providers = {};
  }
  context.exeInfo.rcData.providers[constants.ProviderName] = metaData;
}

function onInitSuccessful(context) {
  return new Promise((resolve) => {
    configurationManager.onInitSuccessful(context);
    resolve(context);
  });
}

function normalizeStackName(stackName) {
  let result = stackName.replace(/[^-a-z0-9]/g, '');
  if (/^[^a-zA-Z]/.test(result) || result.length === 0) {
    result = `a${result}`;
  }
  return result;
}

module.exports = {
  run,
  onInitSuccessful,
};
