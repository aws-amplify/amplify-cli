import {
  $TSAny,
  $TSContext,
  $TSObject,
  exitOnNextTick,
  pathManager,
  readCFNTemplate,
  ResourceAlreadyExistsError,
  ResourceDoesNotExistError,
  stateManager,
  writeCFNTemplate,
} from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import * as fs from 'fs-extra';
import inquirer from 'inquirer';
import _ from 'lodash';
import os from 'os';
import * as path from 'path';
import uuid from 'uuid';
import { categoryName, FunctionServiceNameLambdaFunction, ServiceName, templateFilenameMap } from '../../../constants';
import { readStorageParamsFileSafe, writeToStorageParamsFile } from '../storage-state-management';

// map of s3 actions corresponding to CRUD verbs
// 'create/update' have been consolidated since s3 only has put concept
const permissionMap = {
  'create/update': ['s3:PutObject'],
  read: ['s3:GetObject', 's3:ListBucket'],
  delete: ['s3:DeleteObject'],
};

export const addWalkthrough = async (context: $TSContext, defaultValuesFilename: string, serviceMetadata: $TSAny, options: $TSAny) => {
  while (!checkIfAuthExists()) {
    if (
      await prompter.confirmContinue(
        'You need to add auth (Amazon Cognito) to your project in order to add storage for user files. Do you want to add auth now?',
      )
    ) {
      await context.amplify.invokePluginMethod(context, 'auth', undefined, 'add', [context]);
      break;
    } else {
      await context.usageData.emitSuccess();
      exitOnNextTick(0);
    }
  }

  const resourceName = resourceAlreadyExists();

  if (resourceName) {
    const errMessage = 'Amazon S3 storage was already added to your project.';
    printer.warn(errMessage);
    await context.usageData.emitError(new ResourceAlreadyExistsError(errMessage));

    exitOnNextTick(0);
  } else {
    return await configure(context, defaultValuesFilename, serviceMetadata, undefined, options);
  }
};

export const updateWalkthrough = async (context: $TSContext, defaultValuesFilename: string, serviceMetada: $TSAny) => {
  const amplifyMeta = stateManager.getMeta();

  const storageResources: $TSObject = {};

  Object.keys(amplifyMeta[categoryName]).forEach(resourceName => {
    if (
      amplifyMeta[categoryName][resourceName].service === ServiceName.S3 &&
      amplifyMeta[categoryName][resourceName].mobileHubMigrated !== true
    ) {
      storageResources[resourceName] = amplifyMeta[categoryName][resourceName];
    }
  });

  if (Object.keys(storageResources).length === 0) {
    const errMessage = 'No resources to update. You need to add a resource.';
    printer.error(errMessage);
    await context.usageData.emitError(new ResourceDoesNotExistError(errMessage));
    exitOnNextTick(0);
    return;
  }

  const [resourceName] = Object.keys(storageResources);

  // For better DX check if the storage is imported
  if (amplifyMeta[categoryName][resourceName].serviceType === 'imported') {
    printer.error('Updating of an imported storage resource is not supported.');
    return;
  }

  return configure(context, defaultValuesFilename, serviceMetada, resourceName);
};

