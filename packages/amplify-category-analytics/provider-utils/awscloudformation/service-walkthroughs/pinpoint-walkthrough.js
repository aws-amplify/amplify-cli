const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs-extra');

const category = 'analytics';
const parametersFileName = 'parameters.json';
const serviceName = 'Pinpoint';
const templateFileName = 'pinpoint-cloudformation-template.json';

async function addWalkthrough(context, defaultValuesFilename, serviceMetadata) {
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
    .then(async (answers) => {
      Object.assign(defaultValues, answers);
      const resource = defaultValues.resourceName;

      // Check for auth rules/settings

      const { checkRequirements, externalAuthEnable } = require('amplify-category-auth');
      
      const apiRequirements = { authSelections: 'identityPoolOnly', allowUnauthenticatedIdentities: true };
      // getting requirement satisfaction map
      const satisfiedRequirements = await checkRequirements(apiRequirements, context, 'api', answers.resourceName);
      // checking to see if any requirements are unsatisfied
      const foundUnmetRequirements = Object.values(satisfiedRequirements).includes(false);

      if (foundUnmetRequirements) {
        if (await context.prompt.confirm('Apps need authorization to send analytics events. Do you want to allow guest/unauthenticated users to send analytics events (recommended for analytics)?')) {
          try {
            await externalAuthEnable(context, 'api', answers.resourceName, apiRequirements);
            
          } catch (e) {
            context.print.error(e);
            throw e;
          }
        } else {
          try {
            context.print.warning('Providing authorization for only authenticated users to send analytics events. Please use "amplify update auth" to modify this behavior.')
            apiRequirements.allowUnauthenticatedIdentities = false;
            await externalAuthEnable(context, 'api', answers.resourceName, apiRequirements);
          } catch (e) {
            context.print.error(e);
            throw e;
          }
        }
      }      

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
