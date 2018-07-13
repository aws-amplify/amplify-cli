const path = require('path');
const fs = require('fs-extra');
const inquirer = require('inquirer');
const awsRegions = require('./aws-regions');
const constants = require('./constants');
const configScanner = require('./configuration-scanner');
const setupNewUser = require('./setup-new-user');

async function init(context) {
  context.projectConfigInfo = {};
  await newUserCheck(context);
  printInfo(context);
  await comfirmProjectConfigSetup(context, true);
  return carryOutConfigAction(context);
}

function configure(context) {
  context.projectConfigInfo = {};
  printInfo(context);
  return promptForProjectConfigUpdate(context)
    .then(carryOutConfigAction);
}

function carryOutConfigAction(context) {
  let result;
  switch (context.projectConfigInfo.action) {
    case 'init':
      result = initialize(context);
      break;
    case 'create':
      result = create(context);
      break;
    case 'update':
      result = update(context);
      break;
    case 'remove':
      result = remove(context);
      break;
    default:
      result = context;
  }
  return result;
}

function initialize(context) {
  return configProject(context)
    .then(validateConfig)
    .then((ctxt) => {
      if (ctxt.projectConfigInfo.configValidated) {
        return ctxt;
      }
      throw new Error('Invalid configuration settings');
    });
}

function onInitSuccessful(context) {
  if (context.projectConfigInfo.action === 'init') {
    return createProjectConfig(context);
  }
  return context;
}

function create(context) {
  return configProject(context)
    .then(validateConfig)
    .then((ctxt) => {
      if (ctxt.projectConfigInfo.configValidated) {
        createProjectConfig(ctxt);
        return ctxt;
      }
      throw new Error('Invalid configuration settings');
    });
}

function update(context) {
  return configProject(context)
    .then(validateConfig)
    .then((ctxt) => {
      if (ctxt.projectConfigInfo.configValidated) {
        updateProjectConfig(ctxt);
        return ctxt;
      }
      throw new Error('Invalid configuration settings');
    });
}

function remove(context) {
  return confirmProjectConfigRemoval(context)
    .then((ctxt) => {
      if (ctxt.projectConfigInfo.action !== 'cancel') {
        removeProjectConfig(ctxt);
      }
    });
}

function printInfo(context) {
  context.print.info('');
  context.print.info('Amplify-provider-awscloudformation uses two levels of configurations.');
  context.print.info('General configuration is used by default for all projects.');
  context.print.info('You can also configure the provider specifically for this project.');
  context.print.info('Project specific configuration overrides the general configuration.');
  context.print.info('');
}

function comfirmProjectConfigSetup(context, isInit) {
  const configProjectComfirmation = {
    type: 'confirm',
    name: 'setProjectConfig',
    message: 'Do you want to setup project specific configuration',
    default: false,
  };
  return inquirer.prompt(configProjectComfirmation)
    .then((answers) => {
      const initOrCreate = isInit ? 'init' : 'create';
      context.projectConfigInfo.action = answers.setProjectConfig ? initOrCreate : 'cancel';
      return context;
    });
}

function promptForProjectConfigUpdate(context) {
  getProjectConfig(context);
  if (context.projectConfigInfo.projectConfigExists) {
    const updateOrRemove = {
      type: 'list',
      name: 'action',
      message: 'Do you want to udpate or remove the project specific configuration',
      choices: ['update', 'remove', 'cancel'],
      default: 'update',
    };
    return inquirer.prompt(updateOrRemove)
      .then((answers) => {
        context.projectConfigInfo.action = answers.action;
        return context;
      });
  }
  return comfirmProjectConfigSetup(context);
}

function confirmProjectConfigRemoval(context) {
  const removeProjectComfirmation = {
    type: 'confirm',
    name: 'removeProjectConfig',
    message: 'Remove project specific configuration',
    default: false,
  };
  return inquirer.prompt(removeProjectComfirmation)
    .then((answers) => {
      context.projectConfigInfo.action = answers.removeProjectConfig ? 'confirmed-remove' : 'cancel';
      return context;
    });
}

function configProject(context) {
  const { projectConfigInfo } = context;
  const useProfileConfirmation = {
    type: 'confirm',
    name: 'useProfile',
    message: 'Do you want to use an existing AWS profile set on your system?',
    default: projectConfigInfo.useProfile,
  };

  const profileName = {
    type: 'input',
    name: 'profileName',
    message: 'Profile name',
    default: 'default',
  };

  const configurationSettings = [
    {
      type: 'input',
      name: 'accessKeyId',
      message: 'accessKeyId: ',
      default: projectConfigInfo.accessKeyId ?
        projectConfigInfo.accessKeyId : constants.DefaultAWSAccessKeyId,
    },
    {
      type: 'input',
      name: 'secretAccessKey',
      message: 'secretAccessKey: ',
      default: projectConfigInfo.secretAccessKey ?
        projectConfigInfo.secretAccessKey : constants.DefaultAWSSecretAccessKey,
    },
    {
      type: 'list',
      name: 'region',
      message: 'region: ',
      choices: awsRegions.regions,
      default: projectConfigInfo.region ?
        projectConfigInfo.region : constants.DefaultAWSRegion,
    },
  ];

  return inquirer.prompt(useProfileConfirmation)
    .then((answers) => {
      projectConfigInfo.useProfile = answers.useProfile;
      if (answers.useProfile) {
        return inquirer.prompt(profileName)
          .then((asws) => {
            projectConfigInfo.profileName = asws.profileName;
            return context;
          });
      }
      return inquirer.prompt(configurationSettings)
        .then((asws) => {
          projectConfigInfo.accessKeyId = asws.accessKeyId;
          projectConfigInfo.secretAccessKey = asws.secretAccessKey;
          projectConfigInfo.region = asws.region;
          return context;
        });
    });
}

