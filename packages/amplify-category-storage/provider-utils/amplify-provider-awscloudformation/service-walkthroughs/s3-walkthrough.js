const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs-extra');

const category = 'storage';
const parametersFileName = 'parameters.json';
const serviceName = 'S3';
const templateFileName = 's3-cloudformation-template.json';

async function addWalkthrough(context, defaultValuesFilename, serviceMetadata) {
  const resourceName = resourceAlreadyExists(context);

  if (resourceName) {
    const continueAnswer = await context.prompt.confirm("You've already added Storage to your project. Do you want to update the configurations?");
    if (continueAnswer) {
      return configure(context, defaultValuesFilename, serviceMetadata, resourceName);
    }
    process.exit(0);
  } else {
    return configure(context, defaultValuesFilename, serviceMetadata);
  }
}

function updateWalkthrough(context, defaultValuesFilename, serviceMetadata) {
  const resourceName = resourceAlreadyExists(context);

  if (!resourceName) {
    context.print.error('No resources to update. Please add a resource first');
    process.exit(0);
  } else {
    return configure(context, defaultValuesFilename, serviceMetadata, resourceName);
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
    let parameters;
    try {
      parameters = JSON.parse(fs.readFileSync(parametersFilePath));
    } catch (e) {
      parameters = {};
    }
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

module.exports = { addWalkthrough, updateWalkthrough };
