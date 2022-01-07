import _ from 'lodash';
import { v4 as uuid } from "uuid";
import { merge } from '../service-utils/resourceUtils';
import { DataSourceIntendedUse, PlaceIndexParameters } from '../service-utils/placeIndexParams';
import { apiDocs, ServiceName } from '../service-utils/constants';
import { $TSContext } from 'amplify-cli-core';
import { getCurrentPlaceIndexParameters } from '../service-utils/placeIndexUtils';
import { getGeoServiceMeta, updateDefaultResource, checkGeoResourceExists } from '../service-utils/resourceUtils';
import { resourceAccessWalkthrough, dataProviderWalkthrough, getServiceFriendlyName, defaultResourceQuestion } from './resourceWalkthrough';
import { DataProvider } from '../service-utils/resourceParams';
import { printer, formatter, prompter, alphanumeric } from 'amplify-prompts';

const searchServiceFriendlyName = getServiceFriendlyName(ServiceName.PlaceIndex);
/**
 * Starting point for CLI walkthrough that creates a place index resource
 * @param context The Amplify Context object
 * @param parameters The configurations of the place index Resource
 */
export const createPlaceIndexWalkthrough = async (
  context: $TSContext,
  parameters: Partial<PlaceIndexParameters>
): Promise<Partial<PlaceIndexParameters>> => {
  // get the place index name
  parameters = merge(parameters, await placeIndexNameWalkthrough(context));

  // get the access
  parameters = merge(parameters, await resourceAccessWalkthrough(context, parameters, ServiceName.PlaceIndex));

  // optional advanced walkthrough
  parameters = merge(parameters, await placeIndexAdvancedWalkthrough(context, parameters));

  // ask if the place index should be set as a default. Default to true if it's the only place index
  const currentPlaceIndexResources = await getGeoServiceMeta(ServiceName.PlaceIndex);
  if (currentPlaceIndexResources && Object.keys(currentPlaceIndexResources).length > 0) {
    parameters.isDefault = await prompter.yesOrNo(
        defaultResourceQuestion(ServiceName.PlaceIndex),
        true
    );
  }
  else {
      parameters.isDefault = true;
  }

  return parameters;
};

export const placeIndexNameWalkthrough = async (context: any): Promise<Partial<PlaceIndexParameters>> => {
    let indexName;
    while(!indexName) {
        const [shortId] = uuid().split('-');
        const indexNameInput = await prompter.input(
            'Provide a name for the location search index (place index):',
            { validate: alphanumeric(), initial: `placeindex${shortId}` }
        );
        if (await checkGeoResourceExists(indexNameInput)) {
            printer.info(`Geo resource ${indexNameInput} already exists. Choose another name.`);
        }
        else indexName = indexNameInput;
    }
    return { name: indexName };
};

export const placeIndexAdvancedWalkthrough = async (
    context: $TSContext,
    parameters: Partial<PlaceIndexParameters>
): Promise<Partial<PlaceIndexParameters>> => {
    const advancedSettingOptions: string[] = ['Search data provider (default: HERE)'];
    advancedSettingOptions.push('Search result storage location (default: no result storage)');
    printer.info('Available advanced settings:');
    formatter.list(advancedSettingOptions);
    printer.blankLine();

    if(await prompter.yesOrNo('Do you want to configure advanced settings?', false)) {
        // get the place index data provider
        parameters = merge(parameters, await dataProviderWalkthrough(parameters, ServiceName.PlaceIndex));
    }
    else {
      parameters.dataProvider = DataProvider.Here;
      parameters.dataSourceIntendedUse = DataSourceIntendedUse.SingleUse;
    }

    return parameters;
};

