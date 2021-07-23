import _ from 'lodash';
import uuid from 'uuid';
import inquirer from 'inquirer';
import { merge } from '../service-utils/resourceUtils';
import { MapParameters, getGeoMapStyle, MapStyle, getMapStyleComponents, EsriMapStyleType } from '../service-utils/mapParams';
import { apiDocs, ServiceName } from '../service-utils/constants';
import { $TSContext } from 'amplify-cli-core';
import { getCurrentMapParameters, getMapFriendlyNames } from '../service-utils/mapUtils';
import { getGeoServiceMeta, updateDefaultResource, geoServiceExists, getGeoPricingPlan} from '../service-utils/resourceUtils';
import { resourceAccessWalkthrough, pricingPlanWalkthrough } from './resourceWalkthrough';
import { DataProvider } from '../service-utils/resourceParams';

/**
 * Starting point for CLI walkthrough that creates a map resource
 * @param context The Amplify Context object
 * @param parameters The configurations of the Map Resource
 */
export const createMapWalkthrough = async (
  context: $TSContext,
  parameters: Partial<MapParameters>
): Promise<Partial<MapParameters>> => {
  // get the map name
  parameters = merge(parameters, await mapNameWalkthrough(context));

  // get the access
  parameters = merge(parameters, await resourceAccessWalkthrough(parameters, ServiceName.Map));

  // initiate pricing plan walkthrough if this is the first Map/Place Index added
  if (!(await geoServiceExists(ServiceName.Map)) && !(await geoServiceExists(ServiceName.PlaceIndex))) {
    parameters = merge(parameters, await pricingPlanWalkthrough(context, parameters));
  }

  // optional advanced walkthrough
  parameters = merge(parameters, await mapAdvancedWalkthrough(context, parameters));

  // ask if the map should be set as a default. Default to true if it's the only map
  const currentMapResources = await getGeoServiceMeta(ServiceName.Map);
  if (currentMapResources && Object.keys(currentMapResources).length > 0) {
    parameters.isDefault = await context.amplify.confirmPrompt(
        'Do you want to set this map as default? It will be used in Amplify Map API calls if no explicit reference is provided.',
        true
    );
  }
  else {
      parameters.isDefault = true;
  }

  return parameters;
};

export const mapNameWalkthrough = async (context: any): Promise<Partial<MapParameters>> => {
    const mapNamePrompt = {
        type: 'input',
        name: 'name',
        message: 'Provide a name for the Map:',
        validate: context.amplify.inputValidation({
            operator: 'regex',
            value: '^[a-zA-Z0-9]+$',
            onErrorMsg: 'You can use the following characters: a-z A-Z 0-9',
            required: true,
        }),
        default: () => {
            const [shortId] = uuid().split('-');
            return `map${shortId}`;
        },
    };
    return { name: (await inquirer.prompt([mapNamePrompt])).name as string };
};

export const mapAdvancedWalkthrough = async (context: $TSContext, parameters: Partial<MapParameters>): Promise<Partial<MapParameters>> => {
    // const includePricingPlan = await geoServiceExists(ServiceName.Map) || await geoServiceExists(ServiceName.PlaceIndex);
    const includePricingPlan = false;
    const currentPricingPlan = parameters.pricingPlan ? parameters.pricingPlan : await getGeoPricingPlan();
    context.print.info('Available advanced settings:');
    context.print.info('- Map style & Map data provider (default: Streets provided by Esri)');
    if (includePricingPlan) {
        context.print.info(`- Map pricing plan (current: ${currentPricingPlan})`);
    }
    context.print.info('');

    if(await context.amplify.confirmPrompt('Do you want to configure advanced settings?', false)) {
        // get the map style parameters
        parameters = merge(parameters, await mapStyleWalkthrough(parameters));

        if (includePricingPlan) {
            // get the pricing plan
            parameters = merge(parameters, await pricingPlanWalkthrough(context, parameters));
        }
        else {
            parameters.pricingPlan = currentPricingPlan;
        }
    }
    else {
        parameters.dataProvider = DataProvider.Esri;
        parameters.mapStyleType = EsriMapStyleType.Streets;
        parameters.pricingPlan = currentPricingPlan;
    }

    return parameters;
};

