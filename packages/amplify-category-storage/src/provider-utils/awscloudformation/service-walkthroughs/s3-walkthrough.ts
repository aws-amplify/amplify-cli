import * as inquirer from 'inquirer';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import _ from 'lodash';
import uuid from 'uuid';
import { ResourceDoesNotExistError, ResourceAlreadyExistsError, exitOnNextTick, $TSAny } from 'amplify-cli-core';
import { S3InputState } from './s3-user-input-state';
import { pathManager } from 'amplify-cli-core';

// keep in sync with ServiceName in amplify-category-function, but probably it will not change
const FunctionServiceNameLambdaFunction = 'Lambda';
const category = 'storage';
const parametersFileName = 'parameters.json';
const storageParamsFileName = 'storage-params.json';
const serviceName = 'S3';
const templateFileName = 's3-cloudformation-template.json.ejs';
const amplifyMetaFilename = 'amplify-meta.json';
// map of s3 actions corresponding to CRUD verbs
// 'create/update' have been consolidated since s3 only has put concept
const permissionMap = {
  'create/update': ['s3:PutObject'],
  read: ['s3:GetObject', 's3:ListBucket'],
  delete: ['s3:DeleteObject'],
};

export const addWalkthrough = async (context: any, defaultValuesFilename: any, serviceMetadata: any, options: any) => {
  while (!checkIfAuthExists(context)) {
    if (
      await context.amplify.confirmPrompt(
        'You need to add auth (Amazon Cognito) to your project in order to add storage for user files. Do you want to add auth now?',
      )
    ) {
      await context.amplify.invokePluginMethod(context, 'auth', undefined, 'add', [context]);
      break;
    } else {
      context.usageData.emitSuccess();
      exitOnNextTick(0);
    }
  }

  const resourceName = resourceAlreadyExists(context);

  if (resourceName) {
    const errMessage = 'Amazon S3 storage was already added to your project.';
    context.print.warning(errMessage);
    await context.usageData.emitError(new ResourceAlreadyExistsError(errMessage));

    exitOnNextTick(0);
  } else {
    return await configure(context, defaultValuesFilename, serviceMetadata, undefined, options);
  }
};

export const updateWalkthrough = (context: any, defaultValuesFilename: any, serviceMetada: any) => {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();

  const storageResources : Record<string, $TSAny> = {}; //maps cx resource to

  Object.keys(amplifyMeta[category]).forEach(resourceName => {
    if (amplifyMeta[category][resourceName].service === serviceName && amplifyMeta[category][resourceName].mobileHubMigrated !== true) {
      storageResources[resourceName] = amplifyMeta[category][resourceName];
    }
  });

  if (Object.keys(storageResources).length === 0) {
    const errMessage = 'No resources to update. You need to add a resource.';
    context.print.error(errMessage);
    context.usageData.emitError(new ResourceDoesNotExistError(errMessage));
    exitOnNextTick(0);
    return;
  }

  const [resourceName] = Object.keys(storageResources);

  // For better DX check if the storage is imported
  if (amplifyMeta[category][resourceName].serviceType === 'imported') {
    context.print.error('Updating of an imported storage resource is not supported.');
    return;
  }

  // @ts-expect-error ts-migrate(2554) FIXME: Expected 5 arguments, but got 4.
  return configure(context, defaultValuesFilename, serviceMetada, resourceName);
};

