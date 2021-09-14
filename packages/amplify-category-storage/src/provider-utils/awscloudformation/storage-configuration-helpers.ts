import {
  $TSAny,
  $TSContext,
  $TSMeta,
  $TSObject,
  isResourceNameUnique,
  JSONUtilities,
  pathManager,
  readCFNTemplate,
  ResourceDoesNotExistError,
  stateManager,
  writeCFNTemplate,
} from 'amplify-cli-core';
import { AddStorageRequest, CrudOperation, UpdateStorageRequest } from 'amplify-headless-interface';
import { prompter, printer } from 'amplify-prompts';
import * as fs from 'fs-extra';
import _ from 'lodash';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { authCategoryName, categoryName, functionCategoryName } from '../../constants';
import {
  FunctionServiceNameLambdaFunction,
  providerName,
  ServiceName,
  storageParamsFilename,
  templateFilenameMap,
} from './provider-constants';
import { getAllDefaults } from './default-values/s3-defaults';

const enum S3IamPolicy {
  GET = 's3:GetBucket',
  PUT = 's3:PutObject',
  LIST = 's3:ListBucket',
  DELETE = 's3:DeleteObject',
}

const headlessCrudOperationToIamPoliciesMap = {
  [CrudOperation.CREATE_AND_UPDATE]: [S3IamPolicy.PUT],
  [CrudOperation.READ]: [S3IamPolicy.GET, S3IamPolicy.LIST],
  [CrudOperation.DELETE]: [S3IamPolicy.DELETE],
};

const replaceAndWithSlash = (crudOperation: CrudOperation) => crudOperation.replace('_AND_', '/').toLowerCase();

const convertHeadlessPayloadToParameters = (arr: string[], op: CrudOperation) => arr.concat(headlessCrudOperationToIamPoliciesMap[op]);

export async function headlessAddStorage(context: $TSContext, storageRequest: AddStorageRequest) {
  if (!checkIfAuthExists()) {
    throw new Error('Cannot headlessly add storage resource without an existing auth resource. It can be added with "amplify add auth"');
  }

  if (storageRequest.serviceConfiguration.serviceName === ServiceName.S3) {
    const meta = stateManager.getMeta();

    if (storageRequest.serviceConfiguration.permissions.groups && !doUserPoolGroupsExist(meta)) {
      const error = new Error('No user pool groups found in amplify-meta.json.');
      await context.usageData.emitError(error);
      throw error;
    }

    await createS3StorageArtifacts(context, storageRequest);
  } else if (storageRequest.serviceConfiguration.serviceName === ServiceName.DynamoDB) {
    throw new Error('Headless support for DynamoDB resources is not yet implemented.');
  }
}

export async function headlessUpdateStorage(context: $TSContext, storageRequest: UpdateStorageRequest) {
  if (storageRequest.serviceConfiguration.serviceName === ServiceName.S3) {
    const {
      serviceConfiguration: { permissions, resourceName },
    } = storageRequest;

    const meta = stateManager.getMeta();
    const storageResource = meta[categoryName][resourceName];

    if (!storageResource || storageResource.service !== ServiceName.S3) {
      const error = new ResourceDoesNotExistError(`No S3 resource '${resourceName}' found in amplify-meta.json.`);
      await context.usageData.emitError(error);
      throw error;
    }

    if (storageResource.mobileHubMigrated === true) {
      const error = new ResourceDoesNotExistError(`Updating storage resources migrated from mobile hub is not supported.`);
      await context.usageData.emitError(error);
      throw error;
    }

    if (storageResource.serviceType === 'imported') {
      const error = new Error('Updating an imported storage resource is not supported.');
      await context.usageData.emitError(error);
      throw error;
    }

    if (permissions.groups && !doUserPoolGroupsExist(meta)) {
      const error = new Error('No user pool groups found in amplify-meta.json.');
      await context.usageData.emitError(error);
      throw error;
    }

    await updateS3StorageArtifacts(context, storageRequest, storageResource);
  } else if (storageRequest.serviceConfiguration.serviceName === ServiceName.DynamoDB) {
    throw new Error('Headless support for DynamoDB resources is not yet implemented.');
  }
}

