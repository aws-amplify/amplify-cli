const fs = require('fs-extra');
const { getProjectConfig } = require('./get-project-config');
const { showResourceTable } = require('./resource-status');
const { onCategoryOutputsChange } = require('./on-category-outputs-change');
const { initializeEnv } = require('../../lib/initialize-env');

async function pushResources(context, category, resourceName) {
  if (context.parameters.options.env) {
    const envName = context.parameters.options.env;
    const allEnvs = context.amplify.getAllEnvs(context);
    if (allEnvs.findIndex(env => env === envName) !== -1) {
      context.exeInfo = {};
      context.exeInfo.noPush = true;
      const projectConfigFilePath = context.amplify.pathManager.getProjectConfigFilePath();
      if (fs.existsSync(projectConfigFilePath)) {
        context.exeInfo.projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));
      }
      const envFilePath = context.amplify.pathManager.getLocalEnvFilePath();
      context.exeInfo.localEnvInfo = JSON.parse(fs.readFileSync(envFilePath));

      if (context.exeInfo.localEnvInfo.envName !== envName) {
        context.exeInfo.localEnvInfo.envName = envName;
        const jsonString = JSON.stringify(context.exeInfo.localEnvInfo, null, 4);
        const localEnvFilePath =
          context.amplify.pathManager.getLocalEnvFilePath(context.exeInfo.localEnvInfo.projectPath);
        fs.writeFileSync(localEnvFilePath, jsonString, 'utf8');
      }

      await initializeEnv(context);
    } else {
      context.print.error("Environment doesn't exist. Please use 'amplify init' to create a new environment");
      process.exit(1);
    }
  }


  await showResourceTable(category, resourceName);

  return context.prompt.confirm('Are you sure you want to continue?')
    .then((answer) => {
      if (answer) {
        const { providers } = getProjectConfig();
        const providerPromises = [];

        Object.keys(providers).forEach((providerName) => {
          const pluginModule = require(providers[providerName]);
          providerPromises.push(pluginModule.pushResources(context, category, resourceName));
        });

        return Promise.all(providerPromises);
      }
      process.exit(1);
    })
    .then(() => {
      onCategoryOutputsChange(context);
    })
    .catch((err) => {
      // Handle the errors and print them nicely for the user.
      context.print.error(`\n${err.message}`);
    });
}

module.exports = {
  pushResources,
};
