const fs = require('fs-extra');
const ora = require('ora');
const Mobile = require('../../amplify-provider-awscloudformation/src/aws-utils/aws-mobilehub');

const {
  getLambdaFunctionDetails,
  getDynamoDbDetails,
  getPinpointChannelDetail,
} = require('../../amplify-provider-awscloudformation/lib/mobilehub-import-helper');

const spinner = ora('');

async function importProject(context) {
  const frontendPlugins = context.amplify.getFrontendPlugins(context);
  const projectConfigFilePath = context.amplify.pathManager.getProjectConfigFilePath();
  const projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));

  if (context.parameters.first) {
    const projectId = context.parameters.first;
    try {
      spinner.start('Importing your project');
      const mobileHubResources = await getMobileResources(projectId, context);
      await persistResourcesToConfig(mobileHubResources, context);

      const frontendHandlerModule = require(frontendPlugins[projectConfig.frontend]);
      frontendHandlerModule.createFrontendConfigs(context, getResourceOutputs(context));
      spinner.succeed('Importing your project was successfully.');
    } catch (error) {
      spinner.fail(`There was an error importing your project: ${error.message}`);
      throw error;
    }
  } else {
    context.print.error('Something went wrong. You did not specify a project id. Try this format \' amplify mobilehub-import [PROJECT-ID] \'');
  }
}
async function getMobileResources(projectId, context) {
  const mobileHub = await new Mobile(context);
  const projectResources = await mobileHub.getProjectResources(projectId);
  const configuration = await createAmplifyMetaConfig(projectResources, context);
  return configuration;
}

async function createAmplifyMetaConfig(mobileHubResources, context) {
  const mobileHubAmplifyMap = {
    'user-signin': 'auth',
    analytics: 'analytics',
    'user-data': 'storage',
    hosting: 'storage',
    database: 'database',
    'cloud-api': 'api',
    bots: 'interactions',
  };
  let config = { env: false };
  const featurePromises = Object.keys(mobileHubAmplifyMap).map(async (mobileHubCategory) => {
    // eslint-disable-next-line max-len
    const featureResult = mobileHubResources.details.resources.filter(resource => resource.feature === mobileHubCategory);
    featureResult.region = mobileHubResources.details.region;
    if (featureResult) {
      // eslint-disable-next-line max-len
      config = await buildCategory(featureResult, mobileHubAmplifyMap, mobileHubCategory, config, context);
    }
  });
  await Promise.all(featurePromises);
  return config;
}


// eslint-disable-next-line max-len
async function buildCategory(featureResult, mobileHubAmplifyMap, mobileHubCategory, config, context) {
  const amplifyCategory = mobileHubAmplifyMap[mobileHubCategory];
  switch (amplifyCategory) {
    case 'auth':
      return createAuth(featureResult, config);
    case 'analytics':
      return await createAnalytics(featureResult, config, context);
    case 'storage':
      return createStorage(featureResult, config, context);
    case 'database':
      return await createTables(featureResult, config, context);
    case 'api':
      return await createApi(featureResult, config, context);
    case 'interactions':
      return createInteractions(featureResult, config, context);
    default:
      return config;
  }
}

function createAuth(featureResult, config) {
  const hasAuth = featureResult.find(item => item.type === 'AWS::Cognito::IdentityPool')
  && featureResult.find(item => item.type === 'AWS::Cognito::UserPool');

  if (hasAuth) {
    config.auth = {};
    config.auth[`cognito${new Date().getMilliseconds()}`] = {
      service: 'Cognito',
      providerPlugin: 'awscloudformation',
      lastPushTimeStamp: new Date().toISOString(),
      output: {
        IdentityPoolId: featureResult.find(item => item.type === 'AWS::Cognito::IdentityPool').attributes.poolid,
        IdentityPoolName: featureResult.find(item => item.type === 'AWS::Cognito::IdentityPool').name,
        AppClientSecret: featureResult.find(item => item.type === 'AWS::Cognito::UserPool').attributes['user-pools-client-secret'],
        UserPoolId: featureResult.find(item => item.type === 'AWS::Cognito::UserPool').attributes['user-pools-id'],
        AppClientIDWeb: featureResult.find(item => item.type === 'AWS::Cognito::UserPool').attributes['user-pools-web-client-id'],
        AppClientID: featureResult.find(item => item.type === 'AWS::Cognito::UserPool').attributes['user-pools-client-id'],
        UserPoolName: featureResult.find(item => item.type === 'AWS::Cognito::UserPool').name,
      },
    };
  }
  return config;
}