async function configure(
  context: $TSContext,
  defaultValuesFilename: string,
  serviceMetadata: $TSAny,
  resourceName?: string,
  options?: $TSAny,
) {
  const { amplify } = context;
  let { inputs } = serviceMetadata;
  const defaultValuesSrc = path.join(__dirname, '..', 'default-values', defaultValuesFilename);
  const { getAllDefaults } = await import(defaultValuesSrc);

  const defaultValues = getAllDefaults(amplify.getProjectDetails());

  const projectRoot = pathManager.findProjectRoot();

  let parameters: $TSObject = {};
  let storageParams: $TSObject = {};

  if (resourceName) {
    inputs = inputs.filter((input: $TSAny) => input.key !== 'resourceName');

    try {
      parameters = stateManager.getResourceParametersJson(undefined, categoryName, resourceName);
    } catch (e) {
      parameters = {};
    }
    parameters.resourceName = resourceName;
    Object.assign(defaultValues, parameters);

    storageParams = readStorageParamsFileSafe(resourceName);
  }

  let answers: $TSObject = {};

  // only ask this for add
  if (!parameters.resourceName) {
    const questions = [];

    for (const input of inputs) {
      let question = {
        name: input.key,
        message: input.question,
        validate: amplify.inputValidation(input),
        default: () => {
          const defaultValue = defaultValues[input.key];
          return defaultValue;
        },
      };

      if (input.type && input.type === 'list') {
        question = Object.assign(
          {
            type: 'list',
            choices: input.options,
          },
          question,
        );
      } else if (input.type && input.type === 'multiselect') {
        question = Object.assign(
          {
            type: 'checkbox',
            choices: input.options,
          },
          question,
        );
      } else {
        question = Object.assign(
          {
            type: 'input',
          },
          question,
        );
      }
      questions.push(question);
    }

    answers = await inquirer.prompt(questions);
  }

  if (parameters.resourceName) {
    if (parameters.selectedGuestPermissions && parameters.selectedGuestPermissions.length !== 0) {
      Object.assign(defaultValues, { storageAccess: 'authAndGuest' });
    }
    if (parameters.selectedGuestPermissions || parameters.selectedAuthenticatedPermissions) {
      convertToCRUD(parameters, answers);
    }
  }

  const userPoolGroupList = context.amplify.getUserPoolGroupList();

  let permissionSelected = 'Auth/Guest Users';
  let allowUnauthenticatedIdentities; // default to undefined since if S3 does not require unauth access the IdentityPool can still have that enabled

  if (userPoolGroupList.length > 0) {
    do {
      if (permissionSelected === 'Learn more') {
        printer.info('');
        printer.info(
          'You can restrict access using CRUD policies for Authenticated Users, Guest Users, or on individual Groups that users belong to in a User Pool. If a user logs into your application and is not a member of any group they will use policy set for “Authenticated Users”, however if they belong to a group they will only get the policy associated with that specific group.',
        );
        printer.info('');
      }

      const permissionSelection = await inquirer.prompt({
        name: 'selection',
        type: 'list',
        message: 'Restrict access by?',
        choices: ['Auth/Guest Users', 'Individual Groups', 'Both', 'Learn more'],
        default: 'Auth/Guest Users',
      });

      permissionSelected = permissionSelection.selection;
    } while (permissionSelected === 'Learn more');
  }

  if (permissionSelected === 'Both' || permissionSelected === 'Auth/Guest Users') {
    const accessQuestion = await inquirer.prompt({
      type: 'list',
      name: 'storageAccess',
      message: 'Who should have access:',
      choices: [
        {
          name: 'Auth users only',
          value: 'auth',
        },
        {
          name: 'Auth and guest users',
          value: 'authAndGuest',
        },
      ],
      default: defaultValues.storageAccess,
    });

    answers = { ...answers, storageAccess: accessQuestion.storageAccess };

    // auth permissions

    answers.selectedAuthenticatedPermissions = await askReadWrite('Authenticated', context, answers, parameters);

    if (answers.storageAccess === 'authAndGuest') {
      answers.selectedGuestPermissions = await askReadWrite('Guest', context, answers, parameters);
      allowUnauthenticatedIdentities = true;
    }
  }

  if (permissionSelected === 'Both' || permissionSelected === 'Individual Groups') {
    if (permissionSelected === 'Individual Groups') {
      removeAuthUnauthAccess(answers);
    }

    let defaultSelectedGroups: string[] = [];

    if (storageParams && storageParams.groupPermissionMap) {
      defaultSelectedGroups = Object.keys(storageParams.groupPermissionMap);
    }

    const userPoolGroupSelection = await inquirer.prompt([
      {
        name: 'userpoolGroups',
        type: 'checkbox',
        message: 'Select groups:',
        choices: userPoolGroupList,
        default: defaultSelectedGroups,
        validate: selectedAnswers => {
          if (selectedAnswers.length === 0) {
            return 'Select at least one option';
          }
          return true;
        },
      },
    ]);

    const selectedUserPoolGroupList = userPoolGroupSelection.userpoolGroups;

    const groupCrudFlow = async (group: string, defaults = []) => {
      const possibleOperations = Object.keys(permissionMap).map(el => ({ name: el, value: el }));

      const crudAnswers = await inquirer.prompt({
        name: 'permissions',
        type: 'checkbox',
        message: `What kind of access do you want for ${group} users?`,
        choices: possibleOperations,
        default: defaults,
        validate: selectedAnswers => {
          if (selectedAnswers.length === 0) {
            return 'Select at least one option';
          }
          return true;
        },
      });

      return {
        permissions: crudAnswers.permissions,
        policies: _.uniq(_.flatten(crudAnswers.permissions.map((e: 'create/update' | 'read' | 'delete') => permissionMap[e]))),
      };
    };

    const groupPermissionMap: $TSObject = {};
    const groupPolicyMap: $TSObject = {};

    for (const selectedUserPoolGroup of selectedUserPoolGroupList) {
      let defaults = [];

      if (storageParams && storageParams.groupPermissionMap) {
        defaults = storageParams.groupPermissionMap[selectedUserPoolGroup];
      }

      const crudAnswers = await groupCrudFlow(selectedUserPoolGroup, defaults);

      groupPermissionMap[selectedUserPoolGroup] = crudAnswers.permissions;
      groupPolicyMap[selectedUserPoolGroup] = crudAnswers.policies;
    }

    // Get auth resources

    let authResources = (await context.amplify.getResourceStatus('auth')).allResources;

    authResources = authResources.filter((resource: $TSAny) => resource.service === 'Cognito');

    if (authResources.length === 0) {
      throw new Error('No auth resource found. Please add it using amplify add auth');
    }

    const authResourceName = authResources[0].resourceName;

    // add to storage params
    storageParams.groupPermissionMap = groupPermissionMap;

    if (!resourceName) {
      // add to depends
      if (!options.dependsOn) {
        options.dependsOn = [];
      }

      options.dependsOn.push({
        category: 'auth',
        resourceName: authResourceName,
        attributes: ['UserPoolId'],
      });

      selectedUserPoolGroupList.forEach((group: string) => {
        options.dependsOn.push({
          category: 'auth',
          resourceName: 'userPoolGroups',
          attributes: [`${group}GroupRole`],
        });
      });
      // add to props

      defaultValues.authResourceName = authResourceName;
      defaultValues.groupList = selectedUserPoolGroupList;
      defaultValues.groupPolicyMap = groupPolicyMap;
    } else {
      // In the update flow
      await updateCfnTemplateWithGroups(
        context,
        defaultSelectedGroups,
        selectedUserPoolGroupList,
        groupPolicyMap,
        resourceName,
        authResourceName,
      );
    }
  }

  // Ask Lambda trigger question

  if (!parameters || !parameters.triggerFunction || parameters.triggerFunction === 'NONE') {
    if (await amplify.confirmPrompt('Do you want to add a Lambda Trigger for your S3 Bucket?', false)) {
      try {
        answers.triggerFunction = await addTrigger(context, parameters.resourceName, undefined, parameters.adminTriggerFunction, options);
      } catch (e) {
        printer.error(e.message);
      }
    } else {
      answers.triggerFunction = 'NONE';
    }
  } else {
    const triggerOperationQuestion = {
      type: 'list',
      name: 'triggerOperation',
      message: 'Select from the following options',
      choices: ['Update the Trigger', 'Remove the trigger', 'Skip Question'],
    };

    let continueWithTriggerOperationQuestion = true;

    while (continueWithTriggerOperationQuestion) {
      const triggerOperationAnswer = await inquirer.prompt([triggerOperationQuestion]);

      switch (triggerOperationAnswer.triggerOperation) {
        case 'Update the Trigger': {
          try {
            answers.triggerFunction = await addTrigger(
              context,
              parameters.resourceName,
              parameters.triggerFunction,
              parameters.adminTriggerFunction,
              options,
            );
            continueWithTriggerOperationQuestion = false;
          } catch (e) {
            printer.error(e.message);
            continueWithTriggerOperationQuestion = true;
          }
          break;
        }
        case 'Remove the trigger': {
          answers.triggerFunction = 'NONE';
          await removeTrigger(context, parameters.resourceName, parameters.triggerFunction);
          continueWithTriggerOperationQuestion = false;
          break;
        }
        case 'Skip Question': {
          if (!parameters.triggerFunction) {
            answers.triggerFunction = 'NONE';
          }
          continueWithTriggerOperationQuestion = false;
          break;
        }
        default:
          printer.error(`${triggerOperationAnswer.triggerOperation} not supported`);
      }
    }
  }

  const storageRequirements = { authSelections: 'identityPoolAndUserPool', allowUnauthenticatedIdentities };

  const checkResult: $TSAny = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'checkRequirements', [
    storageRequirements,
    context,
    'storage',
    answers.resourceName,
  ]);

  // If auth is imported and configured, we have to throw the error instead of printing since there is no way to adjust the auth
  // configuration.
  if (checkResult.authImported === true && checkResult.errors && checkResult.errors.length > 0) {
    throw new Error(checkResult.errors.join(os.EOL));
  }

  if (checkResult.errors && checkResult.errors.length > 0) {
    printer.warn(checkResult.errors.join(os.EOL));
  }

  // If auth is not imported and there were errors, adjust or enable auth configuration
  if (!checkResult.authEnabled || !checkResult.requirementsMet) {
    try {
      // If this is not set as requirement, then explicitly configure it to disabled.
      if (storageRequirements.allowUnauthenticatedIdentities === undefined) {
        storageRequirements.allowUnauthenticatedIdentities = false;
      }

      await context.amplify.invokePluginMethod(context, 'auth', undefined, 'externalAuthEnable', [
        context,
        categoryName,
        answers.resourceName,
        storageRequirements,
      ]);
    } catch (error) {
      printer.error(error);
      throw error;
    }
  }

  // At this point we have a valid auth configuration either imported or added/updated.

  Object.assign(defaultValues, answers);

  const resource = defaultValues.resourceName;
  const resourceDirPath = pathManager.getResourceDirectoryPath(projectRoot, categoryName, resource);

  fs.ensureDirSync(resourceDirPath);

  let props = { ...defaultValues };

  if (!parameters.resourceName) {
    if (options) {
      props = { ...defaultValues, ...options };
    }
    // Generate CFN file on add
    await copyCfnTemplate(context, categoryName, resource, props);
  }

  delete defaultValues.resourceName;
  delete defaultValues.storageAccess;
  delete defaultValues.groupPolicyMap;
  delete defaultValues.groupList;
  delete defaultValues.authResourceName;

  stateManager.setResourceParametersJson(undefined, categoryName, resourceName || resource, defaultValues);
  writeToStorageParamsFile(resourceName || resource, storageParams);

  return resource;
}

