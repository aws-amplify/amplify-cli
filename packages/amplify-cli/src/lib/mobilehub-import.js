const fs = require('fs-extra');
const ora = require('ora');
const Mobile = require('amplify-provider-awscloudformation/src/aws-utils/aws-mobilehub');

const spinner = ora('');

async function importProject(context) {
  if (context.parameters.first) {
    const projectId = context.parameters.first;
    const frontendPlugins = context.amplify.getFrontendPlugins(context);
    const projectConfigFilePath = context.amplify.pathManager.getProjectConfigFilePath();
    const projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));
    try {
      spinner.start('Importing your project');
      const mobileHubResources = await getMobileResources(projectId, context);
      await persistResourcesToConfig(mobileHubResources, context);
      const frontendHandlerModule = require(frontendPlugins[projectConfig.frontend]);
      frontendHandlerModule.createFrontendConfigs(context, getResourceOutputs(context));
      spinner.succeed('Importing your project was successfully.');
    } catch (error) {
      console.log(error);
      spinner.fail('There was an error importing your project.');
    }
  } else {
    context.print.error('Something went wrong. You did not specifiy a project id. Try this format \' amplify mobilehub-import [PROJECT-ID] \'');
  }
}
async function getMobileResources(projectId, context) {
  return new Mobile(context)
    .then(mobile => mobile.getProjectResources(projectId)
      .catch(() => context.print.error('We were unable to fetch your mobile hub resources. Please ensure you are using the right profile'))
      .then(result => createAmplifyMetaConfig(result)));
}

function createAmplifyMetaConfig(mobileHubResources) {
  const mobileHubAmplifyMap = new Map();
  mobileHubAmplifyMap.set('user-signin', 'auth');
  mobileHubAmplifyMap.set('analytics', 'analytics');
  mobileHubAmplifyMap.set('user-files', 'storage');
  mobileHubAmplifyMap.set('hosting', 'storage');
  mobileHubAmplifyMap.set('common', 'storage');
  mobileHubAmplifyMap.set('database', 'storage');
  mobileHubAmplifyMap.set('microservices', 'function');
  mobileHubAmplifyMap.set('cloud-api', 'api');
  mobileHubAmplifyMap.set('bots', 'interactions');
  mobileHubAmplifyMap.set('analytics', 'notifications');
  const config = {};
  mobileHubAmplifyMap.forEach((amplifyCategory, mobileHubCategory) => {
    const featureResult = mobileHubResources.details.resources
      .filter(resource => resource.feature === mobileHubCategory);

    if (featureResult) {
      buildCategory(featureResult, mobileHubAmplifyMap, mobileHubCategory, config);
    }
  });
  return JSON.parse('{"auth":{"cognito54764da0":{"service":"Cognito","lastPushTimeStamp":"2019-02-11T07:42:35.438Z","output":{"IdentityPoolId":"us-west-2:ff79e4c5-6152-4b45-8a2c-6369814d4982","IdentityPoolName":"amplifyjsapp_identitypool_f7134f4a"}}},"analytics":{"amplifyjsapp":{"service":"Pinpoint","lastPushTimeStamp":"2019-02-11T07:42:35.438Z","output":{"appName":"migrate_MobileHub","Region":"us-west-2","Id":"429748d632a04f96b43a8e8c17ef7ef5"}}},"storage":{"s3ba19bb15":{"service":"S3","lastPushTimeStamp":"2019-02-11T07:42:35.438Z","output":{"BucketName":"migrate-userfiles-mobilehub-45973183","Region":"us-west-2"}},"dynamo21b8f04d":{"service":"DynamoDB","lastPushTimeStamp":"2019-02-11T07:42:35.438Z","output":{"PartitionKeyName":"category","Region":"us-west-2","Arn":"arn:aws:dynamodb:us-west-2:148827594313:table/migrate-mobilehub-45973183-News","PartitionKeyType":"S","Name":"migrate-mobilehub-45973183-News"}}},"function":{"amplifyjsapp995975c7":{"service":"Lambda","lastPushTimeStamp":"2019-02-11T07:42:35.438Z","build":true,"dependsOn":[{"category":"storage","resourceName":"dynamo21b8f04d","attributes":["Name","Arn"]}],"output":{"Region":"us-west-2","Arn":"arn:aws:lambda:us-west-2:148827594313:function:testapi-itemsHandler-mobilehub-45973183","Name":"testapi-itemsHandler-mobilehub-45973183"}}},"api":{"apie8f27416":{"service":"APIGateway","lastPushTimeStamp":"2019-02-11T07:42:35.438Z","dependsOn":[{"category":"function","resourceName":"amplifyjsapp995975c7","attributes":["Name","Arn"]}],"output":{"ApiName":"c1nlkozbs4","RootUrl":"https://bp7g1u7boi.execute-api.us-west-2.amazonaws.com/Development/"}}},"interactions":{"lex7a924947":{"service":"Lex","lastPushTimeStamp":"2019-02-11T07:42:35.438Z","build":true,"output":{"FunctionArn":"BookTripMOBILEHUB","Region":"us-west-2","BotName":"BookTripMOBILEHUB"}}},"env":false}');
}