async function createAnalytics(featureResult, config, context) {
  config.analytics = {};
  config.analytics[`analytics${new Date().getMilliseconds()}`] = {
    service: 'Pinpoint',
    providerPlugin: 'awscloudformation',
    lastPushTimeStamp: new Date().toISOString(),
    output: {
      appName: featureResult.find(item => item.type === 'AWS::Pinpoint::AnalyticsApplication').name,
      Region: featureResult.region,
      Id: featureResult.find(item => item.type === 'AWS::Pinpoint::AnalyticsApplication').arn,
    },
  };
  config = await createNotifications(featureResult, config, context);
  return config;
}

function createStorage(featureResult, config) {
  const hasS3 = featureResult.find(item => item.type === 'AWS::S3::Bucket' && item.feature === 'user-data');
  if (hasS3) {
    config.storage = {};
    config.storage[`s3${new Date().getMilliseconds()}`] = {
      service: 'S3',
      providerPlugin: 'awscloudformation',
      lastPushTimeStamp: new Date().toISOString(),
      output: {
        BucketName: featureResult.find(item => item.type === 'AWS::S3::Bucket').name,
        Region: featureResult.find(item => item.type === 'AWS::S3::Bucket').attributes.region,
      },
    };
  }
  config = createHosting(featureResult, config);
  return config;
}

async function createTables(featureResult, config, context) {
  const hasDynamoDb = featureResult.find(item => item.type === 'AWS::DynamoDB::Table');
  if (hasDynamoDb) {
    if (!config.storage) {
      config.storage = {};
    } else {
      const tableName = featureResult.find(item => item.type === 'AWS::DynamoDB::Table').name;
      const serviceName = `dynamo${new Date().getMilliseconds()}`;
      config.storage[serviceName] = {
        service: 'DynamoDb',
        providerPlugin: 'awscloudformation',
        lastPushTimeStamp: new Date().toISOString(),
        output: {
          Region: featureResult.region,
          Arn: featureResult.find(item => item.type === 'AWS::DynamoDB::Table').arn,
          Name: tableName,
        },
      };
      // eslint-disable-next-line max-len
      const tableDetails = await getDynamoDbDetails(context, { region: featureResult.region }, tableName);
      const partitionKey = tableDetails.Table.KeySchema
        .find(item => item.KeyType === 'HASH').AttributeName;
      const partitionKeyType = tableDetails.Table.AttributeDefinitions
        .find(item => item.AttributeName === partitionKey).AttributeType;
      config.storage[serviceName].output.PartitionKeyName = partitionKey;
      config.storage[serviceName].output.PartitionKeyType = partitionKeyType;
    }
  }
  return config;
}

function createHosting(featureResult, config) {
  const hasHosting = featureResult.find(item => item.type === 'AWS::S3::Bucket');
  if (hasHosting) {
    config.hosting = {};
    config.hosting.S3AndCloudFront = {
      service: 'S3AndCloudFront',
      providerPlugin: 'awscloudformation',
      lastPushTimeStamp: new Date().toISOString(),
      output: {
        S3BucketSecureURL: featureResult.find(item => item.type === 'AWS::S3::Bucket').attributes['s3-bucket-console-url'],
        WebsiteURL: featureResult.find(item => item.type === 'AWS::S3::Bucket').attributes['s3-bucket-website-url'],
        Region: featureResult.find(item => item.type === 'AWS::S3::Bucket').attributes.region,
        HostingBucketName: featureResult.find(item => item.type === 'AWS::S3::Bucket').name,
      },
    };
  }
  return config;
}