async function createS3StorageArtifacts(context: $TSContext, storageRequest: AddStorageRequest) {
  const {
    serviceConfiguration: { bucketName, permissions, resourceName, lambdaTrigger },
  } = storageRequest;

  if (isResourceNameUnique(categoryName, resourceName)) {
    const resourceDirPath = pathManager.getResourceDirectoryPath(undefined, categoryName, resourceName);
    fs.ensureDirSync(resourceDirPath);

    // create parameters.json
    let parameters = getAllDefaults(context.amplify.getProjectDetails());
    parameters.bucketName = bucketName;
    parameters.resourceName = resourceName;
    parameters.triggerFunction = lambdaTrigger?.name ?? 'NONE';

    parameters.selectedAuthenticatedPermissions = permissions.auth.reduce(convertHeadlessPayloadToParameters, []);
    parameters.selectedGuestPermissions = (permissions.guest || []).reduce(convertHeadlessPayloadToParameters, []);

    const isGuestAllowedAccess = (permissions?.guest?.length || 0) > 0;
    parameters.storageAccess = isGuestAllowedAccess ? 'authAndGuest' : authCategoryName;
    createPermissionKeys('Authenticated', parameters, []);
    if (isGuestAllowedAccess) {
      createPermissionKeys('Guest', parameters, []);
    }

    removeNotStoredParameters(parameters);
    stateManager.setResourceParametersJson(undefined, categoryName, resourceName, parameters);

    // create storage-params.json
    const storageParamsPermissions: { [k: string]: string[] } = {};
    Object.entries(permissions.groups || {}).forEach(([cognitoUserGroupName, crudOperations]: [string, CrudOperation[]]) => {
      storageParamsPermissions[cognitoUserGroupName] = crudOperations.map(replaceAndWithSlash);
    });
    writeToStorageParamsFile(resourceName, { groupPermissionMap: storageParamsPermissions });

    // construct dependsOn array
    let dependsOn: $TSAny[] = [];

    if (storageRequest.serviceConfiguration.permissions.groups) {
      dependsOn.push({
        category: authCategoryName,
        resourceName: await getAuthResourceName(context),
        attributes: ['UserPoolId'],
      });

      for (const group of Object.keys(storageRequest.serviceConfiguration.permissions.groups)) {
        dependsOn.push({
          category: authCategoryName,
          resourceName: 'userPoolGroups',
          attributes: [`${group}GroupRole`],
        });
      }
    }

    if (storageRequest.serviceConfiguration?.lambdaTrigger) {
      const options = { headlessTrigger: storageRequest.serviceConfiguration.lambdaTrigger, dependsOn };
      await addTrigger(context, parameters.resourceName, undefined, undefined, options);
    }

    // create cfn
    await copyCfnTemplate(context, categoryName, resourceName, { ...parameters, dependsOn });

    // update meta
    context.amplify.updateamplifyMetaAfterResourceAdd(categoryName, resourceName, {
      service: ServiceName.S3,
      providerPlugin: providerName,
      dependsOn,
    });
  }
}

async function updateS3StorageArtifacts(context: $TSContext, storageRequest: UpdateStorageRequest, storageResource: $TSAny) {
  const {
    serviceConfiguration: { permissions, resourceName, lambdaTrigger },
  } = storageRequest;

  const { dependsOn } = storageResource;
  // TODO - get trigger name from dependsOn and remove trigger before potentially adding a new one
  // removeTrigger(context, resourceName, )
}

function doUserPoolGroupsExist(meta: $TSMeta) {
  const { userPoolGroups } = meta[authCategoryName];
  return userPoolGroups && userPoolGroups.service === 'Cognito-UserPool-Groups';
}

