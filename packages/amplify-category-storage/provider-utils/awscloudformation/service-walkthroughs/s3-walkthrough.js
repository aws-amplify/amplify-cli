const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const uuid = require('uuid');

const category = 'storage';
const parametersFileName = 'parameters.json';
const serviceName = 'S3';
const templateFileName = 's3-cloudformation-template.json.ejs';

async function addWalkthrough(context, defaultValuesFilename, serviceMetadata, options) {
  while (!checkIfAuthExists(context)) {
    if (await context.amplify.confirmPrompt.run('You need to add auth (Amazon Cognito) to your project in order to add storage for user files. Do you want to add auth now?')) {
      try {
        const { add } = require('amplify-category-auth');
        await add(context);
      } catch (e) {
        context.print.error('The Auth plugin is not installed in the CLI. You need to install it to use this feature');
        break;
      }
      break;
    } else {
      process.exit(0);
    }
  }
  const resourceName = resourceAlreadyExists(context);

  if (resourceName) {
    context.print.warning('Amazon S3 storage was already added to your project.');
    process.exit(0);
  } else {
    return await configure(context, defaultValuesFilename, serviceMetadata, undefined, options);
  }
}

function updateWalkthrough(context, defaultValuesFilename, serviceMetada) {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();

  const storageResources = {};

  Object.keys(amplifyMeta[category]).forEach((resourceName) => {
    if (amplifyMeta[category][resourceName].service === serviceName) {
      storageResources[resourceName] = amplifyMeta[category][resourceName];
    }
  });

  if (Object.keys(storageResources).length === 0) {
    context.print.error('No resources to update. You need to add a resource.');
    process.exit(0);
    return;
  }
  const [resourceName] = Object.keys(storageResources);

  return configure(context, defaultValuesFilename, serviceMetada, resourceName);
}

async function configure(context, defaultValuesFilename, serviceMetadata, resourceName, options) {
  const { amplify } = context;
  let { inputs } = serviceMetadata;
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);

  const defaultValues = getAllDefaults(amplify.getProjectDetails());

  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();

  const { checkRequirements, externalAuthEnable } = require('amplify-category-auth');

  let parameters = {};
  if (resourceName) {
    inputs = inputs.filter(input => input.key !== 'resourceName');
    const resourceDirPath = path.join(projectBackendDirPath, category, resourceName);
    const parametersFilePath = path.join(resourceDirPath, parametersFileName);
    try {
      parameters = amplify.readJsonFile(parametersFilePath);
    } catch (e) {
      parameters = {};
    }
    parameters.resourceName = resourceName;
    Object.assign(defaultValues, parameters);
  }
  let answers = {};


  // only ask this for add
  if (!parameters.resourceName) {
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
        question = Object.assign({
          type: 'list',
          choices: inputs[i].options,
        }, question);
      } else if (inputs[i].type && inputs[i].type === 'multiselect') {
        question = Object.assign({
          type: 'checkbox',
          choices: inputs[i].options,
        }, question);
      } else {
        question = Object.assign({
          type: 'input',
        }, question);
      }
      questions.push(question);
    }

    answers = await inquirer.prompt(questions);
  }

  if (parameters.resourceName) {
    if (parameters.selectedGuestPermissions
      && parameters.selectedGuestPermissions.length !== 0) {
      Object.assign(defaultValues, { storageAccess: 'authAndGuest' });
    }
    if (parameters.selectedGuestPermissions || parameters.selectedAuthenticatedPermissions) {
      convertToCRUD(parameters, answers);
    }
  }

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
  let allowUnauthenticatedIdentities = false;
  if (answers.storageAccess === 'authAndGuest') {
    answers.selectedGuestPermissions = await askReadWrite('Guest', context, answers, parameters);
    allowUnauthenticatedIdentities = true;
  }


  // Ask Lambda trigger question

  if (!parameters || !parameters.triggerFunction || parameters.triggerFunction === 'NONE') {
    if (await amplify.confirmPrompt.run('Do you want to add a Lambda Trigger for your S3 Bucket?', false)) {
      try {
        answers.triggerFunction = await addTrigger(
          context,
          parameters.resourceName,
          undefined,
          options,
        );
      } catch (e) {
        context.print.error(e.message);
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
              options,
            );
            continueWithTriggerOperationQuestion = false;
          } catch (e) {
            context.print.error(e.message);
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
        default: console.log(`${triggerOperationAnswer.triggerOperation} not supported`);
      }
    }
  }


  const storageRequirements = { authSelections: 'identityPoolAndUserPool', allowUnauthenticatedIdentities };

  // getting requirement satisfaction map
  const satisfiedRequirements = await checkRequirements(storageRequirements, context, 'storage', answers.resourceName);
  // checking to see if any requirements are unsatisfied
  const foundUnmetRequirements = Object.values(satisfiedRequirements).includes(false);

  // if requirements are unsatisfied, trigger auth

  if (foundUnmetRequirements) {
    try {
      await externalAuthEnable(context, 'storage', answers.resourceName, storageRequirements);
    } catch (e) {
      context.print.error(e);
      throw e;
    }
  }

  Object.assign(defaultValues, answers);
  const resource = defaultValues.resourceName;
  const resourceDirPath = path.join(projectBackendDirPath, category, resource);
  delete defaultValues.resourceName;
  delete defaultValues.storageAccess;
  fs.ensureDirSync(resourceDirPath);
  const parametersFilePath = path.join(resourceDirPath, parametersFileName);
  const jsonString = JSON.stringify(defaultValues, null, 4);
  fs.writeFileSync(parametersFilePath, jsonString, 'utf8');

  if (!parameters.resourceName) {
    if (options) {
      Object.assign(defaultValues, options);
    }
    // Generate CFN file on add
    await copyCfnTemplate(context, category, resource, defaultValues);
  }
  return resource;
}