async function copyCfnTemplate(context: $TSContext, categoryName: string, resourceName: string, options: $TSAny) {
  const targetDir = pathManager.getBackendDirPath();
  const pluginDir = __dirname;

  const copyJobs = [
    {
      dir: pluginDir,
      template: path.join('..', '..', '..', '..', 'resources', 'cloudformation-templates', templateFilenameMap[ServiceName.S3]),
      target: path.join(targetDir, categoryName, resourceName, 's3-cloudformation-template.json'),
    },
  ];

  // copy over the files
  return await context.amplify.copyBatch(context, copyJobs, options);
}

async function updateCfnTemplateWithGroups(
  context: $TSContext,
  oldGroupList: $TSAny[],
  newGroupList: $TSAny[],
  newGroupPolicyMap: $TSObject,
  s3ResourceName: string,
  authResourceName: string,
) {
  const groupsToBeDeleted = _.difference(oldGroupList, newGroupList);

  // Update Cloudformtion file
  const projectRoot = pathManager.findProjectRoot();
  const resourceDirPath = pathManager.getResourceDirectoryPath(projectRoot, categoryName, s3ResourceName);
  const storageCFNFilePath = path.join(resourceDirPath, 's3-cloudformation-template.json');

  const { cfnTemplate: storageCFNFile }: { cfnTemplate: $TSAny } = await readCFNTemplate(storageCFNFilePath);

  const amplifyMetaFile = stateManager.getMeta(projectRoot);

  let s3DependsOnResources = amplifyMetaFile.storage[s3ResourceName].dependsOn || [];

  s3DependsOnResources = s3DependsOnResources.filter((resource: $TSAny) => resource.category !== 'auth');

  if (newGroupList.length > 0) {
    s3DependsOnResources.push({
      category: 'auth',
      resourceName: authResourceName,
      attributes: ['UserPoolId'],
    });
  }

  storageCFNFile.Parameters[`auth${authResourceName}UserPoolId`] = {
    Type: 'String',
    Default: `auth${authResourceName}UserPoolId`,
  };

  groupsToBeDeleted.forEach(group => {
    delete storageCFNFile.Parameters[`authuserPoolGroups${group}GroupRole`];
    delete storageCFNFile.Resources[`${group}GroupPolicy`];
  });

  newGroupList.forEach(group => {
    s3DependsOnResources.push({
      category: 'auth',
      resourceName: 'userPoolGroups',
      attributes: [`${group}GroupRole`],
    });

    storageCFNFile.Parameters[`authuserPoolGroups${group}GroupRole`] = {
      Type: 'String',
      Default: `authuserPoolGroups${group}GroupRole`,
    };

    storageCFNFile.Resources[`${group}GroupPolicy`] = {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyName: `${group}-group-s3-policy`,
        Roles: [
          {
            'Fn::Join': [
              '',
              [
                {
                  Ref: `auth${authResourceName}UserPoolId`,
                },
                `-${group}GroupRole`,
              ],
            ],
          },
        ],
        PolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: newGroupPolicyMap[group],
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
          ],
        },
      },
    };
  });

  // added a new policy for the user group to make action on buckets
  newGroupList.forEach(group => {
    if (newGroupPolicyMap[group].includes('s3:ListBucket') === true) {
      storageCFNFile.Resources[`${group}GroupPolicy`].Properties.PolicyDocument.Statement.push({
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
      });
    }
  });

  context.amplify.updateamplifyMetaAfterResourceUpdate(categoryName, s3ResourceName, 'dependsOn', s3DependsOnResources);

  await writeCFNTemplate(storageCFNFile, storageCFNFilePath);
}