export const checkIfAuthExists = () => {
  const amplifyMeta = stateManager.getMeta();
  let authExists = false;
  const authServiceName = 'Cognito';
  const authCategory = authCategoryName;

  if (amplifyMeta[authCategory] && Object.keys(amplifyMeta[authCategory]).length > 0) {
    const categoryResources = amplifyMeta[authCategory];

    Object.keys(categoryResources).forEach(resource => {
      if (categoryResources[resource].service === authServiceName) {
        authExists = true;
      }
    });
  }

  return authExists;
};

export async function getAuthResourceName(context: $TSContext) {
  let authResources = (await context.amplify.getResourceStatus(authCategoryName)).allResources;

  authResources = authResources.filter((resource: $TSAny) => resource.service === 'Cognito');

  if (authResources.length === 0) {
    throw new Error('No auth resource found. Please add it using amplify add auth');
  }

  return authResources[0].resourceName;
}

export async function removeTrigger(context: $TSContext, resourceName: string, triggerFunctionName: string) {
  // Update Cloudformtion file
  const projectRoot = pathManager.findProjectRoot();
  const resourceDirPath = pathManager.getResourceDirectoryPath(projectRoot, categoryName, resourceName);
  const storageCFNFilePath = path.join(resourceDirPath, 's3-cloudformation-template.json');
  const { cfnTemplate: storageCFNFile }: { cfnTemplate: $TSAny } = await readCFNTemplate(storageCFNFilePath);
  const bucketParameters = stateManager.getResourceParametersJson(projectRoot, categoryName, resourceName);
  const adminTrigger = bucketParameters.adminTriggerFunction;

  delete storageCFNFile.Parameters[`function${triggerFunctionName}Arn`];
  delete storageCFNFile.Parameters[`function${triggerFunctionName}Name`];
  delete storageCFNFile.Parameters[`function${triggerFunctionName}LambdaExecutionRole`];
  delete storageCFNFile.Resources.TriggerPermissions;

  if (!adminTrigger) {
    // Remove reference for old triggerFunctionName
    delete storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration;
    delete storageCFNFile.Resources.S3TriggerBucketPolicy;
    delete storageCFNFile.Resources.S3Bucket.DependsOn;
  } else {
    const lambdaConfigurations: $TSAny = [];

    storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration.LambdaConfigurations.forEach((triggers: $TSAny) => {
      if (
        triggers.Filter &&
        typeof triggers.Filter.S3Key.Rules[0].Value === 'string' &&
        triggers.Filter.S3Key.Rules[0].Value.includes('index-faces')
      ) {
        lambdaConfigurations.push(triggers);
      }
    });

    storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration.LambdaConfigurations = lambdaConfigurations;

    const index = storageCFNFile.Resources.S3Bucket.DependsOn.indexOf('TriggerPermissions');

    if (index > -1) {
      storageCFNFile.Resources.S3Bucket.DependsOn.splice(index, 1);
    }

    const roles: $TSAny[] = [];

    storageCFNFile.Resources.S3TriggerBucketPolicy.Properties.Roles.forEach((role: $TSAny) => {
      if (!role.Ref.includes(triggerFunctionName)) {
        roles.push(role);
      }
    });

    storageCFNFile.Resources.S3TriggerBucketPolicy.Properties.Roles = roles;
  }

  await writeCFNTemplate(storageCFNFile, storageCFNFilePath);

  const meta = stateManager.getMeta(projectRoot);
  const s3DependsOnResources = meta.storage[resourceName].dependsOn;
  const s3Resources: $TSAny[] = [];

  s3DependsOnResources.forEach((resource: $TSAny) => {
    if (resource.resourceName !== triggerFunctionName) {
      s3Resources.push(resource);
    }
  });

  context.amplify.updateamplifyMetaAfterResourceUpdate(categoryName, resourceName, 'dependsOn', s3Resources);
}

export function removeNotStoredParameters(defaults: $TSAny) {
  delete defaults.resourceName;
  delete defaults.storageAccess;
  delete defaults.groupPolicyMap;
  delete defaults.groupList;
  delete defaults.authResourceName;
}

