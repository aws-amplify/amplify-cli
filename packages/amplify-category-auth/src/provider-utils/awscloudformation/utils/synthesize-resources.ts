import { AuthTriggerConfig, AuthTriggerConnection, ServiceQuestionsResult } from '../service-walkthrough-types';
import * as path from 'path';
import { existsSync, copySync, outputFileSync } from 'fs-extra';
import uuid from 'uuid';
import { cfnTemplateRoot, privateKeys, adminAuthAssetRoot, triggerRoot, ENV_SPECIFIC_PARAMS } from '../constants';
import { pathManager, JSONUtilities, FeatureFlags } from 'amplify-cli-core';
import { get } from 'lodash';
import { authProviders } from '../assets/string-maps';
import { generateNestedAuthTriggerTemplate } from './generate-auth-trigger-template';

const category = 'auth';

// keep in sync with ServiceName in amplify-category-function, but probably it will not change
const FunctionServiceNameLambdaFunction = 'Lambda';

/**
 * Factory function that returns a function that synthesizes all resources based on a ServiceQuestionsResult request.
 * The function returns the request unchanged to enable .then() chaining
 * @param context The amplify context
 * @param cfnFilename The template CFN filename
 * @param provider The cloud provider name
 */
export const getResourceSynthesizer = (context: any, cfnFilename: string, provider: string) => async (
  request: Readonly<ServiceQuestionsResult>,
) => {
  await lambdaTriggers(request, context, null);
  await createUserPoolGroups(context, request.resourceName!, request.userPoolGroupList);
  await addAdminAuth(context, request.resourceName!, 'add', request.adminQueryGroup);
  await copyCfnTemplate(context, category, request, cfnFilename);
  await generateNestedAuthTriggerTemplate(context, category, request);
  saveResourceParameters(context, provider, category, request.resourceName!, request, ENV_SPECIFIC_PARAMS);
  await copyS3Assets(request);
  return request;
};

/**
 * Factory function that returns a function that updates the auth resource based on a ServiceQuestionsResult request.
 * The function returns the request unchanged to enable .then() chaining
 *
 * The code is more-or-less refactored as-is from the existing update logic
 * @param context The amplify context
 * @param cfnFilename The template CFN filename
 * @param provider The cloud provider name
 */
export const getResourceUpdater = (context: any, cfnFilename: string, provider: string) => async (request: ServiceQuestionsResult) => {
  const resources = context.amplify.getProjectMeta();
  if (resources.auth.userPoolGroups) {
    await updateUserPoolGroups(context, request.resourceName!, request.userPoolGroupList);
  } else {
    await createUserPoolGroups(context, request.resourceName!, request.userPoolGroupList);
  }

  const adminQueriesFunctionName = get<{ category: string; resourceName: string }[]>(resources, ['api', 'AdminQueries', 'dependsOn'], [])
    .filter(resource => resource.category === 'function')
    .map(resource => resource.resourceName)
    .find(resourceName => resourceName.includes('AdminQueries'));
  if (adminQueriesFunctionName) {
    await addAdminAuth(context, request.resourceName!, 'update', request.adminQueryGroup, adminQueriesFunctionName);
  } else {
    await addAdminAuth(context, request.resourceName!, 'add', request.adminQueryGroup);
  }

  const providerPlugin = context.amplify.getPluginInstance(context, provider);
  const previouslySaved = providerPlugin.loadResourceParameters(context, 'auth', request.resourceName).triggers || '{}';
  await lambdaTriggers(request, context, JSON.parse(previouslySaved));

  if ((!request.updateFlow && !request.thirdPartyAuth) || (request.updateFlow === 'manual' && !request.thirdPartyAuth)) {
    delete request.selectedParties;
    request.authProviders = [];
    authProviders.forEach(a => delete (request as any)[a.answerHashKey]);
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
    await copyCfnTemplate(context, category, request, cfnFilename);
    await generateNestedAuthTriggerTemplate(context, category, request);
    saveResourceParameters(context, provider, category, request.resourceName!, request, ENV_SPECIFIC_PARAMS);
  }
  await copyS3Assets(request);
  return request;
};

