const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const queryProvider = require('./attach-backend-steps/a10-queryProvider');
const analyzeProject = require('./attach-backend-steps/a20-analyzeProject');
const initFrontend = require('./attach-backend-steps/a30-initFrontend');
const generateFiles = require('./attach-backend-steps/a40-generateFiles');
const { normalizeInputParams } = require('./input-params-manager');

const backupAmplifyDirName = 'amplify-backup';

async function attachBackend(context) {
  backupAmplifyFolder(context);
  setupFolderStructure(context);
  prepareContext(context);
  await queryProvider
    .run(context)
    .then(analyzeProject.run)
    .then(initFrontend.run)
    .then(generateFiles.run)
    .then(onSuccess)
    .catch(e => {
      removeFolderStructure(context);
      restoreOriginalAmplifyFolder(context);
      context.print.error('Failed to pull the backend.');
      context.print.info(util.inspect(e));
      process.exit(1);
    });
}

async function onSuccess(context) {
  const { inputParams } = context.exeInfo;
  if (inputParams.amplify.noOverride) {
    const projectPath = process.cwd();
    const backupAmplifyDirPath = path.join(projectPath, backupAmplifyDirName);
    const backupBackendDirPath = path.join(backupAmplifyDirPath, context.amplify.constants.BackendamplifyCLISubDirName);
    if (fs.existsSync(backupBackendDirPath)) {
      const backendDirPath = context.amplify.pathManager.getBackendDirPath(projectPath);
      fs.removeSync(backendDirPath);
      fs.copySync(backupBackendDirPath, backendDirPath);
    }
  }

  if (!inputParams.yes) {
    const confirmKeepCodebase = await context.amplify.confirmPrompt.run('Do you want to keep the backend codebase?', true);
    if (confirmKeepCodebase) {
      context.print.info('');
      context.print.success('Backend environment has been successfully pulled and attached to your project.');
      context.print.info('');
    } else {
      removeFolderStructure(context);
      context.print.info('');
      context.print.success('Backend environment configuration has been successfully pulled.');
      context.print.info('');
    }
  }

  removeBackupAmplifyFolder();
}

function backupAmplifyFolder(context) {
  const projectPath = process.cwd();
  const amplifyDirPath = context.amplify.pathManager.getAmplifyDirPath(projectPath);
  if (fs.existsSync(amplifyDirPath)) {
    const backupAmplifyDirPath = path.join(projectPath, backupAmplifyDirName);
    fs.moveSync(amplifyDirPath, backupAmplifyDirPath);
  }
}

function restoreOriginalAmplifyFolder(context) {
  const projectPath = process.cwd();
  const backupAmplifyDirPath = path.join(projectPath, backupAmplifyDirName);
  if (fs.existsSync(backupAmplifyDirPath)) {
    const amplifyDirPath = context.amplify.pathManager.getAmplifyDirPath(projectPath);
    fs.removeSync(amplifyDirPath);
    fs.moveSync(backupAmplifyDirPath, amplifyDirPath);
  }
}

function removeBackupAmplifyFolder() {
  const projectPath = process.cwd();
  const backupAmplifyDirPath = path.join(projectPath, backupAmplifyDirName);
  fs.removeSync(backupAmplifyDirPath);
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
    inputParams: constructInputParams(context),
    projectConfig: {},
    localEnvInfo: {
      projectPath: process.cwd(),
    },
    teamProviderInfo: {},
  };
}

function constructInputParams(context) {
  const inputParams = normalizeInputParams(context);

  if (inputParams.appId) {
    inputParams.amplify.appId = inputParams.appId;
    delete inputParams.appId;
  }

  if (inputParams.envName) {
    inputParams.amplify.envName = inputParams.envName;
    delete inputParams.envName;
  }

  if (inputParams['no-override'] != undefined) {
    inputParams.amplify.noOverride = inputParams['no-override'];
    delete inputParams['no-override'];
  }

  return inputParams;
}

module.exports = {
  attachBackend,
};
