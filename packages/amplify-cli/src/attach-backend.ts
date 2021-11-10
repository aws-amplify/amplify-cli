import * as fs from 'fs-extra';
import * as path from 'path';
import { pathManager, stateManager, $TSContext, FeatureFlags } from 'amplify-cli-core';
import { queryProvider } from './attach-backend-steps/a10-queryProvider';
import { analyzeProject } from './attach-backend-steps/a20-analyzeProject';
import { initFrontend } from './attach-backend-steps/a30-initFrontend';
import { generateFiles } from './attach-backend-steps/a40-generateFiles';
import { postPullCodegen } from './amplify-service-helper';
import { initializeEnv } from './initialize-env';

const backupAmplifyDirName = 'amplify-backup';

export async function attachBackend(context: $TSContext, inputParams) {
  prepareContext(context, inputParams);

  backupAmplifyFolder();
  setupFolderStructure();

  try {
    await queryProvider(context);

    // After pulling down backend reload feature flag values as new values can affect the remaining
    // operations of the pull command.
    if (FeatureFlags.isInitialized()) {
      await FeatureFlags.reloadValues();
    }

    await analyzeProject(context);
    await initFrontend(context);
    await generateFiles(context);
    await onSuccess(context);
  } catch (e) {
    removeAmplifyFolderStructure();
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

  await postPullCodegen(context);

  if (!inputParams.yes) {
    const shouldKeepAmplifyDir = context.exeInfo.existingLocalEnvInfo?.noUpdateBackend
      ? !context.exeInfo.existingLocalEnvInfo.noUpdateBackend
      : await context.amplify.confirmPrompt('Do you plan on modifying this backend?', true);

    if (shouldKeepAmplifyDir) {
      if (stateManager.currentMetaFileExists()) {
        await initializeEnv(context, stateManager.getCurrentMeta());
      }

      const { envName } = context.exeInfo.localEnvInfo;

      context.print.info('');
      context.print.success(`Successfully pulled backend environment ${envName} from the cloud.`);
      context.print.info(`Run 'amplify pull' to sync future upstream changes.`);
      context.print.info('');
    } else {
      stateManager.setLocalEnvInfo(process.cwd(), { ...context.exeInfo.localEnvInfo, noUpdateBackend: true });
      removeAmplifyFolderStructure(true);

      context.print.info('');
      context.print.success(`Added backend environment config object to your project.`);
      context.print.info(`Run 'amplify pull' to sync future upstream changes.`);
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
    try {
      fs.moveSync(amplifyDirPath, backupAmplifyDirPath);
    } catch (e) {
      if (e.code === 'EPERM') {
        throw new Error(
          'Could not attach the backend to the project. Ensure that there are no applications locking the `amplify` folder and try again',
        );
      }
      throw e;
    }
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

function removeAmplifyFolderStructure(partial = false) {
  const projectPath = process.cwd();
  if (partial) {
    fs.removeSync(pathManager.getBackendDirPath(projectPath));
    fs.removeSync(pathManager.getCurrentCloudBackendDirPath(projectPath));
  } else {
    const amplifyDirPath = pathManager.getAmplifyDirPath(projectPath);
    fs.removeSync(amplifyDirPath);
  }
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
    existingLocalEnvInfo: stateManager.getLocalEnvInfo(projectPath, {
      throwIfNotExist: false,
    }),
    existingLocalAwsInfo: stateManager.getLocalAWSInfo(projectPath, {
      throwIfNotExist: false,
    }),
  };
  updateContextForNoUpdateBackendProjects(context);
}

function updateContextForNoUpdateBackendProjects(context) {
  if (context.exeInfo.existingLocalEnvInfo?.noUpdateBackend) {
    const envName = context.exeInfo.existingLocalEnvInfo.envName;
    context.exeInfo.isNewProject = false;
    context.exeInfo.localEnvInfo = context.exeInfo.existingLocalEnvInfo;
    context.exeInfo.projectConfig = context.exeInfo.existingProjectConfig;
    context.exeInfo.awsConfigInfo = context.exeInfo.existingLocalAwsInfo[envName];
    context.exeInfo.awsConfigInfo.config = { ...context.exeInfo.existingLocalAwsInfo[envName] };
    context.exeInfo.teamProviderInfo = context.exeInfo.existingTeamProviderInfo;
    context.exeInfo.inputParams = context.exeInfo.inputParams || {};
    context.exeInfo.inputParams.amplify = context.exeInfo.inputParams.amplify || {};

    context.exeInfo.inputParams.amplify.defaultEditor =
      context.exeInfo.inputParams.amplify.defaultEditor || context.exeInfo.existingLocalEnvInfo.defaultEditor;
    context.exeInfo.inputParams.amplify.projectName =
      context.exeInfo.inputParams.amplify.projectName || context.exeInfo.existingProjectConfig.projectName;
    context.exeInfo.inputParams.amplify.envName = context.exeInfo.inputParams.amplify.envName || envName;
    context.exeInfo.inputParams.amplify.frontend =
      context.exeInfo.inputParams.amplify.frontend || context.exeInfo.existingProjectConfig.frontend;
    context.exeInfo.inputParams.amplify.appId =
      context.exeInfo.inputParams.amplify.appId || context.exeInfo.existingTeamProviderInfo[envName].awscloudformation?.AmplifyAppId;
    context.exeInfo.inputParams[context.exeInfo.inputParams.amplify.frontend] =
      context.exeInfo.inputParams[context.exeInfo.inputParams.amplify.frontend] ||
      context.exeInfo.existingProjectConfig[context.exeInfo.inputParams.amplify.frontend];
  }
}
