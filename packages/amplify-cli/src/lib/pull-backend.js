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
    context.print.warning('Pulling changes from the cloud will override your local changes.');
    if (!context.exeInfo.inputParams.yes) {
      const confirmOverride = await context.amplify.confirmPrompt.run('Are you sure you would like to continue?', false);
      if (!confirmOverride) {
        context.print.info(`Run an 'amplify push' to update your project upstream.`);
        context.print.info('However, this will override upstream changes to this backend environment with your local changes.');
        context.print.info(
          `To merge local and upstream changes, commit all backend code changes to Git, perform a merge, resolve conflicts, and then run 'amplify push'.`
        );
        process.exit(0);
      }
    }
  }

  await initializeEnv(context);
  ensureBackendConfigFile(context);
  await postPullCodeGenCheck(context);
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
