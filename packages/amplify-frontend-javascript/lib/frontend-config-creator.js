const constants = require('./constants');
const path = require('path');
const fs = require('fs-extra');


function createAmplifyConfig(context, amplifyResources) {
  const { amplify } = context;
  const pluginDir = __dirname;
  const projectPath = context.exeInfo ?
    context.exeInfo.localEnvInfo.projectPath : amplify.getEnvInfo().projectPath;
  const projectConfig = context.exeInfo ?
    context.exeInfo.projectConfig[constants.Label] : amplify.getProjectConfig()[constants.Label];
  const frontendConfig = projectConfig.config;
  const srcDirPath = path.join(projectPath, frontendConfig.SourceDir);

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

async function createAWSExports(context, amplifyResources, cloudAmplifyResources) {
  const newAWSExports = getAWSExportsObject(amplifyResources);
  const cloudAWSExports = getAWSExportsObject(cloudAmplifyResources);
  const currentAWSExports = await getCurrentAWSExports(context);

  const customConfigs = getCustomConfigs(cloudAWSExports, currentAWSExports);

  Object.assign(newAWSExports, customConfigs);
  generateAWSExportsFile(context, newAWSExports);
  return context;
}

function getCustomConfigs(cloudAWSExports, currentAWSExports) {
  const customConfigs = {};
  Object.keys(currentAWSExports).forEach((key) => {
    if (!cloudAWSExports[key]) {
      customConfigs[key] = currentAWSExports[key];
    }
  });
  return customConfigs;
}

function getAWSExportsObject(resources) {
  const { serviceResourceMapping } = resources;
  const configOutput = {};

  const projectRegion = resources.metadata.Region;
  configOutput.aws_project_region = projectRegion;

  Object.keys(serviceResourceMapping).forEach((service) => {
    switch (service) {
      case 'Cognito': Object.assign(configOutput, getCognitoConfig(serviceResourceMapping[service], projectRegion));
        break;
      case 'S3': Object.assign(configOutput, getS3Config(serviceResourceMapping[service], projectRegion));
        break;
      case 'AppSync': Object.assign(configOutput, getAppSyncConfig(serviceResourceMapping[service], projectRegion));
        break;
      case 'API Gateway': Object.assign(configOutput, getAPIGWConfig(serviceResourceMapping[service], projectRegion));
        break;
      case 'Pinpoint': Object.assign(configOutput, getPinpointConfig(serviceResourceMapping[service], projectRegion));
        break;
      case 'DynamoDB': Object.assign(configOutput, getDynamoDBConfig(serviceResourceMapping[service], projectRegion));
        break;
      case 'S3AndCloudFront': Object.assign(configOutput, getS3AndCloudFrontConfig(serviceResourceMapping[service], projectRegion));
        break;
      case 'Lex': Object.assign(configOutput, getLexConfig(serviceResourceMapping[service], projectRegion));
        break;
      default: break;
    }
  });

  return configOutput;
}

async function getCurrentAWSExports(context) {
  const { amplify } = context;
  const projectPath = context.exeInfo ?
    context.exeInfo.localEnvInfo.projectPath : amplify.getEnvInfo().projectPath;
  const projectConfig = context.exeInfo ?
    context.exeInfo.projectConfig[constants.Label] : amplify.getProjectConfig()[constants.Label];
  const frontendConfig = projectConfig.config;
  const srcDirPath = path.join(projectPath, frontendConfig.SourceDir);

  const targetFilePath = path.join(srcDirPath, constants.exportsFilename);
  let awsExports = {};

  if (fs.existsSync(targetFilePath)) {
    await context.patching.replace(targetFilePath, 'export default awsmobile;\n', 'module.exports = {awsmobile};\n');
    awsExports = require(targetFilePath).awsmobile;
    await context.patching.replace(targetFilePath, 'module.exports = {awsmobile};\n', 'export default awsmobile;\n');
  }

  return awsExports;
}

async function generateAWSExportsFile(context, configOutput) {
  const { amplify } = context;
  const pluginDir = __dirname;
  const projectPath = context.exeInfo ?
    context.exeInfo.localEnvInfo.projectPath : amplify.getEnvInfo().projectPath;
  const projectConfig = context.exeInfo ?
    context.exeInfo.projectConfig[constants.Label] : amplify.getProjectConfig()[constants.Label];
  const frontendConfig = projectConfig.config;
  const srcDirPath = path.join(projectPath, frontendConfig.SourceDir);

  fs.ensureDirSync(srcDirPath);

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
  await amplify.copyBatch(context, copyJobs, options, forceOverwrite);
}

function getCognitoConfig(cognitoResources, projectRegion) {
  // There can only be one cognito resource
  const cognitoResource = cognitoResources[0];
  let domain;
  let scope;
  let redirectSignIn;
  let redirectSignOut;
  let responseType;

  let userPoolFederation = false;
  let idpFederation = false;
  let federationTarget;

  if (cognitoResource.output.HostedUIDomain) {
    domain = `${cognitoResource.output.HostedUIDomain}.auth.${projectRegion}.amazoncognito.com`;
  }
  if (cognitoResource.output.OAuthMetadata) {
    const oAuthMetadata = JSON.parse(cognitoResource.output.OAuthMetadata);
    scope = oAuthMetadata.AllowedOAuthScopes;
    redirectSignIn = oAuthMetadata.CallbackURLs.join(',');
    redirectSignOut = oAuthMetadata.LogoutURLs.join(',');
    [responseType] = oAuthMetadata.AllowedOAuthFlows;
    userPoolFederation = true;
  }

  const oauth = {
    domain,
    scope,
    redirectSignIn,
    redirectSignOut,
    responseType,
  };

  if (cognitoResource.output.GoogleWebClient ||
    cognitoResource.output.FacebookWebClient ||
    cognitoResource.output.AmazonWebClient) {
    idpFederation = true;
  }

  if (userPoolFederation) {
    if (idpFederation) {
      federationTarget = 'COGNITO_USER_AND_IDENTITY_POOLS';
    } else {
      federationTarget = 'COGNITO_USER_POOLS';
    }
  } else if (idpFederation) {
    federationTarget = 'COGNITO_IDENTITY_POOLS';
  }


  return {
    aws_cognito_identity_pool_id: cognitoResource.output.IdentityPoolId,
    aws_cognito_region: projectRegion,
    aws_user_pools_id: cognitoResource.output.UserPoolId,
    aws_user_pools_web_client_id: cognitoResource.output.AppClientIDWeb,
    oauth,
    federationTarget,
  };
}

function getS3Config(s3Resources) {
  // There can only be one s3 resource - user files
  const s3Resource = s3Resources[0];

  return {
    aws_user_files_s3_bucket: s3Resource.output.BucketName,
    aws_user_files_s3_bucket_region: s3Resource.output.Region,
  };
}

function getAppSyncConfig(appsyncResources, projectRegion) {
  // There can only be one appsync resource
  const appsyncResource = appsyncResources[0];
  return {
    aws_appsync_graphqlEndpoint: appsyncResource.output.GraphQLAPIEndpointOutput,
    aws_appsync_region: projectRegion,
    aws_appsync_authenticationType: appsyncResource.output.securityType,
    aws_appsync_apiKey: appsyncResource.output.securityType === 'API_KEY' ? appsyncResource.output.GraphQLAPIKeyOutput : undefined,
  };
}

function getAPIGWConfig(apigwResources, projectRegion) {
  // There can be multiple api gateway resource

  const apigwConfig = {
    aws_cloud_logic_custom: [],
  };

  for (let i = 0; i < apigwResources.length; i += 1) {
    apigwConfig.aws_cloud_logic_custom.push({
      name: apigwResources[i].output.ApiName,
      endpoint: apigwResources[i].output.RootUrl,
      region: projectRegion,
    });
  }
  return apigwConfig;
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
  // There can only be one hosting resource fpr S3AndCloudFront service
  const s3AndCloudfrontResource = s3AndCloudfrontResources[0];

  return {
    aws_content_delivery_bucket: s3AndCloudfrontResource.output.HostingBucketName,
    aws_content_delivery_bucket_region: s3AndCloudfrontResource.output.Region,
    aws_content_delivery_url: s3AndCloudfrontResource.output.CloudFrontSecureURL ||
      s3AndCloudfrontResource.output.WebsiteURL,
  };
}

function getLexConfig(lexResources) {
  const config = lexResources.map(r => ({
    name: r.output.BotName,
    alias: '$LATEST',
    region: r.output.Region,
  }));

  return {
    aws_bots: 'enable',
    aws_bots_config: config,
  };
}

module.exports = { createAWSExports, createAmplifyConfig };
