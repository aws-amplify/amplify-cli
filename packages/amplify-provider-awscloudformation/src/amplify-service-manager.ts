import * as fs from 'fs-extra';
import * as path from 'path';
import inquirer from 'inquirer';
import sequential from 'promise-sequential';
import { S3 } from './aws-utils/aws-s3';
import { getConfiguredAmplifyClient } from './aws-utils/aws-amplify';
import { ProviderName, AmplifyAppIdLabel } from './constants';
import { checkAmplifyServiceIAMPermission } from './amplify-service-permission-check';
import { $TSContext, stateManager, AmplifyFault, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { fileLogger } from './utils/aws-logger';
import { loadConfigurationForEnv } from './configuration-manager';
import {
  CreateAppCommand,
  CreateBackendEnvironmentCommand,
  DeleteBackendEnvironmentCommand,
  GetAppCommand,
  GetBackendEnvironmentCommand,
  ListAppsCommand,
} from '@aws-sdk/client-amplify';

const logger = fileLogger('amplify-service-manager');

export async function init(amplifyServiceParams) {
  const { context, awsConfigInfo, projectName, envName, stackName } = amplifyServiceParams;

  let amplifyAppId;
  let verifiedStackName = stackName;
  let deploymentBucketName = `${stackName}-deployment`;

  const amplifyClient = await getConfiguredAmplifyClient(context, awsConfigInfo);
  if (!amplifyClient) {
    // This happens when the Amplify service is not available in the region
    return {
      amplifyAppId,
      verifiedStackName,
      deploymentBucketName,
    };
  }

  const hasPermission = await checkAmplifyServiceIAMPermission(context, amplifyClient);
  if (!hasPermission) {
    return {
      amplifyAppId,
      verifiedStackName,
      deploymentBucketName,
    };
  }

  if (context.exeInfo && context.exeInfo.inputParams && context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.appId) {
    const inputAmplifyAppId = context.exeInfo.inputParams.amplify.appId;
    logger('init.amplifyClient.getApp', [
      {
        appId: inputAmplifyAppId,
      },
    ])();

    try {
      const getAppResult = await amplifyClient.send(new GetAppCommand({ appId: inputAmplifyAppId }));
      context.print.info(`Amplify AppID found: ${inputAmplifyAppId}. Amplify App name is: ${getAppResult.app.name}`);
      amplifyAppId = inputAmplifyAppId;
    } catch (e) {
      throw new AmplifyError(
        'ProjectNotFoundError',
        {
          message: `Amplify AppID ${inputAmplifyAppId} not found.`,
          resolution: `Please ensure your local profile matches the AWS account or region in which the Amplify app exists.`,
        },
        e,
      );
    }
  }

  if (!amplifyAppId) {
    // in the "amplify env add" workflow, there might be other envs, new env can be added to existing appId
    if (stateManager.teamProviderInfoExists()) {
      const teamProviderInfo = stateManager.getTeamProviderInfo();
      const envList = Object.keys(teamProviderInfo);

      let appIdsInTheSameLocalProjectAndRegion = [];
      for (const env of envList) {
        if (
          env !== envName &&
          teamProviderInfo[env][ProviderName].Region === awsConfigInfo.region &&
          teamProviderInfo[env][ProviderName][AmplifyAppIdLabel] &&
          !appIdsInTheSameLocalProjectAndRegion.includes(teamProviderInfo[env][ProviderName][AmplifyAppIdLabel])
        ) {
          appIdsInTheSameLocalProjectAndRegion.push(teamProviderInfo[env][ProviderName][AmplifyAppIdLabel]);
        }
      }

      if (appIdsInTheSameLocalProjectAndRegion.length > 0) {
        let apps = [];
        let listAppsResponse: { nextToken?: string; apps?: AppList } = {};

        do {
          logger('init.amplifyClient.listApps', [
            {
              nextToken: listAppsResponse.nextToken,
              maxResults: 25,
            },
          ])();
          listAppsResponse = await amplifyClient.send(
            new ListAppsCommand({
              nextToken: listAppsResponse.nextToken,
              maxResults: 25,
            }),
          );
          apps = apps.concat(listAppsResponse.apps);
        } while (listAppsResponse.nextToken);

        const verifiedAppIds = apps.map((app) => app.appId);
        appIdsInTheSameLocalProjectAndRegion = appIdsInTheSameLocalProjectAndRegion.filter((appId) => verifiedAppIds.includes(appId));

        if (appIdsInTheSameLocalProjectAndRegion.length === 1) {
          amplifyAppId = appIdsInTheSameLocalProjectAndRegion[0]; // eslint-disable-line
        } else if (appIdsInTheSameLocalProjectAndRegion.length > 1) {
          context.print.info(`Your project is associated with multiple Amplify Service Apps in the region ${awsConfigInfo.region}`);
          amplifyAppId = await SelectFromExistingAppId(context, appIdsInTheSameLocalProjectAndRegion);
        }
      }
    }
  }

  if (!amplifyAppId) {
    const createAppParams = {
      name: projectName,
      environmentVariables: { _LIVE_PACKAGE_UPDATES: '[{"pkg":"@aws-amplify/cli","type":"npm","version":"latest"}]' },
    };

    logger('init.amplifyClient.createApp', [createAppParams])();
    try {
      if (amplifyAppCreationEnabled()) {
        const createAppResponse = await amplifyClient.send(new CreateAppCommand(createAppParams));
        amplifyAppId = createAppResponse.app.appId;
      }
    } catch (e) {
      if (e.name === 'LimitExceededException') {
        throw new AmplifyError(
          'ProjectInitError',
          {
            message: 'You have reached the Amplify App limit for this account and region',
            resolution:
              'Use a different account or region with fewer apps, or request a service limit increase: https://docs.aws.amazon.com/general/latest/gr/amplify.html#service-quotas-amplify',
          },
          e,
        );
      }
      if (context?.exeInfo?.awsConfigInfo?.configLevel === 'general' && e.name === 'ConfigError') {
        throw new AmplifyError('ConfigurationError', {
          code: e.name,
          message: e.message,
          resolution: 'https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html',
        });
      }
      // default fault
      throw new AmplifyFault(
        'ProjectInitFault',
        {
          message: e.message,
        },
        e,
      );
    }
  }

  if (!amplifyAppId) {
    return {
      amplifyAppId,
      verifiedStackName,
      deploymentBucketName,
    };
  }

  let needToCreateNewBackendEnv = false;
  const log = logger('init.amplifyClient.getBackendEnvironment', [
    {
      appId: amplifyAppId,
      environmentName: envName,
    },
  ]);

  try {
    log();
    const { backendEnvironment } = await amplifyClient.send(
      new GetBackendEnvironmentCommand({
        appId: amplifyAppId,
        environmentName: envName,
      }),
    );

    if (backendEnvironment) {
      verifiedStackName = backendEnvironment.stackName;
      deploymentBucketName = backendEnvironment.deploymentArtifacts;
    } else {
      needToCreateNewBackendEnv = true;
    }
  } catch (e) {
    log(e);
    needToCreateNewBackendEnv = true;
  }

  if (needToCreateNewBackendEnv) {
    context.print.info(`Adding backend environment ${envName} to AWS Amplify app: ${amplifyAppId}`);
    const createEnvParams = {
      appId: amplifyAppId,
      environmentName: envName,
      stackName,
      deploymentArtifacts: deploymentBucketName,
    };
    logger('init.amplifyClient.getBackendEnvironment', [createEnvParams])();
    await amplifyClient.send(new CreateBackendEnvironmentCommand(createEnvParams));
  }

  return {
    amplifyAppId,
    verifiedStackName,
    deploymentBucketName,
  };
}

export async function deleteEnv(context: $TSContext, envName: string, awsConfigInfo?: object) {
  if (stateManager.teamProviderInfoExists()) {
    const teamProviderInfo = stateManager.getTeamProviderInfo();
    if (
      teamProviderInfo[envName] &&
      teamProviderInfo[envName][ProviderName] &&
      teamProviderInfo[envName][ProviderName][AmplifyAppIdLabel]
    ) {
      const envConfig = await loadConfigurationForEnv(context, envName);
      const amplifyClient = await getConfiguredAmplifyClient(context, { ...awsConfigInfo, ...envConfig });
      if (!amplifyClient) {
        // This happens when the Amplify service is not available in the region
        return;
      }

      const hasPermission = await checkAmplifyServiceIAMPermission(context, amplifyClient);
      if (!hasPermission) {
        return;
      }

      const amplifyAppId = teamProviderInfo[envName][ProviderName][AmplifyAppIdLabel];
      const deleteEnvParams = {
        appId: amplifyAppId,
        environmentName: envName,
      };
      logger('deleteEnv.amplifyClient.deleteBackendEnvironment', [deleteEnvParams])();
      try {
        await amplifyClient.send(new DeleteBackendEnvironmentCommand(deleteEnvParams));
      } catch (ex) {
        if (ex.name === 'NotFoundException') {
          context.print.warning(ex.message);
        } else {
          throw new AmplifyFault(
            'ProjectDeleteFault',
            {
              message: ex.message,
            },
            ex,
          );
        }
      }
    }
  }
}

export async function postPushCheck(context) {
  const projectConfig = stateManager.getProjectConfig();
  const { envName } = stateManager.getLocalEnvInfo();
  const amplifyMeta = stateManager.getMeta();
  const providerMeta = amplifyMeta.providers[ProviderName];

  const appId = providerMeta[AmplifyAppIdLabel];

  if (appId) {
    return;
  }

  const stackName = providerMeta.StackName;
  const region = providerMeta.Region;

  let amplifyAppId;

  const amplifyClient = await getConfiguredAmplifyClient(context);
  if (!amplifyClient) {
    // This happens when the Amplify service is not available in the region
    return;
  }

  const hasPermission = await checkAmplifyServiceIAMPermission(context, amplifyClient);
  if (!hasPermission) {
    return;
  }

  const searchAmplifyServiceResult = await searchAmplifyService(amplifyClient, stackName);

  if (searchAmplifyServiceResult.backendEnvExists) {
    amplifyAppId = searchAmplifyServiceResult.amplifyAppId; // eslint-disable-line
  } else {
    // TODO re-implement this check using service calls instead of team-provider-info.json
    const teamProviderInfo = stateManager.getTeamProviderInfo();
    const envList = Object.keys(teamProviderInfo);

    let appIdsInTheSameLocalProjectAndRegion = [];
    for (const env of envList) {
      if (
        env !== envName &&
        teamProviderInfo[env][ProviderName].Region === region &&
        teamProviderInfo[env][ProviderName][AmplifyAppIdLabel]
      ) {
        appIdsInTheSameLocalProjectAndRegion.push(teamProviderInfo[env][ProviderName][AmplifyAppIdLabel]);
      }
    }

    const verifiedAppIds = searchAmplifyServiceResult.apps.map((app) => app.appId);
    appIdsInTheSameLocalProjectAndRegion = appIdsInTheSameLocalProjectAndRegion.filter((appId) => verifiedAppIds.includes(appId));

    if (appIdsInTheSameLocalProjectAndRegion.length === 1) {
      amplifyAppId = appIdsInTheSameLocalProjectAndRegion[0]; // eslint-disable-line
    } else if (appIdsInTheSameLocalProjectAndRegion.length > 1) {
      context.print.info(`Your project is associated with multiple Amplify Service Apps in the region ${region}`);
      amplifyAppId = await SelectFromExistingAppId(context, appIdsInTheSameLocalProjectAndRegion);
    }

    if (!amplifyAppId) {
      const createAppParams = {
        name: projectConfig.projectName,
        environmentVariables: { _LIVE_PACKAGE_UPDATES: '[{"pkg":"@aws-amplify/cli","type":"npm","version":"latest"}]' },
      };
      logger('postPushCheck.amplifyClient.createApp', [createAppParams])();
      try {
        if (amplifyAppCreationEnabled()) {
          const createAppResponse = await amplifyClient.send(new CreateAppCommand(createAppParams));
          amplifyAppId = createAppResponse.app.appId;
        }
      } catch (e) {
        if (e.name === 'LimitExceededException') {
          // Do nothing
        } else if (
          e.name === 'BadRequestException' &&
          e.message.includes('Rate exceeded while calling CreateApp, please slow down or try again later.')
        ) {
          // Do nothing
        } else {
          throw new AmplifyFault(
            'ProjectInitFault',
            {
              message: e.message,
            },
            e,
          );
        }
      }
    }

    if (!amplifyAppId) {
      return;
    }

    const createEnvParams = {
      appId: amplifyAppId,
      environmentName: envName,
      stackName: teamProviderInfo[envName][ProviderName].StackName,
      deploymentArtifacts: teamProviderInfo[envName][ProviderName].DeploymentBucketName,
    };
    logger('postPushCheck.amplifyClient.createBackendEnvironment', [createEnvParams])();
    await amplifyClient.send(new CreateBackendEnvironmentCommand(createEnvParams));
  }

  providerMeta[AmplifyAppIdLabel] = amplifyAppId;
  stateManager.setMeta(undefined, amplifyMeta);

  const tpi = stateManager.getTeamProviderInfo();
  tpi[envName][ProviderName][AmplifyAppIdLabel] = amplifyAppId;
  stateManager.setTeamProviderInfo(undefined, tpi);
}

async function SelectFromExistingAppId(context, appIdsInTheSameLocalProjectAndRegion) {
  let amplifyAppId;

  const LEARNMORE = 'Learn More';
  const NONE = 'None';

  const options = appIdsInTheSameLocalProjectAndRegion.slice(0);
  options.push(NONE);
  options.push(LEARNMORE);

  const answer = await inquirer.prompt({
    type: 'list',
    name: 'selection',
    message: `Select the app id you want this env to be associated with`,
    choices: options,
    default: options[0],
  });

  if (answer.selection === LEARNMORE) {
    displayAppIdSelectionLearnMore(context);
    amplifyAppId = await SelectFromExistingAppId(context, appIdsInTheSameLocalProjectAndRegion);
  }

  if (answer.selection !== NONE) {
    amplifyAppId = answer.selection;
  }

  return amplifyAppId;
}

function displayAppIdSelectionLearnMore(context) {
  // this should rarely happen
  context.print.info('');
  context.print.green(
    'The AWS Amplify Console stores information on your backend environment in the cloud to facilitate collaboration workflows for your team.',
  );
  context.print.green('Select an existing AWS Amplify Console app to associate this backend environment with the app.');
  context.print.green(
    'Select None will lead to the creation of a new AWS Amplify Service App that this backend environment will be associated with.',
  );
  context.print.info('');
}

type AppList = { appId: string }[];

type AmplifySearchResult = {
  apps: AppList;
  backendEnvExists: boolean;
  amplifyAppId?: string;
  environmentName?: string;
};

/**
 * The types in this function may not be complete but they are the minimal types that I can infer from usage when converting this file from js to ts
 */
async function searchAmplifyService(amplifyClient, stackName): Promise<AmplifySearchResult> {
  const result: AmplifySearchResult = {
    apps: [],
    backendEnvExists: false,
  };

  let listAppsResponse: { nextToken?: string; apps?: AppList } = {};
  do {
    logger('searchAmplifyService.amplifyClient.listApps', [
      {
        nextToken: listAppsResponse.nextToken,
        maxResults: 25,
      },
    ])();
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
      let listEnvResponse: { nextToken?: string; backendEnvironments?: { environmentName: string; stackName: string }[] } = {};
      do {
        logger('searchAmplifyService.amplifyClient.listBackendEnvironments', [
          {
            appId: listAppsResponse.apps[i].appId,
            nextToken: listEnvResponse.nextToken,
          },
        ])();
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

export function storeArtifactsForAmplifyService(context) {
  return S3.getInstance(context).then(async (s3) => {
    const currentCloudBackendDir = context.amplify.pathManager.getCurrentCloudBackendDirPath();
    const amplifyMetaFilePath = path.join(currentCloudBackendDir, 'amplify-meta.json');
    const backendConfigFilePath = path.join(currentCloudBackendDir, 'backend-config.json');
    const fileUploadTasks = [];

    fileUploadTasks.push(() => uploadFile(s3, amplifyMetaFilePath, 'amplify-meta.json'));
    fileUploadTasks.push(() => uploadFile(s3, backendConfigFilePath, 'backend-config.json'));

    await sequential(fileUploadTasks);
  });
}

async function uploadFile(s3, filePath, key) {
  if (fs.existsSync(filePath)) {
    const s3Params = {
      Body: fs.createReadStream(filePath),
      Key: key,
    };
    logger('s3.uploadFile', [{ Key: key }])();
    await s3.uploadFile(s3Params);
  }
}

const amplifyAppCreationEnabled = () => !process.env || process.env.CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION !== '1';
