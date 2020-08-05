const { JSONUtilities } = require('amplify-cli-core');

async function run(context) {
  const { projectPath } = context.exeInfo;
  const { amplify } = context;

  const projectConfigFilePath = amplify.pathManager.getProjectConfigFilePath(projectPath);
  await JSONUtilities.writeJson(projectConfigFilePath, context.exeInfo.projectConfig);

  const envFilePath = context.amplify.pathManager.getLocalEnvFilePath();
  await JSONUtilities.writeJson(envFilePath, context.exeInfo.localEnvInfo);

  await context.amplify.onCategoryOutputsChange(context);

  printWelcomeMessage(context);
}

function printWelcomeMessage(context) {
  context.print.info('');
  context.print.success('Successfully made configuration changes to your project.');
  context.print.info('');
}

module.exports = {
  run,
};
