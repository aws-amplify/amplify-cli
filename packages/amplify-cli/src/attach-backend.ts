import {
  $TSContext,
  amplifyErrorWithTroubleshootingLink,
  amplifyFaultWithTroubleshootingLink,
  FeatureFlags,
  pathManager,
  stateManager,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as fs from 'fs-extra';
import * as path from 'path';
import { postPullCodegen } from './amplify-service-helper';
import { queryProvider } from './attach-backend-steps/a10-queryProvider';
import { analyzeProject } from './attach-backend-steps/a20-analyzeProject';
import { initFrontend } from './attach-backend-steps/a30-initFrontend';
import { generateFiles } from './attach-backend-steps/a40-generateFiles';
import { getAmplifyAppId } from './extensions/amplify-helpers/get-amplify-appId';
import { initializeEnv } from './initialize-env';

const backupAmplifyDirName = 'amplify-backup';

/**
 * Attach backend to project
 */
export const attachBackend = async (context: $TSContext, inputParams): Promise<void> => {
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

    throw amplifyFaultWithTroubleshootingLink('PullBackendFault', {
      message: 'Failed to pull the backend.',
      details: e.message,
      stack: e.stack,
    }, e);
  }
};

const onSuccess = async (context: $TSContext): Promise<void> => {
  const { inputParams } = context.exeInfo;

  if (inputParams.amplify.noOverride) {
    const projectPath = process.cwd();
    const backupAmplifyDirPath = path.join(projectPath, backupAmplifyDirName);
    // eslint-disable-next-line spellcheck/spell-checker
    const backupBackendDirPath = path.join(backupAmplifyDirPath, context.amplify.constants.BackendAmplifyCLISubDirName);

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

      printer.info('');
      printer.success(`Successfully pulled backend environment ${envName} from the cloud.`);
      printer.info('Run \'amplify pull\' to sync future upstream changes.');
      printer.info('');
    } else {
      stateManager.setLocalEnvInfo(process.cwd(), { ...context.exeInfo.localEnvInfo, noUpdateBackend: true });
      removeAmplifyFolderStructure(true);

      printer.info('');
      printer.success('Added backend environment config object to your project.');
      printer.info('Run \'amplify pull\' to sync future upstream changes.');
      printer.info('');
    }
  } else if (stateManager.currentMetaFileExists()) {
    await initializeEnv(context, stateManager.getCurrentMeta());
  }

  removeBackupAmplifyFolder();
};

const backupAmplifyFolder = (): void => {
  const projectPath = process.cwd();
  const amplifyDirPath = pathManager.getAmplifyDirPath(projectPath);

  if (fs.existsSync(amplifyDirPath)) {
    const backupAmplifyDirPath = path.join(projectPath, backupAmplifyDirName);

    if (fs.existsSync(backupAmplifyDirPath)) {
      throw amplifyErrorWithTroubleshootingLink('DirectoryAlreadyExistsError', {
        message: `Backup folder at ${backupAmplifyDirPath} already exists, remove the folder and retry the operation.`,
      });
    }
    try {
      fs.moveSync(amplifyDirPath, backupAmplifyDirPath);
    } catch (e) {
      if (e.code === 'EPERM') {
        throw amplifyErrorWithTroubleshootingLink('DirectoryError', {
          message: `Could not attach the backend to the project.`,
          resolution: 'Ensure that there are no applications locking the `amplify` folder and try again.',
          details: e.message,
          stack: e.stack,
        }, e);
      }
      throw amplifyFaultWithTroubleshootingLink('AmplifyBackupFault', {
        message: `Could not attach the backend to the project.`,
        details: e.message,
        stack: e.stack,
      }, e);
    }
  }
};

const restoreOriginalAmplifyFolder = (): void => {
  const projectPath = process.cwd();
  const backupAmplifyDirPath = path.join(projectPath, backupAmplifyDirName);

  if (fs.existsSync(backupAmplifyDirPath)) {
    const amplifyDirPath = pathManager.getAmplifyDirPath(projectPath);

    fs.removeSync(amplifyDirPath);
    fs.moveSync(backupAmplifyDirPath, amplifyDirPath);
  }
};

