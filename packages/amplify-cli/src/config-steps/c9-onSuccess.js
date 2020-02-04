const fs = require('fs-extra');

async function run(context) {
  const { projectPath } = context.exeInfo;
  const { amplify } = context;

  let jsonString = JSON.stringify(context.exeInfo.projectConfig, null, 4);
  const projectConfigFilePath = amplify.pathManager.getProjectConfigFilePath(projectPath);
  fs.writeFileSync(projectConfigFilePath, jsonString, 'utf8');

  jsonString = JSON.stringify(context.exeInfo.localEnvInfo, null, 4);
  const envFilePath = context.amplify.pathManager.getLocalEnvFilePath();
  fs.writeFileSync(envFilePath, jsonString, 'utf8');

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
