const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs-extra');

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
    if (parameters.unauthPermissions
      && parameters.unauthPermissions !== '') {
      Object.assign(defaultValues, { storageAccess: 'authAndGuest' });
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
  const authPermissions = await askReadWrite('Authenticated', context, defaultValues.authPermissions);
  answers = { ...answers, authPermissions, unauthPermissions: '' };
  let allowUnauthenticatedIdentities = false;
  if (answers.storageAccess === 'authAndGuest') {
    const unauthPermissions = await askReadWrite('Guest', context, defaultValues.unauthPermissions);
    answers = { ...answers, unauthPermissions };
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

async function askReadWrite(userType, context, privacy) {
  switch (privacy) {
    case 'r':
    case 'w':
    case 'rw':
      break;
    default:
      privacy = 'r';
  }

  while (true) {
    const answer = await inquirer.prompt({
      name: 'permissions',
      type: 'list',
      message: `What kind of access do you want for ${userType} users`,
      choices: [
        {
          name: 'read',
          value: 'r',
        },
        {
          name: 'write',
          value: 'w',
        },
        {
          name: 'read/write',
          value: 'rw',
        },
      ],
      default: privacy,
    });

    if (answer.permissions !== 'learn') {
      return answer.permissions;
    }
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

module.exports = { addWalkthrough, updateWalkthrough };
