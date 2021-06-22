import { $TSContext } from "amplify-cli-core";
import inquirer from 'inquirer';

/**
 * CLI walkthrough to select resource to be removed
 */
export async function removeWalkthrough(context: $TSContext ,service: string) : Promise<string> {
    const resources = await getServiceResources(context, service);
    
    if (resources.length === 0) {
        context.print.error(`No ${service} type resource exists in the project.`);
        return;
    }

    const removeQuestion = [
        {
            name: 'resourceName',
            message: `Select the ${service} you want to remove`,
            type: 'list',
            choices: resources,
        }
    ];
    return (await inquirer.prompt(removeQuestion)).resourceName as string;

}

async function getServiceResources(context: $TSContext, service: string): Promise<string[]> {
    return ((await context.amplify.getResourceStatus()).allResources as any[])
    .filter(resource => resource.service === service)
    .map(resource => resource.resourceName);
}