async function removeTrigger(context: $TSContext, resourceName: string, triggerFunction: string) {
  // Update Cloudformtion file
  const projectRoot = pathManager.findProjectRoot();
  const resourceDirPath = pathManager.getResourceDirectoryPath(projectRoot, categoryName, resourceName);
  const storageCFNFilePath = path.join(resourceDirPath, 's3-cloudformation-template.json');
  const { cfnTemplate: storageCFNFile }: { cfnTemplate: $TSAny } = await readCFNTemplate(storageCFNFilePath);
  const bucketParameters = stateManager.getResourceParametersJson(projectRoot, categoryName, resourceName);
  const adminTrigger = bucketParameters.adminTriggerFunction;

  delete storageCFNFile.Parameters[`function${triggerFunction}Arn`];
  delete storageCFNFile.Parameters[`function${triggerFunction}Name`];
  delete storageCFNFile.Parameters[`function${triggerFunction}LambdaExecutionRole`];
  delete storageCFNFile.Resources.TriggerPermissions;

  if (!adminTrigger) {
    // Remove reference for old triggerFunction
    delete storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration;
    delete storageCFNFile.Resources.S3TriggerBucketPolicy;
    delete storageCFNFile.Resources.S3Bucket.DependsOn;
  } else {
    const lambdaConfigurations: $TSAny = [];

    // eslint-disable-next-line max-len
    storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration.LambdaConfigurations.forEach((triggers: $TSAny) => {
      if (
        triggers.Filter &&
        typeof triggers.Filter.S3Key.Rules[0].Value === 'string' &&
        triggers.Filter.S3Key.Rules[0].Value.includes('index-faces')
      ) {
        lambdaConfigurations.push(triggers);
      }
    });

    // eslint-disable-next-line max-len
    storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration.LambdaConfigurations = lambdaConfigurations;

    const index = storageCFNFile.Resources.S3Bucket.DependsOn.indexOf('TriggerPermissions');

    if (index > -1) {
      storageCFNFile.Resources.S3Bucket.DependsOn.splice(index, 1);
    }

    const roles: $TSAny[] = [];

    storageCFNFile.Resources.S3TriggerBucketPolicy.Properties.Roles.forEach((role: $TSAny) => {
      if (!role.Ref.includes(triggerFunction)) {
        roles.push(role);
      }
    });

    storageCFNFile.Resources.S3TriggerBucketPolicy.Properties.Roles = roles;
  }

  await writeCFNTemplate(storageCFNFile, storageCFNFilePath);

  const amplifyMeta = stateManager.getMeta();
  const s3DependsOnResources = amplifyMeta.storage[resourceName].dependsOn;
  const s3Resources: $TSAny[] = [];

  s3DependsOnResources.forEach((resource: $TSAny) => {
    if (resource.resourceName !== triggerFunction) {
      s3Resources.push(resource);
    }
  });

  context.amplify.updateamplifyMetaAfterResourceUpdate(categoryName, resourceName, 'dependsOn', s3Resources);
}