async function createApi(featureResult, config, context) {
  const hasApi = featureResult.some(item => item.type === 'AWS::ApiGateway::RestApi');
  const hasFunctions = featureResult.some(item => item.type === 'AWS::Lambda::Function');

  if (hasApi) {
    config.api = {};
    config.api[`api${new Date().getMilliseconds()}`] = {
      service: 'API Gateway',
      providerPlugin: 'awscloudformation',
      lastPushTimeStamp: new Date().toISOString(),
      output: {
        ApiName: featureResult.find(item => item.type === 'AWS::ApiGateway::RestApi').name,
        RootUrl: '', // TODO
      },
    };
  }
  if (hasFunctions) {
    const functions = featureResult.filter(item => item.type === 'AWS::Lambda::Function');
    config.function = {};
    const functionPromises = functions.map(async (element) => {
      // eslint-disable-next-line max-len
      const functionDetails = await getLambdaFunctionDetails(context, { region: featureResult.region }, element.name);
      if (!element.attributes.status.includes('DELETE_SKIPPED')) {
        config.function[`${element.name}`] = {
          service: 'Lambda',
          providerPlugin: 'awscloudformation',
          lastPushTimeStamp: new Date().toISOString(),
          build: true,
          output: {
            Region: element.attributes.region,
            Arn: functionDetails.Configuration.FunctionArn,
            Name: element.name,
          },
        };
      }
    });
    await Promise.all(functionPromises);
  }
  return config;
}

function createInteractions(featureResult, config) {
  const hasBots = featureResult.some(item => item.type === 'AWS::Lex::Bot');
  if (hasBots) {
    config.interactions = {};
    config.interactions[`lex${new Date().getMilliseconds()}`] = {
      service: 'Lex',
      providerPlugin: 'awscloudformation',
      lastPushTimeStamp: new Date().toISOString(),
      output: {
        FunctionArn: featureResult.find(item => item.type === 'AWS::Lex::Bot').arn,
        Region: featureResult.find(item => item.type === 'AWS::Lex::Bot').attributes.region,
        BotName: featureResult.find(item => item.type === 'AWS::Lex::Bot').name,
      },
    };
  }
  return config;
}

async function createNotifications(featureResult, config, context) {
  if (hasNotifications(featureResult)) {
    const appName = featureResult.find(item => item.type === 'AWS::Pinpoint::AnalyticsApplication').name;
    const applicationId = featureResult.find(item => item.type === 'AWS::Pinpoint::AnalyticsApplication').arn;
    const channels = {
      appName,
      applicationId,
      Email: featureResult.find(item => item.type === 'AWS::Pinpoint::EmailChannel'),
      SMS: featureResult.find(item => item.type === 'AWS::Pinpoint::SMSChannel'),
      GCM: featureResult.find(item => item.type === 'AWS::Pinpoint::GCMChannel'),
      APNS: featureResult.find(item => item.type === 'AWS::Pinpoint::APNSChannel'),
    };
    featureResult.region = 'us-east-1';
    config.notifications = {};
    config.notifications[`${appName}`] = {
      service: 'Pinpoint',
      providerPlugin: 'awscloudformation',
      lastPushTimeStamp: new Date().toISOString(),
    };
    // eslint-disable-next-line max-len
    config.notifications[appName].output = await createNotificationsOutput(featureResult, channels, context);
  }
  return config;
}
function hasNotifications(featureResult) {
  return featureResult.find(item => item.type === 'AWS::Pinpoint::AnalyticsApplication') &&
  (featureResult.find(item => item.type === 'AWS::Pinpoint::EmailChannel') ||
  featureResult.find(item => item.type === 'AWS::Pinpoint::SMSChannel') ||
  featureResult.find(item => item.type === 'AWS::Pinpoint::GCMChannel') ||
  featureResult.find(item => item.type === 'AWS::Pinpoint::APNSChannel')
  );
}
async function createNotificationsOutput(featureResult, channels, context) {
  const output = {
    Name: channels.appName,
    Id: channels.applicationId,
    Region: featureResult.region,
  };
  if (channels.GCM) {
    output.FCM = {};
    output.FCM = await getPinpointChannelDetail(context, { region: featureResult.region }, 'GCM', channels.applicationId);
  }
  if (channels.SMS) {
    output.SMS = {};
    output.SMS = await getPinpointChannelDetail(context, { region: featureResult.region }, 'SMS', channels.applicationId);
  }
  if (channels.Email) {
    output.Email = {};
    output.Email = await getPinpointChannelDetail(context, { region: featureResult.region }, 'Email', channels.applicationId);
  }
  if (channels.APNS) {
    output.APNS = {};
    output.APNS = await getPinpointChannelDetail(context, { region: featureResult.region }, 'APNS', channels.applicationId);
  }
  return output;
}

