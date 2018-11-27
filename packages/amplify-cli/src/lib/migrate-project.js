const fs = require('fs-extra');
const path = require('path');
const ora = require('ora');
const sequential = require('promise-sequential');
const { makeId } = require('../extensions/amplify-helpers/make-id');
const constants = require('../extensions/amplify-helpers/constants');
const gitManager = require('../extensions/amplify-helpers/git-manager');

const spinner = ora('');
const { prompt } = require('gluegun/prompt');

const {
  searchProjectRootPath,
  getAmplifyDirPath,
  getDotConfigDirPath,
  getProjectConfigFilePath,
  getAmplifyMetaFilePath,
  getCurentAmplifyMetaFilePath,
  getLocalEnvFilePath,
  getProviderInfoFilePath,
  getBackendConfigFilePath,
  getGitIgnoreFilePath,
  getAmplifyRcFilePath,
} = require('../extensions/amplify-helpers/path-manager');

const confirmMigrateMessage =
'We detected the project was initialized using an older version of the CLI. Do you want to migrate the project, so that it is compatible with the latest version of the CLI?';
const secondConfirmMessage =
'The CLI would be modifying your Amplify backend configuration files as a part of the migration process, hence we highly recommend backing up your existing local project before moving ahead. Are you sure you want to continue?';

async function migrateProject(context) {
  const projectPath = searchProjectRootPath();
  if (!projectPath) {
    // New project, hence not able to find the amplify dir
    return;
  }

  const projectConfigFilePath = getProjectConfigFilePath(projectPath);
  const projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));
  if (projectConfig.version !== constants.PROJECT_CONFIG_VERSION) {
    if (await prompt.confirm(confirmMigrateMessage)) {
      if (await prompt.confirm(secondConfirmMessage)) {
        // Currently there are only two project configuration versions, so call this method directly
        // If more versions are involved, switch to apropriate migration method
        await migrateFrom0To1(context, projectPath, projectConfig);
      }
    }
  }
}

async function migrateFrom0To1(context, projectPath, projectConfig) {
  let amplifyDirPath;
  let backupAmplifyDirPath;
  try {
    amplifyDirPath = getAmplifyDirPath(projectPath);
    backupAmplifyDirPath = backup(amplifyDirPath, projectPath);
    context.migrationInfo = generateMigrationInfo(projectConfig, projectPath);

    // Give each category a chance to migrate their respective files
    const categoryMigrationTasks = [];

    const categoryPlugins = context.amplify.getCategoryPlugins(context);

    Object.keys(categoryPlugins).forEach((category) => {
      try {
        const { migrate } = require(categoryPlugins[category]);
        if (migrate) {
          categoryMigrationTasks.push(() => migrate(context));
        }
      } catch (e) {
        // do nothing, it's fine if a category is not setup for migration
      }
    });

    spinner.start('Migrating your project');
    await sequential(categoryMigrationTasks);
    persistMigrationContext(context.migrationInfo);
    removeAmplifyRCFile(projectPath);
    updateGitIgnoreFile(projectPath);
    spinner.succeed('Migrated your project successfully.');
  } catch (e) {
    spinner.fail('There was an error migrating your project.');
    rollback(amplifyDirPath, backupAmplifyDirPath);
    context.print.info('migration operations are rolledback.');
    throw e;
  } finally {
    cleanUp(backupAmplifyDirPath);
  }
}

function backup(amplifyDirPath, projectPath) {
  const backupAmplifyDirName = `${constants.AmplifyCLIDirName}-${makeId(5)}`;
  const backupAmplifyDirPath = path.join(projectPath, backupAmplifyDirName);

  fs.copySync(amplifyDirPath, backupAmplifyDirPath);

  return backupAmplifyDirPath;
}

function rollback(amplifyDirPath, backupAmplifyDirPath) {
  if (backupAmplifyDirPath && fs.existsSync(backupAmplifyDirPath)) {
    fs.removeSync(amplifyDirPath);
    fs.moveSync(backupAmplifyDirPath, amplifyDirPath);
  }
}