/**
 * The 3 functions below should not be exported, but they are for now because externalAuthEnable still uses them individually
 */
export const copyCfnTemplate = async (context: any, category: string, options: any, cfnFilename: string) => {
  const targetDir = path.join(pathManager.getBackendDirPath(), category, options.resourceName);
  // enable feature flag to remove trigger dependency from auth template

  const copyJobs = [
    {
      dir: cfnTemplateRoot,
      template: cfnFilename,
      target: path.join(targetDir, `${options.resourceName}-cloudformation-template.yml`),
      paramsFile: path.join(targetDir, 'parameters.json'),
    },
  ];

  const privateParams = Object.assign({}, options);
  privateKeys.forEach(p => delete privateParams[p]);

  return await context.amplify.copyBatch(context, copyJobs, privateParams, true);
};

export const saveResourceParameters = (
  context: any,
  providerName: string,
  category: string,
  resource: string,
  params: any,
  envSpecificParams: any[] = [],
) => {
  const provider = context.amplify.getPluginInstance(context, providerName);
  let privateParams = Object.assign({}, params);
  privateKeys.forEach(p => delete privateParams[p]);
  privateParams = removeDeprecatedProps(privateParams);
  provider.saveResourceParameters(context, category, resource, privateParams, envSpecificParams);
};