function buildCategory(featureResult, mobileHubAmplifyMap, mobileHubCategory, config) {
  const amplifyCategory = mobileHubAmplifyMap.get(mobileHubCategory);
  switch (amplifyCategory) {
    case 'auth':
      createAuth(featureResult, config);
      break;
    case 'analytics':
      createAnalytics(featureResult, config);
      break;
    case 'storage':
      createStorage(featureResult, config);
      break;
    case 'function':
      createFunction(featureResult, config);
      break;
    case 'api':
      createApi(featureResult, config);
      break;
    case 'interactions':
      createInteractions(featureResult, config);
      break;
    case 'notifications':
      createNotifications(featureResult, config);
      break;
    default:
      return { };
  }
}

function createAuth(featureResult, config) {
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

function createAnalytics(featureResult, config) {
  config.analytics = {};
  config.analytics[`analytics${new Date().getMilliseconds()}`] = {
    service: 'Pinpoint',
    providerPlugin: 'awscloudformation',
    lastPushTimeStamp: new Date().toISOString(),
    output: {
      appName: featureResult.find(item => item.type === 'AWS::Pinpoint::AnalyticsApplication').name,
      Region: '',
      Id: featureResult.find(item => item.type === 'AWS::Pinpoint::AnalyticsApplication').arn,
    },
  };
  return config;
}

function createStorage(featureResult, config) {
  config.storage = {};
  const hasS3 = featureResult.find(item => item.type === 'AWS::S3::Bucket');
  const hasDynamoDb = featureResult.find(item => item.type === 'AWS::DynamoDB::Table');

  if (hasS3) {
    config.storage[`s3${new Date().getMilliseconds()}`] = {
      service: 'S3',
      providerPlugin: 'awscloudformation',
      lastPushTimeStamp: new Date().toISOString(),
      ouput: {
        BucketName: featureResult.find(item => item.type === 'AWS::S3::Bucket').name,
        Region: featureResult.find(item => item.type === 'AWS::S3::Bucket').attributes.region,
      },
    };
  }

  if (hasDynamoDb) {
    config.storage[`dynamo${new Date().getMilliseconds()}`] = {
      service: 'DynamoDb',
      providerPlugin: 'awscloudformation',
      lastPushTimeStamp: new Date().toISOString(),
      output: {
        PartitionKeyName: '', // TODO
        Region: '', // TODO
        Arn: featureResult.find(item => item.type === 'AWS::DynamoDB::Table').arn,
        PartitionKeyType: '', // TODO
        Name: featureResult.find(item => item.type === 'AWS::DynamoDB::Table').name,
      },
    };
  }
  return config;
}

function createFunction(featureResult, config) {
  // console.log(featureResult);
  return config;
}

function createApi(featureResult, config) {
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

  return config;
}

function createInteractions(featureResult, config) {
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

function createNotifications(featureResult, config) {
  // console.log(featureResult);
  const appName = featureResult.find(item => item.type === 'AWS::Pinpoint::AnalyticsApplication').name;
  config.notifications = {};
  config.notifications[`${appName}`] = {
    service: 'Pinpoint',
    output: {
      Name: `${appName}`,
      Id: '', // TODO
      Region: '', // TODO
      SMS: {
        ApplicationId: '',
        CreationDate: '',
        Enabled: '',
        Id: 'sms',
        Platform: 'SMS',
        PromotionalMessagesPerSecond: '',
        TransactionalMessagesPerSecond: '',
        Version: '',
      },
    },
  };
  return config;
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
      if (!amplifyMetaConfig[category]) {
        amplifyMetaConfig[category] = mobilehubResources[category];
      }
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
        const { providerPlugin } = resourceMeta;
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
  return { outputsByProvider, outputsByCategory, outputsForFrontend };
}

module.exports = {
  importProject,
};
