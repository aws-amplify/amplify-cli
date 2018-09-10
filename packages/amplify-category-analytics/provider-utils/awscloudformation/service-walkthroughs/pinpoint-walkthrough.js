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
    context.print.warning('Pinpoint analytics have already been added to your project.');
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


  const pinpointApp = checkIfNotificationsCategoryExists(context);

  if (pinpointApp) {
    Object.assign(defaultValues, pinpointApp);
  }

  const questions = [];
  for (let i = 1; i < inputs.length; i += 1) {
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
      answers[inputs[0].key] = answers[inputs[1].key];
      Object.assign(defaultValues, answers);
      const resource = defaultValues.resourceName;

      // Check for authorization rules and settings

      const { checkRequirements, externalAuthEnable } = require('amplify-category-auth');

      const apiRequirements = { authSelections: 'identityPoolOnly', allowUnauthenticatedIdentities: true };
      // getting requirement satisfaction map
      const satisfiedRequirements = await checkRequirements(apiRequirements, context, 'api', answers.resourceName);
      // checking to see if any requirements are unsatisfied
      const foundUnmetRequirements = Object.values(satisfiedRequirements).includes(false);

      if (foundUnmetRequirements) {
        context.print.warning('Adding analytics would add the Auth category to the project if not already added.');
        if (await context.prompt.confirm('Apps need authorization to send analytics events. Do you want to allow guests and unauthenticated users to send analytics events? (we recommend you allow this when getting started)')) {
          try {
            await externalAuthEnable(context, 'api', answers.resourceName, apiRequirements);
          } catch (e) {
            context.print.error(e);
            throw e;
          }
        } else {
          try {
            context.print.warning('Authorize only authenticated users to send analytics events. Use "amplify update auth" to modify this behavior.');
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

function checkIfNotificationsCategoryExists(context) {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();
  let pinpointApp;

  if (amplifyMeta.notifications) {
    const categoryResources = amplifyMeta.notifications;
    Object.keys(categoryResources).forEach((resource) => {
      if (categoryResources[resource].service === serviceName) {
        pinpointApp = {};
        pinpointApp.appId = categoryResources[resource].output.Id;
        pinpointApp.appName = categoryResources[resource].output.Name;
      }
    });
  }

  return pinpointApp;
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

module.exports = { addWalkthrough };
