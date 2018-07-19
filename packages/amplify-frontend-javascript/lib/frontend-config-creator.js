const constants = require('./constants');
const path = require('path');
const fs = require('fs');


function createAmplifyConfig(context, amplifyResources) {
  const { amplify } = context;
  const pluginDir = __dirname;
  const projectConfig = amplify.getProjectConfig();
  const frontendConfig = projectConfig[constants.Label].config;
  const srcDirPath = path.join(projectConfig.projectPath, frontendConfig.SourceDir);

  if (fs.existsSync(srcDirPath)) {
    const targetFilePath = path.join(srcDirPath, constants.configFilename);
    const options = {
      amplifyResources,
    };
    const copyJobs = [
      {
        dir: pluginDir,
        template: './amplify-config.js.ejs',
        target: targetFilePath,
      },
    ];

    // copy over the files
    const forceOverwrite = true;
    return amplify.copyBatch(context, copyJobs, options, forceOverwrite);
  }
}

function createAWSExports(context, amplifyResources) {
  const { serviceResourceMapping } = amplifyResources;
  const configOutput = {};

  const projectRegion = amplifyResources.metadata.Region;

  Object.keys(serviceResourceMapping).forEach((service) => {
    switch (service) {
      case 'S3': Object.assign(configOutput, getS3Config(serviceResourceMapping[service], projectRegion));
        break;
      case 'AppSync': Object.assign(configOutput, getAppSyncConfig(serviceResourceMapping[service], projectRegion));
        break;
      case 'Pinpoint': Object.assign(configOutput, getPinpointConfig(serviceResourceMapping[service], projectRegion));
        break;
      case 'DynamoDB': Object.assign(configOutput, getDynamoDBConfig(serviceResourceMapping[service], projectRegion));
        break;
      case 'S3AndCloudFront': Object.assign(configOutput, getS3AndCloudFrontConfig(serviceResourceMapping[service], projectRegion));
        break;
      default: break;
    }
  });
  generateAWSExportsFile(context, configOutput);
}

function generateAWSExportsFile(context, configOutput) {
  const { amplify } = context;
  const pluginDir = __dirname;
  const projectConfig = amplify.getProjectConfig();
  const frontendConfig = projectConfig[constants.Label].config;
  const srcDirPath = path.join(projectConfig.projectPath, frontendConfig.SourceDir);

  if (fs.existsSync(srcDirPath)) {
    const targetFilePath = path.join(srcDirPath, constants.exportsFilename);
    const options = {
      configOutput,
    };
    const copyJobs = [
      {
        dir: pluginDir,
        template: './aws_exports.js.ejs',
        target: targetFilePath,
      },
    ];

    // copy over the files
    const forceOverwrite = true;
    return amplify.copyBatch(context, copyJobs, options, forceOverwrite);
  }
}

function getS3Config(s3Resources) {
  // There can only be one s3 resource - user files
  const s3Resource = s3Resources[0];

  return {
    aws_user_files_s3_bucket: s3Resource.output.BucketName,
    aws_user_files_s3_bucket_region: s3Resource.output.Region,
  };
}

function getAppSyncConfig(appsyncResources) {
  // There can only be one appsync resource
  const appsyncResource = appsyncResources[0];
  return {
    aws_appsync_graphqlEndpoint: appsyncResource.output.GraphQLApiEndpoint,
    aws_appsync_region: appsyncResource.output.Region,
    aws_appsync_authenticationType: appsyncResource.output.securityType,
  };
}

function getPinpointConfig(pinpointResources) {
  // There can only be one analytics resource

  const pinpointResource = pinpointResources[0];

  return {
    aws_mobile_analytics_app_id: pinpointResource.output.Id,
    aws_mobile_analytics_app_region: pinpointResource.output.Region,
  };
}

function getDynamoDBConfig(dynamoDBResources, projectRegion) {
  // There can be multiple dynamo db resource

  const dynamoDBConfig = {
    aws_dynamodb_all_tables_region: projectRegion,
    aws_dynamodb_table_schemas: [],
  };

  for (let i = 0; i < dynamoDBResources.length; i += 1) {
    dynamoDBConfig.aws_dynamodb_table_schemas.push({
      tableName: dynamoDBResources[i].output.Name,
      region: dynamoDBResources[i].output.Region,
    });
  }
  return dynamoDBConfig;
}

function getS3AndCloudFrontConfig(s3AndCloudfrontResources) {
  // There can only be one appsync resource
  const s3AndCloudfrontResource = s3AndCloudfrontResources[0];

  return {
    aws_content_delivery_bucket: s3AndCloudfrontResource.output.HostingBucketName,
    aws_content_delivery_bucket_region: s3AndCloudfrontResource.output.Region,
    aws_content_delivery_url: s3AndCloudfrontResource.output.S3BucketSecureURL,
  };
}


module.exports = { createAWSExports, createAmplifyConfig };