function cleanUp(backupAmplifyDirPath) {
  fs.removeSync(backupAmplifyDirPath);
}

function generateMigrationInfo(projectConfig, projectPath) {
  const migrationInfo = {
    projectPath,
    initVersion: projectConfig.version,
    newVersion: constants.PROJECT_CONFIG_VERSION,
  };
  migrationInfo.amplifyMeta = getAmplifyMeta(projectPath);
  migrationInfo.currentAmplifyMeta = getCurrentAmplifyMeta(projectPath);
  migrationInfo.projectConfig = generateNewProjectConfig(projectConfig);
  migrationInfo.localEnvInfo = generateLocalEnvInfo(projectConfig);
  migrationInfo.localAwsInfo = generateLocalAwsInfo(projectPath);
  migrationInfo.teamProviderInfo = generateTeamProviderInfo(migrationInfo.amplifyMeta);
  migrationInfo.backendConfig = generateBackendConfig(migrationInfo.amplifyMeta);

  return migrationInfo;
}

function persistMigrationContext(migrationInfo) {
  persistAmplifyMeta(migrationInfo.amplifyMeta, migrationInfo.projectPath);
  persistCurrentAmplifyMeta(migrationInfo.currentAmplifyMeta, migrationInfo.projectPath);
  persistProjectConfig(migrationInfo.projectConfig, migrationInfo.projectPath);
  persistLocalEnvInfo(migrationInfo.localEnvInfo, migrationInfo.projectPath);
  persistLocalAwsInfo(migrationInfo.localAwsInfo, migrationInfo.projectPath);
  persistTeamProviderInfo(migrationInfo.teamProviderInfo, migrationInfo.projectPath);
  persistBackendConfig(migrationInfo.backendConfig, migrationInfo.projectPath);
}

function getAmplifyMeta(projectPath) {
  const amplifyMetafilePath = getAmplifyMetaFilePath(projectPath);
  return JSON.parse(fs.readFileSync(amplifyMetafilePath));
}

function persistAmplifyMeta(amplifyMeta, projectPath) {
  if (amplifyMeta) {
    const amplifyMetafilePath = getAmplifyMetaFilePath(projectPath);
    const jsonString = JSON.stringify(amplifyMeta, null, 4);
    fs.writeFileSync(amplifyMetafilePath, jsonString, 'utf8');
  }
}

function getCurrentAmplifyMeta(projectPath) {
  const currentAmplifyMetafilePath = getCurentAmplifyMetaFilePath(projectPath);
  return JSON.parse(fs.readFileSync(currentAmplifyMetafilePath));
}

function persistCurrentAmplifyMeta(currentAmplifyMeta, projectPath) {
  if (currentAmplifyMeta) {
    const currentAmplifyMetafilePath = getCurentAmplifyMetaFilePath(projectPath);
    const jsonString = JSON.stringify(currentAmplifyMeta, null, 4);
    fs.writeFileSync(currentAmplifyMetafilePath, jsonString, 'utf8');
  }
}

function generateNewProjectConfig(projectConfig) {
  const newProjectConfig = {};

  Object.assign(newProjectConfig, projectConfig);
  // These attributes are now stores in amplify/.config/local-env-info.json
  delete newProjectConfig.projectPath;
  delete newProjectConfig.defaultEditor;

  // Modify frontend handler
  const frontendPluginPath = Object.keys(projectConfig.frontendHandler)[0];
  const frontendPlugin = frontendPluginPath.split('/')[frontendPluginPath.split('/').length - 1];
  const frontend = frontendPlugin.split('-')[frontendPlugin.split('-').length - 1];

  newProjectConfig.frontend = frontend;
  delete newProjectConfig.frontendHandler;
  newProjectConfig.version = constants.PROJECT_CONFIG_VERSION;

  // Modify provider handler
  const providers = Object.keys(projectConfig.providers);
  newProjectConfig.providers = providers;

  return newProjectConfig;
}