async function copyCfnTemplate(context, categoryName, resourceName, options) {
  const { amplify } = context;
  const targetDir = amplify.pathManager.getBackendDirPath();
  const pluginDir = __dirname;

  const copyJobs = [
    {
      dir: pluginDir,
      template: `../cloudformation-templates/${templateFileName}`,
      target: `${targetDir}/${categoryName}/${resourceName}/s3-cloudformation-template.json`,
    },
  ];

  // copy over the files
  return await context.amplify.copyBatch(context, copyJobs, options);
}

async function removeTrigger(context, resourceName, triggerFunction) {
  // Update Cloudformtion file
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const storageCFNFilePath = path.join(projectBackendDirPath, 'storage', resourceName, 's3-cloudformation-template.json');
  const storageCFNFile = context.amplify.readJsonFile(storageCFNFilePath);

  // Remove reference for old triggerFunction
  delete storageCFNFile.Parameters[`function${triggerFunction}Arn`];
  delete storageCFNFile.Parameters[`function${triggerFunction}Name`];
  delete storageCFNFile.Parameters[`function${triggerFunction}LambdaExecutionRole`];
  delete storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration;
  delete storageCFNFile.Resources.TriggerPermissions;
  delete storageCFNFile.Resources.S3TriggerBucketPolicy;
  delete storageCFNFile.Resources.S3Bucket.DependsOn;

  const storageCFNString = JSON.stringify(storageCFNFile, null, 4);
  fs.writeFileSync(storageCFNFilePath, storageCFNString, 'utf8');

  // Update DependsOn
  context.amplify.updateamplifyMetaAfterResourceUpdate(
    category,
    resourceName,
    'dependsOn',
    [],
  );
}


