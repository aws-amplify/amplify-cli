const constants = require('./constants');
const _ = require('lodash');
const path = require('path');
const fs = require('fs-extra');
const graphQLConfig = require('graphql-config');
const amplifyConfigHelper = require('./amplify-config-helper');

const AMPLIFY_RESERVED_EXPORT_KEYS = [
  // cognito
  'Auth',
  'CredentialsProvider',
  'CognitoUserPool',
  'GoogleSignIn',
  'FacebookSignIn',
  // s3
  'S3TransferUtility',
  // Analytics
  'PinpointAnalytics',
  'PinpointTargeting',
  // Others
  'DynamoDBObjectMapper',
  'AppSync',
  'Lex',
  'Sumerian',
];
function deleteAmplifyConfig(context) {
  const srcDirPath = getSrcDir(context);
  // delete aws configuration and amplify configuration
  if (fs.existsSync(srcDirPath)) {
    const amplifyConfigFilePath = path.join(srcDirPath, constants.amplifyConfigFilename);
    const awsConfigFilePath = path.join(srcDirPath, constants.awsConfigFilename);
    fs.removeSync(amplifyConfigFilePath);
    fs.removeSync(awsConfigFilePath);
  }

  if (!fs.existsSync(path.join(srcDirPath, '.graphqlconfig.yml'))) return;
  const gqlConfig = graphQLConfig.getGraphQLConfig(srcDirPath);
  if (gqlConfig && gqlConfig.config) {
    const { projects } = gqlConfig.config;
    Object.keys(projects).forEach(project => {
      const { codeGenTarget, docsFilePath, generatedFileName } = projects[project].extensions.amplify;
      constants.fileNames.forEach(filename => {
        const file = path.join(srcDirPath, docsFilePath, `${filename}.${constants.FILE_EXTENSION_MAP[codeGenTarget]}`);
        if (fs.existsSync(file)) fs.removeSync(file);
      });
      if (generatedFileName.trim() !== '') {
        fs.removeSync(path.join(srcDirPath, generatedFileName));
      }
    });
  }
}

function getSrcDir(context) {
  const { amplify } = context;
  const projectPath = context.exeInfo ? context.exeInfo.localEnvInfo.projectPath : amplify.getEnvInfo().projectPath;
  return path.join(projectPath);
}

function createAmplifyConfig(context, amplifyResources, cloudAmplifyResources) {
  const srcDirPath = getSrcDir(context);

  if (fs.existsSync(srcDirPath)) {
    const targetFilePath = path.join(srcDirPath, constants.amplifyConfigFilename);

    // Native GA release requires entire awsconfiguration inside amplifyconfiguration auth plugin
    const amplifyConfig = getAmplifyConfig(context, amplifyResources, cloudAmplifyResources);

    const jsonString = JSON.stringify(amplifyConfig, null, 4);
    fs.writeFileSync(targetFilePath, jsonString, 'utf8');

    writeToFile(srcDirPath, constants.amplifyConfigFilename, amplifyConfig);
  }
}

function writeToFile(filePath, fileName, configObject) {
  fs.ensureDirSync(filePath);
  const targetFilePath = path.join(filePath, fileName);
  const jsonString = JSON.stringify(configObject, null, 4);
  fs.writeFileSync(targetFilePath, jsonString, 'utf8');
}

function getAmplifyConfig(context, amplifyResources, cloudAmplifyResources) {
  const newAWSConfig = getNewAWSConfigObject(context, amplifyResources, cloudAmplifyResources);
  const amplifyConfig = amplifyConfigHelper.generateConfig(context, newAWSConfig);
  return amplifyConfig;
}

function getNewAWSConfigObject(context, amplifyResources, cloudAmplifyResources) {
  const newAWSConfig = getAWSConfigObject(amplifyResources);
  const cloudAWSConfig = getAWSConfigObject(cloudAmplifyResources);
  const currentAWSConfig = getCurrentAWSConfig(context);

  const customConfigs = getCustomConfigs(cloudAWSConfig, currentAWSConfig);

  Object.assign(newAWSConfig, customConfigs);
  return newAWSConfig;
}

function createAWSConfig(context, amplifyResources, cloudAmplifyResources) {
  const newAWSConfig = getNewAWSConfigObject(context, amplifyResources, cloudAmplifyResources);
  generateAWSConfigFile(context, newAWSConfig);
  return context;
}

