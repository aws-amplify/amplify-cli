import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { coerce, lt } from 'semver';
import { pathManager, stateManager, $TSObject, $TSContext, JSONUtilities, $TSAny } from 'amplify-cli-core';
import { makeId } from './extensions/amplify-helpers/make-id';
import { amplifyCLIConstants } from './extensions/amplify-helpers/constants';
import { insertAmplifyIgnore } from './extensions/amplify-helpers/git-manager';
import { run as push } from './commands/push';

const spinner = ora('');

const confirmMigrateMessage =
  'We detected the project was initialized using an older version of the CLI. Do you want to migrate the project, so that it is compatible with the latest version of the CLI?';
const secondConfirmMessage =
  'The CLI would be modifying your Amplify backend configuration files as a part of the migration process, hence we highly recommend backing up your existing local project before moving ahead. Are you sure you want to continue?';

export async function migrateProject(context: $TSContext) {
  const projectPath = pathManager.findProjectRoot();
  if (!projectPath) {
    // New project, hence not able to find the amplify dir
    return;
  }

  const projectConfig = stateManager.getProjectConfig(projectPath);

  // First level check
  // New projects also don't have projectPaths
  if (!projectConfig.projectPath) {
    return;
  }

  const currentProjectVersion = coerce(projectConfig.version);
  const minProjectVersion = coerce(amplifyCLIConstants.MIN_MIGRATION_PROJECT_CONFIG_VERSION);

  if (lt(currentProjectVersion!, minProjectVersion!)) {
    if (await context.prompt.confirm(confirmMigrateMessage)) {
      const infoMessage =
        `${chalk.bold('The CLI is going to take the following actions during the migration step:')}\n` +
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
      context.print.info(
        chalk.red(
          "IF YOU'VE MODIFIED ANY CLOUDFORMATION FILES MANUALLY, PLEASE CHECK AND DIFF YOUR CLOUDFORMATION FILES BEFORE PUSHING YOUR RESOURCES IN THE CLOUD IN THE LAST STEP OF THIS MIGRATION.",
        ),
      );

      if (await context.prompt.confirm(secondConfirmMessage)) {
        // Currently there are only two project configuration versions, so call this method directly
        // If more versions are involved, switch to apropriate migration method
        await migrateFrom0To1(context, projectPath, projectConfig);
      }
    }
  }
}