async function configure(context: any, defaultValuesFilename: any, serviceMetadata: any, resourceName: any, options: any) {
  const { amplify } = context;
  let { inputs } = serviceMetadata;
  const defaultValuesSrc = path.join(__dirname, '..', 'default-values', defaultValuesFilename);
  const { getAllDefaults } = require(defaultValuesSrc);

  const defaultValues = getAllDefaults(amplify.getProjectDetails());

  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();

  let parameters = {};
  let storageParams = {};

  if (resourceName) {
    inputs = inputs.filter((input: any) => input.key !== 'resourceName');
    const resourceDirPath = path.join(projectBackendDirPath, category, resourceName);
    const parametersFilePath = path.join(resourceDirPath, parametersFileName);
    const storageParamsFilePath = path.join(resourceDirPath, storageParamsFileName);

    try {
      parameters = amplify.readJsonFile(parametersFilePath);
    } catch (e) {
      parameters = {};
    }
    (parameters as any).resourceName = resourceName;
    Object.assign(defaultValues, parameters);

    try {
      storageParams = amplify.readJsonFile(storageParamsFilePath);
    } catch (e) {
      storageParams = {};
    }
  }

  let answers = {};

  // only ask this for add
  if (!(parameters as any).resourceName) {
    const questions = [];

    for (let i = 0; i < inputs.length; i += 1) {
      let question = {
        name: inputs[i].key,
        message: inputs[i].question,
        validate: amplify.inputValidation(inputs[i]),
        default: () => {
          const defaultValue = defaultValues[inputs[i].key];
          return defaultValue;
        },
      };

      if (inputs[i].type && inputs[i].type === 'list') {
        question = Object.assign(
          {
            type: 'list',
            choices: inputs[i].options,
          },
          question,
        );
      } else if (inputs[i].type && inputs[i].type === 'multiselect') {
        question = Object.assign(
          {
            type: 'checkbox',
            choices: inputs[i].options,
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

  if ((parameters as any).resourceName) {
    if ((parameters as any).selectedGuestPermissions && (parameters as any).selectedGuestPermissions.length !== 0) {
      Object.assign(defaultValues, { storageAccess: 'authAndGuest' });
    }
    if ((parameters as any).selectedGuestPermissions || (parameters as any).selectedAuthenticatedPermissions) {
      convertToCRUD(parameters, answers);
    }
  }

  const userPoolGroupList = await context.amplify.getUserPoolGroupList(context);

  let permissionSelected = 'Auth/Guest Users';
  let allowUnauthenticatedIdentities; // default to undefined since if S3 does not require unauth access the IdentityPool can still have that enabled

  if (userPoolGroupList.length > 0) {
    do {
      if (permissionSelected === 'Learn more') {
        context.print.info('');
        context.print.info(
          'You can restrict access using CRUD policies for Authenticated Users, Guest Users, or on individual Groups that users belong to in a User Pool. If a user logs into your application and is not a member of any group they will use policy set for “Authenticated Users”, however if they belong to a group they will only get the policy associated with that specific group.',
        );
        context.print.info('');
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
(answers as any).selectedAuthenticatedPermissions = await askReadWrite('Authenticated', context, answers, parameters);

    if ((answers as any).storageAccess === 'authAndGuest') {
      (answers as any).selectedGuestPermissions = await askReadWrite('Guest', context, answers, parameters);
      allowUnauthenticatedIdentities = true;
    }
  }

  if (permissionSelected === 'Both' || permissionSelected === 'Individual Groups') {
    if (permissionSelected === 'Individual Groups') {
      removeAuthUnauthAccess(answers);
    }

    let defaultSelectedGroups: any = [];

    if (storageParams && (storageParams as any).groupPermissionMap) {
      defaultSelectedGroups = Object.keys((storageParams as any).groupPermissionMap);
    }

    const userPoolGroupSelection = await inquirer.prompt([
      {
        name: 'userpoolGroups',
        type: 'checkbox',
        message: 'Select groups:',
        choices: userPoolGroupList,
        default: defaultSelectedGroups,
        validate: (selectedAnswers: any) => {
          if (selectedAnswers.length === 0) {
            return 'Select at least one option';
          }
          return true;
        },
      },
    ]);

    const selectedUserPoolGroupList = userPoolGroupSelection.userpoolGroups;

    const groupCrudFlow = async (group: any, defaults = []) => {
      const possibleOperations = Object.keys(permissionMap).map(el => ({ name: el, value: el }));

      const crudAnswers = await inquirer.prompt({
        name: 'permissions',
        type: 'checkbox',
        message: `What kind of access do you want for ${group} users?`,
        choices: possibleOperations,
        default: defaults,
        validate: (selectedAnswers: any) => {
          if (selectedAnswers.length === 0) {
            return 'Select at least one option';
          }
          return true;
        },
      });

      return {
        permissions: crudAnswers.permissions,
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        policies: _.uniq(_.flatten(crudAnswers.permissions.map((e: any) => permissionMap[e]))),
      };
    };

    const groupPermissionMap = {};
    const groupPolicyMap = {};

    for (let i = 0; i < selectedUserPoolGroupList.length; i += 1) {
      let defaults = [];

      if (storageParams && (storageParams as any).groupPermissionMap) {
        defaults = (storageParams as any).groupPermissionMap[selectedUserPoolGroupList[i]];
      }

      const crudAnswers = await groupCrudFlow(selectedUserPoolGroupList[i], defaults);

      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      groupPermissionMap[selectedUserPoolGroupList[i]] = crudAnswers.permissions;
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      groupPolicyMap[selectedUserPoolGroupList[i]] = crudAnswers.policies;
    }

    // Get auth resources

    let authResources = (await context.amplify.getResourceStatus('auth')).allResources;

    authResources = authResources.filter((resource: any) => resource.service === 'Cognito');

    if (authResources.length === 0) {
      throw new Error('No auth resource found. Please add it using amplify add auth');
    }

    const authResourceName = authResources[0].resourceName;

    // add to storage params
(storageParams as any).groupPermissionMap = groupPermissionMap;

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

      selectedUserPoolGroupList.forEach((group: any) => {
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

  if (!parameters || !(parameters as any).triggerFunction || (parameters as any).triggerFunction === 'NONE') {
    if (await amplify.confirmPrompt('Do you want to add a Lambda Trigger for your S3 Bucket?', false)) {
      try {
        (answers as any).triggerFunction = await addTrigger(context, (parameters as any).resourceName, undefined, (parameters as any).adminTriggerFunction, options);
      } catch (e) {
        context.print.error(e.message);
      }
    } else {
      (answers as any).triggerFunction = 'NONE';
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
            (answers as any).triggerFunction = await addTrigger(context, (parameters as any).resourceName, (parameters as any).triggerFunction, (parameters as any).adminTriggerFunction, options);
            continueWithTriggerOperationQuestion = false;
          } catch (e) {
            context.print.error(e.message);
            continueWithTriggerOperationQuestion = true;
          }
          break;
        }
        case 'Remove the trigger': {
          (answers as any).triggerFunction = 'NONE';
          await removeTrigger(context, (parameters as any).resourceName, (parameters as any).triggerFunction);
          continueWithTriggerOperationQuestion = false;
          break;
        }
        case 'Skip Question': {
          if (!(parameters as any).triggerFunction) {
            (answers as any).triggerFunction = 'NONE';
          }
          continueWithTriggerOperationQuestion = false;
          break;
        }
        default:
          context.print.error(`${triggerOperationAnswer.triggerOperation} not supported`);
      }
    }
  }

  const storageRequirements = { authSelections: 'identityPoolAndUserPool', allowUnauthenticatedIdentities };

  const checkResult = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'checkRequirements', [
    storageRequirements,
    context,
    'storage',
    (answers as any).resourceName,
]);

  // If auth is imported and configured, we have to throw the error instead of printing since there is no way to adjust the auth
  // configuration.
  if (checkResult.authImported === true && checkResult.errors && checkResult.errors.length > 0) {
    throw new Error(checkResult.errors.join(os.EOL));
  }

  if (checkResult.errors && checkResult.errors.length > 0) {
    context.print.warning(checkResult.errors.join(os.EOL));
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
    category,
    (answers as any).resourceName,
    storageRequirements,
]);
    } catch (error) {
      context.print.error(error);
      throw error;
    }
  }

  // At this point we have a valid auth configuration either imported or added/updated.

  Object.assign(defaultValues, answers);

  const resource = defaultValues.resourceName;
  const resourceDirPath = path.join(projectBackendDirPath, category, resource);

  fs.ensureDirSync(resourceDirPath);

  let props = { ...defaultValues };

  if (!(parameters as any).resourceName) {
    if (options) {
      props = { ...defaultValues, ...options };
    }
    // Generate CFN file on add
    await copyCfnTemplate(context, category, resource, props);
  }

  delete defaultValues.resourceName;
  delete defaultValues.storageAccess;
  delete defaultValues.groupPolicyMap;
  delete defaultValues.groupList;
  delete defaultValues.authResourceName;

  const parametersFilePath = path.join(resourceDirPath, parametersFileName);
  const jsonString = JSON.stringify(defaultValues, null, 4);

  fs.writeFileSync(parametersFilePath, jsonString, 'utf8');

  const storageParamsFilePath = path.join(resourceDirPath, storageParamsFileName);
  const storageParamsString = JSON.stringify(storageParams, null, 4);

  fs.writeFileSync(storageParamsFilePath, storageParamsString, 'utf8');

  return resource;
}
//Generate CLIInputs.json
function saveCLIInputsData( options : any ){
  const backendDir = pathManager.getBackendDirPath();
  const cliInputsFilePath = pathManager.getCliInputsPath(backendDir, category, options.resourceName!);
  //create inputManager
  const cliInputManager = S3InputState.getInstance( S3InputState.cliWalkThroughToCliInputParams(cliInputsFilePath, options) );
  //save cliInputs.json
  cliInputManager.saveCliInputPayload(); //Save input data
}

async function copyCfnTemplate(context: any, categoryName: any, resourceName: any, options: any) {
  const { amplify } = context;
  const targetDir = amplify.pathManager.getBackendDirPath();
  const pluginDir = __dirname;
  saveCLIInputsData( options );

  const copyJobs = [
    {
      dir: pluginDir,
      template: path.join('..', '..', '..', '..', 'resources', 'cloudformation-templates', templateFileName),
      target: path.join(targetDir, categoryName, resourceName, 's3-cloudformation-template.json'),
    },
  ];

  // copy over the files
  return await context.amplify.copyBatch(context, copyJobs, options);
}

async function updateCfnTemplateWithGroups(context: any, oldGroupList: any, newGroupList: any, newGroupPolicyMap: any, s3ResourceName: any, authResourceName: any) {
  const groupsToBeDeleted = _.difference(oldGroupList, newGroupList);

  // Update Cloudformtion file
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const resourceDirPath = path.join(projectBackendDirPath, category, s3ResourceName);
  const storageCFNFilePath = path.join(resourceDirPath, 's3-cloudformation-template.json');
  const storageCFNFile = context.amplify.readJsonFile(storageCFNFilePath);

  const amplifyMetaFilePath = path.join(projectBackendDirPath, amplifyMetaFilename);
  const amplifyMetaFile = context.amplify.readJsonFile(amplifyMetaFilePath);

  let s3DependsOnResources = amplifyMetaFile.storage[s3ResourceName].dependsOn || [];

  s3DependsOnResources = s3DependsOnResources.filter((resource: any) => resource.category !== 'auth');

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

  groupsToBeDeleted.forEach((group: any) => {
    delete storageCFNFile.Parameters[`authuserPoolGroups${group}GroupRole`];
    delete storageCFNFile.Resources[`${group}GroupPolicy`];
  });

  newGroupList.forEach((group: any) => {
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
  newGroupList.forEach((group: any) => {
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

  context.amplify.updateamplifyMetaAfterResourceUpdate(category, s3ResourceName, 'dependsOn', s3DependsOnResources);

  const storageCFNString = JSON.stringify(storageCFNFile, null, 4);

  fs.writeFileSync(storageCFNFilePath, storageCFNString, 'utf8');
}

async function removeTrigger(context: any, resourceName: any, triggerFunction: any) {
  // Update Cloudformtion file
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const resourceDirPath = path.join(projectBackendDirPath, category, resourceName);
  const storageCFNFilePath = path.join(resourceDirPath, 's3-cloudformation-template.json');
  const storageCFNFile = context.amplify.readJsonFile(storageCFNFilePath);
  const parametersFilePath = path.join(resourceDirPath, parametersFileName);
  const bucketParameters = context.amplify.readJsonFile(parametersFilePath);
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
    const lambdaConfigurations: any = [];

    // eslint-disable-next-line max-len
    storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration.LambdaConfigurations.forEach((triggers: any) => {
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

    const roles: any = [];

    storageCFNFile.Resources.S3TriggerBucketPolicy.Properties.Roles.forEach((role: any) => {
      if (!role.Ref.includes(triggerFunction)) {
        roles.push(role);
      }
    });

    storageCFNFile.Resources.S3TriggerBucketPolicy.Properties.Roles = roles;
  }

  const storageCFNString = JSON.stringify(storageCFNFile, null, 4);

  fs.writeFileSync(storageCFNFilePath, storageCFNString, 'utf8');

  const amplifyMetaFilePath = path.join(projectBackendDirPath, amplifyMetaFilename);
  const amplifyMetaFile = context.amplify.readJsonFile(amplifyMetaFilePath);
  const s3DependsOnResources = amplifyMetaFile.storage[resourceName].dependsOn;
  const s3Resources: any = [];

  s3DependsOnResources.forEach((resource: any) => {
    if (resource.resourceName !== triggerFunction) {
      s3Resources.push(resource);
    }
  });

  context.amplify.updateamplifyMetaAfterResourceUpdate(category, resourceName, 'dependsOn', s3Resources);
}

/*
When updating
Remove the old trigger
Add a new one
*/
async function addTrigger(context: any, resourceName: any, triggerFunction: any, adminTriggerFunction: any, options: any) {
  let functionName: any;

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
      lambdaResources = lambdaResources.filter((lambdaResource: any) => lambdaResource !== triggerFunction);
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

    const triggerOptionAnswer = await inquirer.prompt([triggerOptionQuestion]);

    functionName = triggerOptionAnswer.triggerOption;

    // Update Lambda CFN

    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    const functionCFNFilePath = path.join(projectBackendDirPath, 'function', functionName, `${functionName}-cloudformation-template.json`);

    if (fs.existsSync(functionCFNFilePath)) {
      const functionCFNFile = context.amplify.readJsonFile(functionCFNFilePath);

      functionCFNFile.Outputs.LambdaExecutionRole = {
        Value: {
          Ref: 'LambdaExecutionRole',
        },
      };

      // Update the functions resource
      const functionCFNString = JSON.stringify(functionCFNFile, null, 4);

      fs.writeFileSync(functionCFNFilePath, functionCFNString, 'utf8');

      context.print.success(`Successfully updated resource ${functionName} locally`);
    }
  } else {
    // Create a new lambda trigger

    const targetDir = context.amplify.pathManager.getBackendDirPath();
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

    context.print.success(`Successfully added resource ${functionName} locally`);

    if (await context.amplify.confirmPrompt(`Do you want to edit the local ${functionName} lambda function now?`)) {
      await context.amplify.openEditor(context, `${targetDir}/function/${functionName}/src/index.js`);
    }
  }

  // If updating an already existing S3 resource
  if (resourceName) {
    // Update Cloudformtion file
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    const storageCFNFilePath = path.join(projectBackendDirPath, category, resourceName, 's3-cloudformation-template.json');
    const storageCFNFile = context.amplify.readJsonFile(storageCFNFilePath);
    const amplifyMetaFilePath = path.join(projectBackendDirPath, amplifyMetaFilename);
    const amplifyMetaFile = context.amplify.readJsonFile(amplifyMetaFilePath);

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

      context.amplify.updateamplifyMetaAfterResourceUpdate(category, resourceName, 'dependsOn', dependsOnResources);
    } else if (adminTriggerFunction && triggerFunction !== 'NONE') {
      storageCFNFile.Resources.S3TriggerBucketPolicy.Properties.Roles.forEach((role: any) => {
        if (role.Ref.includes(triggerFunction)) {
          role.Ref = `function${functionName}LambdaExecutionRole`;
        }
      });

      storageCFNFile.Resources.TriggerPermissions.Properties.FunctionName.Ref = `function${functionName}Name`;

      // eslint-disable-next-line max-len
      storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration.LambdaConfigurations.forEach((lambdaConf: any) => {
        if (
          !(typeof lambdaConf.Filter.S3Key.Rules[0].Value === 'string' && lambdaConf.Filter.S3Key.Rules[0].Value.includes('index-faces'))
        ) {
          lambdaConf.Function.Ref = `function${functionName}Arn`;
        }
      });

      const dependsOnResources = amplifyMetaFile.storage[resourceName].dependsOn;

      dependsOnResources.forEach((resource: any) => {
        if (resource.resourceName === triggerFunction) {
          resource.resourceName = functionName;
        }
      });

      context.amplify.updateamplifyMetaAfterResourceUpdate(category, resourceName, 'dependsOn', dependsOnResources);
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

      dependsOnResources.filter((resource: any) => {
        return resource.resourceName !== triggerFunction;
      });

      dependsOnResources.push({
        category: 'function',
        resourceName: functionName,
        attributes: ['Name', 'Arn', 'LambdaExecutionRole'],
      });

      context.amplify.updateamplifyMetaAfterResourceUpdate(category, resourceName, 'dependsOn', dependsOnResources);
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

    const storageCFNString = JSON.stringify(storageCFNFile, null, 4);

    fs.writeFileSync(storageCFNFilePath, storageCFNString, 'utf8');
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

async function getLambdaFunctions(context: any) {
  const { allResources } = await context.amplify.getResourceStatus();
  const lambdaResources = allResources
    .filter((resource: any) => resource.service === FunctionServiceNameLambdaFunction)
    .map((resource: any) => resource.resourceName);

  return lambdaResources;
}

async function askReadWrite(userType: any, context: any, answers: any, parameters: any) {
  const defaults: any = [];

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

function createPermissionKeys(userType: any, answers: any, selectedPermissions: any) {
  const [policyId] = uuid().split('-');

  // max arrays represent highest possibly privileges for particular S3 keys
  const maxPermissions = ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'];
  const maxPublic = maxPermissions;
  const maxUploads = ['s3:PutObject'];
  const maxPrivate = userType === 'Authenticated' ? maxPermissions : [];
  const maxProtected = userType === 'Authenticated' ? maxPermissions : ['s3:GetObject'];

  function addPermissionKeys(key: any, possiblePermissions: any) {
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

function removeAuthUnauthAccess(answers: any) {
  answers.s3PermissionsGuestPublic = 'DISALLOW';
  answers.s3PermissionsGuestUploads = 'DISALLOW';
  answers.GuestAllowList = 'DISALLOW';

  answers.s3PermissionsAuthenticatedPublic = 'DISALLOW';
  answers.s3PermissionsAuthenticatedProtected = 'DISALLOW';
  answers.s3PermissionsAuthenticatedPrivate = 'DISALLOW';
  answers.s3PermissionsAuthenticatedUploads = 'DISALLOW';
  answers.AuthenticatedAllowList = 'DISALLOW';
}

export const resourceAlreadyExists = (context: any) => {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();
  let resourceName;

  if (amplifyMeta[category]) {
    const categoryResources = amplifyMeta[category];

    Object.keys(categoryResources).forEach(resource => {
      if (categoryResources[resource].service === serviceName) {
        resourceName = resource;
      }
    });
  }

  return resourceName;
};

export const checkIfAuthExists = (context: any) => {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();
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

export const migrate = (context: any, projectPath: any, resourceName: any) => {
  const resourceDirPath = path.join(projectPath, 'amplify', 'backend', category, resourceName);

  // Change CFN file

  const cfnFilePath = path.join(resourceDirPath, 's3-cloudformation-template.json');
  const oldCfn = context.amplify.readJsonFile(cfnFilePath);
  const newCfn = {};

  Object.assign(newCfn, oldCfn);

  // Add env parameter
  if (!(newCfn as any).Parameters) {
    (newCfn as any).Parameters = {};
  }

  (newCfn as any).Parameters.env = {
    Type: 'String',
};

  // Add conditions block
  if (!(newCfn as any).Conditions) {
    (newCfn as any).Conditions = {};
  }

  (newCfn as any).Conditions.ShouldNotCreateEnvResources = {
    'Fn::Equals': [
        {
            Ref: 'env',
        },
        'NONE',
    ],
};

  // Add if condition for resource name change
(newCfn as any).Resources.S3Bucket.Properties.BucketName = {
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

  let jsonString = JSON.stringify(newCfn, null, '\t');

  fs.writeFileSync(cfnFilePath, jsonString, 'utf8');

  // Change Parameters file
  const parametersFilePath = path.join(resourceDirPath, parametersFileName);
  const oldParameters = context.amplify.readJsonFile(parametersFilePath, 'utf8');
  const newParameters = {};

  Object.assign(newParameters, oldParameters);

  (newParameters as any).authRoleName = {
    Ref: 'AuthRoleName',
};

  (newParameters as any).unauthRoleName = {
    Ref: 'UnauthRoleName',
};

  jsonString = JSON.stringify(newParameters, null, '\t');

  fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
};

function convertToCRUD(parameters: any, answers: any) {
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

export const getIAMPolicies = (resourceName: any, crudOptions: any) => {
  let policy = [];
  let actions = new Set();

  crudOptions.forEach((crudOption: any) => {
    switch (crudOption) {
      case 'create':
        actions.add('s3:PutObject');
        break;
      case 'update':
        actions.add('s3:PutObject');
        break;
      case 'read':
        actions.add('s3:GetObject');
        actions.add('s3:ListBucket');
        break;
      case 'delete':
        actions.add('s3:DeleteObject');
        break;
      default:
        console.log(`${crudOption} not supported`);
    }
  });

  // @ts-expect-error ts-migrate(2740) FIXME: Type 'unknown[]' is missing the following properti... Remove this comment to see the full error message
  actions = Array.from(actions);
  if ((actions as any).includes('s3:ListBucket')) {
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
                Ref: `${category}${resourceName}BucketName`,
              },
            ],
          ],
        },
      ],
    };
    actions = (actions as any).filter((action: any) => action != 's3:ListBucket');
    policy.push(listBucketPolicy);
  }
  let s3ObjectPolicy = {
    Effect: 'Allow',
    Action: actions,
    Resource: [
      {
        'Fn::Join': [
          '',
          [
            'arn:aws:s3:::',
            {
              Ref: `${category}${resourceName}BucketName`,
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

function getTriggersForLambdaConfiguration(protectionLevel: any, functionName: any) {
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
