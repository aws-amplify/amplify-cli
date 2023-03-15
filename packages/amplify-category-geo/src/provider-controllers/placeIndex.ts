import { $TSContext } from 'amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import { category } from '../constants';
import { ServiceName } from '../service-utils/constants';
import { convertToCompletePlaceIndexParams, PlaceIndexParameters } from '../service-utils/placeIndexParams';
import { createPlaceIndexResource, getCurrentPlaceIndexParameters, modifyPlaceIndexResource } from '../service-utils/placeIndexUtils';
import {
  createPlaceIndexWalkthrough,
  updateDefaultPlaceIndexWalkthrough,
  updatePlaceIndexWalkthrough,
} from '../service-walkthroughs/placeIndexWalkthrough';
import { removeWalkthrough } from '../service-walkthroughs/removeWalkthrough';
import { printNextStepsSuccessMessage, setProviderContext } from './index';

export const addPlaceIndexResource = async (context: $TSContext): Promise<string> => {
  // initialize the Place Index parameters
  const placeIndexParams: Partial<PlaceIndexParameters> = {
    providerContext: setProviderContext(context, ServiceName.PlaceIndex),
  };
  // populate the parameters for the resource
  await createPlaceIndexWalkthrough(context, placeIndexParams);
  const completeParameters: PlaceIndexParameters = convertToCompletePlaceIndexParams(placeIndexParams);

  await createPlaceIndexResource(context, completeParameters);

  printer.success(`Successfully added resource ${completeParameters.name} locally.`);
  printNextStepsSuccessMessage();
  return completeParameters.name;
};

export const updatePlaceIndexResource = async (context: $TSContext): Promise<string> => {
  const placeIndexParams: Partial<PlaceIndexParameters> = {
    providerContext: setProviderContext(context, ServiceName.PlaceIndex),
  };
  // populate the parameters for the resource
  await updatePlaceIndexWalkthrough(context, placeIndexParams);

  const completeParameters: PlaceIndexParameters = convertToCompletePlaceIndexParams(placeIndexParams);
  await modifyPlaceIndexResource(context, completeParameters);

  printer.success(`Successfully updated resource ${placeIndexParams.name} locally.`);
  printNextStepsSuccessMessage();
  return completeParameters.name;
};

export const removePlaceIndexResource = async (context: $TSContext): Promise<string | undefined> => {
  const resourceToRemove = await removeWalkthrough(ServiceName.PlaceIndex);
  if (!resourceToRemove) return undefined;

  const resourceParameters = await getCurrentPlaceIndexParameters(resourceToRemove);

  const resource = await context.amplify.removeResource(context, category, resourceToRemove);
  if (resource?.service === ServiceName.PlaceIndex && resourceParameters.isDefault) {
    // choose another default if removing a default place index
    await updateDefaultPlaceIndexWalkthrough(context, resource?.resourceName);
  }

  context.amplify.updateBackendConfigAfterResourceRemove(category, resourceToRemove);

  printNextStepsSuccessMessage();
  return resourceToRemove;
};
