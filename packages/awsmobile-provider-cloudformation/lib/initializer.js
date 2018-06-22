const aws = require('aws-sdk');
const moment = require('moment');
const path = require('path');
const fs = require('fs-extra');
const ora = require('ora'); 
const constants = require('../constants');
const configurationManager = require('./configuration-manager');

function run(context) {
  return configurationManager.init(context)
    .then(ctxt => new Promise((resolve, reject) => {
      const awscfn = getConfiguredAwsCfnClient(ctxt);
      const initTemplateFilePath = path.join(__dirname, 'rootStackTemplate.json');
      const timeStamp = `-${moment().format('YYYYMMDDHHmmss')}`;
      const stackName = ctxt.initInfo.projectName + timeStamp;
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

      const spinner = ora('Creating root stack');
      spinner.start(); 
      awscfn.createStack(params, (err, data) => {
        if (err) {
            spinner.fail('Root stack creation failed'); 
            return reject(err);
        }
    
        const waitParams = {
            StackName: stackName
        }; 
        spinner.start('Waiting for root stack creation to complete'); 
        awscfn.waitFor('stackCreateComplete', waitParams, (waitErr, waitData)=>{
            if(waitErr){
                spinner.fail('Root stack creation failed'); 
                return reject(waitErr); 
            }
            spinner.succeed('Successfully created the root stack'); 
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
    let metaData = {}; 
    const {Outputs} = stackDescriptiondata.Stacks[0]; 
    Outputs.forEach(element => {
        metaData[element.OutputKey] = element.OutputValue; 
    });
    context.initInfo.metaData.provider = {};
    context.initInfo.metaData.provider[constants.ProviderName] = metaData;
}

function onInitSuccessful(context) {
  configurationManager.onInitSuccessful(context);
  stampAmplifyRunControl(context.initInfo.projectPath, context.initInfo.metaData);
}

function stampAmplifyRunControl(projectPath, metaData) {
  const filePath = path.join(projectPath, '.amplifyrc');
  const jsonString = JSON.stringify(metaData, null, 4);
  fs.writeFileSync(filePath, jsonString, 'utf8');
}

module.exports = {
  run,
  onInitSuccessful,
};
