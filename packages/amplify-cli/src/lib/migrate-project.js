const fs = require('fs-extra');
const path = require('path');
const ora = require('ora');
const os = require('os');

const spinner = ora('');
const { prompt } = require('gluegun/prompt');
const { print } = require('gluegun/print');
const {
  getDotConfigDirPath,
  getProjectConfigFilePath,
  getAmplifyMetaFilePath,
  getLocalEnvFilePath,
  getProviderInfoFilePath,
  getBackendConfigFilePath,
  getGitIgnoreFilePath,
} = require('../extensions/amplify-helpers/path-manager');

async function migrateProject(plugins) {
  try {
    let projectConfigFilePath;
    try {
      projectConfigFilePath = getProjectConfigFilePath();
    } catch (e) {
      // New project, hence not able to find the amplify dir
      return;
    }

    const projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));
    if (projectConfig.projectPath && await prompt.confirm('We detected the project was initialized using an older version of the CLI. Do you want to migrate the project, so that it is compatible with the latest version of the CLI?')) {
      // This is an older project & migration is needed
      generateNewProjectConfig(projectConfig, projectConfigFilePath);
      generateLocalEnvInfo(projectConfig);
      generateAwsLocalInfo();
      generateTeamProviderInfo();
      generateBackendConfig();
      generateGitIgnoreFile();
    }

    // Give each category a chance to migrate their respective files

    const categoryMigrationTasks = [];
    const amplifyMetafilePath = getAmplifyMetaFilePath();
    const amplifyMeta = JSON.parse(fs.readFileSync(amplifyMetafilePath));
    const initializedCategories = Object.keys(amplifyMeta);

    const categoryPlugins = {};
    plugins.forEach((plugin) => {
      if (plugin.name.includes('category')) {
        const strs = plugin.name.split('-');
        const categoryName = strs[strs.length - 1];
        categoryPlugins[categoryName] = plugin.directory;
      }
    });

    const availableCategory = Object.keys(plugins).filter(key =>
      initializedCategories.includes(key));

    availableCategory.forEach((category) => {
      try {
        const { migrateCategoryFiles } = require(categoryPlugins[category]);
        if (migrateCategoryFiles) {
          categoryMigrationTasks.push(() => migrateCategoryFiles());
        }
      } catch (e) {
        print.warning(`Could not run migrateProject function for ${category} category`);
      }
    });

    spinner.start('Migrating your project');
    await Promise.all(categoryMigrationTasks);
    spinner.succeed('Migrated your project successfully.');
  } catch (e) {
    spinner.fail('There was an error migrating your project.');
    throw e;
  }
}

function generateNewProjectConfig(projectConfig, projectConfigFilePath) {
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

  // Modify provider handler
  const provider = Object.keys(projectConfig.providers)[0];
  newProjectConfig.providers = [provider];

  const jsonString = JSON.stringify(newProjectConfig, null, 4);
  fs.writeFileSync(projectConfigFilePath, jsonString, 'utf8');
}

function generateLocalEnvInfo(projectConfig) {
  const envInfo = {
    projectPath: projectConfig.projectPath,
    defaultEditor: projectConfig.defaultEditor,
    envName: 'NONE',
  };

  const jsonString = JSON.stringify(envInfo, null, 4);
  const localEnvFilePath = getLocalEnvFilePath();
  fs.writeFileSync(localEnvFilePath, jsonString, 'utf8');
}

function generateAwsLocalInfo() {
  const dotConfigDirPath = getDotConfigDirPath();
  const awsInfoFilePath = path.join(dotConfigDirPath, 'aws-info.json');
  if (fs.existsSync(awsInfoFilePath)) {
    const awsInfo = JSON.parse(fs.readFileSync(awsInfoFilePath));
    awsInfo.configLevel = 'project'; // Old version didn't support "General" configuation
    const newAwsInfo = { NONE: awsInfo };

    const jsonString = JSON.stringify(newAwsInfo, null, 4);
    const localAwsInfoFilePath = path.join(dotConfigDirPath, 'local-aws-info.json');
    fs.writeFileSync(localAwsInfoFilePath, jsonString, 'utf8');
    fs.removeSync(awsInfoFilePath);
  }
}

function generateTeamProviderInfo() {
  const amplifyMetafilePath = getAmplifyMetaFilePath();
  const amplifyMeta = JSON.parse(fs.readFileSync(amplifyMetafilePath));

  const teamProviderInfo = { NONE: amplifyMeta.providers };

  const jsonString = JSON.stringify(teamProviderInfo, null, 4);
  const teamProviderFilePath = getProviderInfoFilePath();
  fs.writeFileSync(teamProviderFilePath, jsonString, 'utf8');
}

function generateBackendConfig() {
  const amplifyMetafilePath = getAmplifyMetaFilePath();
  const amplifyMeta = JSON.parse(fs.readFileSync(amplifyMetafilePath));

  const backendConfig = {};
  Object.keys(amplifyMeta).forEach((category) => {
    if (category !== 'providers') {
      backendConfig[category] = {};
      Object.keys(amplifyMeta[category]).forEach((resourceName) => {
        backendConfig[category][resourceName] = {};
        backendConfig[category][resourceName].service = amplifyMeta[category][resourceName].service;
        backendConfig[category][resourceName].providerPlugin =
        amplifyMeta[category][resourceName].providerPlugin;
      });
    }
  });


  const jsonString = JSON.stringify(backendConfig, null, 4);
  const backendConfigFilePath = getBackendConfigFilePath();
  fs.writeFileSync(backendConfigFilePath, jsonString, 'utf8');
}


function generateGitIgnoreFile() {
  const getGitIgnoreAppendString = () => {
    const toAppend = `${os.EOL + os.EOL
    }amplify/\\#current-cloud-backend${os.EOL
    }amplify/.config/local-*${os.EOL
    }amplify/backend/amplify-meta.json${os.EOL
    }aws-exports.js${os.EOL
    }awsconfiguration.json`;

    return toAppend;
  };

  const gitIgnoreFilePath = getGitIgnoreFilePath();
  if (fs.existsSync(gitIgnoreFilePath)) {
    fs.appendFileSync(gitIgnoreFilePath, getGitIgnoreAppendString());
  } else {
    fs.writeFileSync(gitIgnoreFilePath, getGitIgnoreAppendString().trim());
  }
}


module.exports = {
  migrateProject,
};
