import { ContainerParameters } from "amplify-function-plugin-interface";
import inquirer from "inquirer";
import uuid from 'uuid';
import { askExecRolePermissionsQuestions } from "./execPermissionsWalkthrough";
import { scheduleWalkthrough } from "./scheduleWalkthrough";

const category = 'api';
const serviceName = 'ECS';
const parametersFileName = 'container-params.json';
const cfnParametersFilename = 'container-parameters.json';

export async function createContainerWalkthrough(
  context: any,
  templateParameters: Partial<ContainerParameters>
): Promise<Partial<ContainerParameters>> {
  const { amplify, print } = context;
  // const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  // const { getAllDefaults } = await import(defaultValuesSrc);
  // const allDefaultValues = getAllDefaults(amplify.getProjectDetails());
  let configurationParameters: Partial<ContainerParameters>;

  const resourceNameQuestion = await inquirer.prompt([
    {
      name: 'resourceName',
      type: 'input',
      message: 'Provide a name for your Fargate task:',
      validate: amplify.inputValidation({
        validation: {
          operator: 'regex',
          value: '^[a-zA-Z0-9]+$',
          onErrorMsg: 'Resource name should be alphanumeric',
        },
        required: true,
      }),
      default: () => {
        const [shortId] = uuid().split('-');
        return `fargate${shortId}`;
      }
    }
  ]);

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

  let githubPath;

  if (deploymentMechanismQuestion.deploymentMechanism === 'INDEPENDENTLY') {
    print.info('We need a Github Personal Access Token to automatically build & deploy your Fargate task on every Github commit.');

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
  }

  let rolePermissions;
  if (await context.amplify.confirmPrompt('Do you want to access other resources in this project from your Lambda function?')) {
      rolePermissions = await askExecRolePermissionsQuestions(context, resourceNameQuestion.resourceName, undefined, undefined);
  }

  const scheduleOptions = await scheduleWalkthrough(context, {resourceName: resourceNameQuestion.resourceName});

  configurationParameters = {
    imageTemplate: imageTemplate.imageSource,
    resourceName: resourceNameQuestion.resourceName,
    githubPath,
    deploymentMechanism: deploymentMechanismQuestion.deploymentMechanism,
    categoryPolicies: rolePermissions? rolePermissions.categoryPolicies : [],
    scheduleOptions,
    dependsOn: rolePermissions? rolePermissions.dependsOn : [],
    environmentMap: rolePermissions? rolePermissions.environmentMap : {},
    mutableParametersState: rolePermissions? rolePermissions.mutableParametersState : {},
  }

  return configurationParameters;
}

export async function updateContainerWalkthrough(
  context,
  resourceToUpdate?: string,
  params?: Partial<ContainerParameters>
): Promise<Partial<ContainerParameters>> {
  const { amplify } = context;
  const { allResources } = await context.amplify.getResourceStatus();
  // const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  // const { getAllDefaults } = await import(defaultValuesSrc);
  // const allDefaultValues = getAllDefaults(amplify.getProjectDetails());
  const resources = allResources
    .filter(resource => resource.service === serviceName && !!resource.providerPlugin)
    .map(resource => resource.resourceName);

  return {};

}