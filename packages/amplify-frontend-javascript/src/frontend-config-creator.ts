import path from 'path';
import Module from 'module';
import fs from 'fs-extra';
import graphQLConfig from 'graphql-config';
import * as babel from '@babel/core';

import babelTransformEsmToCjs from '@babel/plugin-transform-modules-commonjs';
import { $TSAny, $TSContext } from 'amplify-cli-core';
import constants from './constants';

const MOCK_RESERVED_EXPORT_KEYS = [
  'aws_user_files_s3_dangerously_connect_to_http_endpoint_for_testing',
  'aws_appsync_dangerously_connect_to_http_endpoint_for_testing',
];

// These are the set of keys that are reserved for amplify and customers are not allowed to override
const AMPLIFY_RESERVED_EXPORT_KEYS = [
  // General
  'aws_project_region',
  // cognito
  'aws_cognito_identity_pool_id',
  'aws_cognito_region',
  'aws_user_pools_id',
  'aws_user_pools_web_client_id',
  'oauth',
  'federationTarget',
  'aws_cognito_username_attributes',
  'aws_cognito_social_providers',
  'aws_cognito_signup_attributes',
  'aws_cognito_mfa_configuration',
  'aws_cognito_mfa_types',
  'aws_cognito_password_protection_settings',
  'aws_cognito_verification_mechanisms',

  // S3
  'aws_user_files_s3_bucket',
  'aws_user_files_s3_bucket_region',

  // AppSync
  'aws_appsync_graphqlEndpoint',
  'aws_appsync_region',
  'aws_appsync_authenticationType',
  'aws_appsync_apiKey',
  // API Gateway
  'aws_cloud_logic_custom',

  // Pinpoint
  'aws_mobile_analytics_app_id',
  'aws_mobile_analytics_app_region',
  'Notifications',

  // DynamoDB
  'aws_dynamodb_all_tables_region',
  'aws_dynamodb_table_schemas',

  // S3AndCloudFront
  'aws_content_delivery_bucket',
  'aws_content_delivery_bucket_region',
  'aws_content_delivery_url',

  // lex
  'aws_bots',
  'aws_bots_config',

  // Sumerian
  'XR',

  // Predictions
  'predictions',

  // Geo
  'geo',
];

const CUSTOM_CONFIG_DENY_LIST = [...MOCK_RESERVED_EXPORT_KEYS, ...AMPLIFY_RESERVED_EXPORT_KEYS];

const FILE_EXTENSION_MAP = {
  javascript: 'js',
  graphql: 'graphql',
  flow: 'js',
  typescript: 'ts',
  angular: 'graphql',
};

const fileNames = ['queries', 'mutations', 'subscriptions'];

/**
 Delete Amplify config
 */
export const deleteAmplifyConfig = (context: $TSContext): void => {
  const { srcDirPath, projectPath } = getSrcDir(context);
  // delete aws-exports
  if (fs.existsSync(srcDirPath)) {
    const targetFilePath = path.join(srcDirPath, constants.exportsFilename);
    fs.removeSync(targetFilePath);
  }
  // eslint-disable-next-line spellcheck/spell-checker
  if (!fs.existsSync(path.join(projectPath, '.graphqlconfig.yml'))) return;
  const gqlConfig = graphQLConfig.getGraphQLConfig(projectPath);
  if (gqlConfig && gqlConfig.config) {
    const projects = gqlConfig.config;
    Object.keys(projects).forEach(project => {
      const { codeGenTarget, docsFilePath } = projects[project].extensions.amplify;
      fileNames.forEach(filename => {
        const file = path.join(projectPath, docsFilePath, `${filename}.${FILE_EXTENSION_MAP[codeGenTarget] || 'graphql'}`);
        if (fs.existsSync(file)) fs.removeSync(file);
      });
    });
  }
};

