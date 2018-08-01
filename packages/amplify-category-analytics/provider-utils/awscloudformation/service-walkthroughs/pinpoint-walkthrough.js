const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs-extra');

const category = 'analytics';
const parametersFileName = 'parameters.json';
const serviceName = 'Pinpoint';
const templateFileName = 'pinpoint-cloudformation-template.json';

async function addWalkthrough(context, defaultValuesFilename, serviceMetadata) {
  while (!checkIfAuthExists(context)) {
    if (await context.prompt.confirm('You need auth (Cognito) added to your project for adding analytics for user files. Do you want to add auth now?')) {
      try {
        const { add } = require('amplify-category-auth');
        await add(context);
      } catch (e) {
        context.print.error('Auth plugin not installed in the CLI. Please install it to use this feature');
        break;
      }
      break;
    } else {
      process.exit(0);
    }
  }
  const resourceName = resourceAlreadyExists(context);

  if (resourceName) {
    context.print.warning('You have Pinpoint analytics already added to your project.');
    process.exit(0);
  } else {
    return configure(context, defaultValuesFilename, serviceMetadata);
  }
}


function configure(context, defaultValuesFilename, serviceMetadata, resourceName) {
  const { amplify } = context;
  let { inputs } = serviceMetadata;
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = require(defaultValuesSrc);

  const defaultValues = getAllDefaults(amplify.getProjectDetails());

  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();


  if (resourceName) {
    inputs = inputs.filter(input => input.key !== 'resourceName');
    const resourceDirPath = path.join(projectBackendDirPath, category, resourceName);
    const parametersFilePath = path.join(resourceDirPath, parametersFileName);
    const parameters = JSON.parse(fs.readFileSync(parametersFilePath));
    parameters.resourceName = resourceName;
    Object.assign(defaultValues, parameters);
  }

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

  return inquirer.prompt(questions)
    .then((answers) => {
      Object.assign(defaultValues, answers);
      const resource = defaultValues.resourceName;
      const resourceDirPath = path.join(projectBackendDirPath, category, resource);
      delete defaultValues.resourceName;
      fs.ensureDirSync(resourceDirPath);
      const parametersFilePath = path.join(resourceDirPath, parametersFileName);
      const jsonString = JSON.stringify(defaultValues, null, 4);
      fs.writeFileSync(parametersFilePath, jsonString, 'utf8');

      const templateFilePath = path.join(resourceDirPath, templateFileName);
      if (!fs.existsSync(templateFilePath)) {
        fs.copySync(`${__dirname}/../cloudformation-templates/${templateFileName}`, templateFilePath);
      }
      return resource;
    });
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

module.exports = { addWalkthrough };
