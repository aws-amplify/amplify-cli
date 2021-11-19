import { $TSContext } from 'amplify-cli-core';
import { ServiceName } from "../service-utils/constants";
import { printer, prompter } from 'amplify-prompts';
import { existsSync, writeFileSync } from 'fs-extra';
import { join } from 'path';
import { Location } from 'aws-sdk';
import { validateGeoJSONFile } from '../service-utils/validateGeoJSONFile';
import { FeatureCollection, PopulateParams, GeofenceCollectionParams, GeofenceParams, IdentifierOption } from '../service-utils/populateParams';

export const populateResource = async (context: $TSContext) => {
  const geofenceCollectionResources = ((await context.amplify.getResourceStatus()).allResources as any[])
  .filter(resource => resource.service === ServiceName.GeofenceCollection);
  if (geofenceCollectionResources.length === 0) {
    throw new Error('Geofence collection is not found. Use `amplify geo add` to create a new geofence collection.')
  }
  const collectionNames = geofenceCollectionResources.map(collection => collection.resourceName);
  let collectionToPopulate: string = collectionNames[0];
  if (geofenceCollectionResources.length > 1) {
    collectionToPopulate = await prompter.pick<'one', string>('Select the Geofence Collection to populate with Geofences', collectionNames)
  }
  //Ask for geo json file path
  const geoJSONFilePath = join(await prompter.input(`Provide the path to GeoJSON file containing the Geofences for ${collectionToPopulate} collection. Refer <link> for a sample GeoJSON:`));
  if (!existsSync(geoJSONFilePath)) {
    throw new Error('Cannot find GeoJSON file');
  }
  let uniqueIdentifier: string = 'id';
  const identifierWalkthroughOptions = [
    {name: 'No I will use the root level "id" field on Feature type. Auto-Assign if missing (this will UPDATE the GeoJSON file)', value: IdentifierOption.RootLevelID },
    {name: 'Yes I want use one of the Geofence(Feature) properties as an identifier', value: IdentifierOption.CustomProperty}
  ];
  const identifierOption = await prompter.pick<'one', string>('Do you have an identifier field in the Geofence(Feature) properties?',identifierWalkthroughOptions) as IdentifierOption;
  if (identifierOption === IdentifierOption.CustomProperty) {
    uniqueIdentifier = await prompter.input('Please provide the name of the property to use as a unique Geofence identifier:')
  }
  //Validate the json file against schema
  const geoJSONObj: FeatureCollection = validateGeoJSONFile(geoJSONFilePath, uniqueIdentifier, identifierOption);
  //Update the GeoJSON file
  writeFileSync(geoJSONFilePath, JSON.stringify(geoJSONObj));
  //Construct geofence collection parameters
  const geofenceCollectionParams = constructGeofenceCollectionParams({collectionToPopulate, uniqueIdentifier, identifierOption, geoJSONObj});
  //Upload geofences to collection
  await bulkUploadGeofence(geofenceCollectionParams);
};

const constructGeofenceCollectionParams = (populateParam: PopulateParams): GeofenceCollectionParams => {
  const Entries: GeofenceParams[] = [];
  const { geoJSONObj } = populateParam;
  geoJSONObj.features.forEach(feature => {
    Entries.push({
      GeofenceId: populateParam.identifierOption === IdentifierOption.CustomProperty
        ? feature.properties[populateParam.uniqueIdentifier]
        : feature.id,
      Geometry: {
        Polygon: feature.geometry.coordinates
      }
    })
  })
  return {
    CollectionName: populateParam.collectionToPopulate,
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