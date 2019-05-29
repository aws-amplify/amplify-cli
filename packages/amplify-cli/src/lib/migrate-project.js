const fs = require('fs-extra');
const chalk = require('chalk');
const path = require('path');
const ora = require('ora');
const { makeId } = require('../extensions/amplify-helpers/make-id');
const constants = require('../extensions/amplify-helpers/constants');
const gitManager = require('../extensions/amplify-helpers/git-manager');
const { readJsonFile } = require('../extensions/amplify-helpers/read-json-file');

const spinner = ora('');
const { prompt } = require('gluegun/prompt');
const { run } = require('../commands/push');

const pushRun = run;

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
  const projectConfig = readJsonFile(projectConfigFilePath);
  // First level check
  // New projects also don't have projectPaths
  if (!projectConfig.projectPath) {
    return;
  }
  if (projectConfig.version !== constants.PROJECT_CONFIG_VERSION) {
    if (await prompt.confirm(confirmMigrateMessage)) {
      const infoMessage = `${chalk.bold('The CLI is going to take the following actions during the migration step:')}\n` +
      '\n1. If you have a GraphQL API, we will update the corresponding Cloudformation stack to support larger annotated schemas and custom resolvers.\n' +
      'In this process, we will be making Cloudformation API calls to update your GraphQL API Cloudformation stack. This operation will result in deletion of your AppSync resolvers and then the creation of new ones and for a brief while your AppSync API will be unavailable until the migration finishes\n' +
      '\n2. We will be updating your local Cloudformation files present inside the ‘amplify/‘ directory of your app project, for all the added categories so that it supports multiple environments\n' +
      '\n3. After the migration completes, we will give you the option to either push these Cloudformation files right away or you could inspect them yourselves and later push the updated Cloudformation files to the cloud\n' +
      '\n4. If for any reason the migration fails, the CLI will rollback your cloud and local changes and you can take a look at https://aws-amplify.github.io/docs/cli/migrate?sdk=js for manually migrating your project so that it’s compatible with the latest version of the CLI\n' +
      '\n5. ALL THE ABOVE MENTIONED OPERATIONS WILL NOT DELETE ANY DATA FROM ANY OF YOUR DATA STORES\n' +
      `\n${chalk.bold('Before the migration, please be aware of the following things:')}\n` +
      '\n1. Make sure to have an internet connection through the migration process\n' +
      '\n2. Make sure to not exit/terminate the migration process (by interrupting it explicitly in the middle of migration), as this will lead to inconsistency within your project\n' +
      '\n3. Make sure to take a backup of your entire project (including the amplify related config files)\n';
      context.print.info(infoMessage);
      context.print.info(chalk.red('IF YOU\'VE MODIFIED ANY CLOUDFORMATION FILES MANUALLY, PLEASE CHECK AND DIFF YOUR CLOUDFORMATION FILES BEFORE PUSHING YOUR RESOURCES IN THE CLOUD IN THE LAST STEP OF THIS MIGRATION.'));

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
    let apiMigrateFunction;

    Object.keys(categoryPlugins).forEach((category) => {
      try {
        const { migrate } = require(categoryPlugins[category]);
        if (migrate) {
          if (category !== 'api') {
            categoryMigrationTasks.push(() => migrate(context));
          } else {
            apiMigrateFunction = migrate;
          }
        }
      } catch (e) {
        // do nothing, it's fine if a category is not setup for migration
      }
    });

    if (apiMigrateFunction) {
      categoryMigrationTasks.unshift(() => apiMigrateFunction(context, 'AppSync'));
      categoryMigrationTasks.push(() => apiMigrateFunction(context, 'API Gateway'));
    }

    spinner.start('Migrating your project');
    persistMigrationContext(context.migrationInfo);
    // await sequential(categoryMigrationTasks);
    for (let i = 0; i < categoryMigrationTasks.length; i++) {
      try {
        await categoryMigrationTasks[i]();
      } catch (e) {
        throw e;
      }
    }
    removeAmplifyRCFile(projectPath);
    updateGitIgnoreFile(projectPath);
    spinner.succeed('Migrated your project successfully.');
    context.print.warning('If you have added functions or interactions category to your project, please check the \'Auto-migration\' section at https://github.com/aws-amplify/docs/blob/master/cli/migrate.md');
    // Run the `amplify push` flow
    try {
      await pushRun(context);
    } catch (e) {
      throw e;
    }
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
  return readJsonFile(amplifyMetafilePath);
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
  return readJsonFile(currentAmplifyMetafilePath);
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

  if (projectConfig[`amplify-frontend-${frontend}`]) {
    newProjectConfig[frontend] = projectConfig[`amplify-frontend-${frontend}`];
    delete newProjectConfig[`amplify-frontend-${frontend}`];
  }


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
    const awsInfo = readJsonFile(awsInfoFilePath);
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
        // For AppSync we need to store the securityType output as well
        if (amplifyMeta[category][resourceName].service === 'AppSync') {
          backendConfig[category][resourceName].output = {};
          if (amplifyMeta[category][resourceName].output) {
            backendConfig[category][resourceName].output.securityType =
            amplifyMeta[category][resourceName].output.securityType;
          }
        }
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
