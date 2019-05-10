const moment = require('moment');
const path = require('path');
const archiver = require('../src/utils/archiver');
const fs = require('fs-extra');
const ora = require('ora');
const Cloudformation = require('../src/aws-utils/aws-cfn');
const S3 = require('../src/aws-utils/aws-s3');
const constants = require('./constants');
const configurationManager = require('./configuration-manager');
const systemConfigManager = require('./system-config-manager');

async function run(context) {
  await configurationManager.init(context);
  if (!context.exeInfo || (context.exeInfo.isNewEnv)) {
    const initTemplateFilePath = path.join(__dirname, 'rootStackTemplate.json');
    const timeStamp = `${moment().format('YYYYMMDDHHmmss')}`;
    const { envName = '' } = context.exeInfo.localEnvInfo;
    const stackName = normalizeStackName(`${context.exeInfo.projectConfig.projectName}-${envName}-${timeStamp}`);
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
    const awsConfig = await getAWSConfig(context);
    return new Cloudformation(context, { awsConfig }, 'init')
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
}

async function getAWSConfig(context) {
  const { awsConfigInfo } = context.exeInfo;
  let awsConfig;
  if (awsConfigInfo.config.useProfile) {
    awsConfig =
      await systemConfigManager.getProfiledAwsConfig(context, awsConfigInfo.config.profileName);
  } else {
    awsConfig = {
      accessKeyId: awsConfigInfo.config.accessKeyId,
      secretAccessKey: awsConfigInfo.config.secretAccessKey,
      region: awsConfigInfo.config.region,
    };
  }
  return awsConfig;
}

function processStackCreationData(context, stackDescriptiondata) {
  const metaData = {};
  const { Outputs } = stackDescriptiondata.Stacks[0];
  Outputs.forEach((element) => {
    metaData[element.OutputKey] = element.OutputValue;
  });
  context.exeInfo.amplifyMeta = {};
  if (!context.exeInfo.amplifyMeta.providers) {
    context.exeInfo.amplifyMeta.providers = {};
  }
  context.exeInfo.amplifyMeta.providers[constants.ProviderName] = metaData;

  if (context.exeInfo.isNewEnv) {
    const { envName } = context.exeInfo.localEnvInfo;
    context.exeInfo.teamProviderInfo[envName] = {};
    context.exeInfo.teamProviderInfo[envName][constants.ProviderName] = metaData;
  }
}

async function onInitSuccessful(context) {
  configurationManager.onInitSuccessful(context);
  if (context.exeInfo.isNewEnv) {
    context = await storeCurrentCloudBackend(context);
  }
  return context;
}

function storeCurrentCloudBackend(context) {
  const zipFilename = '#current-cloud-backend.zip';
  const backendDir = context.amplify.pathManager.getBackendDirPath();
  const tempDir = `${backendDir}/.temp`;
  const currentCloudBackendDir = context.exeInfo ?
    `${context.exeInfo.localEnvInfo.projectPath}/amplify/#current-cloud-backend` :
    context.amplify.pathManager.getCurrentCloudBackendDirPath();

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const zipFilePath = path.normalize(path.join(tempDir, zipFilename));
  return archiver.run(currentCloudBackendDir, zipFilePath)
    .then((result) => {
      const s3Key = `${result.zipFilename}`;
      return new S3(context)
        .then((s3) => {
          const s3Params = {
            Body: fs.createReadStream(result.zipFilePath),
            Key: s3Key,
          };
          return s3.uploadFile(s3Params);
        });
    })
    .then(() => {
      fs.removeSync(tempDir);
      return context;
    });
}

function normalizeStackName(stackName) {
  let result = stackName.toLowerCase().replace(/[^-a-z0-9]/g, '');
  if (/^[^a-zA-Z]/.test(result) || result.length === 0) {
    result = `a${result}`;
  }
  return result;
}

module.exports = {
  run,
  onInitSuccessful,
};