export const mapStyleWalkthrough = async (parameters: Partial<MapParameters>): Promise<Partial<MapParameters>> => {
    const mapStyleChoices = [
        { name: 'Streets (data provided by Esri)', value: MapStyle.VectorEsriStreets },
        { name: 'Berlin (data provided by Here)', value: MapStyle.VectorHereBerlin },
        { name: 'Topographic (data provided by Esri)', value: MapStyle.VectorEsriTopographic },
        { name: 'Navigation (data provided by Esri)', value: MapStyle.VectorEsriNavigation },
        { name: 'LightGrayCanvas (data provided by Esri)', value: MapStyle.VectorEsriLightGrayCanvas },
        { name: 'DarkGrayCanvas (data provided by Esri)', value: MapStyle.VectorEsriDarkGrayCanvas }
    ];
    const mapStyleDefault = parameters.dataProvider && parameters.mapStyleType ?
        getGeoMapStyle(parameters.dataProvider, parameters.mapStyleType) : 'VectorEsriStreets';

    const mapStyleTypePrompt = {
        type: 'list',
        name: 'mapStyle',
        message: `Specify the map style. Refer ${apiDocs.mapStyles}`,
        choices: mapStyleChoices,
        default: mapStyleDefault
    };
    return getMapStyleComponents((await inquirer.prompt([mapStyleTypePrompt])).mapStyle as MapStyle);
};

/**
 * Starting point for CLI walkthrough that updates an existing map resource
 * @param context The Amplify Context object
 * @param parameters The configurations of the Map resource
 * @param resourceToUpdate Name of the Map resource to update
 */
export const updateMapWalkthrough = async (
    context: $TSContext,
    parameters: Partial<MapParameters>,
    resourceToUpdate?: string
): Promise<Partial<MapParameters>> => {
    const mapResources = ((await context.amplify.getResourceStatus()).allResources as any[])
    .filter(resource => resource.service === ServiceName.Map)

    if (mapResources.length === 0) {
        context.print.error('No Map resource to update. Use "amplify add geo" to create a new Map.');
        return parameters;
    }

    const mapResourceNames = mapResources.map(resource => resource.resourceName);

    if (resourceToUpdate) {
        if (!mapResourceNames.includes(resourceToUpdate)) {
            context.print.error(`No Map named ${resourceToUpdate} exists in the project.`);
            return parameters;
        }
    }
    else {
        const resourceQuestion = [
            {
                name: 'resourceName',
                message: 'Select the Map you want to update',
                type: 'list',
                choices: mapResourceNames,
            }
        ];
        resourceToUpdate = (await inquirer.prompt(resourceQuestion)).resourceName as string;
    }

    parameters.name = resourceToUpdate;
    parameters = merge(parameters, await getCurrentMapParameters(resourceToUpdate));

    // overwrite the parameters based on user input
    parameters.accessType = (await resourceAccessWalkthrough(parameters, ServiceName.Map)).accessType;

    const otherMapResources = mapResourceNames.filter(mapResourceName => mapResourceName != resourceToUpdate);
    // if this is the only map, default cannot be removed
    if (otherMapResources.length > 0) {
        const isDefault = await context.amplify.confirmPrompt('Do you want to set this map as default?', true);
        // If a default map is updated, ask for new default
        if (parameters.isDefault && !isDefault) {
            await updateDefaultMapWalkthrough(context, resourceToUpdate, otherMapResources);
        }
        parameters.isDefault = isDefault;
    }
    else {
        parameters.isDefault = true; // only map is always the default
    }
    return parameters;
};

/**
 * Walkthrough to choose a different default map
 * @param context The Amplify Context object
 * @param currentDefault The current default map name
 * @param availableMaps The names of available maps
 * @returns name of the new default map choosen
 */
export const updateDefaultMapWalkthrough = async (
    context: $TSContext,
    currentDefault: string,
    availableMaps?: string[]
): Promise<string> => {
    if (!availableMaps) {
        availableMaps = ((await context.amplify.getResourceStatus()).allResources as any[])
        .filter(resource => resource.service === ServiceName.Map)
        .map(resource => resource.resourceName);
    }
    const otherMapResources = availableMaps.filter(mapResourceName => mapResourceName != currentDefault);
    if (otherMapResources?.length > 0) {
        const mapFriendlyNames = await getMapFriendlyNames(otherMapResources);
        const mapChoices = mapFriendlyNames.map((friendlyName, index) => ({ name: friendlyName, value: otherMapResources[index] }));

        const defaultMapQuestion = [
            {
                name: 'defaultMapName',
                message: 'Select the Map you want to set as default:',
                type: 'list',
                choices: mapChoices
            }
        ];
        const defaultMapName = (await inquirer.prompt(defaultMapQuestion)).defaultMapName as string;
        await updateDefaultResource(context, ServiceName.Map, defaultMapName);
    }
    return currentDefault;
}