const removeBackupAmplifyFolder = (): void => {
  const projectPath = process.cwd();
  const backupAmplifyDirPath = path.join(projectPath, backupAmplifyDirName);

  fs.removeSync(backupAmplifyDirPath);
};

const setupFolderStructure = (): void => {
  const projectPath = process.cwd();

  const amplifyDirPath = pathManager.getAmplifyDirPath(projectPath);
  const dotConfigDirPath = pathManager.getDotConfigDirPath(projectPath);
  const currentCloudBackendDirPath = pathManager.getCurrentCloudBackendDirPath(projectPath);
  const backendDirPath = pathManager.getBackendDirPath(projectPath);

  fs.ensureDirSync(amplifyDirPath);
  fs.ensureDirSync(dotConfigDirPath);
  fs.ensureDirSync(currentCloudBackendDirPath);
  fs.ensureDirSync(backendDirPath);
};

const removeAmplifyFolderStructure = (partial = false): void => {
  const projectPath = process.cwd();
  if (partial) {
    fs.removeSync(pathManager.getBackendDirPath(projectPath));
    fs.removeSync(pathManager.getCurrentCloudBackendDirPath(projectPath));
  } else {
    const amplifyDirPath = pathManager.getAmplifyDirPath(projectPath);
    fs.removeSync(amplifyDirPath);
  }
};

const prepareContext = (context: $TSContext, inputParams): void => {
  const projectPath = process.cwd();

  context.exeInfo = {
    isNewProject: true,
    inputParams,
    projectConfig: {},
    localEnvInfo: {
      projectPath,
    },
    teamProviderInfo: {},
    existingTeamProviderInfo: stateManager.getTeamProviderInfo(projectPath, {
      throwIfNotExist: false,
    }),
    existingProjectConfig: stateManager.getProjectConfig(projectPath, {
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
};

const updateContextForNoUpdateBackendProjects = (context: $TSContext): void => {
  if (context.exeInfo.existingLocalEnvInfo?.noUpdateBackend) {
    const { envName } = context.exeInfo.existingLocalEnvInfo;
    context.exeInfo.isNewProject = false;
    context.exeInfo.localEnvInfo = context.exeInfo.existingLocalEnvInfo;
    context.exeInfo.projectConfig = context.exeInfo.existingProjectConfig;
    context.exeInfo.awsConfigInfo = context.exeInfo.existingLocalAwsInfo[envName];
    context.exeInfo.awsConfigInfo.config = { ...context.exeInfo.existingLocalAwsInfo[envName] };
    context.exeInfo.inputParams = context.exeInfo.inputParams || {};
    context.exeInfo.inputParams.amplify = context.exeInfo.inputParams.amplify || {};

    context.exeInfo.inputParams.amplify.defaultEditor = context.exeInfo.inputParams.amplify.defaultEditor
    || context.exeInfo.existingLocalEnvInfo.defaultEditor;
    context.exeInfo.inputParams.amplify.projectName = context.exeInfo.inputParams.amplify.projectName
    || context.exeInfo.existingProjectConfig.projectName;
    context.exeInfo.inputParams.amplify.envName = context.exeInfo.inputParams.amplify.envName || envName;
    context.exeInfo.inputParams.amplify.frontend = context.exeInfo.inputParams.amplify.frontend
    || context.exeInfo.existingProjectConfig.frontend;
    context.exeInfo.inputParams.amplify.appId = context.exeInfo.inputParams.amplify.appId || getAmplifyAppId();
    // eslint-disable-next-line max-len
    context.exeInfo.inputParams[context.exeInfo.inputParams.amplify.frontend] = context.exeInfo.inputParams[context.exeInfo.inputParams.amplify.frontend]
      || context.exeInfo.existingProjectConfig[context.exeInfo.inputParams.amplify.frontend];
  }
};
