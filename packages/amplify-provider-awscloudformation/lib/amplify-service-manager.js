const fs = require('fs-extra');
const inquirer = require('inquirer');
const { getConfiguredAmplifyClient } = require('../src/aws-utils/aws-amplify');
const constants = require('./constants');

async function init(amplifyServiceParams) {
  const { context, awsConfig, projectName, envName, stackName } = amplifyServiceParams;

  const amplifyClient = await getConfiguredAmplifyClient(context, awsConfig);

  let amplifyAppId;

  if (context.exeInfo && context.exeInfo.inputParams && context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.appId) {
    const inputAmplifyAppId = context.exeInfo.inputParams.amplify.appId;
    try {
      const getAppResult = await amplifyClient
        .getApp({
          appId: inputAmplifyAppId,
        })
        .promise();
      context.print.info(`Input Amplify AppId is verified: ${inputAmplifyAppId}`);
      context.print.info(`Amplify App name is: ${getAppResult.app.name}`);
      amplifyAppId = inputAmplifyAppId;
    } catch (e) {
      context.print.error(`Input Amplify AppId is invalild: ${inputAmplifyAppId}`);
      context.print.info(e);
      throw e;
    }
  }

  if (!amplifyAppId) {
    // in the "amplify env add" workflow, there might be other envs, new env can be added to existing appId
    let teamProviderFilePath;
    try {
      teamProviderFilePath = context.amplify.pathManager.getProviderInfoFilePath();
    } catch (e) {
      // do nothing
    }

    if (teamProviderFilePath && fs.existsSync(teamProviderFilePath)) {
      const teamProviderInfo = context.amplify.readJsonFile(teamProviderFilePath);

      const envList = Object.keys(teamProviderInfo);

      let appIdsInTheSameLocalProjectAndRegion = [];
      for (let i = 0; i < envList.length; i++) {
        const env = envList[i];
        if (
          env !== envName &&
          teamProviderInfo[env][constants.ProviderName].Region === awsConfig.region &&
          teamProviderInfo[env][constants.ProviderName][constants.AmplifyAppIdLabel]
        ) {
          appIdsInTheSameLocalProjectAndRegion.push(teamProviderInfo[env][constants.ProviderName][constants.AmplifyAppIdLabel]);
        }
      }

      if (appIdsInTheSameLocalProjectAndRegion.length > 0) {
        let apps = [];
        let listAppsResponse = {};
        do {
          listAppsResponse = await amplifyClient
            .listApps({
              nextToken: listAppsResponse.nextToken,
              maxResults: 25,
            })
            .promise();
          apps = apps.concat(listAppsResponse.apps);
        } while (listAppsResponse.nextToken);

        const verifiedAppIds = apps.map(app => app.appId);
        appIdsInTheSameLocalProjectAndRegion = appIdsInTheSameLocalProjectAndRegion.filter(appId => verifiedAppIds.includes(appId));

        if (appIdsInTheSameLocalProjectAndRegion.length === 1) {
          amplifyAppId = appIdsInTheSameLocalProjectAndRegion[0]; // eslint-disable-line
        } else if (appIdsInTheSameLocalProjectAndRegion.length > 1) {
          context.print.info(`You project is associated with multiple Amplify Service Apps in the region ${awsConfig.region}`);
          amplifyAppId = await SelectFromExistingAppId(context, appIdsInTheSameLocalProjectAndRegion);
        }
      }
    }
  }

  if (!amplifyAppId) {
    const createAppParams = {
      name: projectName,
    };
    const createAppResponse = await amplifyClient.createApp(createAppParams).promise();
    amplifyAppId = createAppResponse.app.appId;
  }

  let verifiedStackName = stackName;
  let deploymentBucketName = `${stackName}-deployment`;

  let needToCreateNewBackendEnv = false;
  try {
    const { backendEnvironment } = await amplifyClient
      .getBackendEnvironment({
        appId: amplifyAppId,
        environmentName: envName,
      })
      .promise();

    if (backendEnvironment) {
      verifiedStackName = backendEnvironment.stackName;
      deploymentBucketName = backendEnvironment.deploymentArtifacts;
    } else {
      needToCreateNewBackendEnv = true;
    }
  } catch (e) {
    needToCreateNewBackendEnv = true;
  }

  if (needToCreateNewBackendEnv) {
    const createEnvParams = {
      appId: amplifyAppId,
      environmentName: envName,
      stackName,
      deploymentArtifacts: deploymentBucketName,
    };
    await amplifyClient.createBackendEnvironment(createEnvParams).promise();
  }

  return {
    amplifyAppId,
    verifiedStackName,
    deploymentBucketName,
  };
}

