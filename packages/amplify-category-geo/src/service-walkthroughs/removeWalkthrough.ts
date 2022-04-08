import { $TSContext } from "amplify-cli-core";
import { ServiceName } from "../service-utils/constants";
import { printer, prompter } from 'amplify-prompts';
import { getServiceFriendlyName } from './resourceWalkthrough';
import { getGeoResources } from '../service-utils/resourceUtils';

/**
 * CLI walkthrough to select resource to be removed
 */
export const removeWalkthrough = async (context: $TSContext ,service: ServiceName) : Promise<string | undefined> => {
    const resources = await getGeoResources(service);
    const serviceFriendlyName = getServiceFriendlyName(service);

    if (resources.length === 0) {
        printer.error(`No ${serviceFriendlyName} exists in the project.`);
        return;
    }
    return await prompter.pick(`Select the ${serviceFriendlyName} you want to remove`, resources);
};
