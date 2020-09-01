import * as fs from 'fs-extra';
import * as path from 'path';
import { pathManager, stateManager, $TSContext } from 'amplify-cli-core';
import { queryProvider } from './attach-backend-steps/a10-queryProvider';
import { analyzeProject } from './attach-backend-steps/a20-analyzeProject';
import { initFrontend } from './attach-backend-steps/a30-initFrontend';
import { generateFiles } from './attach-backend-steps/a40-generateFiles';
import { postPullCodeGenCheck } from './amplify-service-helper';
import { initializeEnv } from './initialize-env';

const backupAmplifyDirName = 'amplify-backup';

export async function attachBackend(context: $TSContext, inputParams) {
  prepareContext(context, inputParams);

  backupAmplifyFolder();
  setupFolderStructure();

  try {
    await queryProvider(context);
    await analyzeProject(context);
    await initFrontend(context);
    await generateFiles(context);
    await onSuccess(context);
  } catch (e) {
    removeFolderStructure();
    restoreOriginalAmplifyFolder();

    context.print.error('Failed to pull the backend.');
    context.usageData.emitError(e);

    throw e;
  }
}

async function onSuccess(context: $TSContext) {
  const { inputParams } = context.exeInfo;

  if (inputParams.amplify.noOverride) {
    const projectPath = process.cwd();
    const backupAmplifyDirPath = path.join(projectPath, backupAmplifyDirName);
    const backupBackendDirPath = path.join(backupAmplifyDirPath, context.amplify.constants.BackendamplifyCLISubDirName);

    if (fs.existsSync(backupBackendDirPath)) {
      const backendDirPath = pathManager.getBackendDirPath(projectPath);

      fs.removeSync(backendDirPath);
      fs.copySync(backupBackendDirPath, backendDirPath);
    }
  }

  await postPullCodeGenCheck(context);

  if (!inputParams.yes) {
    const confirmKeepCodebase = await context.amplify.confirmPrompt('Do you plan on modifying this backend?', true);

    if (confirmKeepCodebase) {
      if (stateManager.currentMetaFileExists()) {
        await initializeEnv(context, stateManager.getCurrentMeta());
      }

      const { envName } = context.exeInfo.localEnvInfo;

      context.print.info('');
      context.print.success(`Successfully pulled backend environment ${envName} from the cloud.`);
      context.print.info(`Run 'amplify pull' to sync upstream changes.`);
      context.print.info('');
    } else {
      removeFolderStructure();

      context.print.info('');
      context.print.success(`Added backend environment config object to your project.`);
      context.print.info(`Run 'amplify pull' to sync upstream changes.`);
      context.print.info('');
    }
  } else {
    if (stateManager.currentMetaFileExists()) {
      await initializeEnv(context, stateManager.getCurrentMeta());
    }
  }

  removeBackupAmplifyFolder();
}

function backupAmplifyFolder() {
  const projectPath = process.cwd();
  const amplifyDirPath = pathManager.getAmplifyDirPath(projectPath);

  if (fs.existsSync(amplifyDirPath)) {
    const backupAmplifyDirPath = path.join(projectPath, backupAmplifyDirName);

    if (fs.existsSync(backupAmplifyDirPath)) {
      const error = new Error(`Backup folder at ${backupAmplifyDirPath} already exists, remove the folder and retry the operation.`);

      error.name = 'BackupFolderAlreadyExist';
      error.stack = undefined;

      throw error;
    }

    fs.moveSync(amplifyDirPath, backupAmplifyDirPath);
  }
}

function restoreOriginalAmplifyFolder() {
  const projectPath = process.cwd();
  const backupAmplifyDirPath = path.join(projectPath, backupAmplifyDirName);

  if (fs.existsSync(backupAmplifyDirPath)) {
    const amplifyDirPath = pathManager.getAmplifyDirPath(projectPath);

    fs.removeSync(amplifyDirPath);
    fs.moveSync(backupAmplifyDirPath, amplifyDirPath);
  }
}

function removeBackupAmplifyFolder() {
  const projectPath = process.cwd();
  const backupAmplifyDirPath = path.join(projectPath, backupAmplifyDirName);

  fs.removeSync(backupAmplifyDirPath);
}

function setupFolderStructure(): void {
  const projectPath = process.cwd();

  const amplifyDirPath = pathManager.getAmplifyDirPath(projectPath);
  const dotConfigDirPath = pathManager.getDotConfigDirPath(projectPath);
  const currentCloudBackendDirPath = pathManager.getCurrentCloudBackendDirPath(projectPath);
  const backendDirPath = pathManager.getBackendDirPath(projectPath);

  fs.ensureDirSync(amplifyDirPath);
  fs.ensureDirSync(dotConfigDirPath);
  fs.ensureDirSync(currentCloudBackendDirPath);
  fs.ensureDirSync(backendDirPath);
}

function removeFolderStructure() {
  const projectPath = process.cwd();

  const amplifyDirPath = pathManager.getAmplifyDirPath(projectPath);

  fs.removeSync(amplifyDirPath);
}

function prepareContext(context: $TSContext, inputParams) {
  const projectPath = process.cwd();

  context.exeInfo = {
    isNewProject: true,
    inputParams,
    projectConfig: {},
    localEnvInfo: {
      projectPath,
    },
    teamProviderInfo: {},
    existingProjectConfig: stateManager.getProjectConfig(projectPath, {
      throwIfNotExist: false,
    }),
    existingTeamProviderInfo: stateManager.getTeamProviderInfo(projectPath, {
      throwIfNotExist: false,
    }),
  };
}