async function deleteEnv(context, envName, awsConfig) {
  const teamProviderFilePath = context.amplify.pathManager.getProviderInfoFilePath();
  if (fs.existsSync(teamProviderFilePath)) {
    const teamProviderInfo = context.amplify.readJsonFile(teamProviderFilePath);
    if (
      teamProviderInfo[envName] &&
      teamProviderInfo[envName][constants.ProviderName] &&
      teamProviderInfo[envName][constants.ProviderName][constants.AmplifyAppIdLabel]
    ) {
      const amplifyAppId = teamProviderInfo[envName][constants.ProviderName][constants.AmplifyAppIdLabel];
      const amplifyClient = await getConfiguredAmplifyClient(context, awsConfig);
      const deleteEnvParams = {
        appId: amplifyAppId,
        environmentName: envName,
      };
      await amplifyClient.deleteBackendEnvironment(deleteEnvParams).promise();
    }
  }
}

async function postPushCheck(context) {
  const { projectConfig, amplifyMeta, localEnvInfo, teamProviderInfo } = context.amplify.getProjectDetails();

  const { envName } = localEnvInfo;
  const stackName = teamProviderInfo[envName][constants.ProviderName].StackName;
  const region = teamProviderInfo[envName][constants.ProviderName].Region;

  if (!teamProviderInfo[envName][constants.ProviderName][constants.AmplifyAppIdLabel]) {
    let amplifyAppId;

    const amplifyClient = await getConfiguredAmplifyClient(context);
    const searchAmplifyServiceResult = await searchAmplifyService(amplifyClient, stackName);

    if (searchAmplifyServiceResult.backendEnvExists) {
      amplifyAppId = searchAmplifyServiceResult.amplifyAppId; // eslint-disable-line
    } else {
      const envList = Object.keys(teamProviderInfo);

      let appIdsInTheSameLocalProjectAndRegion = [];
      for (let i = 0; i < envList.length; i++) {
        const env = envList[i];
        if (
          env !== envName &&
          teamProviderInfo[env][constants.ProviderName].Region === region &&
          teamProviderInfo[env][constants.ProviderName][constants.AmplifyAppIdLabel]
        ) {
          appIdsInTheSameLocalProjectAndRegion.push(teamProviderInfo[env][constants.ProviderName][constants.AmplifyAppIdLabel]);
        }
      }

      const verifiedAppIds = searchAmplifyServiceResult.apps.map(app => app.appId);
      appIdsInTheSameLocalProjectAndRegion = appIdsInTheSameLocalProjectAndRegion.filter(appId => verifiedAppIds.includes(appId));

      if (appIdsInTheSameLocalProjectAndRegion.length === 1) {
        amplifyAppId = appIdsInTheSameLocalProjectAndRegion[0]; // eslint-disable-line
      } else if (appIdsInTheSameLocalProjectAndRegion.length > 1) {
        context.print.info(`You project is associated with multiple Amplify Service Apps in the region ${region}`);
        amplifyAppId = await SelectFromExistingAppId(context, appIdsInTheSameLocalProjectAndRegion);
      }

      if (!amplifyAppId) {
        const createAppParams = {
          name: projectConfig.projectName,
        };
        const createAppResponse = await amplifyClient.createApp(createAppParams).promise();
        amplifyAppId = createAppResponse.app.appId;
      }

      const createEnvParams = {
        appId: amplifyAppId,
        environmentName: envName,
        stackName: teamProviderInfo[envName][constants.ProviderName].StackName,
        deploymentArtifacts: teamProviderInfo[envName][constants.ProviderName].DeploymentBucketName,
      };

      await amplifyClient.createBackendEnvironment(createEnvParams).promise();
    }

    teamProviderInfo[envName][constants.ProviderName][constants.AmplifyAppIdLabel] = amplifyAppId;
    amplifyMeta.providers[constants.ProviderName][constants.AmplifyAppIdLabel] = amplifyAppId;

    const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
    let jsonString = JSON.stringify(amplifyMeta, null, 4);
    fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');

    const teamProviderInfoFilePath = context.amplify.pathManager.getProviderInfoFilePath();
    jsonString = JSON.stringify(teamProviderInfo, null, 4);
    fs.writeFileSync(teamProviderInfoFilePath, jsonString, 'utf8');
  }
}

