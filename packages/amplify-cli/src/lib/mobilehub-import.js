const fs = require('fs-extra');
const ora = require('ora');
const Mobile = require('amplify-provider-awscloudformation/src/aws-utils/aws-mobilehub');

const {
  getLambdaFunctionDetails,
  getDynamoDbDetails,
  getPinpointChannelDetail
} = require('amplify-provider-awscloudformation/lib/mobilehub-import-helper');

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
    context.print.error('Something went wrong. You did not specifiy a project id. Try this format \' amplify mobilehub-import [PROJECT-ID] \'');
  }
}
async function getMobileResources(projectId, context) {
  return new Mobile(context)
    .then(mobile => mobile.getProjectResources(projectId)
      .catch(() => {
        context.print.info('');
        context.print.error('We were unable to fetch your mobile hub resources. Please ensure you are using the right profile');
        context.print.info('');
      })
      .then(result => createAmplifyMetaConfig(result, context)));
}

function createAmplifyMetaConfig(mobileHubResources, context) {
  const mobileHubAmplifyMap = new Map();
  mobileHubAmplifyMap.set('user-signin', 'auth');
  //mobileHubAmplifyMap.set('analytics', 'analytics');
  //mobileHubAmplifyMap.set('user-data', 'storage');
  mobileHubAmplifyMap.set('hosting', 'storage');
  mobileHubAmplifyMap.set('database', 'storage');
  mobileHubAmplifyMap.set('cloud-api', 'api');
  mobileHubAmplifyMap.set('bots', 'interactions');
  mobileHubAmplifyMap.set('analytics', 'notifications');
  let config = {};
  mobileHubAmplifyMap.forEach((amplifyCategory, mobileHubCategory) => {
    const featureResult = mobileHubResources.details.resources
      .filter(resource => resource.feature === mobileHubCategory);
    featureResult.region = mobileHubResources.details.region;
    if (featureResult) {
      config = buildCategory(featureResult, mobileHubAmplifyMap, mobileHubCategory, config, context);
    }
  });
  return config;
  // return JSON.parse('{"auth":{"cognito54764da0":{"service":"Cognito","lastPushTimeStamp":"2019-02-11T07:42:35.438Z","output":{"IdentityPoolId":"us-west-2:ff79e4c5-6152-4b45-8a2c-6369814d4982","IdentityPoolName":"amplifyjsapp_identitypool_f7134f4a"}}},"analytics":{"amplifyjsapp":{"service":"Pinpoint","lastPushTimeStamp":"2019-02-11T07:42:35.438Z","output":{"appName":"migrate_MobileHub","Region":"us-west-2","Id":"429748d632a04f96b43a8e8c17ef7ef5"}}},"storage":{"s3ba19bb15":{"service":"S3","lastPushTimeStamp":"2019-02-11T07:42:35.438Z","output":{"BucketName":"migrate-userfiles-mobilehub-45973183","Region":"us-west-2"}},"dynamo21b8f04d":{"service":"DynamoDB","lastPushTimeStamp":"2019-02-11T07:42:35.438Z","output":{"PartitionKeyName":"category","Region":"us-west-2","Arn":"arn:aws:dynamodb:us-west-2:148827594313:table/migrate-mobilehub-45973183-News","PartitionKeyType":"S","Name":"migrate-mobilehub-45973183-News"}}},"function":{"amplifyjsapp995975c7":{"service":"Lambda","lastPushTimeStamp":"2019-02-11T07:42:35.438Z","build":true,"dependsOn":[{"category":"storage","resourceName":"dynamo21b8f04d","attributes":["Name","Arn"]}],"output":{"Region":"us-west-2","Arn":"arn:aws:lambda:us-west-2:148827594313:function:testapi-itemsHandler-mobilehub-45973183","Name":"testapi-itemsHandler-mobilehub-45973183"}}},"api":{"apie8f27416":{"service":"APIGateway","lastPushTimeStamp":"2019-02-11T07:42:35.438Z","dependsOn":[{"category":"function","resourceName":"amplifyjsapp995975c7","attributes":["Name","Arn"]}],"output":{"ApiName":"c1nlkozbs4","RootUrl":"https://bp7g1u7boi.execute-api.us-west-2.amazonaws.com/Development/"}}},"interactions":{"lex7a924947":{"service":"Lex","lastPushTimeStamp":"2019-02-11T07:42:35.438Z","build":true,"output":{"FunctionArn":"BookTripMOBILEHUB","Region":"us-west-2","BotName":"BookTripMOBILEHUB"}}},"env":false}');
}


