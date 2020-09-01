import { ServiceQuestionsResult } from '../service-walkthrough-types';
import path from 'path';
import fs, { existsSync, copySync } from 'fs-extra';
import uuid from 'uuid';
import { cfnTemplateRoot, privateKeys, adminAuthAssetRoot, triggerRoot, ENV_SPECIFIC_PARAMS } from '../constants';
import { ServiceName as FunctionServiceName } from 'amplify-category-function';

const category = 'auth';

/**
 * Factory function that returns a function that synthesizes all resources based on a ServiceQuestionsResult request.
 * The function returns the request unchanged to enable .then() chaining
 * @param context The amplify context
 * @param cfnFilename The template cfnFilename
 * @param provider The cloud provider name
 */
export const getResourceSynthesizer = (context: any, cfnFilename: string, provider: string) => async (
  request: Readonly<ServiceQuestionsResult>,
) => {
  await lambdaTriggers(request, context, null);
  await createUserPoolGroups(context, request.resourceName, request.userPoolGroupList);
  await addAdminAuth(context, request.resourceName!, 'add', request.adminQueryGroup);
  await copyCfnTemplate(context, category, request, cfnFilename);
  saveResourceParameters(context, provider, category, request.resourceName!, request, ENV_SPECIFIC_PARAMS);
  await copyS3Assets(context, request);
  return request;
};

/**
 * The functions below should not be exported, but they are for now because the update flow still uses them individually
 * Once the update flow is also refactored, they will be internal to this file
 *
 * They are refactored with minimal modification from awscloudformation/indes.js
 */

export const lambdaTriggers = async (coreAnswers: any, context: any, previouslySaved: any) => {
  const { handleTriggers } = require('./trigger-flow-auth-helper');
  let triggerKeyValues = {};

  if (coreAnswers.triggers) {
    triggerKeyValues = await handleTriggers(context, coreAnswers, previouslySaved);
    coreAnswers.triggers = triggerKeyValues ? JSON.stringify(triggerKeyValues) : '{}';

    if (triggerKeyValues) {
      coreAnswers.parentStack = { Ref: 'AWS::StackId' };
    }

    // determine permissions needed for each trigger module
    coreAnswers.permissions = await context.amplify.getTriggerPermissions(context, coreAnswers.triggers, 'auth', coreAnswers.resourceName);
  } else if (previouslySaved) {
    const targetDir = context.amplify.pathManager.getBackendDirPath();
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

export const createUserPoolGroups = async (context: any, resourceName: any, userPoolGroupList: any) => {
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

    const userPoolGroupParams = path.join(context.amplify.pathManager.getBackendDirPath(), 'auth', 'userPoolGroups', 'parameters.json');

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

    fs.outputFileSync(userPoolGroupParams, JSON.stringify(groupParams, null, 4));
    fs.outputFileSync(userPoolGroupFile, JSON.stringify(userPoolGroupPrecedenceList, null, 4));

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

export const addAdminAuth = async (
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

export const createAdminAuthFunction = async (
  context: any,
  authResourceName: string,
  functionName: string,
  adminGroup: string,
  operation: 'update' | 'add',
) => {
  const targetDir = context.amplify.pathManager.getBackendDirPath();
  const pluginDir = __dirname;
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
      target: `${targetDir}/function/${functionName}/src/app.js`,
    },
    {
      dir: adminAuthAssetRoot,
      template: 'admin-auth-cognitoActions.js',
      target: `${targetDir}/function/${functionName}/src/cognitoActions.js`,
    },
    {
      dir: adminAuthAssetRoot,
      template: 'admin-auth-index.js',
      target: `${targetDir}/function/${functionName}/src/index.js`,
    },
    {
      dir: adminAuthAssetRoot,
      template: 'admin-auth-package.json',
      target: `${targetDir}/function/${functionName}/src/package.json`,
    },
    {
      dir: adminAuthAssetRoot,
      template: 'admin-queries-function-template.json.ejs',
      target: `${targetDir}/function/${functionName}/${functionName}-cloudformation-template.json`,
    },
  ];

  // copy over the files
  await context.amplify.copyBatch(context, copyJobs, functionProps, true);

  if (operation === 'add') {
    // add amplify-meta and backend-config
    const backendConfigs = {
      service: FunctionServiceName.LambdaFunction,
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

export const createAdminAuthAPI = async (context: any, authResourceName: string, functionName: string, operation: 'update' | 'add') => {
  const targetDir = context.amplify.pathManager.getBackendDirPath();
  const pluginDir = __dirname;
  const apiName = 'AdminQueries';
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
      target: `${targetDir}/api/${apiName}/admin-queries-cloudformation-template.json`,
    },
    {
      dir: adminAuthAssetRoot,
      template: 'admin-queries-api-params.json',
      target: `${targetDir}/api/${apiName}/parameters.json`,
    },
  ];

  // copy over the files
  await context.amplify.copyBatch(context, copyJobs, apiProps, true);

  if (operation === 'add') {
    // Update amplify-meta and backend-config
    const backendConfigs = {
      service: 'API Gateway',
      providerPlugin: 'awscloudformation',
      dependsOn,
    };

    await context.amplify.updateamplifyMetaAfterResourceAdd('api', apiName, backendConfigs);
    context.print.success(`Successfully added ${apiName} API locally`);
  } else {
    context.print.success(`Successfully updated ${apiName} API locally`);
  }
};

export const copyCfnTemplate = async (context: any, category: string, options: any, cfnFilename: string) => {
  const { amplify } = context;
  const targetDir = amplify.pathManager.getBackendDirPath();

  const copyJobs = [
    {
      dir: cfnTemplateRoot,
      template: cfnFilename,
      target: `${targetDir}/${category}/${options.resourceName}/${options.resourceName}-cloudformation-template.yml`,
      paramsFile: `${targetDir}/${category}/${options.resourceName}/parameters.json`,
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

export const copyS3Assets = async (context: any, props: any) => {
  const targetDir = `${context.amplify.pathManager.getBackendDirPath()}/auth/${props.resourceName}/assets`;

  const triggers = props.triggers ? JSON.parse(props.triggers) : null;
  const confirmationFileNeeded = props.triggers && triggers.CustomMessage && triggers.CustomMessage.includes('verification-link');
  if (confirmationFileNeeded) {
    if (!existsSync(targetDir)) {
      const source = path.join(triggerRoot, 'CustomMessage/assets');
      copySync(source, targetDir);
    }
  }
};
