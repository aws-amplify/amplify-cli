"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDefaultMapWalkthrough = exports.updateMapWalkthrough = exports.mapStyleWalkthrough = exports.mapAdvancedWalkthrough = exports.mapNameWalkthrough = exports.createMapWalkthrough = void 0;
const uuid_1 = require("uuid");
const resourceUtils_1 = require("../service-utils/resourceUtils");
const mapParams_1 = require("../service-utils/mapParams");
const constants_1 = require("../service-utils/constants");
const mapUtils_1 = require("../service-utils/mapUtils");
const resourceUtils_2 = require("../service-utils/resourceUtils");
const resourceWalkthrough_1 = require("./resourceWalkthrough");
const resourceParams_1 = require("../service-utils/resourceParams");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const createMapWalkthrough = async (context, parameters) => {
    parameters = (0, resourceUtils_1.merge)(parameters, await (0, exports.mapNameWalkthrough)());
    parameters = (0, resourceUtils_1.merge)(parameters, await (0, resourceWalkthrough_1.resourceAccessWalkthrough)(context, parameters, constants_1.ServiceName.Map));
    parameters = (0, resourceUtils_1.merge)(parameters, await (0, exports.mapAdvancedWalkthrough)(context, parameters));
    const currentMapResources = await (0, resourceUtils_2.getGeoServiceMeta)(constants_1.ServiceName.Map);
    if (currentMapResources && Object.keys(currentMapResources).length > 0) {
        parameters.isDefault = await amplify_prompts_1.prompter.yesOrNo((0, resourceWalkthrough_1.defaultResourceQuestion)(constants_1.ServiceName.Map), true);
    }
    else {
        parameters.isDefault = true;
    }
    return parameters;
};
exports.createMapWalkthrough = createMapWalkthrough;
const mapNameWalkthrough = async () => {
    let mapName;
    while (!mapName) {
        const [shortId] = (0, uuid_1.v4)().split('-');
        const mapNameInput = await amplify_prompts_1.prompter.input('Provide a name for the Map:', { validate: (0, amplify_prompts_1.alphanumeric)(), initial: `map${shortId}` });
        if (await (0, resourceUtils_2.checkGeoResourceExists)(mapNameInput)) {
            amplify_prompts_1.printer.info(`Geo resource ${mapNameInput} already exists. Choose another name.`);
        }
        else
            mapName = mapNameInput;
    }
    return { name: mapName };
};
exports.mapNameWalkthrough = mapNameWalkthrough;
const mapAdvancedWalkthrough = async (context, parameters) => {
    const advancedSettingOptions = ['Map style & Map data provider (default: Streets provided by Esri)'];
    amplify_prompts_1.printer.info('Available advanced settings:');
    amplify_prompts_1.formatter.list(advancedSettingOptions);
    amplify_prompts_1.printer.blankLine();
    if (await amplify_prompts_1.prompter.yesOrNo('Do you want to configure advanced settings?', false)) {
        parameters = (0, resourceUtils_1.merge)(parameters, await (0, exports.mapStyleWalkthrough)(parameters));
    }
    else {
        parameters.dataProvider = resourceParams_1.DataProvider.Esri;
        parameters.mapStyleType = mapParams_1.EsriMapStyleType.Streets;
    }
    return parameters;
};
exports.mapAdvancedWalkthrough = mapAdvancedWalkthrough;
const mapStyleWalkthrough = async (parameters) => {
    const mapStyleChoices = [
        { name: 'Streets (data provided by Esri)', value: mapParams_1.MapStyle.VectorEsriStreets },
        { name: 'Berlin (data provided by HERE)', value: mapParams_1.MapStyle.VectorHereBerlin },
        { name: 'Explore (data provided by HERE)', value: mapParams_1.MapStyle.VectorHereExplore },
        { name: 'ExploreTruck (data provided by HERE)', value: mapParams_1.MapStyle.VectorHereExploreTruck },
        { name: 'RasterSatellite (data provided by HERE)', value: mapParams_1.MapStyle.RasterHereExploreSatellite },
        { name: 'HybridSatellite (data provided by HERE)', value: mapParams_1.MapStyle.HybridHereExploreSatellite },
        { name: 'Topographic (data provided by Esri)', value: mapParams_1.MapStyle.VectorEsriTopographic },
        { name: 'Navigation (data provided by Esri)', value: mapParams_1.MapStyle.VectorEsriNavigation },
        { name: 'LightGrayCanvas (data provided by Esri)', value: mapParams_1.MapStyle.VectorEsriLightGrayCanvas },
        { name: 'DarkGrayCanvas (data provided by Esri)', value: mapParams_1.MapStyle.VectorEsriDarkGrayCanvas },
        { name: 'Imagery (data provided by Esri)', value: mapParams_1.MapStyle.RasterEsriImagery },
        { name: 'StandardLight (data provided by OpenStreetMap)', value: mapParams_1.MapStyle.VectorOpenDataStandardLight },
    ];
    const mapStyleDefault = parameters.dataProvider && parameters.mapStyleType
        ? (0, mapParams_1.getGeoMapStyle)(parameters.dataProvider, parameters.mapStyleType)
        : 'VectorEsriStreets';
    const mapStyleDefaultIndex = mapStyleChoices.findIndex((item) => item.value === mapStyleDefault);
    const mapStyleInput = await amplify_prompts_1.prompter.pick(`Specify the map style. Refer ${constants_1.apiDocs.mapStyles}`, mapStyleChoices, {
        initial: mapStyleDefaultIndex,
    });
    return (0, mapParams_1.getMapStyleComponents)(mapStyleInput);
};
exports.mapStyleWalkthrough = mapStyleWalkthrough;
const updateMapWalkthrough = async (context, parameters, resourceToUpdate) => {
    const mapResourceNames = await (0, resourceUtils_2.getGeoResources)(constants_1.ServiceName.Map);
    if (mapResourceNames.length === 0) {
        amplify_prompts_1.printer.error('No Map resource to update. Use "amplify add geo" to create a new Map.');
        return parameters;
    }
    if (resourceToUpdate) {
        if (!mapResourceNames.includes(resourceToUpdate)) {
            amplify_prompts_1.printer.error(`No Map named ${resourceToUpdate} exists in the project.`);
            return parameters;
        }
    }
    else {
        resourceToUpdate = await amplify_prompts_1.prompter.pick('Select the Map you want to update', mapResourceNames);
    }
    parameters.name = resourceToUpdate;
    parameters = (0, resourceUtils_1.merge)(parameters, await (0, mapUtils_1.getCurrentMapParameters)(resourceToUpdate));
    const mapAccessSettings = await (0, resourceWalkthrough_1.resourceAccessWalkthrough)(context, parameters, constants_1.ServiceName.Map);
    parameters.accessType = mapAccessSettings.accessType;
    parameters.groupPermissions = mapAccessSettings.groupPermissions;
    const otherMapResources = mapResourceNames.filter((mapResourceName) => mapResourceName !== resourceToUpdate);
    if (otherMapResources.length > 0) {
        const isDefault = await amplify_prompts_1.prompter.yesOrNo((0, resourceWalkthrough_1.defaultResourceQuestion)(constants_1.ServiceName.Map), true);
        if (parameters.isDefault && !isDefault) {
            await (0, exports.updateDefaultMapWalkthrough)(context, resourceToUpdate, otherMapResources);
        }
        parameters.isDefault = isDefault;
    }
    else {
        parameters.isDefault = true;
    }
    return parameters;
};
exports.updateMapWalkthrough = updateMapWalkthrough;
const updateDefaultMapWalkthrough = async (context, currentDefault, availableMaps) => {
    if (!availableMaps) {
        availableMaps = await (0, resourceUtils_2.getGeoResources)(constants_1.ServiceName.Map);
    }
    const otherMapResources = availableMaps.filter((mapResourceName) => mapResourceName !== currentDefault);
    if ((otherMapResources === null || otherMapResources === void 0 ? void 0 : otherMapResources.length) > 0) {
        const mapFriendlyNames = await (0, mapUtils_1.getMapFriendlyNames)(otherMapResources);
        const mapChoices = mapFriendlyNames.map((friendlyName, index) => ({ name: friendlyName, value: otherMapResources[index] }));
        const defaultMapName = await amplify_prompts_1.prompter.pick('Select the Map you want to set as default:', mapChoices);
        await (0, resourceUtils_2.updateDefaultResource)(context, constants_1.ServiceName.Map, defaultMapName);
    }
    return currentDefault;
};
exports.updateDefaultMapWalkthrough = updateDefaultMapWalkthrough;
//# sourceMappingURL=mapWalkthrough.js.map