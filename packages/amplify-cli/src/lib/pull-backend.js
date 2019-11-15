const { initializeEnv } = require('./initialize-env');
const { constructInputParams, postPullCodeGenCheck } = require('./amplify-service-helper');

async function pullBackend(context) {
  context.exeInfo = context.amplify.getProjectDetails();
  context.exeInfo.inputParams = constructInputParams(context);
  context.print.info('');
  context.print.info('Pre pull check:');
  const hasChanges = await context.amplify.showResourceTable();
  context.print.info('');

  context.exeInfo.forcePush = false;
  context.exeInfo.restoreBackend = !context.exeInfo.inputParams.amplify.noOverride;

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
  await postPullCodeGenCheck(context);
  context.print.success('Backend environment has been successfully pulled from the cloud.');
  context.print.info('');
  context.print.info('Post pull status:');
  await context.amplify.showResourceTable();
  context.print.info('');
}

module.exports = {
  pullBackend,
};
