import inquirer from "inquirer";

const category = 'api';
const serviceName = 'ALB';
const parametersFileName = 'container-params.json';
const cfnParametersFilename = 'container-parameters.json';

export async function serviceWalkthrough(context, defaultValuesFilename) {
    const { amplify, print } = context;
    const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
    const { getAllDefaults } = await import(defaultValuesSrc);
    const allDefaultValues = getAllDefaults(amplify.getProjectDetails());

    let answers = {
        containers: true
    }

    const answer = await inquirer.prompt([
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
    ])

    print.info({answer});
    
    return { answers };
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