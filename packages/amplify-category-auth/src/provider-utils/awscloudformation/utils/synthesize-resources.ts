import {
  $TSAny,
  $TSContext,
  $TSObject,
  AmplifyCategories,
  AmplifySupportedService,
  FeatureFlags,
  JSONUtilities,
  pathManager,
  stateManager,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { copySync, ensureDirSync, existsSync } from 'fs-extra';
import { get } from 'lodash';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { UserPoolGroupMetadata } from '../auth-stack-builder/user-pool-group-stack-transform';
import {
  adminAuthAssetRoot, cfnTemplateRoot, privateKeys, triggerRoot,
} from '../constants';
import { CognitoConfiguration } from '../service-walkthrough-types/awsCognito-user-input-types';
import { AuthTriggerConfig, AuthTriggerConnection } from '../service-walkthrough-types/cognito-user-input-types';
import { generateUserPoolGroupStackTemplate } from './generate-user-pool-group-stack-template';

/**
 * Factory function that returns a function that synthesizes all resources based on a CognitoCLIInputs request.
 * The function returns the request unchanged to enable .then() chaining
 * @param context The amplify context
 * @param request The Cognito configuration request
 */
// eslint-disable-next-line max-len
export const getResourceSynthesizer = async (context: $TSContext, request: Readonly<CognitoConfiguration>): Promise<CognitoConfiguration> => {
  await lambdaTriggers(request, context, null);
  // transformation handled in api and functions.
  await addAdminAuth(context, request.resourceName!, 'add', request.adminQueryGroup);
  // copy custom-message trigger files in to S3
  await copyS3Assets(request);
  return request;
};

/**
 * Factory function that returns a function that updates the auth resource based on a CognitoCLIInputs request.
 * The function returns the request unchanged to enable .then() chaining
 *
 * The code is more-or-less refactored as-is from the existing update logic
 * @param context The amplify context
 * @param request The Cognito configuration request
 */
export const getResourceUpdater = async (context: $TSContext, request: Readonly<CognitoConfiguration>): Promise<CognitoConfiguration> => {
  const resources = context.amplify.getProjectMeta();

  const adminQueriesFunctionName = get<{ category: string; resourceName: string }[]>(resources, ['api', 'AdminQueries', 'dependsOn'], [])
    .filter(resource => resource.category === AmplifyCategories.FUNCTION)
    .map(resource => resource.resourceName)
    .find(resourceName => resourceName.includes('AdminQueries'));
  if (adminQueriesFunctionName) {
    await addAdminAuth(context, request.resourceName!, 'update', request.adminQueryGroup, adminQueriesFunctionName);
  } else {
    await addAdminAuth(context, request.resourceName!, 'add', request.adminQueryGroup);
  }

  const providerPlugin = context.amplify.getPluginInstance(context, 'awscloudformation');
  const previouslySaved = JSON.parse(providerPlugin.loadResourceParameters(context, 'auth', request.resourceName)?.triggers || '{}');

  await lambdaTriggers(request, context, previouslySaved);

  await copyS3Assets(request);
  return request;
};

/**
 * The 3 functions below should not be exported, but they are for now because externalAuthEnable still uses them individually
 */
export const copyCfnTemplate = async (context: $TSContext, category: string, options: $TSObject, cfnFilename: string): Promise<$TSAny> => {
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

  const privateParams = { ...options };
  privateKeys.forEach(p => delete privateParams[p]);

  return context.amplify.copyBatch(context, copyJobs, privateParams, true);
};

/**
 * save auth resource parameters
 */
export const saveResourceParameters = (
  context: $TSContext,
  providerName: string,
  category: string,
  resource: string,
  params: $TSObject,
  envSpecificParams: $TSAny[] = [],
): void => {
  const provider = context.amplify.getPluginInstance(context, providerName);
  let privateParams = { ...params };
  privateKeys.forEach(p => delete privateParams[p]);
  privateParams = removeDeprecatedProps(privateParams);
  provider.saveResourceParameters(context, category, resource, privateParams, envSpecificParams);
};

/**
 * removes extra parameters from auth cfn
 */
export const removeDeprecatedProps = (props: $TSObject): $TSObject => {
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
  // eslint-disable-next-line no-param-reassign
  ].forEach(deprecatedField => delete props[deprecatedField]);
  return props;
};

