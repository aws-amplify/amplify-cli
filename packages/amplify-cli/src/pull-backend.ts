import { exitOnNextTick, stateManager, $TSAny, $TSContext } from '@aws-amplify/amplify-cli-core';
import { initializeEnv } from './initialize-env';
import { postPullCodegen } from './amplify-service-helper';
import { printer } from '@aws-amplify/amplify-prompts';

/**
 * pull backend from the cloud
 */
export const pullBackend = async (context: $TSContext, inputParams: $TSAny): Promise<void> => {
  context.exeInfo = context.amplify.getProjectDetails();
  context.exeInfo.inputParams = inputParams;
  printer.info('');
  printer.info('Pre-pull status:');
  const hasChanges = await context.amplify.showResourceTable();
  printer.info('');

  context.exeInfo.forcePush = false;
  context.exeInfo.restoreBackend = !context.exeInfo.inputParams.amplify.noOverride;

  if (hasChanges && context.exeInfo.restoreBackend) {
    printer.warn('Local changes detected.');
    printer.warn('Pulling changes from the cloud will override your local changes.');
    if (!context.exeInfo.inputParams.yes) {
      const confirmOverride = await context.amplify.confirmPrompt('Are you sure you would like to continue?', false);
      if (!confirmOverride) {
        printer.info(`Run an 'amplify push' to update your project upstream.`);
        printer.info('However, this will override upstream changes to this backend environment with your local changes.');
        printer.info(
          `To merge local and upstream changes, commit all backend code changes to Git, perform a merge, resolve conflicts, and then run 'amplify push'.`,
        );
        void context.usageData.emitSuccess();
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
};

const ensureBackendConfigFile = (context: $TSContext): void => {
  const { projectPath } = context.exeInfo.localEnvInfo;
  if (!stateManager.backendConfigFileExists(projectPath)) {
    stateManager.setBackendConfig(projectPath, {});
  }
};
