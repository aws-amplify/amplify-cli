const moment = require('moment');
const fs = require('fs-extra');
const path = require('path');
const Cloudformation = require('../src/aws-utils/aws-cfn');
const configurationManager = require('./configuration-manager');
const providerName = require('../constants').ProviderName;

function run(context) {
  const config = configurationManager.getConfiguration(context);
  const initTemplateFilePath = `${__dirname}/rootStackTemplate.json`;
  const timeStamp = `-${moment().format('YYYYMMDDHHmmss')}`;
  const stackName = context.initInfo.projectName + timeStamp;
  const deploymentBucketName = `${stackName}-deployment`;
  const params = {
    StackName: stackName,
    TemplateBody: fs.readFileSync(initTemplateFilePath).toString(),
    Parameters: [
      {
        ParameterKey: 'DeploymentBucketName',
        ParameterValue: deploymentBucketName,
      },
    ],
  };

  return new Cloudformation(context)
    .then(cfnItem => cfnItem.createResourceStack(params))
    .then((data) => {
      processStackCreationData(context, config.region, params, data);
      return context;
    });
}

function processStackCreationData(context, region, params, data) {
  const metaData = {
    Region: region,
    StackId: data.StackId,
    StackName: params.StackName,
    DeploymentBucket: params.Parameters[0].ParameterValue,
  };
  context.initInfo.metaData.provider = {};
  context.initInfo.metaData.provider[providerName] = metaData;

  stampAmplifyRunControl(context.initInfo.projectPath, metaData);
}

function stampAmplifyRunControl(projectPath, metaData) {
  const filePath = path.join(projectPath, '.amplifyrc');
  const jsonString = JSON.stringify(metaData, null, 4);
  fs.writeFileSync(filePath, jsonString, 'utf8');
}

module.exports = {
  run,
};