export const placeIndexDataStorageWalkthrough = async (context:$TSContext, parameters: Partial<PlaceIndexParameters>): Promise<Partial<PlaceIndexParameters>> => {
  const areResultsStored = await prompter.yesOrNo(
    `Do you want to cache or store the results of search operations? Refer ${apiDocs.dataSourceUsage}`,
    parameters.dataSourceIntendedUse === DataSourceIntendedUse.Storage
  );
  const intendedUse = areResultsStored ? DataSourceIntendedUse.Storage : DataSourceIntendedUse.SingleUse;
  return { dataSourceIntendedUse: intendedUse };
};

/**
 * Starting point for CLI walkthrough that updates an existing place index resource
 * @param context The Amplify Context object
 * @param parameters The configurations of the place index resource
 * @param resourceToUpdate Name of the place index resource to update
 */
export const updatePlaceIndexWalkthrough = async (
    context: $TSContext,
    parameters: Partial<PlaceIndexParameters>,
    resourceToUpdate?: string
): Promise<Partial<PlaceIndexParameters>> => {
    const indexResources = ((await context.amplify.getResourceStatus()).allResources as any[])
    .filter(resource => resource.service === ServiceName.PlaceIndex)

    if (indexResources.length === 0) {
        printer.error(`No ${searchServiceFriendlyName} resource to update. Use "amplify add geo" to create a new ${searchServiceFriendlyName}.`);
        return parameters;
    }

    const indexResourceNames = indexResources.map(resource => resource.resourceName);

    if (resourceToUpdate) {
        if (!indexResourceNames.includes(resourceToUpdate)) {
            printer.error(`No ${searchServiceFriendlyName} named ${resourceToUpdate} exists in the project.`);
            return parameters;
        }
    }
    else {
        resourceToUpdate = await prompter.pick<'one', string>(`Select the ${searchServiceFriendlyName} you want to update`, indexResourceNames);
    }

    parameters.name = resourceToUpdate;
    parameters = merge(parameters, await getCurrentPlaceIndexParameters(resourceToUpdate));

    // overwrite the parameters based on user input
    const placeIndexAccessSettings = (await resourceAccessWalkthrough(context, parameters, ServiceName.PlaceIndex));
    parameters.accessType = placeIndexAccessSettings.accessType;
    parameters.groupPermissions = placeIndexAccessSettings.groupPermissions;

    const otherIndexResources = indexResourceNames.filter(indexResourceName => indexResourceName != resourceToUpdate);
    // if this is the only place index, default cannot be removed
    if (otherIndexResources.length > 0) {
        const isDefault = await prompter.yesOrNo(defaultResourceQuestion(ServiceName.PlaceIndex), true);
        // If a default place index is updated, ask for new default
        if (parameters.isDefault && !isDefault) {
            await updateDefaultPlaceIndexWalkthrough(context, resourceToUpdate, otherIndexResources);
        }
        parameters.isDefault = isDefault;
    }
    else {
        parameters.isDefault = true; // only place index is always the default
    }
    return parameters;
};

/**
 * Walkthrough to choose a different default place index
 * @param context The Amplify Context object
 * @param currentDefault The current default place index name
 * @param availablePlaceIndices The names of available place indices
 * @returns name of the new default place index choosen
 */
export const updateDefaultPlaceIndexWalkthrough = async (
    context: $TSContext,
    currentDefault: string,
    availablePlaceIndices?: string[]
): Promise<string> => {
    if (!availablePlaceIndices) {
      availablePlaceIndices = ((await context.amplify.getResourceStatus()).allResources as any[])
        .filter(resource => resource.service === ServiceName.PlaceIndex)
        .map(resource => resource.resourceName);
    }
    const otherIndexResources = availablePlaceIndices.filter(indexResourceName => indexResourceName != currentDefault);
    if (otherIndexResources?.length > 0) {
        const defaultIndexName = await prompter.pick(`Select the ${searchServiceFriendlyName} you want to set as default:`, otherIndexResources);
        await updateDefaultResource(context, ServiceName.PlaceIndex, defaultIndexName);
    }
    return currentDefault;
}
