import { $TSContext } from "amplify-cli-core";
import { ServiceName } from "../service-utils/constants";
import { printer, prompter } from 'amplify-prompts';
import { getServiceFriendlyName } from './resourceWalkthrough';

/**
 * CLI walkthrough to select resource to be removed
 */
export const removeWalkthrough = async (context: $TSContext ,service: ServiceName) : Promise<string | undefined> => {
    const resources = await getServiceResources(context, service);
    const serviceFriendlyName = getServiceFriendlyName(service);

    if (resources.length === 0) {
        printer.error(`No ${serviceFriendlyName} exists in the project.`);
        return;
    }
    return await prompter.pick(`Select the ${serviceFriendlyName} you want to remove`, resources);
};

const getServiceResources = async (context: $TSContext, service: string): Promise<string[]> => {
    return ((await context.amplify.getResourceStatus()).allResources as any[])
    .filter(resource => resource.service === service)
    .map(resource => resource.resourceName);
};
