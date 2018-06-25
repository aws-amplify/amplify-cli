const fs = require('fs-extra');
const { print } = require('gluegun/print');

function run(context) {
  const { projectPath } = context.initInfo;
  const { amplify } = context;

  const amplifyDirPath = amplify.pathManager.getamplifyDirPath(projectPath);
  const dotConfigDirPath = amplify.pathManager.getDotConfigDirPath(projectPath);
  const backendDirPath = amplify.pathManager.getBackendDirPath(projectPath);
  const currentBackendDirPath = amplify.pathManager.getCurrentCloudBackendDirPath(projectPath);

  fs.ensureDirSync(amplifyDirPath);
  fs.ensureDirSync(dotConfigDirPath);
  fs.ensureDirSync(backendDirPath);
  fs.ensureDirSync(currentBackendDirPath);

  let jsonString = JSON.stringify(context.initInfo.projectConfig, null, 4);
  const projectCofnigFilePath = amplify.pathManager.getProjectConfigFilePath(projectPath);
  fs.writeFileSync(projectCofnigFilePath, jsonString, 'utf8');

  jsonString = JSON.stringify(context.initInfo.metaData, null, 4);
  const currentBackendMetaFilePath =
            amplify.pathManager.getCurentBackendCloudamplifyMetaFilePath(projectPath);
  fs.writeFileSync(currentBackendMetaFilePath, jsonString, 'utf8');
  const backendMetaFilePath = amplify.pathManager.getamplifyMetaFilePath(projectPath);
  fs.writeFileSync(backendMetaFilePath, jsonString, 'utf8');

  const { providers } = context.initInfo.projectConfig;
  Object.keys(providers).forEach((providerKey) => {
    const provider = require(providers[providerKey]);
    provider.onInitSuccessful(context);
  });
  print.success('Project initialized successfully. Yay!');
}

module.exports = {
  run,
};
