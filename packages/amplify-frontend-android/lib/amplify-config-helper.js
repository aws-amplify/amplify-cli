function generateConfig(context, amplifyConfig) {
  const metaData = context.amplify.getProjectMeta();
  amplifyConfig = amplifyConfig || {
    UserAgent: 'aws-amplify-cli/2.0',
    Version: '1.0',
  };
  constructAnalytics(metaData, amplifyConfig);
  constructApi(metaData, amplifyConfig);
  constructPredictions(metaData, amplifyConfig);
  constructStorage(metaData, amplifyConfig);

  return amplifyConfig;
}

function constructAnalytics(metaData, amplifyConfig) {
  const categoryName = 'analytics';
  const pluginName = 'awsPinpointAnalyticsPlugin';
  if (metaData[categoryName] && Object.keys(metaData[categoryName]).length > 0) {
    const r = Object.keys(metaData[categoryName])[0]; // only one resource in analytics
    const resourceMeta = metaData[categoryName][r];
    if (resourceMeta.output) {
      amplifyConfig[categoryName] = {};
      amplifyConfig[categoryName].plugins = {};
      amplifyConfig[categoryName].plugins[pluginName] = {};

      amplifyConfig[categoryName].plugins[pluginName].pinpointAnalytics = {
        appId: resourceMeta.output.Id,
        region: resourceMeta.output.Region,
      };
      amplifyConfig[categoryName].plugins[pluginName].pinpointTargeting = {
        region: resourceMeta.output.Region,
      };
    }
  }
}

function constructApi(metaData, amplifyConfig) {
  const categoryName = 'api';
  const pluginName = 'awsAPIPlugin';
  const region = metaData.providers.awscloudformation.Region;
  if (metaData[categoryName]) {
    Object.keys(metaData[categoryName]).forEach(r => {
      const resourceMeta = metaData[categoryName][r];
      if (resourceMeta.output) {
        amplifyConfig[categoryName] = amplifyConfig[categoryName] || {};
        amplifyConfig[categoryName].plugins = amplifyConfig[categoryName].plugins || {};
        amplifyConfig[categoryName].plugins[pluginName] = amplifyConfig[categoryName].plugins[pluginName] || {};

        if (resourceMeta.service === 'AppSync') {
          amplifyConfig[categoryName].plugins[pluginName][r] = {
            endpointType: 'GraphQL',
            endpoint: resourceMeta.output.GraphQLAPIEndpointOutput,
            region,
            authorizationType: resourceMeta.output.authConfig.defaultAuthentication.authenticationType,
            apiKey: resourceMeta.output.GraphQLAPIKeyOutput,
          };
        } else if (resourceMeta.service === 'API Gateway') {
          amplifyConfig[categoryName].plugins[pluginName][r] = {
            endpointType: 'REST',
            endpoint: resourceMeta.output.RootUrl,
            region,
            authorizationType: 'AWS_IAM',
          };
        }
      }
    });
  }
}

function constructPredictions(metaData, amplifyConfig) {
  const categoryName = 'predictions';
  const pluginName = 'awsPredictionsPlugin';
  const region = metaData.providers.awscloudformation.Region;
  if (metaData[categoryName]) {
    Object.keys(metaData[categoryName]).forEach(r => {
      const resourceMeta = metaData[categoryName][r];
      if (resourceMeta.output) {
        amplifyConfig[categoryName] = amplifyConfig[categoryName] || {};
        amplifyConfig[categoryName].plugins = amplifyConfig[categoryName].plugins || {};
        amplifyConfig[categoryName].plugins[pluginName] = amplifyConfig[categoryName].plugins[pluginName] || {};
        amplifyConfig[categoryName].plugins[pluginName].defaultRegion =
          amplifyConfig[categoryName].plugins[pluginName].defaultRegion || region;

        const { serviceGroup, serviceType } = getPredictionsResourceNameAndType(resourceMeta);
        if (serviceGroup && serviceType) {
          amplifyConfig[categoryName].plugins[pluginName][serviceGroup] =
            amplifyConfig[categoryName].plugins[pluginName][serviceGroup] || {};

          let defaultNetworkPolicy = 'auto';
          if (
            amplifyConfig[categoryName].plugins[pluginName][serviceGroup][serviceType] &&
            amplifyConfig[categoryName].plugins[pluginName][serviceGroup][serviceType].defaultNetworkPolicy
          ) {
            // eslint-disable-next-line
            defaultNetworkPolicy = amplifyConfig[categoryName].plugins[pluginName][serviceGroup][serviceType].defaultNetworkPolicy;
          }

          amplifyConfig[categoryName].plugins[pluginName][serviceGroup][serviceType] = resourceMeta.output;
          amplifyConfig[categoryName].plugins[pluginName][serviceGroup][serviceType].defaultNetworkPolicy = defaultNetworkPolicy;
        }
      }
    });
  }
}

function getPredictionsResourceNameAndType(resourceMeta) {
  const result = {};

  if (resourceMeta.identifyType) {
    result.serviceGroup = 'identify';
    result.serviceType = resourceMeta.identifyType;
  } else if (resourceMeta.interpretType) {
    result.serviceGroup = 'interpret';
    result.serviceType = resourceMeta.interpretType;
  } else if (resourceMeta.convertType) {
    result.serviceGroup = 'convert';
    result.serviceType = resourceMeta.convertType;
  } else if (resourceMeta.inferType) {
    result.serviceGroup = 'infer';
    result.serviceType = resourceMeta.inferType;
  }

  return result;
}

function constructStorage(metaData, amplifyConfig) {
  const categoryName = 'storage';
  const s3PluginName = 'awsS3StoragePlugin';
  const dynamoDbPluginName = 'awsDynamoDbStoragePlugin';
  if (metaData[categoryName]) {
    Object.keys(metaData[categoryName]).forEach(r => {
      const resourceMeta = metaData[categoryName][r];
      if (resourceMeta.output) {
        amplifyConfig[categoryName] = amplifyConfig[categoryName] || {};
        amplifyConfig[categoryName].plugins = amplifyConfig[categoryName].plugins || {};
        if (resourceMeta.service === 'S3') {
          let defaultAccessLevel = 'guest';
          if (
            amplifyConfig[categoryName].plugins[s3PluginName] &&
            amplifyConfig[categoryName].plugins[s3PluginName].defaultAccessLevel &&
            (amplifyConfig[categoryName].plugins[s3PluginName].defaultAccessLevel === 'protected' ||
              amplifyConfig[categoryName].plugins[s3PluginName].defaultAccessLevel === 'private')
          ) {
            // eslint-disable-next-line
            defaultAccessLevel = amplifyConfig[categoryName].plugins[s3PluginName].defaultAccessLevel;
          }
          amplifyConfig[categoryName].plugins[s3PluginName] = {
            bucket: resourceMeta.output.BucketName,
            region: resourceMeta.output.Region,
            defaultAccessLevel,
          };
        } else if (resourceMeta.service === 'DynamoDB') {
          amplifyConfig[categoryName].plugins[dynamoDbPluginName] = {};
          Object.keys(metaData[categoryName][r].output).forEach(key => {
            const value = metaData[categoryName][r].output[key];
            key = key[0].toLowerCase() + key.slice(1);
            amplifyConfig[categoryName].plugins[dynamoDbPluginName][key] = value;
          });
        }
      }
    });
  }
}

module.exports = {
  generateConfig,
};
