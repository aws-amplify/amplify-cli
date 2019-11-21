const fs = require('fs-extra');
const { initializeEnv } = require('./initialize-env');
const { postPullCodeGenCheck } = require('./amplify-service-helper');

async function pullBackend(context, inputParams) {
  context.exeInfo = context.amplify.getProjectDetails();
  context.exeInfo.inputParams = inputParams;
  context.print.info('');
  context.print.info('Pre-pull status:');
  const hasChanges = await context.amplify.showResourceTable();
  context.print.info('');

  context.exeInfo.forcePush = false;
  context.exeInfo.restoreBackend = !context.exeInfo.inputParams.amplify.noOverride;

  if (hasChanges && context.exeInfo.restoreBackend) {
    context.print.warning('Local changes detected.');
    context.print.warning('Amplify pull will override your local changes with what is currently in the cloud.');
    if (!context.exeInfo.inputParams.yes) {
      const confirmOverride = await context.amplify.confirmPrompt.run('Do you want to continue?', false);
      if (!confirmOverride) {
        context.print.info(`Run an 'amplify push' to update your project upstream.`);
        context.print.info('This will override changes made upstream.');
        context.print.info('If you would like to merge changes with upstream, use Git to merge your backend code changes.');
        process.exit(0);
      }
    }
  }

  await initializeEnv(context);
  ensureBackendConfigFile(context);
  await postPullCodeGenCheck(context);
  context.print.success('Backend environment has been successfully pulled from the cloud.');
  context.print.info('');
  context.print.info('Post-pull status:');
  await context.amplify.showResourceTable();
  context.print.info('');
}

function ensureBackendConfigFile(context) {
  const { projectPath } = context.exeInfo.localEnvInfo;
  const backendConfigFilePath = context.amplify.pathManager.getBackendConfigFilePath(projectPath);
  if (!fs.existsSync(backendConfigFilePath)) {
    fs.writeFileSync(backendConfigFilePath, '{}', 'utf8');
  }
}

module.exports = {
  pullBackend,
};
