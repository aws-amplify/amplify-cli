const xrManager = require('./lib/xr-manager');
const inquirer = require('inquirer');
const xrManager = require('../../lib/xr-manager');

function console(context) {
  return xrManager.console(context);
}

async function initEnv(context) {
  // Ask to use same configuration from existing env
  const answer = await inquirer.prompt({
    name: 'useExistingEnvConfig',
    type: 'confirm',
    message: 'Would you like to use XR configuration from an existing environment?',
    default: true,
  });

  if (answer) {
    // if yes, list envs
    // get team provider info for env

    const envs = context.amplify.getAllEnvs();
    inquirer.prompt({
      name: 'envToCopy',
      message: 'Choose the environment configuration to use:',
      type: 'list',
      choices: envs,
    }).then((answer) => {
      context.print.info(answer);
    });
  } else {
    xrManager.addScene(context);
  }
  
  
  // if no, would you like to add a scene
  //   add scene

}

module.exports = {
  console,
  initEnv,
};