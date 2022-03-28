import { readFileSync } from 'fs-extra';
import { $TSContext } from 'amplify-cli-core';
import { prompter } from 'amplify-prompts';
import { existsSync, writeFileSync } from 'fs-extra';
import { join } from 'path';
import { Location } from 'aws-sdk';
import { ServiceName } from '../service-utils/constants';
import { validateGeoJSONObj } from '../service-utils/validateGeoJSONObj';
import {
  FeatureCollection, ImportParams, GeofenceCollectionParams, GeofenceParams, IdentifierOption, IdentifierInfo
} from '../service-utils/importParams';
import { printer } from 'amplify-prompts';

const MAX_ENTRIES_PER_BATCH = 10;

export const importResource = async (context: $TSContext) => {
  const geofenceCollectionResources = ((await context.amplify.getResourceStatus()).allResources as any[])
  .filter(resource => resource.service === ServiceName.GeofenceCollection);
  if (geofenceCollectionResources.length === 0) {
    throw new Error('Geofence collection is not found. Run `amplify geo add` to create a new geofence collection.')
  }
  // Get provisioned geofence collection name
  const collectionNames = geofenceCollectionResources.map(collection => {
    if (!collection.output || !collection.output.Name || !collection.output.Region) {
      throw new Error(`Geofence ${collection.resourceName} is not provisioned yet. Run \`amplify push\` to provision geofence collection.`)
    }
    return collection.output.Name;
  });
  // Get collection region
  const collectionRegion = geofenceCollectionResources[0].output.Region;
  // Get the collection to import
  let collectionToImport: string = collectionNames[0];
  if (geofenceCollectionResources.length > 1) {
    collectionToImport = await prompter.pick<'one', string>('Select the Geofence Collection to import with Geofences', collectionNames)
  }
  // Ask for geo json file path
  const geoJSONFilePath = join(await prompter.input(`Provide the path to GeoJSON file containing the Geofences for ${collectionToImport} collection. Refer https://geojson.io/ for a sample GeoJSON:`));
  if (!existsSync(geoJSONFilePath)) {
    throw new Error(`Cannot find GeoJSON file at ${geoJSONFilePath}`);
  }
  let geoJSONObj: FeatureCollection;
  geoJSONObj = JSON.parse(readFileSync(geoJSONFilePath, 'utf-8')) as FeatureCollection;
  const identifierWalkthroughOptions = [
    { name: 'Use root-level "id" field. (Auto-assigned if missing)', value: { identifierType: IdentifierOption.RootLevelID, identifierField: 'id' } },
    ...scanCandidateCustomProperties(geoJSONObj).map(prop => ({
      name: prop,
      value: {
        identifierType: IdentifierOption.CustomProperty,
        identifierField: prop,
      },
    })),
  ];
  const { identifierField, identifierType } = await prompter.pick<'one', any>('Select the property to use as the Geofence feature identifier:', identifierWalkthroughOptions) as IdentifierInfo;
  // Validate the json file against schema
  printer.info('Validating your GeoJSON file...');
  try {
    geoJSONObj = validateGeoJSONObj(geoJSONObj, identifierField, identifierType);
    printer.success('Successfully validated GeoJSON file.');
  } catch (err) {
    printer.error('Error occurs while validating GeoJSON file.');
    throw err;
  }
  // Update the GeoJSON file with auto-assigned ID
  if (identifierType === IdentifierOption.RootLevelID) {
    writeFileSync(geoJSONFilePath, JSON.stringify(geoJSONObj, null, 2));
  }
  // Construct geofence collection parameters
  const geofenceCollectionParams = constructGeofenceCollectionParams({ collectionToImport, identifierField, identifierType, geoJSONObj });
  // Upload geofences to collection
  printer.info('Updating your Geofences in the collection...');
  try {
    const totalGeofenceCount = geofenceCollectionParams.Entries.length;
    for(let i = 0; i < totalGeofenceCount; i += MAX_ENTRIES_PER_BATCH){
      const geofenceCollectionPerBatch : GeofenceCollectionParams = {
        CollectionName: geofenceCollectionParams.CollectionName,
        Entries: geofenceCollectionParams.Entries.slice(i, i + MAX_ENTRIES_PER_BATCH)
      }
      await bulkUploadGeofence(geofenceCollectionPerBatch, collectionRegion);
    }
    printer.success(`Successfully added/updated ${totalGeofenceCount} Geofences in your "${collectionToImport}" collection`);
  } catch (err) {
    printer.error('Error occurs while uploading geofences.');
    throw err;
  }
};

const constructGeofenceCollectionParams = (importParam: ImportParams): GeofenceCollectionParams => {
  const { geoJSONObj } = importParam;
  const Entries: GeofenceParams[] = [
    ...geoJSONObj.features.map(feature => ({
      GeofenceId: importParam.identifierType === IdentifierOption.CustomProperty
        ? feature.properties[importParam.identifierField]
        : feature.id,
      Geometry: {
        Polygon: feature.geometry.coordinates,
      },
    })),
  ];
  return {
    CollectionName: importParam.collectionToImport,
    Entries,
  };
};

const bulkUploadGeofence = async (params: GeofenceCollectionParams, region: string) => {
  const service = new Location({ region });
  return await service.batchPutGeofence(params).promise();
};

/**
 * Scan the custom properties as candidate options.
 * @param geoJSONObj Geo features collection
 * @returns Array of candidate custom property names which exist in all features
 */
const scanCandidateCustomProperties = (geoJSONObj: FeatureCollection): string[] => {
  const { features } = geoJSONObj;
  if (features && features.length > 0 && features[0].properties) {
    const candidateProperties: string[] = Object.keys(features[0].properties).filter(prop => {
      for (let i = 1; i < features.length; i += 1) {
        // Remove the property that does not exist in all features
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