const getSrcDir = (context:$TSContext): {srcDirPath: string, projectPath: string } => {
  const { amplify } = context;
  const projectPath = context.exeInfo ? context.exeInfo.localEnvInfo.projectPath : amplify.getEnvInfo().projectPath;
  const projectConfig = context.exeInfo ? context.exeInfo.projectConfig[constants.Label] : amplify.getProjectConfig()[constants.Label];
  const frontendConfig = projectConfig.config;
  return {
    srcDirPath: path.join(projectPath, frontendConfig.SourceDir),
    projectPath,
  };
};

/**
 Create Amplify config
 */
export const createAmplifyConfig = (context: $TSContext, amplifyResources): undefined => {
  const { amplify } = context;
  const pluginDir = __dirname;
  const { srcDirPath } = getSrcDir(context);

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
  return undefined;
};

/**
 Creates AWS exports
 */
export const createAWSExports = async (context:$TSContext, amplifyResources, cloudAmplifyResources): Promise<$TSContext> => {
  const newAWSExports = await getAWSExports(context, amplifyResources, cloudAmplifyResources);
  generateAWSExportsFile(context, newAWSExports);
  return context;
};

/**
 Return the AWS exports
 */
export const getAWSExports = async (context: $TSContext, amplifyResources, cloudAmplifyResources): Promise<$TSAny> => {
  const newAWSExports = getAWSExportsObject(amplifyResources);
  const cloudAWSExports = getAWSExportsObject(cloudAmplifyResources);
  const currentAWSExports = await getCurrentAWSExports(context);
  const customConfigs = getCustomConfigs(cloudAWSExports, currentAWSExports);

  Object.assign(newAWSExports, customConfigs);
  return newAWSExports;
};

const getCustomConfigs = (cloudAWSExports, currentAWSExports): $TSAny => {
  const customConfigs = {};
  if (currentAWSExports) {
    Object.keys(currentAWSExports)
      .filter(key => !CUSTOM_CONFIG_DENY_LIST.includes(key))
      .forEach(key => {
        if (!cloudAWSExports[key]) {
          customConfigs[key] = currentAWSExports[key];
        }
      });
  }
  return customConfigs;
};

type PredictionsConfig = {
  convert?,
  identify?,
  interpret?,
  infer?,
}

type GeoConfig = {
  region?,
  maps?,
  searchIndices?,
  geofenceCollections?,
}

/**
 Get the AWS exports object
 */