function validateConfig(context) {
  const { projectConfigInfo } = context;
  projectConfigInfo.configValidated = false;
  if (projectConfigInfo.useProfile) {
    if (projectConfigInfo.profileName && projectConfigInfo.profileName.length > 0) {
      projectConfigInfo.configValidated = true;
    }
  } else {
    projectConfigInfo.configValidated = projectConfigInfo.accessKeyId &&
            projectConfigInfo.accessKeyId !== constants.DefaultAWSAccessKeyId &&
            projectConfigInfo.secretAccessKey &&
            projectConfigInfo.secretAccessKey !== constants.DefaultAWSSecretAccessKey &&
            projectConfigInfo.region && awsRegions.regions.includes(projectConfigInfo.region);
  }
  return context;
}

function createProjectConfig(context) {
  const { projectConfigInfo } = context;
  const awsConfigInfo = {
    useProfile: projectConfigInfo.useProfile,
  };

  if (projectConfigInfo.useProfile) {
    awsConfigInfo.profileName = projectConfigInfo.profileName;
  } else {
    const awsConfig = {
      accessKeyId: projectConfigInfo.accessKeyId,
      secretAccessKey: projectConfigInfo.secretAccessKey,
      region: projectConfigInfo.region,
    };
    const sharedConfigDirPath =
      path.join(context.amplify.pathManager.getHomeDotAmplifyDirPath(), constants.Label);
    fs.ensureDirSync(sharedConfigDirPath);
    const configFileName = context.amplify.makeId(10);
    const awsConfigFilePath = path.join(sharedConfigDirPath, configFileName);
    const jsonString = JSON.stringify(awsConfig, null, 4);
    fs.writeFileSync(awsConfigFilePath, jsonString, 'utf8');

    awsConfigInfo.awsConfigFilePath = awsConfigFilePath;
  }
  const dotConfigDirPath = context.amplify.pathManager.getDotConfigDirPath();
  const configInfoFilePath = path.join(dotConfigDirPath, 'aws-info.json');
  const jsonString = JSON.stringify(awsConfigInfo, null, 4);
  fs.writeFileSync(configInfoFilePath, jsonString, 'utf8');
  return context;
}

function getProjectConfig(context) {
  const { projectConfigInfo } = context;
  projectConfigInfo.projectConfigExists = false;
  const dotConfigDirPath = context.amplify.pathManager.getDotConfigDirPath();
  const configInfoFilePath = path.join(dotConfigDirPath, 'aws-info.json');
  if (fs.existsSync(configInfoFilePath)) {
    try {
      const configInfo = JSON.parse(fs.readFileSync(configInfoFilePath, 'utf8'));
      if (configInfo.useProfile && configInfo.profileName) {
        projectConfigInfo.useProfile = configInfo.useProfile;
        projectConfigInfo.profileName = configInfo.profileName;
      } else if (configInfo.awsConfigFilePath && fs.existsSync(configInfo.awsConfigFilePath)) {
        const awsConfig = JSON.parse(fs.readFileSync(configInfo.awsConfigFilePath, 'utf8'));
        projectConfigInfo.useProfile = false;
        projectConfigInfo.accessKeyId = awsConfig.accessKeyId;
        projectConfigInfo.secretAccessKey = awsConfig.secretAccessKey;
        projectConfigInfo.region = awsConfig.region;
      }
      projectConfigInfo.projectConfigExists = true;
    } catch (e) {
      fs.removeSync(configInfoFilePath);
    }
  }
  return context;
}

function updateProjectConfig(context) {
  removeProjectConfig(context);
  createProjectConfig(context);
  return context;
}

function removeProjectConfig(context) {
  const dotConfigDirPath = context.amplify.pathManager.getDotConfigDirPath();
  const configInfoFilePath = path.join(dotConfigDirPath, 'aws-info.json');
  if (fs.existsSync(configInfoFilePath)) {
    const configInfo = JSON.parse(fs.readFileSync(configInfoFilePath, 'utf8'));
    if (configInfo.awsConfigFilePath && fs.existsSync(configInfo.awsConfigFilePath)) {
      fs.removeSync(configInfo.awsConfigFilePath);
    }
    fs.removeSync(configInfoFilePath);
  }
  return context;
}

async function loadConfiguration(context, awsClient) {
  process.env.AWS_SDK_LOAD_CONFIG = true;
  await newUserCheck(context);
  return logProjectSpecificConfg(context, awsClient);
}

async function newUserCheck(context) {
  const configSource = configScanner.run(context);
  if (configSource === 'none') {
    context.print.info('AWS access credentials can not be resolved.');
    const answer = await inquirer.prompt([{
      type: 'confirm',
      name: 'setupNewUser',
      message: 'Setup new user',
      default: true,
    }]);
    if (answer.setupNewUser) {
      await setupNewUser.run(context);
    }
  }
  return context;
}

function logProjectSpecificConfg(context, awsClient) {
  const dotConfigDirPath = context.amplify.pathManager.getDotConfigDirPath();
  const configInfoFilePath = path.join(dotConfigDirPath, 'aws-info.json');
  if (fs.existsSync(configInfoFilePath)) {
    const configInfo = JSON.parse(fs.readFileSync(configInfoFilePath, 'utf8'));
    if (configInfo.useProfile && configInfo.profileName) {
      process.env.AWS_PROFILE = configInfo.profileName;
    } else if (configInfo.awsConfigFilePath && fs.existsSync(configInfo.awsConfigFilePath)) {
      awsClient.config.loadFromPath(configInfo.awsConfigFilePath);
    }
  }
  return awsClient;
}

module.exports = {
  init,
  onInitSuccessful,
  configure,
  loadConfiguration,
};
