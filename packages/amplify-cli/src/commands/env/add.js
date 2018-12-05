const fs = require('fs-extra');
const path = require('path');

module.exports = {
  name: 'add',
  run: async (context) => {
    const envName = context.parameters.options.name;
    const config = JSON.parse(context.parameters.options.config);
    const awsInfo = JSON.parse(context.parameters.options.awsInfo);

    if (!envName) {
      context.print.error('You must pass in the name of the environment using the --name flag');
      process.exit(1);
    }

    if (!config) {
      context.print.error('You must pass in the configs of the environment using the --config flag');
      process.exit(1);
    }

    let envFound = false;
    const allEnvs = context.amplify.getEnvDetails();
    Object.keys(allEnvs).forEach((env) => {
      if (env === envName) {
        envFound = true;
      }
    });

    const addNewEnvConfig = () => {
      const envProviderFilepath = context.amplify.pathManager.getProviderInfoFilePath();
      allEnvs[envName] = config;
      let jsonString = JSON.stringify(allEnvs, null, '\t');
      fs.writeFileSync(envProviderFilepath, jsonString, 'utf8');

      const dotConfigDirPath = context.amplify.pathManager.getDotConfigDirPath();
      const configInfoFilePath = path.join(dotConfigDirPath, 'local-aws-info.json');

      let envAwsInfo = {};
      if (fs.existsSync(configInfoFilePath)) {
        envAwsInfo = JSON.parse(fs.readFileSync(configInfoFilePath));
      }

      envAwsInfo[envName] = awsInfo;
      jsonString = JSON.stringify(envAwsInfo, null, 4);
      fs.writeFileSync(configInfoFilePath, jsonString, 'utf8');

      context.print.success('Successfully added environment from your project');
    };

    if (envFound) {
      if (context.parameters.options.yes) {
        addNewEnvConfig();
      } else if (await context.amplify.confirmPrompt.run('We found an environment with the same name. Do you want to overwrite existing enviornment config?')) {
        addNewEnvConfig();
      }
    } else {
      addNewEnvConfig();
    }
  },
};