export const getAWSExportsObject = (resources): $TSAny => {
  const { serviceResourceMapping } = resources;

  const predictionsConfig: PredictionsConfig = {};
  const geoConfig: GeoConfig = {};

  const projectRegion = resources.metadata.Region;
  const configOutput = { aws_project_region: projectRegion };

  Object.keys(serviceResourceMapping).forEach(service => {
    switch (service) {
      case 'Cognito':
        Object.assign(configOutput, getCognitoConfig(serviceResourceMapping[service], projectRegion));
        break;
      case 'S3':
        Object.assign(configOutput, getS3Config(serviceResourceMapping[service], projectRegion));
        break;
      case 'AppSync':
        Object.assign(configOutput, getAppSyncConfig(serviceResourceMapping[service], projectRegion));
        break;
      case 'API Gateway':
      case 'ElasticContainer':
        Object.assign(configOutput, getAPIGWConfig(serviceResourceMapping[service], projectRegion, configOutput));
        break;
      case 'Pinpoint':
        Object.assign(configOutput, getPinpointConfig(serviceResourceMapping[service], projectRegion));
        break;
      case 'DynamoDB':
        Object.assign(configOutput, getDynamoDBConfig(serviceResourceMapping[service], projectRegion));
        break;
      case 'S3AndCloudFront':
        Object.assign(configOutput, getS3AndCloudFrontConfig(serviceResourceMapping[service], projectRegion));
        break;
      case 'Lex':
        Object.assign(configOutput, getLexConfig(serviceResourceMapping[service], projectRegion));
        break;
      case 'Sumerian':
        Object.assign(configOutput, getSumerianConfig(serviceResourceMapping[service], projectRegion));
        break;
      // predictions config generation
      case 'Translate':
      case 'Polly':
      case 'Transcribe':
        predictionsConfig.convert = {
          ...predictionsConfig.convert,
          ...getConvertConfig(serviceResourceMapping[service]),
        };
        break;
      case 'Rekognition':
      case 'RekognitionAndTextract':
        predictionsConfig.identify = {
          ...predictionsConfig.identify,
          ...getIdentifyConfig(serviceResourceMapping[service]),
        };
        break;
      case 'Comprehend':
        predictionsConfig.interpret = {
          ...predictionsConfig.interpret,
          ...getInterpretConfig(serviceResourceMapping[service]),
        };
        break;
      case 'SageMaker':
        predictionsConfig.infer = {
          ...predictionsConfig.infer,
          ...getInferConfig(serviceResourceMapping[service]),
        };
        break;
      case 'Map':
        geoConfig.region = serviceResourceMapping[service][0].output.Region || projectRegion;
        geoConfig.maps = getMapConfig(serviceResourceMapping[service]);
        break;
      case 'PlaceIndex':
        geoConfig.region = serviceResourceMapping[service][0].output.Region || projectRegion;
        geoConfig.searchIndices = getPlaceIndexConfig(serviceResourceMapping[service]);
        break;
      case 'GeofenceCollection':
        geoConfig.region = serviceResourceMapping[service][0].output.Region || projectRegion;
        geoConfig.geofenceCollections = getGeofenceCollectionConfig(serviceResourceMapping[service]);
        break;
      default:
        break;
    }
  });

  // add predictions config if predictions resources exist
  if (Object.entries(predictionsConfig).length > 0) {
    Object.assign(configOutput, { predictions: predictionsConfig });
  }

  // add geo config if geo resources exist
  if (Object.entries(geoConfig).length > 0) {
    Object.assign(configOutput, {
      geo: {
        amazon_location_service: geoConfig,
      },
    });
  }

  return configOutput;
};

/**
 Return the current AWS exports
 */
export const getCurrentAWSExports = async (context: $TSContext): Promise<$TSAny> => {
  const { amplify, exeInfo } = context;
  const projectPath = exeInfo?.localEnvInfo?.projectPath || amplify.getEnvInfo().projectPath;
  const { config: frontendConfig } = exeInfo?.projectConfig?.[constants.Label] || amplify.getProjectConfig()[constants.Label];
  const srcDirPath = path.join(projectPath, frontendConfig.SourceDir);

  const targetFilePath = path.join(srcDirPath, constants.exportsFilename);
  let awsExports = {};

  if (fs.existsSync(targetFilePath)) {
    const fileContents = fs.readFileSync(targetFilePath, 'utf-8');
    try {
      // transpile the file contents to CommonJS
      const code = (babel.transformSync(fileContents, {
        plugins: [babelTransformEsmToCjs],
        configFile: false,
        babelrc: false,
      }))?.code;

      const mod = new Module('');
      (mod as $TSAny)._compile(code, 'aws-exports.js');
      // add paths to the module to account for node_module imports in aws-exports.js (should there be any)
      mod.paths = [projectPath];
      // the transpiled result will contain `exports.default`
      awsExports = mod.exports?.default || mod.exports;
    } catch (error) {
      throw new Error('Unable to parse aws-exports.js. Has this file been modified?');
    }
  }

  if (!awsExports) {
    throw new Error('Unable to find aws-exports.js. Has this file been modified?');
  }
  return awsExports;
};

