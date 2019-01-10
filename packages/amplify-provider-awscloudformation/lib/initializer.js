const moment = require('moment');
const path = require('path');
const fs = require('fs-extra');
const ora = require('ora');
const Cloudformation = require('../src/aws-utils/aws-cfn');
const constants = require('./constants');
const configurationManager = require('./configuration-manager');
const systemConfigManager = require('./system-config-manager');

async function run(context) {
  await configurationManager.init(context);
  const configuredAwsClient = await getConfiguredAwsCfnClient(context);
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
  return new Cloudformation(context, configuredAwsClient, 'init')
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

async function getConfiguredAwsCfnClient(context) {
  process.env.AWS_SDK_LOAD_CONFIG = true;
  const aws = require('aws-sdk');
  if (context.projectConfigInfo.action === 'init') {
    const { config } = context.projectConfigInfo;
    if (config.useProfile) {
      const awsConfig = await systemConfigManager.getProfiledAwsConfig(config.profileName);
      aws.config.update(awsConfig);
    } else {
      aws.config.update({
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        region: config.region,
      });
    }
  }
  return aws;
}

function processStackCreationData(context, stackDescriptiondata) {
  const metaData = {};
  const { Outputs } = stackDescriptiondata.Stacks[0];
  Outputs.forEach((element) => {
    metaData[element.OutputKey] = element.OutputValue;
  });

  if (!context.exeInfo.metaData.providers) {
    context.exeInfo.metaData.providers = {};
  }
  context.exeInfo.metaData.providers[constants.ProviderName] = metaData;

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
