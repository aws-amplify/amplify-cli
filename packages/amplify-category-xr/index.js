const xrManager = require('./lib/xr-manager');
const inquirer = require('inquirer');

function console(context) {
  return xrManager.console(context);
}

async function initEnv(context) {
  const currentEnvInfo = context.amplify.getEnvInfo();
  const thisEnvName = currentEnvInfo.envName;
  const allEnvs = context.amplify.getEnvDetails();

  // If the environment already has xr configured, exit
  if (allEnvs[thisEnvName].categories['xr']) {
    return;
  }

  const answer = await inquirer.prompt({
    name: 'useExistingEnvConfig',
    type: 'confirm',
    message: 'Would you like to use XR configuration from an existing environment?',
    default: false,
  });

  if (answer.useExistingEnvConfig) {
    const allEnvNames = context.amplify.getAllEnvs();
    const selectableEnvs = allEnvNames.filter(word => word != thisEnvName);
    await inquirer.prompt({
      name: 'envToUse',
      message: 'Choose the environment configuration to use:',
      type: 'list',
      choices: selectableEnvs,
    }).then((answer) => {
      const xrResources = allEnvs[answer.envToUse].categories['xr'];
      for (let [resource, config] of Object.entries(xrResources)) {
        const options = {
          service: 'Sumerian',
          output: config
        }
        context.amplify.saveEnvResourceParameters(context, 'xr', resource, config);
        context.amplify.updateamplifyMetaAfterResourceAdd('xr', resource, options);
      }
      context.print.info(`XR configuration from ${answer.envToUse} saved for ${thisEnvName}`);
    });
  } else {
    const answer = await inquirer.prompt({
      name: 'addXRResource',
      type: 'confirm',
      message: 'Would you like to add a new XR resource?',
    });

    if (answer.addXRResource) {
      await xrManager.addScene(context);
    }
  }
}

module.exports = {
  console,
  initEnv,
};