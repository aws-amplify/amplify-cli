import { initializeEnv } from './initialize-env';
import { postPullCodegen } from './amplify-service-helper';
import { exitOnNextTick, stateManager, $TSAny, $TSContext } from 'amplify-cli-core';

export async function pullBackend(context: $TSContext, inputParams: $TSAny) {
  context.exeInfo = context.amplify.getProjectDetails();
  context.exeInfo.inputParams = inputParams;
  context.print.info('');
  context.print.info('Pre-pull status:');
  const hasChanges = await context.amplify.showResourceTable();
  context.print.info('');

  context.exeInfo.forcePush = false;
  context.exeInfo.restoreBackend = !context.exeInfo.inputParams.amplify.noOverride;

  context.print.info(`Continuing will automatically override the hooks directory.`);
  context.print.info(``);

  if (hasChanges && context.exeInfo.restoreBackend) {
    context.print.warning('Local changes detected.');
    context.print.warning('Pulling changes from the cloud will override your local changes.');
    if (!context.exeInfo.inputParams.yes) {
      const confirmOverride = await context.amplify.confirmPrompt('Are you sure you would like to continue?', false);
      if (!confirmOverride) {
        context.print.info(`Run an 'amplify push' to update your project upstream.`);
        context.print.info('However, this will override upstream changes to this backend environment with your local changes.');
        context.print.info(
          `To merge local and upstream changes, commit all backend code changes to Git, perform a merge, resolve conflicts, and then run 'amplify push'.`,
        );
        context.usageData.emitSuccess();
        exitOnNextTick(0);
      }
    }
  }

  await initializeEnv(context);
  ensureBackendConfigFile(context);
  await postPullCodegen(context);
  context.print.info('Post-pull status:');
  await context.amplify.showResourceTable();
  context.print.info('');
}

function ensureBackendConfigFile(context: $TSContext) {
  const { projectPath } = context.exeInfo.localEnvInfo;
  if (!stateManager.backendConfigFileExists(projectPath)) {
    stateManager.setBackendConfig(projectPath, {});
  }
}