async function migrateFrom0To1(context: $TSContext, projectPath, projectConfig) {
  let amplifyDirPath;
  let backupAmplifyDirPath;
  try {
    amplifyDirPath = pathManager.getAmplifyDirPath(projectPath);
    backupAmplifyDirPath = backup(amplifyDirPath, projectPath);
    context.migrationInfo = generateMigrationInfo(projectConfig, projectPath);

    // Give each category a chance to migrate their respective files
    const categoryMigrationTasks: Function[] = [];

    const categoryPluginInfoList = context.amplify.getAllCategoryPluginInfo(context);
    let apiMigrateFunction;

    Object.keys(categoryPluginInfoList).forEach(category => {
      categoryPluginInfoList[category].forEach(pluginInfo => {
        try {
          const { migrate } = require(pluginInfo.packageLocation);
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

    context.print.warning(
      "If you have added functions or interactions category to your project, please check the 'Auto-migration' section at https://github.com/aws-amplify/docs/blob/master/cli/migrate.md",
    );

    // Run the `amplify push` flow
    await push(context);
  } catch (e) {
    spinner.fail('There was an error migrating your project.');

    rollback(amplifyDirPath, backupAmplifyDirPath);

    context.print.info('migration operations are rolled back.');

    throw e;
  } finally {
    cleanUp(backupAmplifyDirPath);
  }
}

function backup(amplifyDirPath: string, projectPath: string) {
  const backupAmplifyDirName = `${amplifyCLIConstants.AmplifyCLIDirName}-${makeId(5)}`;
  const backupAmplifyDirPath = path.join(projectPath, backupAmplifyDirName);

  if (fs.existsSync(backupAmplifyDirPath)) {
    const error = new Error(`Backup folder at ${backupAmplifyDirPath} already exists, remove the folder and retry the operation.`);

    error.name = 'BackupFolderAlreadyExist';
    error.stack = undefined;

    throw error;
  }

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
  const migrationInfo: $TSObject = {
    projectPath,
    initVersion: projectConfig.version,
    newVersion: amplifyCLIConstants.CURRENT_PROJECT_CONFIG_VERSION,
  };
  migrationInfo.amplifyMeta = stateManager.getMeta(projectPath);
  migrationInfo.currentAmplifyMeta = stateManager.getCurrentMeta(projectPath);
  migrationInfo.projectConfig = generateNewProjectConfig(projectConfig);
  migrationInfo.localEnvInfo = generateLocalEnvInfo(projectConfig);
  migrationInfo.localAwsInfo = generateLocalAwsInfo(projectPath);
  migrationInfo.teamProviderInfo = generateTeamProviderInfo(migrationInfo.amplifyMeta);
  migrationInfo.backendConfig = generateBackendConfig(migrationInfo.amplifyMeta);

  return migrationInfo;
}

function persistMigrationContext(migrationInfo) {
  stateManager.setMeta(migrationInfo.projectPath, migrationInfo.amplifyMeta);
  stateManager.setCurrentMeta(migrationInfo.projectPath, migrationInfo.currentAmplifyMeta);
  stateManager.setProjectConfig(migrationInfo.projectPath, migrationInfo.projectConfig);

  if (migrationInfo.localEnvInfo) {
    stateManager.setLocalEnvInfo(migrationInfo.projectPath, migrationInfo.localEnvInfo);
  }

  if (migrationInfo.localAwsInfo) {
    stateManager.setLocalAWSInfo(migrationInfo.projectPath, migrationInfo.localAwsInfo);
  }

  if (migrationInfo.teamProviderInfo) {
    stateManager.setTeamProviderInfo(migrationInfo.projectPath, migrationInfo.teamProviderInfo);
  }

  if (migrationInfo.backendConfig) {
    stateManager.setBackendConfig(migrationInfo.projectPath, migrationInfo.backendConfig);
  }
}

function generateNewProjectConfig(projectConfig) {
  const newProjectConfig: $TSObject = {};

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
  newProjectConfig.version = amplifyCLIConstants.CURRENT_PROJECT_CONFIG_VERSION;

  // Modify provider handler
  const providers = Object.keys(projectConfig.providers);
  newProjectConfig.providers = providers;

  return newProjectConfig;
}

function generateLocalEnvInfo(projectConfig) {
  return {
    projectPath: projectConfig.projectPath,
    defaultEditor: projectConfig.defaultEditor,
    envName: 'NONE',
  };
}

function generateLocalAwsInfo(projectPath) {
  let newAwsInfo;

  const awsInfoFilePath = path.join(pathManager.getDotConfigDirPath(projectPath), 'aws-info.json');

  if (fs.existsSync(awsInfoFilePath)) {
    const awsInfo = JSONUtilities.readJson<$TSAny>(awsInfoFilePath);

    awsInfo.configLevel = 'project'; // Old version didn't support "General" configuation

    newAwsInfo = { NONE: awsInfo };

    fs.removeSync(awsInfoFilePath);
  }

  return newAwsInfo;
}

function generateTeamProviderInfo(amplifyMeta) {
  return { NONE: amplifyMeta.providers };
}

function generateBackendConfig(amplifyMeta) {
  const backendConfig = {};

  Object.keys(amplifyMeta).forEach(category => {
    if (category !== 'providers') {
      backendConfig[category] = {};

      Object.keys(amplifyMeta[category]).forEach(resourceName => {
        backendConfig[category][resourceName] = {};
        backendConfig[category][resourceName].service = amplifyMeta[category][resourceName].service;
        backendConfig[category][resourceName].providerPlugin = amplifyMeta[category][resourceName].providerPlugin;
        backendConfig[category][resourceName].dependsOn = amplifyMeta[category][resourceName].dependsOn;
        backendConfig[category][resourceName].build = amplifyMeta[category][resourceName].build;

        // For AppSync we need to store the securityType output as well
        if (amplifyMeta[category][resourceName].service === 'AppSync') {
          backendConfig[category][resourceName].output = {};

          if (amplifyMeta[category][resourceName].output) {
            backendConfig[category][resourceName].output.securityType = amplifyMeta[category][resourceName].output.securityType;
          }
        }
      });
    }
  });

  return backendConfig;
}

function removeAmplifyRCFile(projectPath) {
  const amplifyRcFilePath = pathManager.getAmplifyRcFilePath(projectPath);
  fs.removeSync(amplifyRcFilePath);
}

function updateGitIgnoreFile(projectPath) {
  const gitIgnoreFilePath = pathManager.getGitIgnoreFilePath(projectPath);

  insertAmplifyIgnore(gitIgnoreFilePath);
}
