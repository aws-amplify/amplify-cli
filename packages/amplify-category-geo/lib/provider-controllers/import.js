"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importResource = void 0;
const fs_extra_1 = require("fs-extra");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const fs_extra_2 = require("fs-extra");
const path_1 = require("path");
const constants_1 = require("../service-utils/constants");
const validateGeoJSONObj_1 = require("../service-utils/validateGeoJSONObj");
const importParams_1 = require("../service-utils/importParams");
const resourceUtils_1 = require("../service-utils/resourceUtils");
const MAX_ENTRIES_PER_BATCH = 10;
const importResource = async (context) => {
    const geofenceCollectionResourcesMap = await (0, resourceUtils_1.getGeoServiceMeta)(constants_1.ServiceName.GeofenceCollection);
    const collectionNames = await (0, resourceUtils_1.getGeoResources)(constants_1.ServiceName.GeofenceCollection);
    if (collectionNames.length === 0) {
        throw new Error('Geofence collection is not found. Run `amplify geo add` to create a new geofence collection.');
    }
    const provisionedCollectionNames = collectionNames.filter((collectionName) => {
        const collection = geofenceCollectionResourcesMap[collectionName];
        if (!collection.output || !collection.output.Name || !collection.output.Region) {
            return false;
        }
        return true;
    });
    if (provisionedCollectionNames.length === 0) {
        throw new Error('No geofence is not provisioned yet. Run `amplify push` to provision geofence collection.');
    }
    const collectionRegion = geofenceCollectionResourcesMap[provisionedCollectionNames[0]].output.Region;
    const provisionedCollectionOutputNames = provisionedCollectionNames.map((collectionName) => geofenceCollectionResourcesMap[collectionName].output.Name);
    let collectionToImport = provisionedCollectionOutputNames[0];
    if (provisionedCollectionOutputNames.length > 1) {
        if (provisionedCollectionOutputNames.length < collectionNames.length) {
            amplify_prompts_1.printer.warn('There are additional geofence collections in the project that have not been deployed. To import data into these resources, run `amplify push` first.');
        }
        collectionToImport = await amplify_prompts_1.prompter.pick('Select the Geofence Collection to import with Geofences', provisionedCollectionOutputNames);
    }
    let geoJSONFilePath;
    geoJSONFilePath = (0, path_1.join)(await amplify_prompts_1.prompter.input(`Provide the path to GeoJSON file containing the Geofences for ${collectionToImport} collection. Refer https://geojson.io/ for a sample GeoJSON:`));
    while (!(0, fs_extra_2.existsSync)(geoJSONFilePath)) {
        geoJSONFilePath = (0, path_1.join)(await amplify_prompts_1.prompter.input(`Cannot find GeoJSON file. Re-enter a valid file path:`));
    }
    let geoJSONObj;
    geoJSONObj = JSON.parse((0, fs_extra_1.readFileSync)(geoJSONFilePath, 'utf-8'));
    const identifierWalkthroughOptions = [
        {
            name: 'Use root-level "id" field. (Auto-assigned if missing. This will MODIFY the GeoJSON file)',
            value: { identifierType: importParams_1.IdentifierOption.RootLevelID, identifierField: 'id' },
        },
        ...scanCandidateCustomProperties(geoJSONObj).map((prop) => ({
            name: prop,
            value: {
                identifierType: importParams_1.IdentifierOption.CustomProperty,
                identifierField: prop,
            },
        })),
    ];
    const { identifierField, identifierType } = (await amplify_prompts_1.prompter.pick('Select the property to use as the Geofence feature identifier:', identifierWalkthroughOptions));
    amplify_prompts_1.printer.info('Validating your GeoJSON file...');
    try {
        geoJSONObj = (0, validateGeoJSONObj_1.validateGeoJSONObj)(geoJSONObj, identifierField, identifierType);
        amplify_prompts_1.printer.success('Successfully validated GeoJSON file.');
    }
    catch (err) {
        amplify_prompts_1.printer.error('Error occurs while validating GeoJSON file.');
        throw err;
    }
    if (identifierType === importParams_1.IdentifierOption.RootLevelID) {
        (0, fs_extra_2.writeFileSync)(geoJSONFilePath, JSON.stringify(geoJSONObj, null, 2));
    }
    await bulkUploadGeofence(context, {
        collectionToImport,
        identifierField,
        identifierType,
        geoJSONObj,
    }, collectionRegion);
};
exports.importResource = importResource;
const bulkUploadGeofence = async (context, params, region) => {
    amplify_prompts_1.printer.info('Updating your Geofences in the collection...');
    try {
        const { client } = await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'getConfiguredLocationServiceClient', [context, { region }]);
        const geofenceEntries = constructGeofenceCollectionEntries(params);
        const totalGeofenceCount = geofenceEntries.length;
        const uploadTasks = [];
        while (geofenceEntries.length > 0) {
            const geofenceCollectionPerBatch = {
                CollectionName: params.collectionToImport,
                Entries: geofenceEntries.splice(0, MAX_ENTRIES_PER_BATCH),
            };
            uploadTasks.push(client.batchPutGeofence(geofenceCollectionPerBatch).promise());
        }
        await Promise.all(uploadTasks);
        amplify_prompts_1.printer.success(`Successfully added/updated ${totalGeofenceCount} Geofences in your "${params.collectionToImport}" collection`);
    }
    catch (err) {
        amplify_prompts_1.printer.error('Error occurs while uploading geofences.');
        throw err;
    }
};
const constructGeofenceCollectionEntries = (importParam) => {
    const { geoJSONObj } = importParam;
    const Entries = [
        ...geoJSONObj.features.map((feature) => ({
            GeofenceId: importParam.identifierType === importParams_1.IdentifierOption.CustomProperty ? feature.properties[importParam.identifierField] : feature.id,
            Geometry: {
                Polygon: feature.geometry.coordinates,
            },
        })),
    ];
    return Entries;
};
const scanCandidateCustomProperties = (geoJSONObj) => {
    const { features } = geoJSONObj;
    if (features && features.length > 0 && features[0].properties) {
        const candidateProperties = Object.keys(features[0].properties).filter((prop) => {
            for (let i = 1; i < features.length; i += 1) {
                if (!features[i] || !features[i].properties || !features[i].properties[prop]) {
                    return false;
                }
            }
            return true;
        });
        return candidateProperties;
    }
    return [];
};
//# sourceMappingURL=import.js.map