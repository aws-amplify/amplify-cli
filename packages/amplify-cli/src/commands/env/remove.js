const fs = require('fs-extra');
const path = require('path');
const ora = require('ora');
const { readJsonFile } = require('../../extensions/amplify-helpers/read-json-file');

module.exports = {
  name: 'remove',
  run: async (context) => {
    const envName = context.parameters.first;
    const currentEnv = context.amplify.getEnvInfo().envName;

    if (!envName) {
      context.print.error("You must pass in the name of the environment as a part of the 'amplify env remove <env-name>' command");
      process.exit(1);
    }
    let envFound = false;
    const allEnvs = context.amplify.getEnvDetails();


    Object.keys(allEnvs).forEach((env) => {
      if (env === envName) {
        envFound = true;
        delete allEnvs[env];
      }
    });

    if (!envFound) {
      context.print.error('No environment found with the corresponding name provided');
    } else {
      if (currentEnv === envName) {
        context.print.error('You cannot delete your current environment. Please switch to another environment to delete your current environment');
        context.print.error("If this is your only environment you can use the 'amplify delete' command to delete your project");
        process.exit(1);
      }

      if (await context.amplify.confirmPrompt.run('Do you also want to remove all the resources of the environment from the cloud?')) {
        const spinner = ora('Deleting resources from the cloud. This may take a few minutes...');
        spinner.start();
        await context.amplify.removeEnvFromCloud(context, envName);
        spinner.succeed('Successfully removed environment from the cloud');
      }

      // Remove from team-provider-info
      const envProviderFilepath = context.amplify.pathManager.getProviderInfoFilePath();
      let jsonString = JSON.stringify(allEnvs, null, '\t');
      fs.writeFileSync(envProviderFilepath, jsonString, 'utf8');

      // Remove entry from aws-info
      const dotConfigDirPath = context.amplify.pathManager.getDotConfigDirPath();
      const awsInfoFilePath = path.join(dotConfigDirPath, 'local-aws-info.json');
      const awsInfo = readJsonFile(awsInfoFilePath);
      if (awsInfo[envName]) {
        delete awsInfo[envName];
        jsonString = JSON.stringify(awsInfo, null, '\t');
        fs.writeFileSync(awsInfoFilePath, jsonString, 'utf8');
      }
      context.print.success('Successfully removed environment from your project locally');
    }
  },
};