async function addTrigger(context, resourceName, triggerFunction, options) {
  let functionName;

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
      lambdaResources = lambdaResources.filter(lambdaResource =>
        lambdaResource !== triggerFunction);
    }
    if (lambdaResources.length === 0) {
      throw new Error('No pre-existing functions found in the project. Please use \'amplify add function\' command to add a new function to your project.');
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
        template: '../triggers/s3/lambda-cloudformation-template.json.ejs',
        target: `${targetDir}/function/${functionName}/${functionName}-cloudformation-template.json`,
      },
      {
        dir: pluginDir,
        template: '../triggers/s3/event.json',
        target: `${targetDir}/function/${functionName}/src/event.json`,
      },
      {
        dir: pluginDir,
        template: '../triggers/s3/index.js',
        target: `${targetDir}/function/${functionName}/src/index.js`,
      },
      {
        dir: pluginDir,
        template: '../triggers/s3/package.json.ejs',
        target: `${targetDir}/function/${functionName}/src/package.json`,
      },
    ];

    // copy over the files
    await context.amplify.copyBatch(context, copyJobs, defaults);

    // Update amplify-meta and backend-config

    const backendConfigs = {
      service: 'Lambda',
      providerPlugin: 'awscloudformation',
      build: true,
    };

    await context.amplify.updateamplifyMetaAfterResourceAdd(
      'function',
      functionName,
      backendConfigs,
    );
    context.print.success(`Successfully added resource ${functionName} locally`);
    if (await context.amplify.confirmPrompt.run(`Do you want to edit the local ${functionName} lambda function now?`)) {
      await context.amplify.openEditor(context, `${targetDir}/function/${functionName}/src/index.js`);
    }
  }

  // If updating an already existing S3 resource
  if (resourceName) {
    // Update Cloudformtion file
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    const storageCFNFilePath = path.join(projectBackendDirPath, 'storage', resourceName, 's3-cloudformation-template.json');
    const storageCFNFile = context.amplify.readJsonFile(storageCFNFilePath);

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

    storageCFNFile.Resources.S3Bucket.DependsOn = ['TriggerPermissions'];

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

    storageCFNFile.Resources.S3TriggerBucketPolicy = {
      Type: 'AWS::IAM::Policy',
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
              Action: [
                's3:PutObject',
                's3:GetObject',
                's3:ListBucket',
                's3:DeleteObject',
              ],
              Resource: [
                {
                  'Fn::Join': [
                    '',
                    [
                      'arn:aws:s3:::',
                      {
                        Ref: 'bucketName',
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


    const storageCFNString = JSON.stringify(storageCFNFile, null, 4);
    fs.writeFileSync(storageCFNFilePath, storageCFNString, 'utf8');

    // Update DependsOn
    context.amplify.updateamplifyMetaAfterResourceUpdate(
      category,
      resourceName,
      'dependsOn',
      [{
        category: 'function',
        resourceName: functionName,
        attributes: ['Name', 'Arn', 'LambdaExecutionRole'],
      }],
    );
  } else {
    // New resource
    options.dependsOn = [];
    options.dependsOn.push({
      category: 'function',
      resourceName: functionName,
      attributes: ['Name', 'Arn', 'LambdaExecutionRole'],
    });
  }

  return functionName;
}

async function getLambdaFunctions(context) {
  const { allResources } = await context.amplify.getResourceStatus();
  const lambdaResources = allResources
    .filter(resource => resource.service === 'Lambda')
    .map(resource => resource.resourceName);

  return lambdaResources;
}

async function askReadWrite(userType, context, answers, parameters) {
  // map of s3 actions corresponding to CRUD verbs
  // 'create/update' have been consolidated since s3 only has put concept
  const permissionMap = {
    'create/update': ['s3:PutObject'],
    read: ['s3:GetObject', 's3:ListBucket'],
    delete: ['s3:DeleteObject'],
  };

  const defaults = [];
  if (parameters[`selected${userType}Permissions`]) {
    Object.values(permissionMap).forEach((el, index) => {
      if (el.every(i => parameters[`selected${userType}Permissions`].includes(i))) {
        defaults.push(Object.keys(permissionMap)[index]);
      }
    });
  }

  const selectedPermissions = await context.amplify.crudFlow(
    userType,
    permissionMap,
    defaults,
  );

  createPermissionKeys(userType, answers, selectedPermissions);

  return selectedPermissions;
}

function createPermissionKeys(userType, answers, selectedPermissions) {
  const [policyId] = uuid().split('-');

  // max arrays represent highest possibly privileges for particular S3 keys
  const maxPermissions = ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'];
  const maxPublic = maxPermissions;
  const maxUploads = ['s3:PutObject'];
  const maxPrivate = userType === 'Authenticated' ? maxPermissions : [];
  const maxProtected = userType === 'Authenticated' ? maxPermissions : ['s3:GetObject'];

  function addPermissionKeys(key, possiblePermissions) {
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

function resourceAlreadyExists(context) {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();
  let resourceName;

  if (amplifyMeta[category]) {
    const categoryResources = amplifyMeta[category];
    Object.keys(categoryResources).forEach((resource) => {
      if (categoryResources[resource].service === serviceName) {
        resourceName = resource;
      }
    });
  }

  return resourceName;
}

function checkIfAuthExists(context) {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();
  let authExists = false;
  const authServiceName = 'Cognito';
  const authCategory = 'auth';

  if (amplifyMeta[authCategory] && Object.keys(amplifyMeta[authCategory]).length > 0) {
    const categoryResources = amplifyMeta[authCategory];
    Object.keys(categoryResources).forEach((resource) => {
      if (categoryResources[resource].service === authServiceName) {
        authExists = true;
      }
    });
  }
  return authExists;
}

function migrate(context, projectPath, resourceName) {
  const resourceDirPath = path.join(projectPath, 'amplify', 'backend', category, resourceName);

  // Change CFN file

  const cfnFilePath = path.join(resourceDirPath, 's3-cloudformation-template.json');
  const oldCfn = context.amplify.readJsonFile(cfnFilePath);
  const newCfn = {};
  Object.assign(newCfn, oldCfn);

  // Add env parameter
  if (!newCfn.Parameters) {
    newCfn.Parameters = {};
  }
  newCfn.Parameters.env = {
    Type: 'String',
  };

  // Add conditions block
  if (!newCfn.Conditions) {
    newCfn.Conditions = {};
  }
  newCfn.Conditions.ShouldNotCreateEnvResources = {
    'Fn::Equals': [
      {
        Ref: 'env',
      },
      'NONE',
    ],
  };

  // Add if condition for resource name change

  newCfn.Resources.S3Bucket.Properties.BucketName = {
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

  newParameters.authRoleName = {
    Ref: 'AuthRoleName',
  };
  newParameters.unauthRoleName = {
    Ref: 'UnauthRoleName',
  };


  jsonString = JSON.stringify(newParameters, null, '\t');
  fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
}

function convertToCRUD(parameters, answers) {
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

function getIAMPolicies(resourceName, crudOptions) {
  let policy = {};
  let actions = new Set();

  crudOptions.forEach((crudOption) => {
    switch (crudOption) {
      case 'create': actions.add('s3:PutObject');
        break;
      case 'update': actions.add('s3:PutObject');
        break;
      case 'read': actions.add('s3:GetObject'); actions.add('s3:ListBucket');
        break;
      case 'delete': actions.add('s3:DeleteObject');
        break;
      default: console.log(`${crudOption} not supported`);
    }
  });

  actions = Array.from(actions);
  policy = {
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

  const attributes = ['BucketName'];

  return { policy, attributes };
}


module.exports = {
  addWalkthrough, updateWalkthrough, migrate, getIAMPolicies,
};
