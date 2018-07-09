const aws = require('aws-sdk');
const moment = require('moment');
const path = require('path');
const fs = require('fs-extra');
const ora = require('ora');
const constants = require('./constants');
const configurationManager = require('./configuration-manager');

function run(context) {
  return configurationManager.init(context)
    .then(ctxt => new Promise((resolve, reject) => {
      const awscfn = getConfiguredAwsCfnClient(ctxt);
      const initTemplateFilePath = path.join(__dirname, 'rootStackTemplate.json');
      const timeStamp = `-${moment().format('YYYYMMDDHHmmss')}`;
      const stackName = normalizeStackName(ctxt.exeInfo.projectConfig.projectName + timeStamp);
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

      const spinner = ora('Creating root stack');
      spinner.start();
      awscfn.createStack(params, (err) => {
        if (err) {
          spinner.fail('Root stack creation failed');
          return reject(err);
        }

        const waitParams = {
          StackName: stackName,
        };
        spinner.start('Initializing project in the cloud...');
        awscfn.waitFor('stackCreateComplete', waitParams, (waitErr, waitData) => {
          if (waitErr) {
            spinner.fail('Root stack creation failed');
            return reject(waitErr);
          }
          spinner.succeed('Successfully created initial AWS cloud resources for deployments.');
          processStackCreationData(ctxt, waitData);
          resolve(ctxt);
        });
      });
    }));
}

function getConfiguredAwsCfnClient(context) {
  const { projectConfigInfo } = context;
  process.env.AWS_SDK_LOAD_CONFIG = true;
  if (projectConfigInfo.action === 'init') {
    if (projectConfigInfo.useProfile && projectConfigInfo.profileName) {
      process.env.AWS_PROFILE = projectConfigInfo.profileName;
    } else {
      aws.config.update({
        accessKeyId: projectConfigInfo.accessKeyId,
        secretAccessKey: projectConfigInfo.secretAccessKey,
        region: projectConfigInfo.region,
      });
    }
  }
  return new aws.CloudFormation();
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
