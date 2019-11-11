const fs = require('fs-extra');
const util = require('util');
const queryProvider = require('./attach-backend-steps/a10-queryProvider');
const analyzeProject = require('./attach-backend-steps/a20-analyzeProject');
const initFrontend = require('./attach-backend-steps/a30-initFrontend');
const onSuccess = require('./attach-backend-steps/a90-onSuccess');
const { normalizeInputParams } = require('./input-params-manager');

async function attachBackend(context) {
  setupFolderStructure(context);
  prepareContext(context);
  await queryProvider
    .run(context)
    .then(analyzeProject.run)
    .then(initFrontend.run)
    .then(onSuccess.run)
    .catch(e => {
      removeFolderStructure(context);
      context.print.error('Failed to pull the backend.');
      context.print.info(util.inspect(e));
      process.exit(1);
    });
}

function setupFolderStructure(context) {
  const projectPath = process.cwd();
  const amplifyDirPath = context.amplify.pathManager.getAmplifyDirPath(projectPath);
  const dotConfigDirPath = context.amplify.pathManager.getDotConfigDirPath(projectPath);
  const currentCloudBackendDirPath = context.amplify.pathManager.getCurrentCloudBackendDirPath(projectPath);
  const backendDirPath = context.amplify.pathManager.getBackendDirPath(projectPath);
  fs.ensureDirSync(amplifyDirPath);
  fs.ensureDirSync(dotConfigDirPath);
  fs.ensureDirSync(currentCloudBackendDirPath);
  fs.ensureDirSync(backendDirPath);
}

function removeFolderStructure(context) {
  const projectPath = process.cwd();
  const amplifyDirPath = context.amplify.pathManager.getAmplifyDirPath(projectPath);
  fs.removeSync(amplifyDirPath);
}

function prepareContext(context) {
  context.exeInfo = {
    isNewProject: true,
    inputParams: normalizeInputParams(context),
    projectConfig: {},
    localEnvInfo: {
      projectPath: process.cwd(),
    },
    teamProviderInfo: {},
  };
}

module.exports = {
  attachBackend,
};
