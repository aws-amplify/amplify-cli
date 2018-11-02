const fs = require('fs-extra');

module.exports = {
  name: 'remove',
  run: async (context) => {
    const envName = context.parameters.options.name;
    if (!envName) {
      context.print.error('You must pass in the name of the environment using the --name flag');
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
      const envProviderFilepath = context.amplify.pathManager.getProviderInfoFilePath();
      const jsonString = JSON.stringify(allEnvs, null, '\t');
      fs.writeFileSync(envProviderFilepath, jsonString, 'utf8');
      context.print.success('Successfully removed environment from your project');
    }
  },
};
