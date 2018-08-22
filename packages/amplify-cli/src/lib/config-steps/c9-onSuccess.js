const fs = require('fs-extra');
const { print } = require('gluegun/print');

function run(context) {
  const { projectPath } = context.exeInfo;
  const { amplify } = context;

  let jsonString = JSON.stringify(context.exeInfo.projectConfig, null, 4);
  const projectCofnigFilePath = amplify.pathManager.getProjectConfigFilePath(projectPath);
  fs.writeFileSync(projectCofnigFilePath, jsonString, 'utf8');

  jsonString = JSON.stringify(context.exeInfo.metaData, null, 4);
  const currentBackendMetaFilePath =
            amplify.pathManager.getCurentBackendCloudAmplifyMetaFilePath(projectPath);
  fs.writeFileSync(currentBackendMetaFilePath, jsonString, 'utf8');
  const backendMetaFilePath = amplify.pathManager.getAmplifyMetaFilePath(projectPath);
  fs.writeFileSync(backendMetaFilePath, jsonString, 'utf8');


  jsonString = JSON.stringify(context.exeInfo.rcData, null, 4);
  const amplifyRcFilePath = amplify.pathManager.getAmplifyRcFilePath(projectPath);
  fs.writeFileSync(amplifyRcFilePath, jsonString, 'utf8');

  printWelcomeMessage();
}


function printWelcomeMessage() {
  print.info('');
  print.info('Configuration done.');
  print.info('');
}

module.exports = {
  run,
};
