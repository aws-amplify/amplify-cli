const fs = require('fs-extra');
const { initializeEnv } = require('../lib/initialize-env');
const { attachBackend } = require('../lib/attach-backend');

module.exports = {
  name: 'pull',
  run: async context => {
    const amplifyDirPath = context.amplify.pathManager.getAmplifyDirPath(process.cwd());

    if (fs.existsSync(amplifyDirPath)) {
      await pull(context);
    } else {
      await attachBackend(context);
    }
  },
};

async function pull(context) {
  context.amplify.constructExeInfo(context);
  context.exeInfo.forcePush = false;
  context.exeInfo.restoreBackend = false;

  await initializeEnv(context);

  context.print.info('Resource status:');
  const hasChanges = await context.amplify.showResourceTable();

  if (hasChanges) {
    context.print.info('');
    context.print.warning('Local changes detected.');
    const confirmOverride = await context.amplify.confirmPrompt.run(
      'Do you want to override local changes with the current cloud version?',
      false
    );
    if (confirmOverride) {
      context.amplify.constructExeInfo(context);
      context.exeInfo.forcePush = false;
      context.exeInfo.restoreBackend = true;
      await initializeEnv(context);
      context.print.success('Restored your local backend with the current cloud version.');
      context.print.info('');
    } else {
      context.print.info("Run 'amplify push' to push your local changes to the cloud.");
      context.print.info('');
    }
  } else {
    context.print.info('');
    context.print.info('No local changes detected.');
  }
}