/*
When updating
Remove the old trigger
Add a new one
*/
async function addTrigger(
  context: $TSContext,
  resourceName: string,
  triggerFunction: $TSAny,
  adminTriggerFunction: $TSAny,
  options: $TSAny,
) {
  let functionName: string;

  const triggerTypeQuestion = {
    type: 'list',
    name: 'triggerType',
    message: 'Select from the following options',
    choices: ['Choose an existing function from the project', 'Create a new function'],
  };
  const triggerTypeAnswer = await inquirer.prompt([triggerTypeQuestion]);

  if (triggerTypeAnswer.triggerType === 'Choose an existing function from the project') {
    let lambdaResources = await getLambdaFunctions(context);

    if (triggerFunction) {
      lambdaResources = lambdaResources.filter((lambdaResource: $TSAny) => lambdaResource !== triggerFunction);
    }

    if (lambdaResources.length === 0) {
      throw new Error("No functions were found in the project. Use 'amplify add function' to add a new function.");
    }

    const triggerOptionQuestion = {
      type: 'list',
      name: 'triggerOption',
      message: 'Select from the following options',
      choices: lambdaResources,
    };

    const triggerOptionAnswer: $TSAny = await inquirer.prompt([triggerOptionQuestion]);

    functionName = triggerOptionAnswer.triggerOption;

    // Update Lambda CFN

    const projectBackendDirPath = pathManager.getBackendDirPath();
    const functionCFNFilePath = path.join(projectBackendDirPath, 'function', functionName, `${functionName}-cloudformation-template.json`);

    if (fs.existsSync(functionCFNFilePath)) {
      const { cfnTemplate: functionCFNFile }: { cfnTemplate: $TSAny } = await readCFNTemplate(functionCFNFilePath);

      functionCFNFile.Outputs.LambdaExecutionRole = {
        Value: {
          Ref: 'LambdaExecutionRole',
        },
      };

      // Update the functions resource

      await writeCFNTemplate(functionCFNFile, functionCFNFilePath);

      printer.success(`Successfully updated resource ${functionName} locally`);
    }
  } else {
    // Create a new lambda trigger

    const targetDir = pathManager.getBackendDirPath();
    const [shortId] = uuid().split('-');
    functionName = `S3Trigger${shortId}`;
    const pluginDir = __dirname;

    const defaults = {
      functionName: `${functionName}`,
      roleName: `${functionName}LambdaRole${shortId}`,
    };

    const copyJobs = [
      {
        dir: pluginDir,
        template: path.join('..', '..', '..', '..', 'resources', 'triggers', 's3', 'lambda-cloudformation-template.json.ejs'),
        target: path.join(targetDir, 'function', functionName, `${functionName}-cloudformation-template.json`),
      },
      {
        dir: pluginDir,
        template: path.join('..', '..', '..', '..', 'resources', 'triggers', 's3', 'event.json'),
        target: path.join(targetDir, 'function', functionName, 'src', 'event.json'),
      },
      {
        dir: pluginDir,
        template: path.join('..', '..', '..', '..', 'resources', 'triggers', 's3', 'index.js'),
        target: path.join(targetDir, 'function', functionName, 'src', 'index.js'),
      },
      {
        dir: pluginDir,
        template: path.join('..', '..', '..', '..', 'resources', 'triggers', 's3', 'package.json.ejs'),
        target: path.join(targetDir, 'function', functionName, 'src', 'package.json'),
      },
    ];

    // copy over the files
    await context.amplify.copyBatch(context, copyJobs, defaults);

    // Update amplify-meta and backend-config

    const backendConfigs = {
      service: FunctionServiceNameLambdaFunction,
      providerPlugin: 'awscloudformation',
      build: true,
    };

    await context.amplify.updateamplifyMetaAfterResourceAdd('function', functionName, backendConfigs);

    printer.success(`Successfully added resource ${functionName} locally`);

    if (await context.amplify.confirmPrompt(`Do you want to edit the local ${functionName} lambda function now?`)) {
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
        category: 'function',
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
        category: 'function',
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
      category: 'function',
      resourceName: functionName,
      attributes: ['Name', 'Arn', 'LambdaExecutionRole'],
    });
  }

  return functionName;
}