async function persistResourcesToConfig(mobileHubResources, context) {
  if (mobileHubResources) {
    const amplifyMetaConfig = getAmplifyMetaConfig(context);
    const mergedBackendConfig = mergeConfig(amplifyMetaConfig, mobileHubResources);
    persistToFile(mergedBackendConfig, context.amplify.pathManager.getAmplifyMetaFilePath());
    persistToFile(mergedBackendConfig, context.amplify.pathManager.getCurentAmplifyMetaFilePath());
  }
}

function persistToFile(mergedBackendConfig, filePath) {
  const amplifyMetaFilePath = filePath;
  const jsonString = JSON.stringify(mergedBackendConfig, null, 4);
  fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');
}

function getAmplifyMetaConfig(context) {
  const amplifyMetaConfig = context.amplify.pathManager.getAmplifyMetaFilePath();
  return JSON.parse(fs.readFileSync(amplifyMetaConfig));
}

function mergeConfig(amplifyMetaConfig, mobilehubResources) {
  if (amplifyMetaConfig.providers) {
    Object.keys(mobilehubResources).forEach((category) => {
      amplifyMetaConfig[category] = mobilehubResources[category];
    });
  }
  return amplifyMetaConfig;
}

function getResourceOutputs(context) {
  const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = JSON.parse(fs.readFileSync(amplifyMetaFilePath));
  // Build the provider object
  const outputsByProvider = {};
  const outputsByCategory = {};
  const outputsForFrontend = {
    metadata: {},
    serviceResourceMapping: {},
  };

  Object.keys(amplifyMeta.providers).forEach((provider) => {
    outputsByProvider[provider] = {};
    outputsByProvider[provider].metadata = amplifyMeta.providers[provider] || {};
    outputsByProvider[provider].serviceResourceMapping = {};
  });

  Object.keys(amplifyMeta).forEach((category) => {
    const categoryMeta = amplifyMeta[category];
    Object.keys(categoryMeta).forEach((resourceName) => {
      const resourceMeta = categoryMeta[resourceName];
      if (resourceMeta.output) {
        const {
          providerPlugin,
        } = resourceMeta;
        if (!outputsByProvider[providerPlugin]) {
          outputsByProvider[providerPlugin] = {
            metadata: {},
            serviceResourceMapping: {},
          };
        }
        if (!outputsByProvider[providerPlugin].serviceResourceMapping[resourceMeta.service]) {
          outputsByProvider[providerPlugin].serviceResourceMapping[resourceMeta.service] = [];
        }
        /*eslint-disable*/
            outputsByProvider[providerPlugin].serviceResourceMapping[resourceMeta.service].push(resourceMeta);
            /* eslint-enable */
        if (!outputsByCategory[category]) {
          outputsByCategory[category] = {};
        }
        if (resourceMeta.service) {
          resourceMeta.output.service = resourceMeta.service;
        }
        outputsByCategory[category][resourceName] = resourceMeta.output;

        // for frontend configuration file generation
        if (!outputsForFrontend.serviceResourceMapping[resourceMeta.service]) {
          outputsForFrontend.serviceResourceMapping[resourceMeta.service] = [];
        }
        outputsForFrontend.serviceResourceMapping[resourceMeta.service].push(resourceMeta);
      }
    });
  });

  if (outputsByProvider.awscloudformation) {
    outputsForFrontend.metadata = outputsByProvider.awscloudformation.metadata;
  }
  return {
    outputsByProvider,
    outputsByCategory,
    outputsForFrontend,
  };
}

module.exports = {
  importProject,
};