const lambdaTriggers = async (coreAnswers: $TSObject, context: $TSContext, previouslySaved: $TSAny): Promise<void> => {
  const { handleTriggers } = await import('./trigger-flow-auth-helper');
  let triggerKeyValues = {};
  let authTriggerConnections: AuthTriggerConnection[];
  if (coreAnswers.triggers) {
    const triggerConfig = (await handleTriggers(context, coreAnswers, previouslySaved)) as AuthTriggerConfig;
    triggerKeyValues = triggerConfig.triggers;
    authTriggerConnections = triggerConfig.authTriggerConnections;

    // eslint-disable-next-line no-param-reassign
    coreAnswers.triggers = triggerKeyValues ? JSONUtilities.stringify(triggerKeyValues) : '{}';

    if (FeatureFlags.getBoolean('auth.breakCircularDependency')) {
      if (Array.isArray(authTriggerConnections) && authTriggerConnections.length > 0) {
        // eslint-disable-next-line no-param-reassign
        coreAnswers.authTriggerConnections = JSONUtilities.stringify(authTriggerConnections);
      } else {
        // eslint-disable-next-line no-param-reassign
        delete coreAnswers.authTriggerConnections;
      }
    }
    // eslint-disable-next-line no-param-reassign
    coreAnswers.breakCircularDependency = FeatureFlags.getBoolean('auth.breakCircularDependency');
    if (triggerKeyValues) {
      // eslint-disable-next-line no-param-reassign
      coreAnswers.parentStack = { Ref: 'AWS::StackId' };
    }

    // determine permissions needed for each trigger module
    // eslint-disable-next-line no-param-reassign
    coreAnswers.permissions = await context.amplify.getTriggerPermissions(
      context,
      coreAnswers.triggers,
      AmplifyCategories.AUTH,
      coreAnswers.resourceName,
    );
  } else if (previouslySaved) {
    const targetDir = pathManager.getBackendDirPath();
    Object.keys(previouslySaved).forEach(p => {
      // eslint-disable-next-line no-param-reassign
      delete coreAnswers[p];
    });
    await context.amplify.deleteAllTriggers(previouslySaved, coreAnswers.resourceName, targetDir, context);
  }
  // remove unused coreAnswers.triggers key
  if (coreAnswers.triggers && coreAnswers.triggers === '[]') {
    // eslint-disable-next-line no-param-reassign
    delete coreAnswers.triggers;
  }

  // handle dependsOn data
  const dependsOnKeys = Object.keys(triggerKeyValues).map(i => `${coreAnswers.resourceName}${i}`);
  // eslint-disable-next-line no-param-reassign
  coreAnswers.dependsOn = context.amplify.dependsOnBlock(context, dependsOnKeys, 'Cognito');
};

/**
 * Creates Userpool groups
 */
export const createUserPoolGroups = async (context: $TSContext, resourceName: string, userPoolGroupList?: string[]): Promise<void> => {
  if (userPoolGroupList && userPoolGroupList.length > 0) {
    const userPoolGroupPrecedenceList = [];

    for (let i = 0; i < userPoolGroupList.length; ++i) {
      userPoolGroupPrecedenceList.push({
        groupName: userPoolGroupList[i],
        precedence: i + 1,
      });
    }

    const userPoolGroupFile = path.join(
      pathManager.getBackendDirPath(),
      AmplifyCategories.AUTH,
      'userPoolGroups',
      'user-pool-group-precedence.json',
    );

    const userPoolGroupParams = path.join(
      pathManager.getBackendDirPath(),
      AmplifyCategories.AUTH,
      'userPoolGroups',
      'build',
      'parameters.json',
    );

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

    context.amplify.updateamplifyMetaAfterResourceAdd(AmplifyCategories.AUTH, 'userPoolGroups', {
      service: 'Cognito-UserPool-Groups',
      providerPlugin: 'awscloudformation',
      dependsOn: [
        {
          category: AmplifyCategories.AUTH,
          resourceName,
          attributes: ['UserPoolId', 'AppClientIDWeb', 'AppClientID', 'IdentityPoolId'],
        },
      ],
    });
    // create CFN
    await generateUserPoolGroupStackTemplate(context, resourceName);
  }
};

/**
 * Updates UserPool Groups
 */
