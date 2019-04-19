const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const uuid = require('uuid');

const category = 'storage';
const parametersFileName = 'parameters.json';
const serviceName = 'S3';
const templateFileName = 's3-cloudformation-template.json';

async function addWalkthrough(context, defaultValuesFilename, serviceMetadata) {
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
    return await configure(context, defaultValuesFilename, serviceMetadata);
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

async function configure(context, defaultValuesFilename, serviceMetadata, resourceName) {
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
      parameters = JSON.parse(fs.readFileSync(parametersFilePath));
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

  const templateFilePath = path.join(resourceDirPath, templateFileName);
  if (!fs.existsSync(templateFilePath)) {
    fs.copySync(`${__dirname}/../cloudformation-templates/${templateFileName}`, templateFilePath);
  }
  return resource;
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

function migrate(projectPath, resourceName) {
  const resourceDirPath = path.join(projectPath, 'amplify', 'backend', category, resourceName);

  // Change CFN file

  const cfnFilePath = path.join(resourceDirPath, 's3-cloudformation-template.json');
  const oldCfn = JSON.parse(fs.readFileSync(cfnFilePath, 'utf8'));
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
  const oldParameters = JSON.parse(fs.readFileSync(parametersFilePath, 'utf8'));
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


module.exports = { addWalkthrough, updateWalkthrough, migrate };