export async function loadDefaults(context: $TSContext) {
  return getAllDefaults(context.amplify.getProjectDetails()) as $TSAny;
}

export function readStorageParamsFileSafe(resourceName: string) {
  return JSONUtilities.readJson<$TSObject>(getStorageParamsFilePath(resourceName), { throwIfNotExist: false }) || {};
}

export function writeToStorageParamsFile(resourceName: string, storageParams: $TSAny) {
  JSONUtilities.writeJson(getStorageParamsFilePath(resourceName), storageParams);
}

export function createPermissionKeys(userType: string, parameters: $TSAny, selectedPermissions: string[]) {
  const [policyId] = uuid().split('-');

  // max arrays represent highest possibly privileges for particular S3 keys
  const maxPermissions = ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'];
  const maxPublic = maxPermissions;
  const maxUploads = ['s3:PutObject'];
  const maxPrivate = userType === 'Authenticated' ? maxPermissions : [];
  const maxProtected = userType === 'Authenticated' ? maxPermissions : ['s3:GetObject'];

  function addPermissionKeys(key: string, possiblePermissions: string[]) {
    const permissions = _.intersection(selectedPermissions, possiblePermissions).join();

    parameters[`s3Permissions${userType}${key}`] = !permissions ? 'DISALLOW' : permissions;
    parameters[`s3${key}Policy`] = `${key}_policy_${policyId}`;
  }

  addPermissionKeys('Public', maxPublic);
  addPermissionKeys('Uploads', maxUploads);

  if (userType !== 'Guest') {
    addPermissionKeys('Protected', maxProtected);
    addPermissionKeys('Private', maxPrivate);
  }

  parameters[`${userType}AllowList`] = selectedPermissions.includes('s3:GetObject') ? 'ALLOW' : 'DISALLOW';
  parameters.s3ReadPolicy = `read_policy_${policyId}`;

  // double-check to make sure guest is denied
  if (parameters.storageAccess !== 'authAndGuest') {
    parameters.s3PermissionsGuestPublic = 'DISALLOW';
    parameters.s3PermissionsGuestUploads = 'DISALLOW';
    parameters.GuestAllowList = 'DISALLOW';
  }
}

export async function copyCfnTemplate(context: $TSContext, categoryName: string, resourceName: string, options: $TSAny) {
  const targetDir = pathManager.getBackendDirPath();
  const pluginDir = __dirname;

  const copyJobs = [
    {
      dir: pluginDir,
      template: path.join('..', '..', '..', 'resources', 'cloudformation-templates', templateFilenameMap[ServiceName.S3]),
      target: path.join(targetDir, categoryName, resourceName, 's3-cloudformation-template.json'),
    },
  ];

  // copy over the files
  return await context.amplify.copyBatch(context, copyJobs, options);
}

/*
 * When updating, remove the old trigger before adding a new one
 * This function has a side effect of updating the dependsOn array
 */
