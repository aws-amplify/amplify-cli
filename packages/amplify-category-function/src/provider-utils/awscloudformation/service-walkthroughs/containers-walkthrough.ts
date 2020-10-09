import { ContainerParameters } from "amplify-function-plugin-interface";
import inquirer from "inquirer";
import uuid from 'uuid';

const category = 'api';
const serviceName = 'ECS';
const parametersFileName = 'container-params.json';
const cfnParametersFilename = 'container-parameters.json';

export async function createContainerWalkthrough(
  context: any,
  templateParameters: Partial<ContainerParameters>
): Promise<Partial<ContainerParameters>> {
  const { amplify } = context;
  // const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
  // const { getAllDefaults } = await import(defaultValuesSrc);
  // const allDefaultValues = getAllDefaults(amplify.getProjectDetails());
  let configurationParameters: Partial<ContainerParameters>;

  const answer = await inquirer.prompt([
    {
      name: 'resourceName',
      type: 'input',
      message: 'Provide a friendly name for your resource to be used as a label for this category in the project:',
      validate: amplify.inputValidation({
        validation: {
          operator: 'regex',
          value: '^[a-zA-Z0-9]+$',
          onErrorMsg: 'Resource name should be alphanumeric',
        },
        required: true,
      }),
      default: () => {
        const appName = context.amplify
          .getProjectDetails()
          .projectConfig.projectName.toLowerCase()
          .replace(/[^0-9a-zA-Z]/gi, '');
        const [shortId] = uuid().split('-');
        return `${appName}${shortId}`;
      }
    },
    {
      name: 'templateOrBringYourOwnContainer',
      type: 'list',
      message: 'Do you want to start from a container template or want to bring your own',
      choices: [
        {
          name: 'Start from container template',
          value: 'template'
        },
        {
          name: 'Bring my own container',
          value: 'byoc'
        }
      ],
      default: 'template'
    }
  ]);

  configurationParameters = {
    byoc: answer.templateOrBringYourOwnContainer === 'byoc',
    template: answer.templateOrBringYourOwnContainer === 'template',
    resourceName: answer.resourceName
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