export const updateUserPoolGroups = async (context: $TSContext, resourceName: string, userPoolGroupList?: string[]): Promise<void> => {
  if (userPoolGroupList && userPoolGroupList.length > 0) {
    const userPoolGroupFolder = path.join(pathManager.getBackendDirPath(), AmplifyCategories.AUTH, 'userPoolGroups');
    const prevUserPoolGroupPrecedenceList = JSONUtilities.readJson<UserPoolGroupMetadata[]>(path.join(userPoolGroupFolder, 'user-pool-group-precedence.json'), { throwIfNotExist: false }) ?? [];
    const currentUserPoolGroupPrecedenceList = userPoolGroupList.map((groupName: string, index: number) => ({
      groupName,
      precedence: index + 1,
    }));
    // underlying logic takes previous user-pool precedece files object (amplifygenerated/ Cx overided)
    // and updates with new settings keeping custom policies intact
    const updatedUserPoolGroupList: UserPoolGroupMetadata[] = [];
    currentUserPoolGroupPrecedenceList.forEach(group1 => {
      let newGroup = group1;
      prevUserPoolGroupPrecedenceList.forEach(group2 => {
        const oldGroup = group2;
        if (newGroup.groupName === oldGroup.groupName) {
          newGroup = { ...oldGroup, ...newGroup };
        }
      });
      updatedUserPoolGroupList.push(newGroup);
    });

    ensureDirSync(userPoolGroupFolder);
    JSONUtilities.writeJson(path.join(userPoolGroupFolder, 'user-pool-group-precedence.json'), updatedUserPoolGroupList);

    context.amplify.updateamplifyMetaAfterResourceUpdate(AmplifyCategories.AUTH, 'userPoolGroups', 'service', 'Cognito-UserPool-Groups');
    context.amplify.updateamplifyMetaAfterResourceUpdate(AmplifyCategories.AUTH, 'userPoolGroups', 'providerPlugin', 'awscloudformation');

    const authInputs = stateManager.getResourceInputsJson(undefined, AmplifyCategories.AUTH, resourceName);
    const attributes = ['UserPoolId', 'AppClientIDWeb', 'AppClientID'];
    if (authInputs?.cognitoConfig?.identityPoolName) {
      attributes.push('IdentityPoolId');
    }
    context.amplify.updateamplifyMetaAfterResourceUpdate(AmplifyCategories.AUTH, 'userPoolGroups', 'dependsOn', [
      {
        category: AmplifyCategories.AUTH,
        resourceName,
        attributes,
      },
    ]);

    // generate template
    await generateUserPoolGroupStackTemplate(context, resourceName);
  }
};

const addAdminAuth = async (
  context: $TSContext,
  authResourceName: string,
  operation: 'update' | 'add',
  adminGroup?: string,
  functionName?: string,
): Promise<void> => {
  if (adminGroup) {
    if (!functionName) {
      const [shortId] = uuid().split('-');
      // eslint-disable-next-line no-param-reassign
      functionName = `AdminQueries${shortId}`;
    }
    await createAdminAuthFunction(context, authResourceName, functionName, adminGroup, operation);
    await createAdminAuthAPI(context, authResourceName, functionName, operation);
  }
};

export const createAdminAuthFunction = async (
  context: $TSContext,
  authResourceName: string,
  functionName: string,
  adminGroup: string,
  operation: 'update' | 'add',
): Promise<void> => {
  const targetDir = path.join(pathManager.getBackendDirPath(), AmplifyCategories.FUNCTION, functionName);
  let lambdaGroupVar = adminGroup;

  const dependsOn = [];

  dependsOn.push({
    category: AmplifyCategories.AUTH,
    resourceName: authResourceName,
    attributes: ['UserPoolId'],
  });

  if (!lambdaGroupVar) {
    lambdaGroupVar = 'NONE';
  }

  if (operation === 'add') {
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

    // add amplify-meta and backend-config
    const backendConfigs = {
      service: AmplifySupportedService.LAMBDA,
      providerPlugin: 'awscloudformation',
      build: true,
      dependsOn,
    };

    await context.amplify.updateamplifyMetaAfterResourceAdd(AmplifyCategories.FUNCTION, functionName, backendConfigs);
    printer.success(`Successfully added ${functionName} function locally`);
  } else {
    printer.success(`Successfully updated ${functionName} function locally`);
  }
};

const createAdminAuthAPI = async (context: $TSContext, authResourceName: string, functionName: string, operation: 'update' | 'add'): Promise<void> => {
  const apiName = 'AdminQueries';
  const dependsOn = [
    {
      category: AmplifyCategories.AUTH,
      resourceName: authResourceName,
      attributes: ['UserPoolId'],
    },
    {
      category: AmplifyCategories.FUNCTION,
      resourceName: functionName,
      attributes: ['Arn', 'Name'],
    },
  ];

  const apiProps = {
    apiName,
    functionName,
    authResourceName,
    dependsOn,
  };

  if (operation === 'add') {
    await context.amplify.invokePluginMethod(context, AmplifyCategories.API, undefined, 'addAdminQueriesApi', [context, apiProps]);
    printer.success(`Successfully added ${apiName} API locally`);
  } else {
    await context.amplify.invokePluginMethod(context, AmplifyCategories.API, undefined, 'updateAdminQueriesApi', [context, apiProps]);
    printer.success(`Successfully updated ${apiName} API locally`);
  }
};

const copyS3Assets = async (request: CognitoConfiguration): Promise<void> => {
  const targetDir = path.join(pathManager.getBackendDirPath(), AmplifyCategories.AUTH, request.resourceName!, 'assets');
  const triggers = request.triggers ? JSONUtilities.parse<$TSAny>(request.triggers) : null;
  const confirmationFileNeeded = request.triggers && triggers.CustomMessage && triggers.CustomMessage.includes('verification-link');
  if (confirmationFileNeeded) {
    if (!existsSync(targetDir)) {
      const source = path.join(triggerRoot, 'CustomMessage/assets');
      copySync(source, targetDir);
    }
  }
};
