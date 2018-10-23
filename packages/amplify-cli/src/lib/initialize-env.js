const fs = require('fs-extra');
const sequential = require('promise-sequential');

async function initializeEnv(context) {
  const currentEnv = context.exeInfo.localEnvInfo.envName;
  // Generate amplify-meta.json

  const amplifyMeta = {};
  const { projectPath } = context.exeInfo.localEnvInfo;
  const providerInfoFilePath = context.amplify.pathManager.getProviderInfoFilePath(projectPath);

  amplifyMeta.providers = JSON.parse(fs.readFileSync(providerInfoFilePath))[currentEnv];

  const backendConfigFilePath = context.amplify.pathManager.getBackendConfigFilePath(projectPath);

  const backendResourceInfo = JSON.parse(fs.readFileSync(backendConfigFilePath));

  Object.assign(amplifyMeta, backendResourceInfo);

  const backendMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath(projectPath);
  const jsonString = JSON.stringify(amplifyMeta, null, 4);

  fs.writeFileSync(backendMetaFilePath, jsonString, 'utf8');

  const { providers } = context.exeInfo.projectConfig;

  const initializationTasks = [];

  Object.keys(amplifyMeta.providers).forEach((providerKey) => {
    const provider = require(providers[providerKey]);
    initializationTasks.push(() => provider.initEnv(context, amplifyMeta.providers[providerKey]));
  });

  await sequential(initializationTasks);
}

module.exports = {
  initializeEnv,
};