async function getLambdaFunctions(context: $TSContext) {
  const { allResources } = await context.amplify.getResourceStatus();
  const lambdaResources = allResources
    .filter((resource: $TSObject) => resource.service === FunctionServiceNameLambdaFunction)
    .map((resource: $TSObject) => resource.resourceName);

  return lambdaResources;
}

async function askReadWrite(userType: string, context: $TSContext, answers: $TSAny, parameters: $TSAny) {
  const defaults: $TSAny[] = [];

  if (parameters[`selected${userType}Permissions`]) {
    Object.values(permissionMap).forEach((el, index) => {
      if (el.every(i => parameters[`selected${userType}Permissions`].includes(i))) {
        defaults.push(Object.keys(permissionMap)[index]);
      }
    });
  }

  const selectedPermissions = await context.amplify.crudFlow(userType, permissionMap, defaults);

  createPermissionKeys(userType, answers, selectedPermissions);

  return selectedPermissions;
}

function createPermissionKeys(userType: string, answers: $TSAny, selectedPermissions: string[]) {
  const [policyId] = uuid().split('-');

  // max arrays represent highest possibly privileges for particular S3 keys
  const maxPermissions = ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'];
  const maxPublic = maxPermissions;
  const maxUploads = ['s3:PutObject'];
  const maxPrivate = userType === 'Authenticated' ? maxPermissions : [];
  const maxProtected = userType === 'Authenticated' ? maxPermissions : ['s3:GetObject'];

  function addPermissionKeys(key: string, possiblePermissions: string[]) {
    const permissions = _.intersection(selectedPermissions, possiblePermissions).join();

    answers[`s3Permissions${userType}${key}`] = !permissions ? 'DISALLOW' : permissions;
    answers[`s3${key}Policy`] = `${key}_policy_${policyId}`;
  }

  addPermissionKeys('Public', maxPublic);
  addPermissionKeys('Uploads', maxUploads);

  if (userType !== 'Guest') {
    addPermissionKeys('Protected', maxProtected);
    addPermissionKeys('Private', maxPrivate);
  }

  answers[`${userType}AllowList`] = selectedPermissions.includes('s3:GetObject') ? 'ALLOW' : 'DISALLOW';
  answers.s3ReadPolicy = `read_policy_${policyId}`;

  // double-check to make sure guest is denied
  if (answers.storageAccess !== 'authAndGuest') {
    answers.s3PermissionsGuestPublic = 'DISALLOW';
    answers.s3PermissionsGuestUploads = 'DISALLOW';
    answers.GuestAllowList = 'DISALLOW';
  }
}

