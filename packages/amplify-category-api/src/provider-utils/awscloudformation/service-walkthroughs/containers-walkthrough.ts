import { ServiceName as FunctionServiceName } from 'amplify-category-function';
import inquirer from 'inquirer';
import { DEPLOYMENT_MECHANISM } from '../ecs-stack';

const category = 'api';
const serviceName = 'CloudFront';
const parametersFileName = 'container-params.json';
const cfnParametersFilename = 'container-parameters.json';

export type ServiceConfiguration = {
  resourceName: string;
  imageSource: { type: IMAGE_SOURCE_TYPE; template?: string };
  githubPath: string;
  authName: string;
  githubToken: string;
  deploymentMechanism: DEPLOYMENT_MECHANISM;
  restrictAccess: boolean;
};

export async function serviceWalkthrough(context, defaultValuesFilename): Promise<Partial<ServiceConfiguration>> {
  const { checkRequirements, externalAuthEnable } = await import('amplify-category-auth');

  const { amplify, print } = context;
  const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  const { getAllDefaults } = await import(defaultValuesSrc);
  const allDefaultValues = getAllDefaults(amplify.getProjectDetails());

  const resourceName = await askResourceName(context, getAllDefaults);

  const containerInfo = await askContainerSource(context);

  return { resourceName, ...containerInfo };
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

export enum IMAGE_SOURCE_TYPE {
  TEMPLATE = 'TEMPLATE',
  CUSTOM = 'CUSTOM',
}

async function newContainer(context): Promise<Partial<ServiceConfiguration>> {
  let imageSource: { type: IMAGE_SOURCE_TYPE; template?: string };

  do {
    ({ imageSource } = await inquirer.prompt([
      {
        name: 'imageSource',
        type: 'list',
        message: 'What image would you like to use',
        choices: [
          {
            name: 'ExpressJS - Hello World sample',
            value: { type: IMAGE_SOURCE_TYPE.TEMPLATE, template: 'express_hello_world' },
          },
          {
            name: 'ExpressJS - REST',
            value: { type: IMAGE_SOURCE_TYPE.TEMPLATE, template: 'express_rest' },
          },
          {
            name: 'ExpressJS - GraphQL',
            value: { type: IMAGE_SOURCE_TYPE.TEMPLATE, template: 'express_graphql' },
          },
          {
            name: 'Custom (bring your own Dockerfile or docker-compose.yml)',
            value: { type: IMAGE_SOURCE_TYPE.CUSTOM },
          },
          {
            name: 'Learn More',
            value: undefined,
          },
        ],
        default: 'express_hello_world',
      },
    ]));
  } while (imageSource === undefined);

  let deploymentMechanismQuestion;

  const deploymentMechanismChoices = [
    {
      name: 'On every "amplify push" (Fully managed container source)',
      value: DEPLOYMENT_MECHANISM.FULLY_MANAGED,
    },
  ];

  if (imageSource.type === IMAGE_SOURCE_TYPE.CUSTOM) {
    deploymentMechanismChoices.push({
      name: 'On every Github commit (Independently managed container source)',
      value: DEPLOYMENT_MECHANISM.INDENPENDENTLY_MANAGED,
    });
  }

  deploymentMechanismChoices.push({
    name: 'Advanced: Self-managed (Learn more: docs.amplify.aws/function/container#...)',
    value: DEPLOYMENT_MECHANISM.SELF_MANAGED,
  });

  do {
    deploymentMechanismQuestion = await inquirer.prompt([
      {
        name: 'deploymentMechanism',
        type: 'list',
        message: 'When do you want to build & deploy the Fargate task',
        choices: deploymentMechanismChoices,
      },
    ]);
  } while (deploymentMechanismQuestion.deploymentMechanism === 'Learn More');

  let githubPath, githubToken;

  if (deploymentMechanismQuestion.deploymentMechanism === DEPLOYMENT_MECHANISM.INDENPENDENTLY_MANAGED) {
    context.print.info('We need a Github Personal Access Token to automatically build & deploy your Fargate task on every Github commit.');

    const githubQuestions = await inquirer.prompt([
      {
        name: 'github_access_token',
        type: 'password',
        message: 'GitHub Personal Access Token:',
      },
      {
        name: 'github_path',
        type: 'input',
        message: 'Path to your repo:',
      },
    ]);

    githubPath = githubQuestions.github_path;
    githubToken = githubQuestions.github_access_token;
  }

  const restrictApiQuestion = await inquirer.prompt({
    name: 'rescrict_access',
    type: 'confirm',
    message: 'Do you want to restrict API access',
    default: true,
  });

  return {
    imageSource,
    githubPath,
    githubToken,
    deploymentMechanism: deploymentMechanismQuestion.deploymentMechanism,
    restrictAccess: restrictApiQuestion.rescrict_access,
  };
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
