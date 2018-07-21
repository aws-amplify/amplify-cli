const constants = require('./constants');
const path = require('path');
const fs = require('fs');

function createAmplifyConfig(context, amplifyResources) {
  const { amplify, filesystem } = context;
  const projectConfig = amplify.getProjectConfig();
  const frontendConfig = projectConfig[constants.Label].config;
  const srcDirPath = path.join(projectConfig.projectPath, frontendConfig.ResDir, 'raw');

  if (!fs.existsSync(srcDirPath)) {
    filesystem.dir(srcDirPath);
  }

  const targetFilePath = path.join(srcDirPath, constants.amplifyConfigFilename);
  const jsonString = JSON.stringify(amplifyResources, null, 4);
  fs.writeFileSync(targetFilePath, jsonString, 'utf8');
}

function createAWSConfig(context, amplifyResources) {
  const { serviceResourceMapping } = amplifyResources;
  const configOutput = {
    UserAgent: 'MobileHub/1.0',
    Version: '1.0',
    IdentityManager: {
      Default: {},
    },
  };

  const projectRegion = amplifyResources.metadata.Region;

  Object.keys(serviceResourceMapping).forEach((service) => {
    switch (service) {
      case 'Cognito': Object.assign(configOutput, getCognitoConfig(serviceResourceMapping[service], projectRegion));
        break;
      case 'S3': Object.assign(configOutput, getS3Config(serviceResourceMapping[service], projectRegion));
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
  generateAWSConfigFile(context, configOutput);
}

function generateAWSConfigFile(context, configOutput) {
  const { amplify } = context;
  const projectConfig = amplify.getProjectConfig();
  const frontendConfig = projectConfig[constants.Label].config;
  const srcDirPath = path.join(projectConfig.projectPath, frontendConfig.ResDir, 'raw');

  if (!fs.existsSync(srcDirPath)) {
    fs.mkdirSync(srcDirPath);
  }
  const targetFilePath = path.join(srcDirPath, constants.awsConfigFilename);
  const jsonString = JSON.stringify(configOutput, null, 4);
  fs.writeFileSync(targetFilePath, jsonString, 'utf8');
}

function getCognitoConfig(cognitoResources, projectRegion) {
  // There can only be one cognito instance

  const cognitoResource = cognitoResources[0];

  return {
    CredentialsProvider: {
      CognitoIdentity: {
        Default: {
          PoolId: cognitoResource.output.IdentityPoolName,
          Region: projectRegion,
        },
      },
    },
    CognitoUserPool: {
      Default: {
        PoolId: cognitoResource.output.UserPoolName,
        AppClientId: cognitoResource.output.AppClientID,
        AppClientSecret: cognitoResource.output.AppClientSecret,
        Region: projectRegion,
      },
    },
  };
}


function getS3Config(s3Resources) {
  const s3Resource = s3Resources[0];

  return {
    UserFileManager: {
      Default: {
        Bucket: s3Resource.output.BucketName,
        Region: s3Resource.output.Region,
      },
    },
    S3TransferUtility: {
      Default: {
        Bucket: s3Resource.output.BucketName,
        Region: s3Resource.output.Region,
      },
    },
  };
}

function getPinpointConfig(pinpointResources) {
  const pinpointResource = pinpointResources[0];
  return {
    PinpointAnalytics: {
      Default: {
        AppId: pinpointResource.output.Id,
        Region: pinpointResource.output.Region,
      },
    },
    PinpointTargeting: {
      Default: {
        Region: pinpointResource.output.Region,
      },
    },
  };
}

function getDynamoDBConfig(dynamoDBResources, projectRegion) {
  return {
    DynamoDBObjectMapper: {
      Default: {
        Region: projectRegion,
      },
    },
  };
}

function getS3AndCloudFrontConfig(s3AndCloudfrontResources) {
  // There can only be one hosting resource fpr S3AndCloudFront service
  const s3AndCloudfrontResource = s3AndCloudfrontResources[0];

  return {
    ContentManager: {
      Default: {
        Bucket: s3AndCloudfrontResource.output.HostingBucketName,
        Region: s3AndCloudfrontResource.output.Region,
        // Will need to change once we have cloudfrontURL
        CloudFrontURL: s3AndCloudfrontResource.output.S3BucketSecureURL,
      },
    },
  };
}

module.exports = { createAWSConfig, createAmplifyConfig };
