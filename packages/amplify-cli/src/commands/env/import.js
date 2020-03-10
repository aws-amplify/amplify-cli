const fs = require('fs-extra');
const path = require('path');
const { readJsonFile } = require('../../extensions/amplify-helpers/read-json-file');

module.exports = {
  name: 'import',
  run: async context => {
    const envName = context.parameters.options.name;
    if (!envName) {
      context.print.error('You must pass in the name of the environment using the --name flag');
      process.exit(1);
    }

    let config;
    try {
      config = JSON.parse(context.parameters.options.config);
      let awsCF = config.awscloudformation;
      if (
        !(
          config.hasOwnProperty('awscloudformation') &&
          awsCF.hasOwnProperty('Region') &&
          awsCF.Region &&
          awsCF.hasOwnProperty('DeploymentBucketName') &&
          awsCF.DeploymentBucketName &&
          awsCF.hasOwnProperty('UnauthRoleName') &&
          awsCF.UnauthRoleName &&
          awsCF.hasOwnProperty('StackName') &&
          awsCF.StackName &&
          awsCF.hasOwnProperty('StackId') &&
          awsCF.StackId &&
          awsCF.hasOwnProperty('AuthRoleName') &&
          awsCF.AuthRoleName &&
          awsCF.hasOwnProperty('UnauthRoleArn') &&
          awsCF.UnauthRoleArn &&
          awsCF.hasOwnProperty('AuthRoleArn') &&
          awsCF.AuthRoleArn
        )
      ) {
        throw 'The provided config was invalid or incomplete';
      }
    } catch (e) {
      context.print.error('You must pass in the configs of the environment in an object format using the --config flag');
      process.exit(1);
    }

    let awsInfo;
    if (context.parameters.options.awsInfo) {
      try {
        awsInfo = JSON.parse(context.parameters.options.awsInfo);
      } catch (e) {
        context.print.error(
          'You must pass in the AWS credential info in an object format for intializating your environment using the --awsInfo flag',
        );
        process.exit(1);
      }
    }

    const allEnvs = context.amplify.getEnvDetails();

    const addNewEnvConfig = () => {
      const envProviderFilepath = context.amplify.pathManager.getProviderInfoFilePath();
      allEnvs[envName] = config;
      let jsonString = JSON.stringify(allEnvs, null, '\t');
      fs.writeFileSync(envProviderFilepath, jsonString, 'utf8');

      const dotConfigDirPath = context.amplify.pathManager.getDotConfigDirPath();
      const configInfoFilePath = path.join(dotConfigDirPath, 'local-aws-info.json');

      let envAwsInfo = {};
      if (fs.existsSync(configInfoFilePath)) {
        envAwsInfo = readJsonFile(configInfoFilePath);
      }

      envAwsInfo[envName] = awsInfo;
      jsonString = JSON.stringify(envAwsInfo, null, 4);
      fs.writeFileSync(configInfoFilePath, jsonString, 'utf8');

      context.print.success('Successfully added environment from your project');
    };

    if (allEnvs.hasOwnProperty(envName)) {
      if (context.parameters.options.yes) {
        addNewEnvConfig();
      } else if (
        await context.amplify.confirmPrompt.run(
          'We found an environment with the same name. Do you want to overwrite the existing environment config?',
        )
      ) {
        addNewEnvConfig();
      }
    } else {
      addNewEnvConfig();
    }
  },
};
