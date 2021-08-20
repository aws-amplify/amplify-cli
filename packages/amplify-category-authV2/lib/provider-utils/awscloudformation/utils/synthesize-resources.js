'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        Object.defineProperty(o, k2, {
          enumerable: true,
          get: function () {
            return m[k];
          },
        });
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod) if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.removeDeprecatedProps = exports.saveResourceParameters = exports.copyCfnTemplate = exports.getResourceUpdater = exports.getResourceSynthesizer = void 0;
const path = __importStar(require('path'));
const fs_extra_1 = require('fs-extra');
const uuid_1 = __importDefault(require('uuid'));
const constants_1 = require('../constants');
const amplify_cli_core_1 = require('amplify-cli-core');
const lodash_1 = require('lodash');
const string_maps_1 = require('../assets/string-maps');
const generate_auth_trigger_template_1 = require('./generate-auth-trigger-template');
const generate_auth_stack_template_1 = require('./generate-auth-stack-template');
const trigger_flow_auth_helper_1 = require('./trigger-flow-auth-helper');
const category = 'auth';
const FunctionServiceNameLambdaFunction = 'Lambda';
const getResourceSynthesizer = (context, cfnFilename, provider) => async request => {
  await lambdaTriggers(request, context, null);
  await generate_auth_stack_template_1.generateAuthStackTemplate(category, cfnFilename, request.resourceName);
  return request;
};
exports.getResourceSynthesizer = getResourceSynthesizer;
const getResourceUpdater = (context, cfnFilename, provider) => async request => {
  const resources = context.amplify.getProjectMeta();
  if (resources.auth.userPoolGroups) {
    await updateUserPoolGroups(context, request.resourceName, request.userPoolGroupList);
  } else {
    await createUserPoolGroups(context, request.resourceName, request.userPoolGroupList);
  }
  const adminQueriesFunctionName = lodash_1
    .get(resources, ['api', 'AdminQueries', 'dependsOn'], [])
    .filter(resource => resource.category === 'function')
    .map(resource => resource.resourceName)
    .find(resourceName => resourceName.includes('AdminQueries'));
  if (adminQueriesFunctionName) {
    await addAdminAuth(context, request.resourceName, 'update', request.adminQueryGroup, adminQueriesFunctionName);
  } else {
    await addAdminAuth(context, request.resourceName, 'add', request.adminQueryGroup);
  }
  const providerPlugin = context.amplify.getPluginInstance(context, provider);
  const previouslySaved = providerPlugin.loadResourceParameters(context, 'auth', request.resourceName).triggers || '{}';
  await lambdaTriggers(request, context, JSON.parse(previouslySaved));
  if ((!request.updateFlow && !request.thirdPartyAuth) || (request.updateFlow === 'manual' && !request.thirdPartyAuth)) {
    delete request.selectedParties;
    request.authProviders = [];
    string_maps_1.authProviders.forEach(a => delete request[a.answerHashKey]);
    if (request.googleIos) {
      delete request.googleIos;
    }
    if (request.googleAndroid) {
      delete request.googleAndroid;
    }
    if (request.audiences) {
      delete request.audiences;
    }
  }
  if (request.useDefault === 'default' || request.hostedUI === false) {
    delete request.oAuthMetadata;
    delete request.hostedUIProviderMeta;
    delete request.hostedUIProviderCreds;
    delete request.hostedUIDomainName;
    delete request.authProvidersUserPool;
  }
  if (request.updateFlow !== 'updateUserPoolGroups' && request.updateFlow !== 'updateAdminQueries') {
    await exports.copyCfnTemplate(context, category, request, cfnFilename);
    await generate_auth_trigger_template_1.generateNestedAuthTriggerTemplate(category, request);
    exports.saveResourceParameters(context, provider, category, request.resourceName, request, constants_1.ENV_SPECIFIC_PARAMS);
  }
  await copyS3Assets(request);
  return request;
};
exports.getResourceUpdater = getResourceUpdater;
const copyCfnTemplate = async (context, category, options, cfnFilename) => {
  const targetDir = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), category, options.resourceName);
  const copyJobs = [
    {
      dir: constants_1.cfnTemplateRoot,
      template: cfnFilename,
      target: path.join(targetDir, `${options.resourceName}-cloudformation-template.yml`),
      paramsFile: path.join(targetDir, 'parameters.json'),
    },
  ];
  const privateParams = Object.assign({}, options);
  constants_1.privateKeys.forEach(p => delete privateParams[p]);
  return await context.amplify.copyBatch(context, copyJobs, privateParams, true);
};
exports.copyCfnTemplate = copyCfnTemplate;
const saveResourceParameters = (context, providerName, category, resource, params, envSpecificParams = []) => {
  const provider = context.amplify.getPluginInstance(context, providerName);
  let privateParams = Object.assign({}, params);
  constants_1.privateKeys.forEach(p => delete privateParams[p]);
  privateParams = exports.removeDeprecatedProps(privateParams);
  provider.saveResourceParameters(context, category, resource, privateParams, envSpecificParams);
};
exports.saveResourceParameters = saveResourceParameters;
const removeDeprecatedProps = props => {
  [
    'authRoleName',
    'unauthRoleName',
    'userpoolClientName',
    'roleName',
    'policyName',
    'mfaLambdaLogPolicy',
    'mfaPassRolePolicy',
    'mfaLambdaIAMPolicy',
    'userpoolClientLogPolicy',
    'userpoolClientLambdaPolicy',
    'lambdaLogPolicy',
    'openIdRolePolicy',
    'openIdLambdaIAMPolicy',
    'mfaLambdaRole',
    'openIdLambdaRoleName',
    'CreateAuthChallenge',
    'CustomMessage',
    'DefineAuthChallenge',
    'PostAuthentication',
    'PostConfirmation',
    'PreAuthentication',
    'PreSignup',
    'VerifyAuthChallengeResponse',
  ].forEach(deprecatedField => delete props[deprecatedField]);
  return props;
};
exports.removeDeprecatedProps = removeDeprecatedProps;
const lambdaTriggers = async (coreAnswers, context, previouslySaved) => {
  let triggerKeyValues = {};
  let authTriggerConnections;
  if (coreAnswers.triggers) {
    const triggerConfig = await trigger_flow_auth_helper_1.handleTriggers(context, coreAnswers, previouslySaved);
    triggerKeyValues = triggerConfig.triggers;
    authTriggerConnections = triggerConfig.authTriggerConnections;
    coreAnswers.triggers = triggerKeyValues ? amplify_cli_core_1.JSONUtilities.stringify(triggerKeyValues) : '{}';
    if (amplify_cli_core_1.FeatureFlags.getBoolean('auth.breakCircularDependency')) {
      if (Array.isArray(authTriggerConnections) && authTriggerConnections.length > 0) {
        coreAnswers.authTriggerConnections = amplify_cli_core_1.JSONUtilities.stringify(authTriggerConnections);
      } else {
        delete coreAnswers.authTriggerConnections;
      }
    }
    coreAnswers.breakCircularDependency = amplify_cli_core_1.FeatureFlags.getBoolean('auth.breakCircularDependency');
    if (triggerKeyValues) {
      coreAnswers.parentStack = { Ref: 'AWS::StackId' };
    }
    coreAnswers.permissions = await context.amplify.getTriggerPermissions(context, coreAnswers.triggers, 'auth', coreAnswers.resourceName);
  } else if (previouslySaved) {
    const targetDir = amplify_cli_core_1.pathManager.getBackendDirPath();
    Object.keys(previouslySaved).forEach(p => {
      delete coreAnswers[p];
    });
    await context.amplify.deleteAllTriggers(previouslySaved, coreAnswers.resourceName, targetDir, context);
  }
  if (coreAnswers.triggers && coreAnswers.triggers === '[]') {
    delete coreAnswers.triggers;
  }
  const dependsOnKeys = Object.keys(triggerKeyValues).map(i => `${coreAnswers.resourceName}${i}`);
  coreAnswers.dependsOn = context.amplify.dependsOnBlock(context, dependsOnKeys, 'Cognito');
};
const createUserPoolGroups = async (context, resourceName, userPoolGroupList) => {
  if (userPoolGroupList && userPoolGroupList.length > 0) {
    const userPoolGroupPrecedenceList = [];
    for (let i = 0; i < userPoolGroupList.length; i += 1) {
      userPoolGroupPrecedenceList.push({
        groupName: userPoolGroupList[i],
        precedence: i + 1,
      });
    }
    const userPoolGroupFile = path.join(
      amplify_cli_core_1.pathManager.getBackendDirPath(),
      'auth',
      'userPoolGroups',
      'user-pool-group-precedence.json',
    );
    const userPoolGroupParams = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), 'auth', 'userPoolGroups', 'parameters.json');
    const groupParams = {
      AuthRoleArn: {
        'Fn::GetAtt': ['AuthRole', 'Arn'],
      },
      UnauthRoleArn: {
        'Fn::GetAtt': ['UnauthRole', 'Arn'],
      },
    };
    amplify_cli_core_1.JSONUtilities.writeJson(userPoolGroupParams, groupParams);
    amplify_cli_core_1.JSONUtilities.writeJson(userPoolGroupFile, userPoolGroupPrecedenceList);
    context.amplify.updateamplifyMetaAfterResourceAdd('auth', 'userPoolGroups', {
      service: 'Cognito-UserPool-Groups',
      providerPlugin: 'awscloudformation',
      dependsOn: [
        {
          category: 'auth',
          resourceName,
          attributes: ['UserPoolId', 'AppClientIDWeb', 'AppClientID', 'IdentityPoolId'],
        },
      ],
    });
  }
};
const updateUserPoolGroups = async (context, resourceName, userPoolGroupList) => {
  if (userPoolGroupList && userPoolGroupList.length > 0) {
    const userPoolGroupPrecedenceList = [];
    for (let i = 0; i < userPoolGroupList.length; i += 1) {
      userPoolGroupPrecedenceList.push({
        groupName: userPoolGroupList[i],
        precedence: i + 1,
      });
    }
    const userPoolGroupFile = path.join(
      context.amplify.pathManager.getBackendDirPath(),
      'auth',
      'userPoolGroups',
      'user-pool-group-precedence.json',
    );
    fs_extra_1.outputFileSync(userPoolGroupFile, JSON.stringify(userPoolGroupPrecedenceList, null, 4));
    context.amplify.updateamplifyMetaAfterResourceUpdate('auth', 'userPoolGroups', {
      service: 'Cognito-UserPool-Groups',
      providerPlugin: 'awscloudformation',
      dependsOn: [
        {
          category: 'auth',
          resourceName,
          attributes: ['UserPoolId', 'AppClientIDWeb', 'AppClientID', 'IdentityPoolId'],
        },
      ],
    });
  }
};
const addAdminAuth = async (context, authResourceName, operation, adminGroup, functionName) => {
  if (adminGroup) {
    if (!functionName) {
      const [shortId] = uuid_1.default().split('-');
      functionName = `AdminQueries${shortId}`;
    }
    await createAdminAuthFunction(context, authResourceName, functionName, adminGroup, operation);
    await createAdminAuthAPI(context, authResourceName, functionName, operation);
  }
};
const createAdminAuthFunction = async (context, authResourceName, functionName, adminGroup, operation) => {
  const targetDir = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), 'function', functionName);
  let lambdaGroupVar = adminGroup;
  const dependsOn = [];
  dependsOn.push({
    category: 'auth',
    resourceName: authResourceName,
    attributes: ['UserPoolId'],
  });
  if (!lambdaGroupVar) {
    lambdaGroupVar = 'NONE';
  }
  const functionProps = {
    functionName: `${functionName}`,
    roleName: `${functionName}LambdaRole`,
    dependsOn,
    authResourceName,
    lambdaGroupVar,
  };
  const copyJobs = [
    {
      dir: constants_1.adminAuthAssetRoot,
      template: 'admin-auth-app.js',
      target: path.join(targetDir, 'src/app.js'),
    },
    {
      dir: constants_1.adminAuthAssetRoot,
      template: 'admin-auth-cognitoActions.js',
      target: path.join(targetDir, 'src/cognitoActions.js'),
    },
    {
      dir: constants_1.adminAuthAssetRoot,
      template: 'admin-auth-index.js',
      target: path.join(targetDir, 'src/index.js'),
    },
    {
      dir: constants_1.adminAuthAssetRoot,
      template: 'admin-auth-package.json',
      target: path.join(targetDir, 'src/package.json'),
    },
    {
      dir: constants_1.adminAuthAssetRoot,
      template: 'admin-queries-function-template.json.ejs',
      target: path.join(targetDir, `${functionName}-cloudformation-template.json`),
    },
  ];
  await context.amplify.copyBatch(context, copyJobs, functionProps, true);
  if (operation === 'add') {
    const backendConfigs = {
      service: FunctionServiceNameLambdaFunction,
      providerPlugin: 'awscloudformation',
      build: true,
      dependsOn,
    };
    await context.amplify.updateamplifyMetaAfterResourceAdd('function', functionName, backendConfigs);
    context.print.success(`Successfully added ${functionName} function locally`);
  } else {
    context.print.success(`Successfully updated ${functionName} function locally`);
  }
};
const createAdminAuthAPI = async (context, authResourceName, functionName, operation) => {
  const apiName = 'AdminQueries';
  const targetDir = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), 'api', apiName);
  const dependsOn = [];
  dependsOn.push(
    {
      category: 'auth',
      resourceName: authResourceName,
      attributes: ['UserPoolId'],
    },
    {
      category: 'function',
      resourceName: functionName,
      attributes: ['Arn', 'Name'],
    },
  );
  const apiProps = {
    functionName,
    authResourceName,
    dependsOn,
  };
  const copyJobs = [
    {
      dir: constants_1.adminAuthAssetRoot,
      template: 'admin-queries-api-template.json.ejs',
      target: path.join(targetDir, 'admin-queries-cloudformation-template.json'),
    },
    {
      dir: constants_1.adminAuthAssetRoot,
      template: 'admin-queries-api-params.json',
      target: path.join(targetDir, 'parameters.json'),
    },
  ];
  await context.amplify.copyBatch(context, copyJobs, apiProps, true);
  if (operation === 'add') {
    const backendConfigs = {
      service: 'API Gateway',
      providerPlugin: 'awscloudformation',
      authorizationType: 'AMAZON_COGNITO_USER_POOLS',
      dependsOn,
    };
    await context.amplify.updateamplifyMetaAfterResourceAdd('api', apiName, backendConfigs);
    context.print.success(`Successfully added ${apiName} API locally`);
  } else {
    context.print.success(`Successfully updated ${apiName} API locally`);
  }
};
const copyS3Assets = async request => {
  const targetDir = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), 'auth', request.resourceName, 'assets');
  const triggers = request.triggers ? amplify_cli_core_1.JSONUtilities.parse(request.triggers) : null;
  const confirmationFileNeeded = request.triggers && triggers.CustomMessage && triggers.CustomMessage.includes('verification-link');
  if (confirmationFileNeeded) {
    if (!fs_extra_1.existsSync(targetDir)) {
      const source = path.join(constants_1.triggerRoot, 'CustomMessage/assets');
      fs_extra_1.copySync(source, targetDir);
    }
  }
};
//# sourceMappingURL=synthesize-resources.js.map