async function SelectFromExistingAppId(context, appIdsInTheSameLocalProjectAndRegion) {
  let amplifyAppId;

  const LEARNMORE = 'Learn More';
  const NONE = 'None';

  const options = appIdsInTheSameLocalProjectAndRegion.slice(0);
  options.Push(NONE);
  options.Push(LEARNMORE);

  const answer = await inquirer.prompt({
    type: 'list',
    name: 'selection',
    message: `Select the app id you want this env to be be associated with`,
    choices: options,
    default: options[0],
  });

  if (answer.selection === LEARNMORE) {
    displayAppIdSelectionLearnMore(context);
    amplifyAppId = await SelectFromExistingAppId(appIdsInTheSameLocalProjectAndRegion);
  }

  if (answer.selection !== NONE) {
    amplifyAppId = answer.selection;
  }

  return amplifyAppId;
}

function displayAppIdSelectionLearnMore(context) {
  // this should rarely happen
  context.print.info('');
  context.print.green("AWS Amplify Service stores information of your project's the backend environments in the cloud.");
  context.print.green("It facilitates the team collaboration workflow of your project's development.");
  context.print.green(
    'You can select to associate this environment with an existing AWS Amplify Service App that other backend environements of the project are associated with.'
  );
  context.print.green(
    'Select None will lead to the creation of a new AWS Amplify Service App that this backend environment will be associated with.'
  );
  context.print.info('');
}

async function searchAmplifyService(amplifyClient, stackName) {
  const result = {
    apps: [],
    backendEnvExists: false,
  };

  let listAppsResponse = {};
  do {
    listAppsResponse = await amplifyClient
      .listApps({
        nextToken: listAppsResponse.nextToken,
        maxResults: 25,
      })
      .promise();
    result.apps = result.apps.concat(listAppsResponse.apps);
  } while (listAppsResponse.nextToken);

  if (listAppsResponse.apps.length > 0) {
    for (let i = 0; i < listAppsResponse.apps.length; i++) {
      let listEnvResponse = {};
      do {
        listEnvResponse = await amplifyClient
          .listBackendEnvironments({
            appId: listAppsResponse.apps[i].appId,
            nextToken: listEnvResponse.nextToken,
          })
          .promise();

        for (let j = 0; j < listEnvResponse.backendEnvironments.length; j++) {
          if (listEnvResponse.backendEnvironments[j].stackName === stackName) {
            result.backendEnvExists = true;
            result.amplifyAppId = listAppsResponse.apps[i].appId;
            result.environmentName = listEnvResponse.backendEnvironments[j].environmentName;
          }
        }
      } while (listEnvResponse.nextToken && !result.backendEnvExists);

      if (result.backendEnvExists) {
        break;
      }
    }
  }

  return result;
}

module.exports = {
  init,
  deleteEnv,
  postPushCheck,
};