export const removeDeprecatedProps = (props: any) => {
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

const lambdaTriggers = async (coreAnswers: any, context: any, previouslySaved: any) => {
  const { handleTriggers } = require('./trigger-flow-auth-helper');
  let triggerKeyValues = {};
  let authTriggerConnections: AuthTriggerConnection[];
  if (coreAnswers.triggers) {
    const triggerConfig: AuthTriggerConfig = await handleTriggers(context, coreAnswers, previouslySaved);
    triggerKeyValues = triggerConfig.triggers;
    authTriggerConnections = triggerConfig.authTriggerConnections;
    coreAnswers.triggers = triggerKeyValues ? JSONUtilities.stringify(triggerKeyValues) : '{}';

    if (FeatureFlags.getBoolean('auth.breakCircularDependency')) {
      if (Array.isArray(authTriggerConnections) && authTriggerConnections.length > 0) {
        coreAnswers.authTriggerConnections = JSONUtilities.stringify(authTriggerConnections);
      } else {
        delete coreAnswers.authTriggerConnections;
      }
    }
    coreAnswers.breakCircularDependency = FeatureFlags.getBoolean('auth.breakCircularDependency');
    if (triggerKeyValues) {
      coreAnswers.parentStack = { Ref: 'AWS::StackId' };
    }

    // determine permissions needed for each trigger module
    coreAnswers.permissions = await context.amplify.getTriggerPermissions(context, coreAnswers.triggers, 'auth', coreAnswers.resourceName);
  } else if (previouslySaved) {
    const targetDir = pathManager.getBackendDirPath();
    Object.keys(previouslySaved).forEach(p => {
      delete coreAnswers[p];
    });
    await context.amplify.deleteAllTriggers(previouslySaved, coreAnswers.resourceName, targetDir, context);
  }
  // remove unused coreAnswers.triggers key
  if (coreAnswers.triggers && coreAnswers.triggers === '[]') {
    delete coreAnswers.triggers;
  }

  // handle dependsOn data
  const dependsOnKeys = Object.keys(triggerKeyValues).map(i => `${coreAnswers.resourceName}${i}`);
  coreAnswers.dependsOn = context.amplify.dependsOnBlock(context, dependsOnKeys, 'Cognito');
};

const createUserPoolGroups = async (context: any, resourceName: string, userPoolGroupList?: string[]) => {
  if (userPoolGroupList && userPoolGroupList.length > 0) {
    const userPoolGroupPrecedenceList = [];

    for (let i = 0; i < userPoolGroupList.length; i += 1) {
      userPoolGroupPrecedenceList.push({
        groupName: userPoolGroupList[i],
        precedence: i + 1,
      });
    }

    const userPoolGroupFile = path.join(pathManager.getBackendDirPath(), 'auth', 'userPoolGroups', 'user-pool-group-precedence.json');

    const userPoolGroupParams = path.join(pathManager.getBackendDirPath(), 'auth', 'userPoolGroups', 'parameters.json');

    /* eslint-disable */
    const groupParams = {
      AuthRoleArn: {
        'Fn::GetAtt': ['AuthRole', 'Arn'],
      },
      UnauthRoleArn: {
        'Fn::GetAtt': ['UnauthRole', 'Arn'],
      },
    };
    /* eslint-enable */

    JSONUtilities.writeJson(userPoolGroupParams, groupParams);
    JSONUtilities.writeJson(userPoolGroupFile, userPoolGroupPrecedenceList);

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

const updateUserPoolGroups = async (context: any, resourceName: string, userPoolGroupList?: string[]) => {
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

    outputFileSync(userPoolGroupFile, JSON.stringify(userPoolGroupPrecedenceList, null, 4));

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

const addAdminAuth = async (
  context: any,
  authResourceName: string,
  operation: 'update' | 'add',
  adminGroup?: string,
  functionName?: string,
) => {
  if (adminGroup) {
    if (!functionName) {
      const [shortId] = uuid().split('-');
      functionName = `AdminQueries${shortId}`;
    }
    await createAdminAuthFunction(context, authResourceName, functionName, adminGroup, operation);
    await createAdminAuthAPI(context, authResourceName, functionName, operation);
  }
};

const createAdminAuthFunction = async (
  context: any,
  authResourceName: string,
  functionName: string,
  adminGroup: string,
  operation: 'update' | 'add',
) => {
  const targetDir = path.join(pathManager.getBackendDirPath(), 'function', functionName);
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
      dir: adminAuthAssetRoot,
      template: 'admin-auth-app.js',
      target: path.join(targetDir, 'src/app.js'),
    },
    {
      dir: adminAuthAssetRoot,
      template: 'admin-auth-cognitoActions.js',
      target: path.join(targetDir, 'src/cognitoActions.js'),
    },
    {
      dir: adminAuthAssetRoot,
      template: 'admin-auth-index.js',
      target: path.join(targetDir, 'src/index.js'),
    },
    {
      dir: adminAuthAssetRoot,
      template: 'admin-auth-package.json',
      target: path.join(targetDir, 'src/package.json'),
    },
    {
      dir: adminAuthAssetRoot,
      template: 'admin-queries-function-template.json.ejs',
      target: path.join(targetDir, `${functionName}-cloudformation-template.json`),
    },
  ];

  // copy over the files
  await context.amplify.copyBatch(context, copyJobs, functionProps, true);

  if (operation === 'add') {
    // add amplify-meta and backend-config
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

const createAdminAuthAPI = async (context: any, authResourceName: string, functionName: string, operation: 'update' | 'add') => {
  const apiName = 'AdminQueries';
  const targetDir = path.join(pathManager.getBackendDirPath(), 'api', apiName);
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
      dir: adminAuthAssetRoot,
      template: 'admin-queries-api-template.json.ejs',
      target: path.join(targetDir, 'admin-queries-cloudformation-template.json'),
    },
    {
      dir: adminAuthAssetRoot,
      template: 'admin-queries-api-params.json',
      target: path.join(targetDir, 'parameters.json'),
    },
  ];

  // copy over the files
  await context.amplify.copyBatch(context, copyJobs, apiProps, true);

  if (operation === 'add') {
    // Update amplify-meta and backend-config
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

const copyS3Assets = async (request: ServiceQuestionsResult) => {
  const targetDir = path.join(pathManager.getBackendDirPath(), 'auth', request.resourceName!, 'assets');
  const triggers = request.triggers ? JSONUtilities.parse<any>(request.triggers) : null;
  const confirmationFileNeeded = request.triggers && triggers.CustomMessage && triggers.CustomMessage.includes('verification-link');
  if (confirmationFileNeeded) {
    if (!existsSync(targetDir)) {
      const source = path.join(triggerRoot, 'CustomMessage/assets');
      copySync(source, targetDir);
    }
  }
};