export async function addTrigger(
  context: $TSContext,
  resourceName: string,
  triggerFunction: $TSAny,
  adminTriggerFunction: $TSAny,
  options: { dependsOn?: $TSAny[]; headlessTrigger?: { name: string; mode: 'new' | 'existing' } },
) {
  const triggerTypeChoices = ['Choose an existing function from the project', 'Create a new function'];
  const [shortId] = uuid().split('-');
  let functionName = `S3Trigger${shortId}`;

  let useExistingFunction: boolean;

  if (options?.headlessTrigger) {
    functionName = options.headlessTrigger.name;
    useExistingFunction = options.headlessTrigger.mode === 'existing';
  } else {
    const triggerTypeQuestion = {
      message: 'Select from the following options',
      choices: triggerTypeChoices,
    };
    useExistingFunction = (await prompter.pick(triggerTypeQuestion.message, triggerTypeQuestion.choices)) === triggerTypeChoices[0];

    if (useExistingFunction) {
      let lambdaResources = await getLambdaFunctions(context);

      if (triggerFunction) {
        lambdaResources = lambdaResources.filter((lambdaResource: $TSAny) => lambdaResource !== triggerFunction);
      }

      if (lambdaResources.length === 0) {
        throw new Error("No functions were found in the project. Use 'amplify add function' to add a new function.");
      }

      const triggerOptionQuestion = {
        message: 'Select from the following options',
        choices: lambdaResources,
      };

      functionName = await prompter.pick(triggerOptionQuestion.message, triggerOptionQuestion.choices);
    }
  }

  // Update Lambda CFN
  const functionCFNFilePath = pathManager.getResourceCfnTemplatePath(undefined, functionCategoryName, functionName);

  if (useExistingFunction) {
    const { cfnTemplate: functionCFNFile }: { cfnTemplate: $TSAny } = await readCFNTemplate(functionCFNFilePath);

    functionCFNFile.Outputs.LambdaExecutionRole = {
      Value: {
        Ref: 'LambdaExecutionRole',
      },
    };

    // Update the function resource's CFN template

    await writeCFNTemplate(functionCFNFile, functionCFNFilePath);

    printer.success(`Successfully updated resource ${functionName} locally`);
  } else {
    // Create a new lambda trigger

    const targetDir = pathManager.getBackendDirPath();
    const pluginDir = __dirname;

    const defaults = {
      functionName,
      roleName: `${functionName}LambdaRole${shortId}`,
    };

    const copyJobs = [
      {
        dir: pluginDir,
        template: path.join('..', '..', '..', 'resources', 'triggers', 's3', 'lambda-cloudformation-template.json.ejs'),
        target: path.join(targetDir, functionCategoryName, functionName, `${functionName}-cloudformation-template.json`),
      },
      {
        dir: pluginDir,
        template: path.join('..', '..', '..', 'resources', 'triggers', 's3', 'event.json'),
        target: path.join(targetDir, functionCategoryName, functionName, 'src', 'event.json'),
      },
      {
        dir: pluginDir,
        template: path.join('..', '..', '..', 'resources', 'triggers', 's3', 'index.js'),
        target: path.join(targetDir, functionCategoryName, functionName, 'src', 'index.js'),
      },
      {
        dir: pluginDir,
        template: path.join('..', '..', '..', 'resources', 'triggers', 's3', 'package.json.ejs'),
        target: path.join(targetDir, functionCategoryName, functionName, 'src', 'package.json'),
      },
    ];

    // copy over the files
    await context.amplify.copyBatch(context, copyJobs, defaults);

    // Update amplify-meta and backend-config

    const backendConfigs = {
      service: FunctionServiceNameLambdaFunction,
      providerPlugin: providerName,
      build: true,
    };

    await context.amplify.updateamplifyMetaAfterResourceAdd(functionCategoryName, functionName, backendConfigs);

    printer.success(`Successfully added resource ${functionName} locally`);

    if (
      !options?.headlessTrigger &&
      (await context.amplify.confirmPrompt(`Do you want to edit the local ${functionName} lambda function now?`))
    ) {
      await context.amplify.openEditor(context, `${targetDir}/function/${functionName}/src/index.js`);
    }
  }

  // If updating an already existing S3 resource
  if (resourceName) {
    // Update Cloudformtion file
    const projectBackendDirPath = pathManager.getBackendDirPath();
    const storageCFNFilePath = path.join(projectBackendDirPath, categoryName, resourceName, 's3-cloudformation-template.json');
    const { cfnTemplate: storageCFNFile }: { cfnTemplate: $TSAny } = await readCFNTemplate(storageCFNFilePath);
    const amplifyMetaFile = stateManager.getMeta();

    // Remove reference for old triggerFunction
    if (triggerFunction) {
      delete storageCFNFile.Parameters[`function${triggerFunction}Arn`];
      delete storageCFNFile.Parameters[`function${triggerFunction}Name`];
      delete storageCFNFile.Parameters[`function${triggerFunction}LambdaExecutionRole`];
    }

    // Add reference for the new triggerFunction

    storageCFNFile.Parameters[`function${functionName}Arn`] = {
      Type: 'String',
      Default: `function${functionName}Arn`,
    };

    storageCFNFile.Parameters[`function${functionName}Name`] = {
      Type: 'String',
      Default: `function${functionName}Name`,
    };

    storageCFNFile.Parameters[`function${functionName}LambdaExecutionRole`] = {
      Type: 'String',
      Default: `function${functionName}LambdaExecutionRole`,
    };

    storageCFNFile.Parameters.triggerFunction = {
      Type: 'String',
    };

    if (adminTriggerFunction && !triggerFunction) {
      storageCFNFile.Resources.S3Bucket.DependsOn.push('TriggerPermissions');
      storageCFNFile.Resources.S3TriggerBucketPolicy.Properties.Roles.push({
        Ref: `function${functionName}LambdaExecutionRole`,
      });

      // eslint-disable-next-line max-len
      let lambdaConf = storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration.LambdaConfigurations;

      lambdaConf = lambdaConf.concat(
        getTriggersForLambdaConfiguration('private', functionName),
        getTriggersForLambdaConfiguration('protected', functionName),
        getTriggersForLambdaConfiguration('public', functionName),
      );

      // eslint-disable-next-line max-len
      storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration.LambdaConfigurations = lambdaConf;

      const dependsOnResources = amplifyMetaFile.storage[resourceName].dependsOn;

      dependsOnResources.push({
        category: functionCategoryName,
        resourceName: functionName,
        attributes: ['Name', 'Arn', 'LambdaExecutionRole'],
      });

      context.amplify.updateamplifyMetaAfterResourceUpdate(categoryName, resourceName, 'dependsOn', dependsOnResources);
    } else if (adminTriggerFunction && triggerFunction !== 'NONE') {
      storageCFNFile.Resources.S3TriggerBucketPolicy.Properties.Roles.forEach((role: $TSAny) => {
        if (role.Ref.includes(triggerFunction)) {
          role.Ref = `function${functionName}LambdaExecutionRole`;
        }
      });

      storageCFNFile.Resources.TriggerPermissions.Properties.FunctionName.Ref = `function${functionName}Name`;

      // eslint-disable-next-line max-len
      storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration.LambdaConfigurations.forEach((lambdaConf: $TSAny) => {
        if (
          !(typeof lambdaConf.Filter.S3Key.Rules[0].Value === 'string' && lambdaConf.Filter.S3Key.Rules[0].Value.includes('index-faces'))
        ) {
          lambdaConf.Function.Ref = `function${functionName}Arn`;
        }
      });

      const dependsOnResources = amplifyMetaFile.storage[resourceName].dependsOn;

      dependsOnResources.forEach((resource: $TSAny) => {
        if (resource.resourceName === triggerFunction) {
          resource.resourceName = functionName;
        }
      });

      context.amplify.updateamplifyMetaAfterResourceUpdate(categoryName, resourceName, 'dependsOn', dependsOnResources);
    } else {
      storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration = {
        LambdaConfigurations: [
          {
            Event: 's3:ObjectCreated:*',
            Function: {
              Ref: `function${functionName}Arn`,
            },
          },
          {
            Event: 's3:ObjectRemoved:*',
            Function: {
              Ref: `function${functionName}Arn`,
            },
          },
        ],
      };

      storageCFNFile.Resources.S3Bucket.DependsOn = ['TriggerPermissions'];

      storageCFNFile.Resources.S3TriggerBucketPolicy = {
        Type: 'AWS::IAM::Policy',
        DependsOn: ['S3Bucket'],
        Properties: {
          PolicyName: 's3-trigger-lambda-execution-policy',
          Roles: [
            {
              Ref: `function${functionName}LambdaExecutionRole`,
            },
          ],
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
                Resource: [
                  {
                    'Fn::Join': [
                      '',
                      [
                        'arn:aws:s3:::',
                        {
                          Ref: 'S3Bucket',
                        },
                        '/*',
                      ],
                    ],
                  },
                ],
              },
              {
                Effect: 'Allow',
                Action: 's3:ListBucket',
                Resource: [
                  {
                    'Fn::Join': [
                      '',
                      [
                        'arn:aws:s3:::',
                        {
                          Ref: 'S3Bucket',
                        },
                      ],
                    ],
                  },
                ],
              },
            ],
          },
        },
      };

      // Update DependsOn
      const dependsOnResources = amplifyMetaFile.storage[resourceName].dependsOn || [];

      dependsOnResources.filter((resource: $TSAny) => {
        return resource.resourceName !== triggerFunction;
      });

      dependsOnResources.push({
        category: functionCategoryName,
        resourceName: functionName,
        attributes: ['Name', 'Arn', 'LambdaExecutionRole'],
      });

      context.amplify.updateamplifyMetaAfterResourceUpdate(categoryName, resourceName, 'dependsOn', dependsOnResources);
    }

    storageCFNFile.Resources.TriggerPermissions = {
      Type: 'AWS::Lambda::Permission',
      Properties: {
        Action: 'lambda:InvokeFunction',
        FunctionName: {
          Ref: `function${functionName}Name`,
        },
        Principal: 's3.amazonaws.com',
        SourceAccount: {
          Ref: 'AWS::AccountId',
        },
        SourceArn: {
          'Fn::Join': [
            '',
            [
              'arn:aws:s3:::',
              {
                'Fn::If': [
                  'ShouldNotCreateEnvResources',
                  {
                    Ref: 'bucketName',
                  },
                  {
                    'Fn::Join': [
                      '',
                      [
                        {
                          Ref: 'bucketName',
                        },
                        {
                          'Fn::Select': [
                            3,
                            {
                              'Fn::Split': [
                                '-',
                                {
                                  Ref: 'AWS::StackName',
                                },
                              ],
                            },
                          ],
                        },
                        '-',
                        {
                          Ref: 'env',
                        },
                      ],
                    ],
                  },
                ],
              },
            ],
          ],
        },
      },
    };

    await writeCFNTemplate(storageCFNFile, storageCFNFilePath);
  } else {
    // New resource
    if (!options.dependsOn) {
      options.dependsOn = [];
    }

    options.dependsOn.push({
      category: functionCategoryName,
      resourceName: functionName,
      attributes: ['Name', 'Arn', 'LambdaExecutionRole'],
    });
  }

  return functionName;
}

