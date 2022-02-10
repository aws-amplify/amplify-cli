import { createPlaceIndexResource, modifyPlaceIndexResource, getCurrentPlaceIndexParameters } from '../service-utils/placeIndexUtils';
import { removeWalkthrough } from '../service-walkthroughs/removeWalkthrough';
import { category } from '../constants';
import { updateDefaultPlaceIndexWalkthrough, createPlaceIndexWalkthrough, updatePlaceIndexWalkthrough } from '../service-walkthroughs/placeIndexWalkthrough';
import { convertToCompletePlaceIndexParams, PlaceIndexParameters } from '../service-utils/placeIndexParams';
import { $TSAny, $TSContext } from 'amplify-cli-core';
import { printNextStepsSuccessMessage, setProviderContext, insufficientInfoForUpdateError } from './index';
import { ServiceName } from '../service-utils/constants';
import { printer } from 'amplify-prompts';

export const addPlaceIndexResource = async (
  context: $TSContext
): Promise<string> => {
  // initialize the Place Index parameters
  let placeIndexParams: Partial<PlaceIndexParameters> = {
    providerContext: setProviderContext(context, ServiceName.PlaceIndex)
  };
  // populate the parameters for the resource
  await createPlaceIndexWalkthrough(context, placeIndexParams);
  const completeParameters: PlaceIndexParameters = convertToCompletePlaceIndexParams(placeIndexParams);

  await createPlaceIndexResource(context, completeParameters);

  printer.success(`Successfully added resource ${completeParameters.name} locally.`);
  printNextStepsSuccessMessage(context);
  return completeParameters.name;
};

export const updatePlaceIndexResource = async (
  context: $TSContext
): Promise<string> => {
  let placeIndexParams: Partial<PlaceIndexParameters> = {
    providerContext: setProviderContext(context, ServiceName.PlaceIndex)
  };
  // populate the parameters for the resource
  await updatePlaceIndexWalkthrough(context, placeIndexParams);

  const completeParameters: PlaceIndexParameters = convertToCompletePlaceIndexParams(placeIndexParams);
  await modifyPlaceIndexResource(context, completeParameters);

  printer.success(`Successfully updated resource ${placeIndexParams.name} locally.`);
  printNextStepsSuccessMessage(context);
  return completeParameters.name;
};

export const removePlaceIndexResource = async (
  context: any
): Promise<string | undefined> => {
  const { amplify } = context;
  const resourceToRemove = await removeWalkthrough(context, ServiceName.PlaceIndex);
  if (!resourceToRemove) return;

  const resourceParameters = await getCurrentPlaceIndexParameters(resourceToRemove);

  try {
    await amplify.removeResource(context, category, resourceToRemove)
    .then(async (resource: { service: string; resourceName: string }) => {
      if (resource?.service === ServiceName.PlaceIndex && resourceParameters.isDefault) {
        // choose another default if removing a default place index
        await updateDefaultPlaceIndexWalkthrough(context, resource.resourceName);
      }
    });
  } catch (err: $TSAny) {
    if (err.stack) {
      printer.error(err.stack);
      printer.error(err.message);
      printer.error(`An error occurred when removing the geo resource ${resourceToRemove}`);
    }

    context.usageData.emitError(err);
    process.exitCode = 1;
  }

  printNextStepsSuccessMessage(context);
  return resourceToRemove;
};
