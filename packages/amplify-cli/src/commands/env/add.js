const fs = require('fs-extra');

module.exports = {
  name: 'add',
  run: async (context) => {
    const envName = context.parameters.options.name;
    const config = JSON.parse(context.parameters.options.config);

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
      const jsonString = JSON.stringify(allEnvs, null, '\t');
      fs.writeFileSync(envProviderFilepath, jsonString, 'utf8');
      context.print.success('Successfully added environment from your project');
    };

    if (envFound) {
      if (await context.prompt.confirm('We found an environment with the same name. Do you want to overwrite existing enviornment config?')) {
        addNewEnvConfig();
      }
    } else {
      addNewEnvConfig();
    }
  },
};
