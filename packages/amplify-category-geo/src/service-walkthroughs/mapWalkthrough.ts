import _ from 'lodash';
import { v4 as uuid } from "uuid";
import { merge } from '../service-utils/resourceUtils';
import { MapParameters, getGeoMapStyle, MapStyle, getMapStyleComponents, EsriMapStyleType } from '../service-utils/mapParams';
import { apiDocs, ServiceName } from '../service-utils/constants';
import { $TSContext } from 'amplify-cli-core';
import { getCurrentMapParameters, getMapFriendlyNames } from '../service-utils/mapUtils';
import { getGeoServiceMeta, updateDefaultResource, checkGeoResourceExists, getGeoResources } from '../service-utils/resourceUtils';
import { resourceAccessWalkthrough, defaultResourceQuestion } from './resourceWalkthrough';
import { DataProvider } from '../service-utils/resourceParams';
import { printer, formatter, prompter, alphanumeric } from 'amplify-prompts';

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
  parameters = merge(parameters, await resourceAccessWalkthrough(context, parameters, ServiceName.Map));

  // optional advanced walkthrough
  parameters = merge(parameters, await mapAdvancedWalkthrough(context, parameters));

  // ask if the map should be set as a default. Default to true if it's the only map
  const currentMapResources = await getGeoServiceMeta(ServiceName.Map);
  if (currentMapResources && Object.keys(currentMapResources).length > 0) {
    parameters.isDefault = await prompter.yesOrNo(
        defaultResourceQuestion(ServiceName.Map),
        true
    );
  }
  else {
      parameters.isDefault = true;
  }

  return parameters;
};

export const mapNameWalkthrough = async (context: any): Promise<Partial<MapParameters>> => {
    let mapName;
    while(!mapName) {
        const [shortId] = uuid().split('-');
        const mapNameInput = await prompter.input(
            'Provide a name for the Map:',
            { validate: alphanumeric(), initial: `map${shortId}` }
        );
        if (await checkGeoResourceExists(mapNameInput)) {
            printer.info(`Geo resource ${mapNameInput} already exists. Choose another name.`);
        }
        else mapName = mapNameInput;
    }
    return { name: mapName };
};

export const mapAdvancedWalkthrough = async (
    context: $TSContext,
    parameters: Partial<MapParameters>
): Promise<Partial<MapParameters>> => {
    const advancedSettingOptions: string[] = ['Map style & Map data provider (default: Navigation provided by Esri)'];
    printer.info('Available advanced settings:');
    formatter.list(advancedSettingOptions);
    printer.blankLine();

    if(await prompter.yesOrNo('Do you want to configure advanced settings?', false)) {
        // get the map style parameters
        parameters = merge(parameters, await mapStyleWalkthrough(parameters));
    }
    else {
        parameters.dataProvider = DataProvider.Esri;
        parameters.mapStyleType = EsriMapStyleType.Navigation;
    }

    return parameters;
};

export const mapStyleWalkthrough = async (parameters: Partial<MapParameters>): Promise<Partial<MapParameters>> => {
    const mapStyleChoices = [
        { name: 'Navigation (data provided by Esri)', value: MapStyle.VectorEsriNavigation },
        { name: 'Streets (data provided by Esri)', value: MapStyle.VectorEsriStreets },
        { name: 'Berlin (data provided by HERE)', value: MapStyle.VectorHereBerlin },
        { name: 'Topographic (data provided by Esri)', value: MapStyle.VectorEsriTopographic },
        { name: 'LightGrayCanvas (data provided by Esri)', value: MapStyle.VectorEsriLightGrayCanvas },
        { name: 'DarkGrayCanvas (data provided by Esri)', value: MapStyle.VectorEsriDarkGrayCanvas }
    ];
    const mapStyleDefault = parameters.dataProvider && parameters.mapStyleType ?
        getGeoMapStyle(parameters.dataProvider, parameters.mapStyleType) : 'VectorEsriStreets';

    const mapStyleDefaultIndex = mapStyleChoices.findIndex(item => item.value === mapStyleDefault);
    const mapStyleInput = await prompter.pick<'one', string>(
        `Specify the map style. Refer ${apiDocs.mapStyles}`,
        mapStyleChoices,
        { initial: mapStyleDefaultIndex }
    );
    return getMapStyleComponents(mapStyleInput as MapStyle);
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
    const mapResourceNames = await getGeoResources(ServiceName.Map);

    if (mapResourceNames.length === 0) {
        printer.error('No Map resource to update. Use "amplify add geo" to create a new Map.');
        return parameters;
    }

    if (resourceToUpdate) {
        if (!mapResourceNames.includes(resourceToUpdate)) {
            printer.error(`No Map named ${resourceToUpdate} exists in the project.`);
            return parameters;
        }
    }
    else {
        resourceToUpdate = await prompter.pick<'one', string>('Select the Map you want to update', mapResourceNames);
    }

    parameters.name = resourceToUpdate;
    parameters = merge(parameters, await getCurrentMapParameters(resourceToUpdate));

    // overwrite the parameters based on user input
    const mapAccessSettings = (await resourceAccessWalkthrough(context, parameters, ServiceName.Map));
    parameters.accessType = mapAccessSettings.accessType;
    parameters.groupPermissions = mapAccessSettings.groupPermissions;

    const otherMapResources = mapResourceNames.filter(mapResourceName => mapResourceName !== resourceToUpdate);
    // if this is the only map, default cannot be removed
    if (otherMapResources.length > 0) {
        const isDefault = await prompter.yesOrNo(defaultResourceQuestion(ServiceName.Map), true);
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
        availableMaps = await getGeoResources(ServiceName.Map);
    }
    const otherMapResources = availableMaps.filter(mapResourceName => mapResourceName !== currentDefault);
    if (otherMapResources?.length > 0) {
        const mapFriendlyNames = await getMapFriendlyNames(otherMapResources);
        const mapChoices = mapFriendlyNames.map((friendlyName, index) => ({ name: friendlyName, value: otherMapResources[index] }));
        const defaultMapName = await prompter.pick('Select the Map you want to set as default:', mapChoices);
        await updateDefaultResource(context, ServiceName.Map, defaultMapName);
    }
    return currentDefault;
}
