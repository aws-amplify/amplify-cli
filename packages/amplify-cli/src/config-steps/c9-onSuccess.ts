import { stateManager } from 'amplify-cli-core';

export async function onSuccess(context) {
  const { projectPath } = context.exeInfo;

  stateManager.setProjectConfig(projectPath, context.exeInfo.projectConfig);
  stateManager.setLocalEnvInfo(undefined, context.exeInfo.localEnvInfo);

  await context.amplify.onCategoryOutputsChange(context);

  printWelcomeMessage(context);
}

function printWelcomeMessage(context) {
  context.print.info('');
  context.print.success('Successfully made configuration changes to your project.');
  context.print.info('');
}
