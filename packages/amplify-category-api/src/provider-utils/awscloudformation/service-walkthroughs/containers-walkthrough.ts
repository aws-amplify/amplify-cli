import { ServiceName as FunctionServiceName } from 'amplify-category-function';
import inquirer from "inquirer";

const category = 'api';
const serviceName = 'CloudFront';
const parametersFileName = 'container-params.json';
const cfnParametersFilename = 'container-parameters.json';


export async function serviceWalkthrough(context, defaultValuesFilename) {
  const { checkRequirements, externalAuthEnable } = await import('amplify-category-auth');

  const { amplify, print } = context;
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = await import(defaultValuesSrc);
  const allDefaultValues = getAllDefaults(amplify.getProjectDetails());

  const resourceName = await askResourceName(context, getAllDefaults);

  const containerName = await askContainerSource(context);

  let authName;

  const apiRequirements = { authSelections: 'identityPoolAndUserPool' };
  // getting requirement satisfaction map
  const satisfiedRequirements = await checkRequirements(apiRequirements, context, category, resourceName);
  // checking to see if any requirements are unsatisfied
  const foundUnmetRequirements = Object.values(satisfiedRequirements).includes(false);

  // if requirements are unsatisfied, trigger auth
  

  if (foundUnmetRequirements) {
    try {
      authName = await externalAuthEnable(context, 'api', resourceName, apiRequirements);
    } catch (e) {
      context.print.error(e);
      throw e;
    }
  } else {
    [authName] = Object.keys(context.amplify.getProjectDetails().amplifyMeta.auth);
  }

  return { resourceName, containerName, authName };
}

async function askResourceName(context, getAllDefaults) {
  const { amplify } = context;

  const { resourceName } = await inquirer.prompt([
    {
      name: 'resourceName',
      type: 'input',
      message: 'Provide a friendly name for your resource to be used as a label for this category in the project:',
      default: getAllDefaults.resourceName,
      validate: amplify.inputValidation({
        validation: {
          operator: 'regex',
          value: '^[a-zA-Z0-9]+$',
          onErrorMsg: 'Resource name should be alphanumeric',
        },
        required: true,
      }),
    },
  ]);

  return resourceName;
}

async function askContainerSource(context) {
  const containerQuestionChoices = createContainerQuestionChoices(context);

  const { containerFrom } = await inquirer.prompt({
    type: 'list',
    name: 'containerFrom',
    message: 'Choose where you want to get your container',
    choices: containerQuestionChoices
  });

  switch (containerFrom) {
    case 'newContainer':
      return newContainer(context);
    case 'projectContainer':
      return askContainerFromProject(context);
    default:
      throw new Error('Not supported');
  }
}

function createContainerQuestionChoices(context) {
  const containerQuestionChoices = [
    {
      name: 'Create a new container',
      value: 'newContainer'
    }
  ];

  if (hasContainers(context)) {
    containerQuestionChoices.push({
      name: 'Use a container from the current project',
      value: 'projectContainer'
    })
  }

  return containerQuestionChoices;
}

function hasContainers(context) {
  if (!context.amplify.getProjectDetails().amplifyMeta.function) {
    return false;
  }

  return containerList(context).length > 0;
}

function containerList(context) {
  const functionResources = context.amplify.getProjectDetails().amplifyMeta.function;
  const containersFound = [];

  Object.keys(functionResources).forEach(resourceName => {
    if (functionResources[resourceName].service === FunctionServiceName.ElasticContainer) {
      containersFound.push(resourceName);
    }
  });

  return containersFound;
}

async function newContainer(context) {
  let add;
  try {
    ({ add } = await import('amplify-category-function'));
  } catch (e) {
    throw new Error('Function plugin not installed in the CLI. You need to install it to use this feature.');
  }

  return add(context, 'awscloudformation', FunctionServiceName.ElasticContainer, {}).then(resourceName => {
    context.print.success('Succesfully added the Lambda function locally');
    return resourceName;
  });
}

async function askContainerFromProject(context) {
  const containerListChoices = containerList(context).map(resourceName => ({
    name: resourceName,
    value: resourceName
  }));

  const { containerName } = await inquirer.prompt({
    choices: containerListChoices,
    message: 'Select the container you want to use',
    type: 'list',
    name: 'containerName'
  });

  return containerName;
}

export async function updateWalkthrough(context, defaultValuesFilename) {
  const { amplify } = context;
  const { allResources } = await context.amplify.getResourceStatus();
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = await import(defaultValuesSrc);
  const allDefaultValues = getAllDefaults(amplify.getProjectDetails());
  const resources = allResources
    .filter(resource => resource.service === serviceName && !!resource.providerPlugin)
    .map(resource => resource.resourceName);

}