function getAWSConfigObject(amplifyResources) {
  const { serviceResourceMapping } = amplifyResources;
  const configOutput = {
    UserAgent: 'aws-amplify/cli',
    Version: '0.1.0',
    IdentityManager: {
      Default: {},
    },
  };
  const projectRegion = amplifyResources.metadata.Region;

  Object.keys(serviceResourceMapping).forEach(service => {
    switch (service) {
      case 'Cognito':
        Object.assign(configOutput, getCognitoConfig(serviceResourceMapping[service], projectRegion));
        break;
      case 'S3':
        Object.assign(configOutput, getS3Config(serviceResourceMapping[service], projectRegion));
        break;
      case 'Pinpoint':
        Object.assign(configOutput, getPinpointConfig(serviceResourceMapping[service], projectRegion));
        break;
      case 'DynamoDB':
        Object.assign(configOutput, getDynamoDBConfig(serviceResourceMapping[service], projectRegion));
        break;
      case 'AppSync':
        Object.assign(configOutput, getAppSyncConfig(serviceResourceMapping[service], projectRegion));
        break;
      case 'Lex':
        Object.assign(configOutput, getLexConfig(serviceResourceMapping[service], projectRegion));
        break;
      case 'Sumerian':
        Object.assign(configOutput, getSumerianConfig(serviceResourceMapping[service], projectRegion));
        break;
      default:
        break;
    }
  });

  return configOutput;
}

function getCurrentAWSConfig(context) {
  const { amplify } = context;
  const projectPath = context.exeInfo ? context.exeInfo.localEnvInfo.projectPath : amplify.getEnvInfo().projectPath;
  const srcDirPath = path.join(projectPath);
  const targetFilePath = path.join(srcDirPath, constants.awsConfigFilename);

  let awsConfig = {};

  if (fs.existsSync(targetFilePath)) {
    awsConfig = amplify.readJsonFile(targetFilePath);
  }
  return awsConfig;
}

function getCustomConfigs(cloudAWSConfig, currentAWSConfig) {
  const customConfigs = {};
  Object.keys(currentAWSConfig)
    .filter(k => !AMPLIFY_RESERVED_EXPORT_KEYS.includes(k))
    .forEach(key => {
      if (!cloudAWSConfig[key]) {
        customConfigs[key] = currentAWSConfig[key];
      }
    });
  return customConfigs;
}

function generateAWSConfigFile(context, configOutput) {
  const srcDirPath = getSrcDir(context);
  if (fs.existsSync(srcDirPath)) {
    writeToFile(srcDirPath, constants.awsConfigFilename, configOutput);
  }
}

function getCognitoConfig(cognitoResources, projectRegion) {
  // There can only be one cognito instance

  const cognitoResource = cognitoResources[0];

  const cognitoConfig = {};

  if (cognitoResource.output.IdentityPoolId) {
    Object.assign(cognitoConfig, {
      CredentialsProvider: {
        CognitoIdentity: {
          Default: {
            PoolId: cognitoResource.output.IdentityPoolId,
            Region: projectRegion,
          },
        },
      },
    });
  }

  if (cognitoResource.output.UserPoolId) {
    const defaultPool = {
      PoolId: cognitoResource.output.UserPoolId,
      AppClientId: cognitoResource.output.AppClientID,
      Region: projectRegion,
    };
    if (cognitoResource.output.AppClientSecret) {
      _.set(defaultPool, 'AppClientSecret', cognitoResource.output.AppClientSecret);
    }
    Object.assign(cognitoConfig, {
      CognitoUserPool: {
        Default: defaultPool,
      },
    });
  }

  if (cognitoResource.output.GoogleWebClient || cognitoResource.output.GoogleIOSClient) {
    cognitoConfig.GoogleSignIn = {
      Permissions: 'email,profile,openid',
    };
    if (cognitoResource.output.GoogleWebClient) {
      cognitoConfig.GoogleSignIn['ClientId-WebApp'] = cognitoResource.output.GoogleWebClient;
    }
    if (cognitoResource.output.GoogleIOSClient) {
      cognitoConfig.GoogleSignIn['ClientId-iOS'] = cognitoResource.output.GoogleIOSClient;
    }
  }
  if (cognitoResource.output.FacebookWebClient) {
    cognitoConfig.FacebookSignIn = {
      AppId: cognitoResource.output.FacebookWebClient,
      Permissions: 'public_profile',
    };
  }

  let domain;
  let scope;
  let redirectSignIn;
  let redirectSignOut;

  if (cognitoResource.output.HostedUIDomain) {
    domain = `${cognitoResource.output.HostedUIDomain}.auth.${projectRegion}.amazoncognito.com`;
  }

  if (cognitoResource.output.OAuthMetadata) {
    const oAuthMetadata = JSON.parse(cognitoResource.output.OAuthMetadata);
    scope = oAuthMetadata.AllowedOAuthScopes;
    redirectSignIn = oAuthMetadata.CallbackURLs.join(',');
    redirectSignOut = oAuthMetadata.LogoutURLs.join(',');
    const oauth = {
      WebDomain: domain,
      AppClientId: cognitoResource.output.AppClientID,
      AppClientSecret: cognitoResource.output.AppClientSecret,
      SignInRedirectURI: redirectSignIn,
      SignOutRedirectURI: redirectSignOut,
      Scopes: scope,
    };

    Object.assign(cognitoConfig, {
      Auth: {
        Default: {
          OAuth: oauth,
        },
      },
    });
  }

  if (cognitoConfig.Auth && cognitoConfig.Auth.Default) {
    cognitoConfig.Auth.Default.authenticationFlowType = cognitoResources.find(i => i.customAuth) ? 'CUSTOM_AUTH' : 'USER_SRP_AUTH';
  } else {
    cognitoConfig.Auth = {
      Default: {
        authenticationFlowType: cognitoResources.find(i => i.customAuth) ? 'CUSTOM_AUTH' : 'USER_SRP_AUTH',
      },
    };
  }

  Object.assign(cognitoConfig.Auth.Default, cognitoResource.frontendAuthConfig);

  return cognitoConfig;
}

