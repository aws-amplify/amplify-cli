import { $TSContext } from 'amplify-cli-core';
import { ServiceName } from "../service-utils/constants";
import { printer, prompter } from 'amplify-prompts';
import { existsSync } from 'fs-extra';
import { join } from 'path';
import { Location } from 'aws-sdk';
import { v4 as uuid } from "uuid";
import { validateGeoJSONFile } from '../service-utils/validateGeoJSONFile';
import { FeatureCollection, FillParams, GeofenceCollectionParams, GeofenceParams } from '../service-utils/fillParams';

export const fillResource = async (context: $TSContext) => {
  const geofenceCollectionResources = ((await context.amplify.getResourceStatus()).allResources as any[])
  .filter(resource => resource.service === ServiceName.GeofenceCollection);
  if (geofenceCollectionResources.length === 0) {
    throw new Error('Geofence collection is not found. Use `amplify geo add` to create a new geofence collection.')
  }
  const collectionNames = geofenceCollectionResources.map(collection => collection.resourceName);
  let collectionToFill: string = collectionNames[0];
  if (geofenceCollectionResources.length > 1) {
    collectionToFill = await prompter.pick<'one', string>('Select the Geofence Collection to populate with Geofences', collectionNames)
  }
  //Ask for geo json file path
  const geoJSONFilePath = join(await prompter.input(`Provide the path to GeoJSON file containing the Geofences for ${collectionToFill} collection. Refer <link> for a sample GeoJSON:`));
  if (!existsSync(geoJSONFilePath)) {
    throw new Error('Cannot find GeoJSON file');
  }
  let uniqueIdentifier: string = 'id';
  if (await prompter.yesOrNo('Do you have a property on Geofences to use as a unique identifier?')) {
    uniqueIdentifier = await prompter.input('Please provide the name of the property to use as a unique Geofence identifier:')
  }
  //Validate the json file against schema
  const geoJSONObj: FeatureCollection = validateGeoJSONFile(geoJSONFilePath);
  if (await prompter.yesOrNo('Auto-assign the Geofence ID if not present?')) {
    if (await prompter.yesOrNo('Do you want to update the input GeoJSON file with Auto-assigned Geofence IDs?')) {
      const geofenceCollectionParams = constructGeofenceCollectionParams({collectionName: collectionToFill, uniqueIdentifier, geoJSONObj});
      await bulkUploadGeofence(geofenceCollectionParams);
    }
  }
};

const constructGeofenceCollectionParams = (fillParam: FillParams): GeofenceCollectionParams => {
  const Entries: GeofenceParams[] = [];
  const { geoJSONObj } = fillParam;
  geoJSONObj.features.forEach(feature => {
    Entries.push({
      GeofenceId: feature.id ?? uuid(),
      Geometry: {
        Polygon: feature.geometry.coordinates
      }
    })
  })
  return {
    CollectionName: fillParam.collectionName,
    Entries
  }
}

const bulkUploadGeofence = async (params: GeofenceCollectionParams) => {
  const service = new Location();
  await service.batchPutGeofence(params, (err, data) => {
    if (err) {
      console.log(err, err.stack);
    }
    else {
      printer.success(`Successfully added/updated <count> Geofences in your "${params.CollectionName}" collection`);
      console.log(data);
    }
  }).promise();
}