const generateAWSExportsFile = async (context: $TSContext, configOutput): Promise<void> => {
  const { amplify } = context;
  const projectPath = context.exeInfo ? context.exeInfo.localEnvInfo.projectPath : amplify.getEnvInfo().projectPath;
  const projectConfig = context.exeInfo ? context.exeInfo.projectConfig[constants.Label] : amplify.getProjectConfig()[constants.Label];
  const frontendConfig = projectConfig.config;
  const srcDirPath = path.join(projectPath, frontendConfig.SourceDir);

  fs.ensureDirSync(srcDirPath);

  const targetFilePath = path.join(srcDirPath, constants.exportsFilename);
  await generateAwsExportsAtPath(context, targetFilePath, configOutput);
};

/**
 Generate AWS exports at given path
 */
export const generateAwsExportsAtPath = async (context: $TSContext, targetFilePath, configOutput): Promise<void> => {
  const pluginDir = __dirname;
  const { amplify } = context;
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
};

/* eslint-disable camelcase*/
type FrontendAuthConfig = {
  aws_cognito_username_attributes?,
  aws_cognito_social_providers?,
  aws_cognito_signup_attributes?,
  aws_cognito_mfa_configuration?,
  aws_cognito_mfa_types?,
  aws_cognito_password_protection_settings?,
  aws_cognito_verification_mechanisms?,
  aws_user_files_s3_dangerously_connect_to_http_endpoint_for_testing?,
  aws_cognito_identity_pool_id?,
  aws_cognito_region?,
  aws_user_pools_id?,
  aws_user_pools_web_client_id?,
  oauth?,
  federationTarget?,
}
/* eslint-enable camelcase*/

const getCognitoConfig = (cognitoResources, projectRegion): FrontendAuthConfig => {
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
    // eslint-disable-next-line spellcheck/spell-checker
    domain = `${cognitoResource.output.HostedUIDomain}.auth.${projectRegion}.amazoncognito.com`;
  }
  if (cognitoResource.output.OAuthMetadata) {
    const oAuthMetadata = JSON.parse(cognitoResource.output.OAuthMetadata);
    scope = oAuthMetadata.AllowedOAuthScopes;
    redirectSignIn = oAuthMetadata.CallbackURLs.join(',');
    redirectSignOut = oAuthMetadata.LogoutURLs.join(',');
    [responseType] = oAuthMetadata.AllowedOAuthFlows;
    if (responseType === 'implicit') {
      responseType = 'token';
    }
    userPoolFederation = true;
  }

  const oauth = {
    domain,
    scope,
    redirectSignIn,
    redirectSignOut,
    responseType,
  };

  if (
    cognitoResource.output.GoogleWebClient
    || cognitoResource.output.FacebookWebClient
    || cognitoResource.output.AmazonWebClient
    || cognitoResource.output.AppleWebClient
  ) {
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

  const frontendAuthConfig: FrontendAuthConfig = {};
  if (cognitoResource.frontendAuthConfig) {
    frontendAuthConfig.aws_cognito_username_attributes = cognitoResource.frontendAuthConfig.usernameAttributes;
    frontendAuthConfig.aws_cognito_social_providers = cognitoResource.frontendAuthConfig.socialProviders;
    frontendAuthConfig.aws_cognito_signup_attributes = cognitoResource.frontendAuthConfig.signupAttributes;
    frontendAuthConfig.aws_cognito_mfa_configuration = cognitoResource.frontendAuthConfig.mfaConfiguration;
    frontendAuthConfig.aws_cognito_mfa_types = cognitoResource.frontendAuthConfig.mfaTypes;
    frontendAuthConfig.aws_cognito_password_protection_settings = cognitoResource.frontendAuthConfig.passwordProtectionSettings;
    frontendAuthConfig.aws_cognito_verification_mechanisms = cognitoResource.frontendAuthConfig.verificationMechanisms;
  }

  return {
    aws_cognito_identity_pool_id: cognitoResource.output.IdentityPoolId,
    aws_cognito_region: projectRegion,
    aws_user_pools_id: cognitoResource.output.UserPoolId,
    aws_user_pools_web_client_id: cognitoResource.output.AppClientIDWeb,
    oauth,
    federationTarget,
    ...frontendAuthConfig,
  };
};