function persistProjectConfig(projectConfig, projectPath) {
  if (projectConfig) {
    const projectConfigFilePath = getProjectConfigFilePath(projectPath);
    const jsonString = JSON.stringify(projectConfig, null, 4);
    fs.writeFileSync(projectConfigFilePath, jsonString, 'utf8');
  }
}

function generateLocalEnvInfo(projectConfig) {
  return {
    projectPath: projectConfig.projectPath,
    defaultEditor: projectConfig.defaultEditor,
    envName: 'NONE',
  };
}

function persistLocalEnvInfo(localEnvInfo, projectPath) {
  if (localEnvInfo) {
    const jsonString = JSON.stringify(localEnvInfo, null, 4);
    const localEnvFilePath = getLocalEnvFilePath(projectPath);
    fs.writeFileSync(localEnvFilePath, jsonString, 'utf8');
  }
}

function generateLocalAwsInfo(projectPath) {
  let newAwsInfo;

  const dotConfigDirPath = getDotConfigDirPath(projectPath);
  const awsInfoFilePath = path.join(dotConfigDirPath, 'aws-info.json');
  if (fs.existsSync(awsInfoFilePath)) {
    const awsInfo = JSON.parse(fs.readFileSync(awsInfoFilePath));
    awsInfo.configLevel = 'project'; // Old version didn't support "General" configuation
    newAwsInfo = { NONE: awsInfo };
    fs.removeSync(awsInfoFilePath);
  }

  return newAwsInfo;
}

function persistLocalAwsInfo(localAwsInfo, projectPath) {
  if (localAwsInfo) {
    const dotConfigDirPath = getDotConfigDirPath(projectPath);
    const jsonString = JSON.stringify(localAwsInfo, null, 4);
    const localAwsInfoFilePath = path.join(dotConfigDirPath, 'local-aws-info.json');
    fs.writeFileSync(localAwsInfoFilePath, jsonString, 'utf8');
  }
}

function generateTeamProviderInfo(amplifyMeta) {
  return { NONE: amplifyMeta.providers };
}

function persistTeamProviderInfo(teamProviderInfo, projectPath) {
  if (teamProviderInfo) {
    const jsonString = JSON.stringify(teamProviderInfo, null, 4);
    const teamProviderFilePath = getProviderInfoFilePath(projectPath);
    fs.writeFileSync(teamProviderFilePath, jsonString, 'utf8');
  }
}

function generateBackendConfig(amplifyMeta) {
  const backendConfig = {};
  Object.keys(amplifyMeta).forEach((category) => {
    if (category !== 'providers') {
      backendConfig[category] = {};
      Object.keys(amplifyMeta[category]).forEach((resourceName) => {
        backendConfig[category][resourceName] = {};
        backendConfig[category][resourceName].service = amplifyMeta[category][resourceName].service;
        backendConfig[category][resourceName].providerPlugin =
        amplifyMeta[category][resourceName].providerPlugin;
        backendConfig[category][resourceName].dependsOn =
        amplifyMeta[category][resourceName].dependsOn;
        backendConfig[category][resourceName].build =
        amplifyMeta[category][resourceName].build;
      });
    }
  });
  return backendConfig;
}

function persistBackendConfig(backendConfig, projectPath) {
  if (backendConfig) {
    const jsonString = JSON.stringify(backendConfig, null, 4);
    const backendConfigFilePath = getBackendConfigFilePath(projectPath);
    fs.writeFileSync(backendConfigFilePath, jsonString, 'utf8');
  }
}

function removeAmplifyRCFile(projectPath) {
  const amplifyRcFilePath = getAmplifyRcFilePath(projectPath);
  fs.removeSync(amplifyRcFilePath);
}

function updateGitIgnoreFile(projectPath) {
  const gitIgnoreFilePath = getGitIgnoreFilePath(projectPath);
  gitManager.insertAmplifyIgnore(gitIgnoreFilePath);
}

module.exports = {
  migrateProject,
};
