import { ServiceName as FunctionServiceName } from 'amplify-category-function';
import inquirer from "inquirer";

const category = 'api';
const serviceName = 'CloudFront';
const parametersFileName = 'container-params.json';
const cfnParametersFilename = 'container-parameters.json';

export type ServiceConfiguration = { 
  resourceName: string, 
  imageTemplate: string, 
  githubPath: string,
  authName: string,
  githubToken: string;
  deploymentMechanism: string;
}

export async function serviceWalkthrough(context, defaultValuesFilename): Promise<Partial<ServiceConfiguration>> {
  const { checkRequirements, externalAuthEnable } = await import('amplify-category-auth');

  const { amplify, print } = context;
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = await import(defaultValuesSrc);
  const allDefaultValues = getAllDefaults(amplify.getProjectDetails());

  const resourceName = await askResourceName(context, getAllDefaults);

  const containerInfo = await askContainerSource(context);

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

  return { resourceName, ...containerInfo, authName };
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

async function askContainerSource(context): Promise<Partial<ServiceConfiguration>> {
  return newContainer(context);
}

async function newContainer(context): Promise<Partial<ServiceConfiguration>> {
  let imageTemplate;
  do {
    imageTemplate = await inquirer.prompt([
      {
        name: 'imageSource',
        type: 'list',
        message: 'What image would you like to use',
        choices: [
          {
            name: 'ExpressJS - Hello World sample',
            value: 'express_hello_world'
          },
          {
            name: 'ExpressJS - REST',
            value: 'express_rest'
          },
          {
            name: 'ExpressJS - GraphQL',
            value: 'express_graphql'
          },
          {
            name: 'Custom (bring your own Dockerfile or docker-compose.yml)',
            value: 'custom'
          },
          {
            name: 'Learn More',
            value: 'Learn More',
          },
        ],
        default: 'express_hello_world'
      }
    ]);
  } while (imageTemplate.imageSource === 'Learn More')

  let deploymentMechanismQuestion;

  const deploymentMechanismChoices = [
    {
      name: 'On every "amplify push" (Fully managed container source)',
      value: 'FULLY_MANAGED'
    }
  ];

  if (imageTemplate.imageSource === 'custom') {
    deploymentMechanismChoices.push(
      {
        name: 'On every Github commit (Independently managed container source)',
        value: 'INDEPENDENTLY'
      }
    );
  }

  deploymentMechanismChoices.push({
    name: 'Advanced: Self-managed (Learn more: docs.amplify.aws/function/container#...)',
    value: 'ADVANCE'
  });

  do {
    deploymentMechanismQuestion = await inquirer.prompt([
      {
        name: 'deploymentMechanism',
        type: 'list',
        message: 'When do you want to build & deploy the Fargate task',
        choices: deploymentMechanismChoices
      }
    ])
  } while (deploymentMechanismQuestion.deploymentMechanism === 'Learn More')

  let githubPath, githubToken;

  if (deploymentMechanismQuestion.deploymentMechanism === 'INDEPENDENTLY') {
    context.print.info('We need a Github Personal Access Token to automatically build & deploy your Fargate task on every Github commit.');

    const githubQuestions = await inquirer.prompt([
      {
        name: 'github_access_token',
        type: 'input',
        message: 'GitHub Personal Access Token:',
      },
      {
        name: 'github_path',
        type: 'input',
        message: 'Path to your repo:',
      }
    ]);

    githubPath = githubQuestions.github_path;
    githubToken = githubQuestions.github_access_token;
  }

  return {
    imageTemplate: imageTemplate.imageSource,
    githubPath,
    githubToken,
    deploymentMechanism: deploymentMechanismQuestion.deploymentMechanism
  }
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