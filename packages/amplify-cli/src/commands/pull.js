const fs = require('fs-extra');

const { initializeEnv } = require('../lib/initialize-env');
const { attachBackend } = require('../lib/attach-backend');
const { normalizeInputParams } = require('../lib/input-params-manager');

module.exports = {
  name: 'pull',
  run: async context => {
    const currentAmplifyMetaFilePath = context.amplify.pathManager.getCurentAmplifyMetaFilePath(process.cwd());
    if (fs.existsSync(currentAmplifyMetaFilePath)) {
      await pull(context);
    } else {
      await attachBackend(context);
    }
  },
};

async function pull(context) {
  context.exeInfo = context.amplify.getProjectDetails();
  context.exeInfo.inputParams = constructInputParams(context);
  context.print.info('');
  context.print.info('Pre pull check:');
  const hasChanges = await context.amplify.showResourceTable();
  context.print.info('');

  context.exeInfo.forcePush = false;
  context.exeInfo.restoreBackend = !context.input.options['no-override'];

  if (hasChanges && context.exeInfo.restoreBackend) {
    context.print.warning('Local changes detected.');
    context.print.warning('Amplify pull will override your local changes with what is currently in the cloud.');
    if (!context.exeInfo.inputParams.yes) {
      context.print.info('It is recommended to perform a merge through codebase repository before you continue.');
      const confirmOverride = await context.amplify.confirmPrompt.run('Do you want to continue?', false);
      if (!confirmOverride) {
        process.exit(0);
      }
    }
  }

  await initializeEnv(context);
  context.print.success('Backend environment has been successfully pulled from the cloud.');
  context.print.info('');
  context.print.info('Post pull status:');
  await context.amplify.showResourceTable();
  context.print.info('');
}

function constructInputParams(context) {
  const inputParams = normalizeInputParams(context);

  if (inputParams.appId) {
    inputParams.amplify.appId = inputParams.appId;
    delete inputParams.appId;
  }

  if (inputParams.envName) {
    inputParams.amplify.envName = inputParams.envName;
    delete inputParams.envName;
  }

  if (inputParams['no-override'] !== undefined) {
    inputParams.amplify.noOverride = inputParams['no-override'];
    delete inputParams['no-override'];
  }

  return inputParams;
}