function getS3Config(s3Resources) {
  const s3Resource = s3Resources[0];
  const testMode = s3Resource.testMode || false;
  const result = {
    S3TransferUtility: {
      Default: {
        Bucket: s3Resource.output.BucketName,
        Region: s3Resource.output.Region,
      },
    },
  };
  if (testMode) {
    result.S3TransferUtility.Default.DangerouslyConnectToHTTPEndpointForTesting = true;
  }
  return result;
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

function getAppSyncConfig(appsyncResources, projectRegion) {
  // There can only be one appsync resource
  const appsyncResource = appsyncResources[0];
  const testMode = appsyncResource.testMode || false;
  const { authConfig, securityType } = appsyncResource.output;
  let authMode = '';

  if (securityType) {
    authMode = securityType;
  } else if (authConfig) {
    authMode = authConfig.defaultAuthentication.authenticationType;
  }

  const apiKey = authMode === 'API_KEY' ? appsyncResource.output.GraphQLAPIKeyOutput : undefined;

  const result = {
    AppSync: {
      Default: {
        ApiUrl: appsyncResource.output.GraphQLAPIEndpointOutput,
        Region: appsyncResource.output.region || projectRegion,
        AuthMode: authMode,
        ApiKey: apiKey,
        ClientDatabasePrefix: `${appsyncResource.resourceName}_${authMode}`,
      },
    },
  };

  if (testMode) {
    result.AppSync.Default.DangerouslyConnectToHTTPEndpointForTesting = true;
  }

  const additionalAuths =
    (appsyncResource.output && appsyncResource.output.authConfig && appsyncResource.output.authConfig.additionalAuthenticationProviders) ||
    [];
  additionalAuths.forEach(auth => {
    const apiName = `${appsyncResource.resourceName}_${auth.authenticationType}`;
    const config = {
      ApiUrl: appsyncResource.output.GraphQLAPIEndpointOutput,
      Region: appsyncResource.output.region || projectRegion,
      AuthMode: auth.authenticationType,
      ApiKey: auth.authenticationType === 'API_KEY' ? appsyncResource.output.GraphQLAPIKeyOutput : undefined,
      ClientDatabasePrefix: apiName,
    };
    if (testMode) {
      config.DangerouslyConnectToHTTPEndpointForTesting = true;
    }
    result.AppSync[apiName] = config;
  });

  return result;
}

function getLexConfig(lexResources) {
  const config = {};
  lexResources.forEach(r => {
    config[r.output.BotName] = {
      Name: r.output.BotName,
      Alias: '$LATEST',
      Region: r.output.Region,
    };
  });
  return {
    Lex: config,
  };
}

function getSumerianConfig(sumerianResources) {
  const config = {};
  sumerianResources.forEach(r => {
    const { output } = r;
    Object.assign(config, output);
  });
  delete config.service;
  return {
    Sumerian: config,
  };
}

module.exports = { createAWSConfig, getNewAWSConfigObject, createAmplifyConfig, getAmplifyConfig, deleteAmplifyConfig, writeToFile };
