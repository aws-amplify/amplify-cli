import { printer, prompter } from '@aws-amplify/amplify-prompts';
import { ServiceName } from '../service-utils/constants';
import { getGeoResources } from '../service-utils/resourceUtils';
import { getServiceFriendlyName } from './resourceWalkthrough';

/**
 * CLI walkthrough to select resource to be removed
 */
export const removeWalkthrough = async (service: ServiceName): Promise<string | undefined> => {
  const resources = await getGeoResources(service);
  const serviceFriendlyName = getServiceFriendlyName(service);

  if (resources.length === 0) {
    printer.error(`No ${serviceFriendlyName} exists in the project.`);
    return undefined;
  }
  return prompter.pick(`Select the ${serviceFriendlyName} you want to remove`, resources);
};