function removeAuthUnauthAccess(answers: $TSAny) {
  answers.s3PermissionsGuestPublic = 'DISALLOW';
  answers.s3PermissionsGuestUploads = 'DISALLOW';
  answers.GuestAllowList = 'DISALLOW';

  answers.s3PermissionsAuthenticatedPublic = 'DISALLOW';
  answers.s3PermissionsAuthenticatedProtected = 'DISALLOW';
  answers.s3PermissionsAuthenticatedPrivate = 'DISALLOW';
  answers.s3PermissionsAuthenticatedUploads = 'DISALLOW';
  answers.AuthenticatedAllowList = 'DISALLOW';
}

export const resourceAlreadyExists = () => {
  const amplifyMeta = stateManager.getMeta();
  let resourceName;

  if (amplifyMeta[categoryName]) {
    const categoryResources = amplifyMeta[categoryName];

    Object.keys(categoryResources).forEach(resource => {
      if (categoryResources[resource].service === ServiceName.S3) {
        resourceName = resource;
      }
    });
  }

  return resourceName;
};

export const checkIfAuthExists = () => {
  const amplifyMeta = stateManager.getMeta();
  let authExists = false;
  const authServiceName = 'Cognito';
  const authCategory = 'auth';

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

export const migrate = async (context: $TSContext, projectPath: string, resourceName: string) => {
  const resourceDirPath = pathManager.getResourceDirectoryPath(projectPath, categoryName, resourceName);

  // Change CFN file

  const cfnFilePath = path.join(resourceDirPath, 's3-cloudformation-template.json');
  const { cfnTemplate }: { cfnTemplate: $TSAny } = await readCFNTemplate(cfnFilePath);

  // Add env parameter
  if (!cfnTemplate.Parameters) {
    cfnTemplate.Parameters = {};
  }

  cfnTemplate.Parameters.env = {
    Type: 'String',
  };

  // Add conditions block
  if (!cfnTemplate.Conditions) {
    cfnTemplate.Conditions = {};
  }

  cfnTemplate.Conditions.ShouldNotCreateEnvResources = {
    'Fn::Equals': [
      {
        Ref: 'env',
      },
      'NONE',
    ],
  };

  // Add if condition for resource name change

  cfnTemplate.Resources.S3Bucket.Properties.BucketName = {
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
  };

  await writeCFNTemplate(cfnTemplate, cfnFilePath);

  // Change Parameters file
  const parameters = stateManager.getResourceParametersJson(undefined, categoryName, resourceName);

  parameters.authRoleName = {
    Ref: 'AuthRoleName',
  };

  parameters.unauthRoleName = {
    Ref: 'UnauthRoleName',
  };

  stateManager.setResourceParametersJson(undefined, categoryName, resourceName, parameters);
};

function convertToCRUD(parameters: $TSAny, answers: $TSAny) {
  if (parameters.unauthPermissions === 'r') {
    answers.selectedGuestPermissions = ['s3:GetObject', 's3:ListBucket'];
    createPermissionKeys('Guest', answers, answers.selectedGuestPermissions);
  }

  if (parameters.unauthPermissions === 'rw') {
    answers.selectedGuestPermissions = ['s3:GetObject', 's3:ListBucket', 's3:PutObject', 's3:DeleteObject'];
    createPermissionKeys('Guest', answers, answers.selectedGuestPermissions);
  }

  if (parameters.authPermissions === 'r') {
    answers.selectedAuthenticatedPermissions = ['s3:GetObject', 's3:ListBucket'];
    createPermissionKeys('Authenticated', answers, answers.selectedAuthenticatedPermissions);
  }

  if (parameters.authPermissions === 'rw') {
    answers.selectedAuthenticatedPermissions = ['s3:GetObject', 's3:ListBucket', 's3:PutObject', 's3:DeleteObject'];
    createPermissionKeys('Authenticated', answers, answers.selectedAuthenticatedPermissions);
  }
}

export const getIAMPolicies = (resourceName: string, crudOptions: string[]) => {
  let policy = [];
  const actionsSet: Set<string> = new Set();

  crudOptions.forEach(crudOption => {
    switch (crudOption) {
      case 'create':
        actionsSet.add('s3:PutObject');
        break;
      case 'update':
        actionsSet.add('s3:PutObject');
        break;
      case 'read':
        actionsSet.add('s3:GetObject');
        actionsSet.add('s3:ListBucket');
        break;
      case 'delete':
        actionsSet.add('s3:DeleteObject');
        break;
      default:
        printer.info(`${crudOption} not supported`);
    }
  });

  let actions = Array.from(actionsSet);
  if (actions.includes('s3:ListBucket')) {
    let listBucketPolicy = {};
    listBucketPolicy = {
      Effect: 'Allow',
      Action: 's3:ListBucket',
      Resource: [
        {
          'Fn::Join': [
            '',
            [
              'arn:aws:s3:::',
              {
                Ref: `${categoryName}${resourceName}BucketName`,
              },
            ],
          ],
        },
      ],
    };
    actions = actions.filter(action => action != 's3:ListBucket');
    policy.push(listBucketPolicy);
  }

  const s3ObjectPolicy = {
    Effect: 'Allow',
    Action: actions,
    Resource: [
      {
        'Fn::Join': [
          '',
          [
            'arn:aws:s3:::',
            {
              Ref: `${categoryName}${resourceName}BucketName`,
            },
            '/*',
          ],
        ],
      },
    ],
  };
  policy.push(s3ObjectPolicy);
  const attributes = ['BucketName'];

  return { policy, attributes };
};

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
