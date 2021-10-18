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
import { authCategoryName, categoryName } from '../../../constants';
import { ServiceName } from '../provider-constants';
import {
  checkIfAuthExists,
  copyCfnTemplate,
  createPermissionKeys,
  getAuthResourceName,
  loadDefaults,
  permissionMap,
  readStorageParamsFileSafe,
  removeNotStoredParameters,
  updateCfnTemplateWithGroups,
  writeToStorageParamsFile,
} from '../storage-configuration-helpers';
import { addTrigger, removeTrigger } from '../s3-trigger-helpers';

export const addWalkthrough = async (context: $TSContext, defaultValuesFilename: string, serviceMetadata: $TSAny, options: $TSAny) => {
  while (!checkIfAuthExists()) {
    if (
      await prompter.confirmContinue(
        'You need to add auth (Amazon Cognito) to your project in order to add storage for user files. Do you want to add auth now?',
      )
    ) {
      await context.amplify.invokePluginMethod(context, authCategoryName, undefined, 'add', [context]);
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
    return await configure(context, serviceMetadata, undefined, options);
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

  return configure(context, serviceMetada, resourceName);
};

async function configure(context: $TSContext, serviceMetadata: $TSAny, resourceName?: string, options?: $TSAny) {
  const { amplify } = context;
  let { inputs } = serviceMetadata;
  let defaultValues = await loadDefaults(context);
  const projectRoot = pathManager.findProjectRoot();

  let parameters: $TSObject = {};
  let storageParams: $TSObject = {};

  if (resourceName) {
    inputs = inputs.filter((input: $TSAny) => input.key !== 'resourceName');

    try {
      parameters = stateManager.getResourceParametersJson(projectRoot, categoryName, resourceName);
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
  } else {
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
          value: authCategoryName,
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

    const authResourceName = await getAuthResourceName(context);

    // add to storage params
    storageParams.groupPermissionMap = groupPermissionMap;

    if (!resourceName) {
      // add to depends
      if (!options.dependsOn) {
        options.dependsOn = [];
      }

      options.dependsOn.push({
        category: authCategoryName,
        resourceName: authResourceName,
        attributes: ['UserPoolId'],
      });

      selectedUserPoolGroupList.forEach((group: string) => {
        options.dependsOn.push({
          category: authCategoryName,
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

  const checkResult: $TSAny = await context.amplify.invokePluginMethod(context, authCategoryName, undefined, 'checkRequirements', [
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

      await context.amplify.invokePluginMethod(context, authCategoryName, undefined, 'externalAuthEnable', [
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

  removeNotStoredParameters(defaultValues);

  stateManager.setResourceParametersJson(undefined, categoryName, resourceName || resource, defaultValues);
  writeToStorageParamsFile(resourceName || resource, storageParams);

  return resource;
}

async function askReadWrite(userType: string, context: $TSContext, answers: $TSAny, parameters: $TSAny) {
  const defaults: $TSAny[] = [];

  if (parameters[`selected${userType}Permissions`]) {
    Object.values(permissionMap).forEach((el, index) => {
      if (el.every((i: $TSAny) => parameters[`selected${userType}Permissions`].includes(i))) {
        defaults.push(Object.keys(permissionMap)[index]);
      }
    });
  }

  const selectedPermissions = await context.amplify.crudFlow(userType, permissionMap, defaults);

  createPermissionKeys(userType, answers, selectedPermissions);

  return selectedPermissions;
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