/* eslint-disable camelcase */
type S3Config ={
  aws_user_files_s3_bucket?,
  aws_user_files_s3_bucket_region?,
  aws_user_files_s3_dangerously_connect_to_http_endpoint_for_testing?,
}

/* eslint-enable camelcase*/
const getS3Config = (s3Resources, projectRegion): $TSAny => {
  // There can only be one s3 resource - user files
  const s3Resource = s3Resources[0];
  const config: S3Config = {
    aws_user_files_s3_bucket: s3Resource.output.BucketName,
    aws_user_files_s3_bucket_region: projectRegion,
  };

  if (s3Resource.testMode) {
    config.aws_user_files_s3_dangerously_connect_to_http_endpoint_for_testing = true;
  }
  return config;
};

/* eslint-disable camelcase */
type AppSyncConfig = {
  aws_appsync_graphqlEndpoint?,
  aws_appsync_region?,
  aws_appsync_authenticationType?,
  aws_appsync_apiKey?,
  aws_appsync_dangerously_connect_to_http_endpoint_for_testing?,
}
/* eslint-enable camelcase*/

const getAppSyncConfig = (appsyncResources, projectRegion): AppSyncConfig => {
  // There can only be one appsync resource
  const appsyncResource = appsyncResources[0];
  const { authConfig, securityType } = appsyncResource.output;
  let authMode = '';

  if (securityType) {
    authMode = securityType;
  } else if (authConfig) {
    authMode = authConfig.defaultAuthentication.authenticationType;
  }
  const config: AppSyncConfig = {
    aws_appsync_graphqlEndpoint: appsyncResource.output.GraphQLAPIEndpointOutput,
    aws_appsync_region: projectRegion,
    aws_appsync_authenticationType: authMode,
    aws_appsync_apiKey: appsyncResource.output.GraphQLAPIKeyOutput || undefined,
  };
  if (appsyncResource.testMode) {
    config.aws_appsync_dangerously_connect_to_http_endpoint_for_testing = true;
  }
  return config;
};

const getAPIGWConfig = (apigwResources, projectRegion, configOutput): $TSAny => {
  // There can be multiple api gateway resource

  const apigwConfig = {
    aws_cloud_logic_custom: configOutput.aws_cloud_logic_custom || [],
  };

  for (let i = 0; i < apigwResources.length; i += 1) {
    if (apigwResources[i].output.ApiName && apigwResources[i].output.RootUrl) {
      // only REST endpoints contains this information
      apigwConfig.aws_cloud_logic_custom.push({
        name: apigwResources[i].output.ApiName,
        endpoint: apigwResources[i].output.RootUrl,
        region: projectRegion,
      });
    }
  }
  return apigwConfig;
};

// get the predictions-convert config resource
const getConvertConfig = (convertResources): $TSAny => {
  const convertResource = convertResources[0];

  // return speechGenerator config
  if (convertResource.convertType === 'speechGenerator') {
    return {
      speechGenerator: {
        region: convertResource.output.region,
        proxy: false,
        defaults: {
          VoiceId: convertResource.output.voice,
          LanguageCode: convertResource.output.language,
        },
      },
    };
  }
  if (convertResource.convertType === 'transcription') {
    return {
      transcription: {
        region: convertResource.output.region,
        proxy: false,
        defaults: {
          language: convertResource.output.language,
        },
      },
    };
  }
  // return translate convert config
  return {
    translateText: {
      region: convertResource.output.region,
      proxy: false,
      defaults: {
        sourceLanguage: convertResource.output.sourceLang,
        targetLanguage: convertResource.output.targetLang,
      },
    },
  };
};

/* eslint-disable camelcase */
type IdentifyConfig = {
  identifyText?,
  identifyEntities?,
  identifyLabels?,
}
/* eslint-enable camelcase*/