// eslint-disable-next-line max-len
async function buildCategory(featureResult, mobileHubAmplifyMap, mobileHubCategory, config, context) {
  const amplifyCategory = mobileHubAmplifyMap.get(mobileHubCategory);
  switch (amplifyCategory) {
    case 'auth':
      return createAuth(featureResult, config);
    case 'analytics':
      return createAnalytics(featureResult, config, context);
    case 'storage':
      return await createStorage(featureResult, config, context);
    case 'api':
      return await createApi(featureResult, config, context);
    case 'interactions':
      return createInteractions(featureResult, config, context);
    case 'notifications':
      return await createNotifications(featureResult, config, context);
    default:
      return config;
  }
}

function createAuth(featureResult, config) {
  const hasAuth = featureResult.find(item => item.type === 'AWS::Cognito::IdentityPool') && featureResult.find(item => item.type === 'AWS::Cognito::UserPool');
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
        AppClientIDWeb: featureResult.find(item => item.type === 'AWS::Cognito::UserPool').attributes['user-pools-web-client-id"'],
        AppClientID: featureResult.find(item => item.type === 'AWS::Cognito::UserPool').attributes['user-pools-client-id'],
        UserPoolName: featureResult.find(item => item.type === 'AWS::Cognito::UserPool').name,
      },
    };
    return config;
  }
}

function createAnalytics(featureResult, config) {
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
  return config;
}

async function createStorage(featureResult, config, context) {
  const hasS3 = featureResult.find(item => item.type === 'AWS::S3::Bucket' && item.feature === 'user-data');
  const hasDynamoDb = featureResult.find(item => item.type === 'AWS::DynamoDB::Table');
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

  if (hasDynamoDb) {
    if (!config.storage) {
      config.storage = {};
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
    //const functionArn = await getLambdaFunctionDetails(context, { region: 'us-west-2' }, 'newsApi-newsHandler-mobilehub-1519951283');
    functions.forEach((element) => {
      if (!element.attributes.status.includes('DELETE_SKIPPED')) {
        config.function[`${element.name}`] = {
          service: 'Lambda',
          lastPushTimeStamp: new Date().toISOString(),
          build: true,
          output: {
            Region: element.attributes.region,
            Arn: {},
            Name: element.name,
          },
        };
      }
    });
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
        FunctionArn: featureResult.find(item => item.type === 'AWS::Lex::Bot').arn, // TODO
        Region: featureResult.find(item => item.type === 'AWS::Lex::Bot').attributes.region,
        BotName: featureResult.find(item => item.type === 'AWS::Lex::Bot').name,
      },
    };
    return config;
  }
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
    config.notifications = {};
    config.notifications[`${appName}`] = {
      service: 'Pinpoint',
      providerPlugin: 'awscloudformation',
      lastPushTimeStamp: new Date().toISOString(),
    };
    config.notifications[appName].output = await createNotificationsOutput(featureResult, channels, context);
    console.log();
    return config;
  }
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
    output.FCM = await getPinpointChannelDetail(context, { region: 'us-east-1' }, 'GCM', channels.applicationId);
  }
  if (channels.SMS) {
    output.SMS = {};
    output.SMS = await getPinpointChannelDetail(context, { region: 'us-east-1' }, 'SMS', channels.applicationId);
  }
  if (channels.Email) {
    output.Email = {};
    output.Email = await getPinpointChannelDetail(context, { region: 'us-east-1' }, 'Email', channels.applicationId);
  }
  if (channels.APNS) {
    output.APNS = {};
    output.APNS = await getPinpointChannelDetail(context, { region: 'us-east-1' }, 'APNS', channels.applicationId);
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
      // TODO: prompt user if they want to override
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