function getTriggersForLambdaConfiguration(protectionLevel: string, functionName: string) {
  const triggers = [
    {
      Event: 's3:ObjectCreated:*',
      Filter: {
        S3Key: {
          Rules: [
            {
              Name: 'prefix',
              Value: {
                'Fn::Join': [
                  '',
                  [
                    `${protectionLevel}/`,
                    {
                      Ref: 'AWS::Region',
                    },
                  ],
                ],
              },
            },
          ],
        },
      },
      Function: {
        Ref: `function${functionName}Arn`,
      },
    },
    {
      Event: 's3:ObjectRemoved:*',
      Filter: {
        S3Key: {
          Rules: [
            {
              Name: 'prefix',
              Value: {
                'Fn::Join': [
                  '',
                  [
                    `${protectionLevel}/`,
                    {
                      Ref: 'AWS::Region',
                    },
                  ],
                ],
              },
            },
          ],
        },
      },
      Function: {
        Ref: `function${functionName}Arn`,
      },
    },
  ];
  return triggers;
}

async function getLambdaFunctions(context: $TSContext) {
  const { allResources } = await context.amplify.getResourceStatus();
  const lambdaResources = allResources
    .filter((resource: $TSObject) => resource.service === FunctionServiceNameLambdaFunction)
    .map((resource: $TSObject) => resource.resourceName);

  return lambdaResources;
}

function getStorageParamsFilePath(resourceName: string) {
  const resourceDirPath = pathManager.getResourceDirectoryPath(undefined, categoryName, resourceName);
  return path.join(resourceDirPath, storageParamsFilename);
}