const getIdentifyConfig = (identifyResources): IdentifyConfig => {
  const resultConfig: IdentifyConfig = {};
  const baseConfig = {
    proxy: false,
  };
  identifyResources.forEach(identifyResource => {
    if (identifyResource.identifyType === 'identifyText') {
      resultConfig.identifyText = {
        ...baseConfig,
        region: identifyResource.output.region,
        defaults: {
          format: identifyResource.output.format,
        },
      };
    }
    if (identifyResource.identifyType === 'identifyEntities') {
      resultConfig.identifyEntities = {
        ...baseConfig,
        region: identifyResource.output.region,
        celebrityDetectionEnabled: Boolean(identifyResource.output.celebrityDetectionEnabled),
      };
      if (identifyResource.output.collectionId) {
        resultConfig.identifyEntities.defaults = {
          collectionId: identifyResource.output.collectionId,
          maxEntities: parseInt(identifyResource.output.maxEntities, 10),
        };
      }
    }
    if (identifyResource.identifyType === 'identifyLabels') {
      resultConfig.identifyLabels = {
        ...baseConfig,
        region: identifyResource.output.region,
        defaults: {
          type: identifyResource.output.type,
        },
      };
    }
  });
  return resultConfig;
};

type InterpretConfig = {
  interpretText
}

const getInterpretConfig = (interpretResources):InterpretConfig => ({
  interpretText: {
    region: interpretResources[0].output.region,
    proxy: false,
    defaults: {
      type: interpretResources[0].output.type,
    },
  },
});

type InferConfig = {
  inferModel
}

const getInferConfig = (inferResources):InferConfig => ({
  inferModel: {
    region: inferResources[0].output.region,
    proxy: false,
    endpoint: inferResources[0].output.endpointName,
  },
});

/* eslint-disable camelcase */
type PinpointConfig = {
  aws_mobile_analytics_app_id,
  aws_mobile_analytics_app_region,
}
/* eslint-enable camelcase*/

const isPinpointChannelEnabled = (channelName, pinpointResource): bool => pinpointResource?.output?.[channelName]?.Enabled;

const getPinpointConfig = (pinpointResources): PinpointConfig => {
  // There are legacy projects where we could have multiple Pinpoint resources.
  // We will iterate over all Pinpoint resources in amplify-meta until we get the configured
  // AppId, Region and Channel configuration for that Pinpoint resource

  const firstPinpointResource = pinpointResources[0];
  const pinpointConfig = {
    aws_mobile_analytics_app_id: firstPinpointResource.output.Id,
    aws_mobile_analytics_app_region: firstPinpointResource.output.Region,
  };
  for (const pinpointResource of pinpointResources) {
    pinpointConfig.aws_mobile_analytics_app_id = (pinpointConfig.aws_mobile_analytics_app_id) || pinpointResource.output.Id;
    pinpointConfig.aws_mobile_analytics_app_region = (pinpointConfig.aws_mobile_analytics_app_region) || pinpointResource.output.Region;
    if (isPinpointChannelEnabled('InAppMessaging', pinpointResource)) {
      pinpointConfig.Notifications = {
        InAppMessaging: {
          AWSPinpoint: {
            appId: pinpointConfig.aws_mobile_analytics_app_id,
            region: pinpointConfig.aws_mobile_analytics_app_region,
          },
        },
      };
      break;
    }
  }
  return pinpointConfig;
};

/* eslint-disable camelcase */
type DynamoDBConfig = {
  aws_dynamodb_all_tables_region,
  aws_dynamodb_table_schemas: Array<$TSAny>,
}

