import _, { join } from 'lodash';
import inquirer from 'inquirer';
import { merge } from '../utils/resourceUtils';
import { HereMapStyleType, MapParameters, EsriMapStyleType } from '../utils/mapParams';
import uuid from 'uuid';
import { AccessType, DataProvider, PricingPlan } from '../utils/resourceParams';
import { apiDocs, ServiceName } from '../utils/constants';
import { $TSContext } from 'amplify-cli-core';
import { getCurrentMapParameters, updateDefaultMap, getMapFriendlyName } from '../utils/mapResourceUtils';
import { getServiceMetaInfo } from '../utils/resourceUtils';

/**
 * Starting point for CLI walkthrough that creates a map resource
 * @param context The Amplify Context object
 * @param parameters The configurations of the Map Resource
 */
export async function createMapWalkthrough(
  context: $TSContext,
  parameters: Partial<MapParameters>
): Promise<Partial<MapParameters>> {
  // get the map name
  parameters = merge(parameters, await mapNameWalkthrough(context));

  // get the map data provider
  parameters = merge(parameters, await mapDataProviderWalkthrough(parameters));

  // get the map style parameters
  parameters = merge(parameters, await mapStyleWalkthrough(parameters));

  // get the access
  parameters = merge(parameters, await mapAccessWalkthrough(parameters));

  // get the pricing plan
  parameters = merge(parameters, await pricingPlanWalkthrough(parameters));

  // ask if the map should be set as a default. Default to true if it's the only map
  const currentMapResources = await getServiceMetaInfo(context, ServiceName.Map);
  if (currentMapResources && Object.keys(currentMapResources).length > 0) {
    parameters.isDefaultMap = await context.amplify.confirmPrompt('Do you want to set this map as default?', true)
  }
  else {
      parameters.isDefaultMap = true;
  }

  return parameters;
}

export async function mapNameWalkthrough(context: any): Promise<Partial<MapParameters>> {
    const mapNamePrompt = {
        type: 'input',
        name: 'mapName',
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
    return await inquirer.prompt([mapNamePrompt]);
}

export async function mapDataProviderWalkthrough(parameters: Partial<MapParameters>): Promise<Partial<MapParameters>> {
    const dataProviderPrompt = {
        type: 'list',
        name: 'dataProvider',
        message: 'Specify the data provider of geospatial data:',
        choices: Object.keys(DataProvider),
        default: parameters.dataProvider ? parameters.dataProvider : 'Esri'
    };
    return await inquirer.prompt([dataProviderPrompt]);
}

export async function mapStyleTypeWalkthrough(parameters: Partial<MapParameters>): Promise<Partial<MapParameters>> {
    const mapStyleTypePrompt = {
        type: 'list',
        name: 'mapStyleType',
        message: `Specify the map style. Refer ${apiDocs.mapStyles}`,
        choices: Object.keys(EsriMapStyleType),
        default: parameters.mapStyleType ? parameters.mapStyleType : 'Streets'
    };
    return await inquirer.prompt([mapStyleTypePrompt]);
}

export async function mapAccessWalkthrough(parameters: Partial<MapParameters>): Promise<Partial<MapParameters>> {
    const mapAccessPrompt = {
        type: 'list',
        name: 'accessType',
        message: 'Who should have access?',
        choices: Object.keys(AccessType),
        default: parameters.accessType ? parameters.accessType : 'AuthorizedUsers'
    };
    return await inquirer.prompt([mapAccessPrompt]);
}

export async function pricingPlanWalkthrough(parameters: Partial<MapParameters>): Promise<Partial<MapParameters>> {
    const pricingPlanPrompt = {
        type: 'list',
        name: 'pricingPlan',
        message: 'Specify the pricing plan for the map: Refer https://aws.amazon.com/location/pricing/',
        choices: Object.values(PricingPlan),
        default: parameters.pricingPlan ? parameters.pricingPlan : 'RequestBasedUsage'
    };
    return await inquirer.prompt([pricingPlanPrompt]);
}

export async function mapStyleWalkthrough(parameters:Partial<MapParameters>): Promise<Partial<MapParameters>> {
    let params: Partial<MapParameters> = parameters;
    if (params.dataProvider == DataProvider.Here) {
        // single style supported for Here Maps
        params.mapStyleType = HereMapStyleType.Berlin;
    }
    else {
        // get the Esri map style type
        params = merge(params, await mapStyleTypeWalkthrough(parameters));
    }
    return params;
}


/**
 * Starting point for CLI walkthrough that updates an existing map resource
 * @param context The Amplify Context object
 * @param parameters The configurations of the Map resource
 * @param resourceToUpdate Name of the Map resource to update
 */
export async function updateMapWalkthrough(context: $TSContext, parameters?: Partial<MapParameters>, resourceToUpdate?: string) {
    const mapResources = ((await context.amplify.getResourceStatus()).allResources as any[])
    .filter(resource => resource.service === ServiceName.Map)

    if (mapResources.length === 0) {
        context.print.error('No Map resource to update. Use "amplify add geo" to create a new Map.');
        return;
    }

    const mapResourceNames = mapResources.map(resource => resource.resourceName);

    if (resourceToUpdate) {
        if (!mapResourceNames.includes(resourceToUpdate)) {
        context.print.error(`No Map named ${resourceToUpdate} exists in the project.`);
        return;
        }
    } else {
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

    parameters.mapName = resourceToUpdate;
    parameters = merge(parameters, getCurrentMapParameters(context, resourceToUpdate));

    // overwrite the parameters based on user input
    parameters.accessType = (await mapAccessWalkthrough(parameters)).accessType;

    const otherMapResources = mapResourceNames.filter(mapResourceName => mapResourceName != resourceToUpdate);
    // if this is the only map, default cannot be removed
    if (otherMapResources.length > 0) {
        const isDefaultMap = await context.amplify.confirmPrompt('Do you want to set this map as default?', true);
        // If a default map is updated, ask for new default
        if (parameters.isDefaultMap && !isDefaultMap) {
            await updateDefaultMapWalkthrough(context, resourceToUpdate, otherMapResources);
        }
        parameters.isDefaultMap = isDefaultMap;
    }
    else {
        parameters.isDefaultMap = true; // only map is always the default
    }
    return parameters;
}

/**
 * Walkthrough to choose a different default map
 * @param context The Amplify Context object
 * @param currentDefault The current default map name
 * @param availableMaps The names of available maps
 * @returns name of the new default map choosen
 */
export async function updateDefaultMapWalkthrough(context: $TSContext, currentDefault: string, availableMaps?: string[]): Promise<string> {
    if (!availableMaps) {
        availableMaps = ((await context.amplify.getResourceStatus()).allResources as any[])
        .filter(resource => resource.service === ServiceName.Map)
        .map(resource => resource.resourceName);
    }
    const otherMapResources = availableMaps.filter(mapResourceName => mapResourceName != currentDefault);
    if (otherMapResources && otherMapResources.length > 0) {
        const mapChoices = [];
        const mapFriendlyNames = await getMapFriendlyName(context, otherMapResources);
        for (let [index, val] of mapFriendlyNames.entries()) {
            mapChoices.push({ name: val, value:otherMapResources[index] });
        }
        const defaultMapQuestion = [
            {
                name: 'defaultMapName',
                message: 'Select the Map you want to set as default:',
                type: 'list',
                choices: mapChoices
            }
        ];
        const defaultMapName = (await inquirer.prompt(defaultMapQuestion)).defaultMapName as string;
        await updateDefaultMap(context, defaultMapName);
    }
    return currentDefault;
}
