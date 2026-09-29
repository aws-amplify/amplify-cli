import { readFileSync } from 'fs-extra';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { prompter, printer } from '@aws-amplify/amplify-prompts';
import { existsSync, writeFileSync } from 'fs-extra';
import { join } from 'path';
import { LocationClient, BatchPutGeofenceCommand } from '@aws-sdk/client-location';
import { ServiceName } from '../service-utils/constants';
import { validateGeoJSONObj } from '../service-utils/validateGeoJSONObj';
import {
  FeatureCollection,
  ImportParams,
  GeofenceCollectionParams,
  GeofenceParams,
  IdentifierOption,
  IdentifierInfo,
} from '../service-utils/importParams';
import { getGeoResources, getGeoServiceMeta } from '../service-utils/resourceUtils';

const MAX_ENTRIES_PER_BATCH = 10;

export const importResource = async (context: $TSContext) => {
  const geofenceCollectionResourcesMap = await getGeoServiceMeta(ServiceName.GeofenceCollection);
  const collectionNames = await getGeoResources(ServiceName.GeofenceCollection);
  if (collectionNames.length === 0) {
    throw new Error('Geofence collection is not found. Run `amplify geo add` to create a new geofence collection.');
  }
  // Get provisioned geofence collection name
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
  // Get collection region
  const collectionRegion = geofenceCollectionResourcesMap[provisionedCollectionNames[0]].output.Region;
  // Get collection output name
  const provisionedCollectionOutputNames = provisionedCollectionNames.map(
    (collectionName) => geofenceCollectionResourcesMap[collectionName].output.Name,
  );
  // Get the collection to import
  let collectionToImport: string = provisionedCollectionOutputNames[0];
  if (provisionedCollectionOutputNames.length > 1) {
    if (provisionedCollectionOutputNames.length < collectionNames.length) {
      printer.warn(
        'There are additional geofence collections in the project that have not been deployed. To import data into these resources, run `amplify push` first.',
      );
    }
    collectionToImport = await prompter.pick<'one', string>(
      'Select the Geofence Collection to import with Geofences',
      provisionedCollectionOutputNames,
    );
  }
  // Ask for geo json file path
  let geoJSONFilePath: string;
  geoJSONFilePath = join(
    await prompter.input(
      `Provide the path to GeoJSON file containing the Geofences for ${collectionToImport} collection. Refer https://geojson.io/ for a sample GeoJSON:`,
    ),
  );
  while (!existsSync(geoJSONFilePath)) {
    geoJSONFilePath = join(await prompter.input(`Cannot find GeoJSON file. Re-enter a valid file path:`));
  }
  let geoJSONObj: FeatureCollection;
  geoJSONObj = JSON.parse(readFileSync(geoJSONFilePath, 'utf-8')) as FeatureCollection;
  const identifierWalkthroughOptions = [
    {
      name: 'Use root-level "id" field. (Auto-assigned if missing. This will MODIFY the GeoJSON file)',
      value: { identifierType: IdentifierOption.RootLevelID, identifierField: 'id' },
    },
    ...scanCandidateCustomProperties(geoJSONObj).map((prop) => ({
      name: prop,
      value: {
        identifierType: IdentifierOption.CustomProperty,
        identifierField: prop,
      },
    })),
  ];
  const { identifierField, identifierType } = (await prompter.pick<'one', any>(
    'Select the property to use as the Geofence feature identifier:',
    identifierWalkthroughOptions,
  )) as IdentifierInfo;
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
  // Upload geofences to collection
  await bulkUploadGeofence(
    context,
    {
      collectionToImport,
      identifierField,
      identifierType,
      geoJSONObj,
    },
    collectionRegion,
  );
};

const bulkUploadGeofence = async (context: $TSContext, params: ImportParams, region: string) => {
  printer.info('Updating your Geofences in the collection...');
  try {
    const { client } = await context.amplify.invokePluginMethod<{ client: LocationClient }>(
      context,
      'awscloudformation',
      undefined,
      'getConfiguredLocationServiceClient',
      [context, { region }],
    );
    const geofenceEntries = constructGeofenceCollectionEntries(params);
    const totalGeofenceCount = geofenceEntries.length;
    const uploadTasks = [];
    while (geofenceEntries.length > 0) {
      const geofenceCollectionPerBatch: GeofenceCollectionParams = {
        CollectionName: params.collectionToImport,
        Entries: geofenceEntries.splice(0, MAX_ENTRIES_PER_BATCH),
      };
      const command = new BatchPutGeofenceCommand(geofenceCollectionPerBatch);
      uploadTasks.push(client.send(command));
    }
    await Promise.all(uploadTasks);
    printer.success(`Successfully added/updated ${totalGeofenceCount} Geofences in your "${params.collectionToImport}" collection`);
  } catch (err) {
    printer.error('Error occurs while uploading geofences.');
    throw err;
  }
};

const constructGeofenceCollectionEntries = (importParam: ImportParams): GeofenceParams[] => {
  const { geoJSONObj } = importParam;
  const Entries: GeofenceParams[] = [
    ...geoJSONObj.features.map((feature) => ({
      GeofenceId:
        importParam.identifierType === IdentifierOption.CustomProperty ? feature.properties[importParam.identifierField] : feature.id,
      Geometry: {
        Polygon: feature.geometry.coordinates,
      },
    })),
  ];
  return Entries;
};

/**
 * Scan the custom properties as candidate options.
 * @param geoJSONObj Geo features collection
 * @returns Array of candidate custom property names which exist in all features
 */
const scanCandidateCustomProperties = (geoJSONObj: FeatureCollection): string[] => {
  const { features } = geoJSONObj;
  if (features && features.length > 0 && features[0].properties) {
    const candidateProperties: string[] = Object.keys(features[0].properties).filter((prop) => {
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