const getDynamoDBConfig = (dynamoDBResources, projectRegion): DynamoDBConfig => {
  // There can be multiple dynamo db resource

  const dynamoDBConfig: DynamoDBConfig = {
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
};

/* eslint-disable camelcase */
type S3AndCloudFrontConfig ={
  aws_content_delivery_bucket?,
  aws_content_delivery_bucket_region?,
  aws_content_delivery_url?,
}
/* eslint-enable camelcase*/

const getS3AndCloudFrontConfig = (s3AndCloudfrontResources, projectRegion): S3AndCloudFrontConfig => {
  // There can only be one hosting resource fpr S3AndCloudFront service
  const s3AndCloudfrontResource = s3AndCloudfrontResources[0];

  return {
    aws_content_delivery_bucket: s3AndCloudfrontResource.output.HostingBucketName,
    aws_content_delivery_bucket_region: projectRegion,
    aws_content_delivery_url: s3AndCloudfrontResource.output.CloudFrontSecureURL || s3AndCloudfrontResource.output.WebsiteURL,
  };
};

/* eslint-disable camelcase */
type LexConfig = {
  aws_bots?,
  aws_bots_config?,
}
/* eslint-enable camelcase*/

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getLexConfig = (lexResources, projectRegion): LexConfig => {
  const config = lexResources.map(r => ({
    name: r.output.BotName,
    alias: '$LATEST',
    region: r.output.Region,
  }));

  return {
    aws_bots: 'enable',
    aws_bots_config: config,
  };
};

/* eslint-disable camelcase */
type SumerianConfig ={
  XR?,
}
/* eslint-enable camelcase*/

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getSumerianConfig = (sumerianResources, projectRegion): SumerianConfig => {
  const scenes = {};
  sumerianResources.forEach(r => {
    const { resourceName, output } = r;
    delete output.service;

    scenes[resourceName] = {
      sceneConfig: output,
    };
  });
  return {
    XR: {
      scenes,
    },
  };
};

/* eslint-disable camelcase */
type MapConfig={
  items?,
  default?,
}
/* eslint-enable camelcase*/

const getMapConfig = (mapResources): MapConfig => {
  let defaultMap = '';
  const mapConfig: MapConfig = {
    items: {},
  };
  mapResources.forEach(mapResource => {
    const mapName = mapResource.output.Name;
    mapConfig.items[mapName] = {
      style: mapResource.output.Style,
    };
    if (mapResource.isDefault) {
      defaultMap = mapName;
    }
  });
  mapConfig.default = defaultMap;
  return mapConfig;
};

/* eslint-disable camelcase */
type PlaceIndexConfig={
  items?,
  default?,
}
/* eslint-enable camelcase*/

const getPlaceIndexConfig = (placeIndexResources):PlaceIndexConfig => {
  let defaultPlaceIndex = '';
  const placeIndexConfig:PlaceIndexConfig = {
    items: [],
  };
  placeIndexResources.forEach(placeIndexResource => {
    const placeIndexName = placeIndexResource.output.Name;
    placeIndexConfig.items.push(placeIndexName);
    if (placeIndexResource.isDefault) {
      defaultPlaceIndex = placeIndexName;
    }
  });
  placeIndexConfig.default = defaultPlaceIndex;
  return placeIndexConfig;
};

/* eslint-disable camelcase */
type GeofenceCollectionConfig={
  items?,
  default?,
}
/* eslint-enable camelcase*/

const getGeofenceCollectionConfig = (geofenceCollectionResources):GeofenceCollectionConfig => {
  let defaultGeofenceCollection = '';
  const geofenceCollectionConfig:GeofenceCollectionConfig = {
    items: [],
  };
  geofenceCollectionResources.forEach(geofenceCollectionResource => {
    const geofenceCollectionName = geofenceCollectionResource.output.Name;
    geofenceCollectionConfig.items.push(geofenceCollectionName);
    if (geofenceCollectionResource.isDefault) {
      defaultGeofenceCollection = geofenceCollectionName;
    }
  });
  geofenceCollectionConfig.default = defaultGeofenceCollection;
  return geofenceCollectionConfig;
};

export default {
  createAWSExports,
  getAWSExports,
  getCurrentAWSExports,
  createAmplifyConfig,
  deleteAmplifyConfig,
  generateAwsExportsAtPath,
  getAWSExportsObject,
};
