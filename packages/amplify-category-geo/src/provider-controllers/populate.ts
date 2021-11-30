import { $TSContext } from 'amplify-cli-core';
import { ServiceName } from "../service-utils/constants";
import { printer, prompter } from 'amplify-prompts';
import { existsSync, writeFileSync } from 'fs-extra';
import { join } from 'path';
import { Location } from 'aws-sdk';
import { validateGeoJSONFile } from '../service-utils/validateGeoJSONFile';
import { FeatureCollection, PopulateParams, GeofenceCollectionParams, GeofenceParams, IdentifierOption } from '../service-utils/populateParams';
import ora from "ora";

const MAX_ENTRIES_PER_BATCH = 10;
const MIN_ENTRIES_PER_BATCH = 1;

export const populateResource = async (context: $TSContext) => {
  const geofenceCollectionResources = ((await context.amplify.getResourceStatus()).allResources as any[])
  .filter(resource => resource.service === ServiceName.GeofenceCollection);
  if (geofenceCollectionResources.length === 0) {
    throw new Error('Geofence collection is not found. Run `amplify geo add` to create a new geofence collection.')
  }
  //Get provisioned geofence collection name
  const collectionNames = geofenceCollectionResources.map(collection => {
    if (!collection.output || !collection.output.Name || !collection.output.Region) {
      throw new Error(`Geofence ${collection.resourceName} is not provisioned yet. Run \`amplify push\` to provision geofence collection.`)
    }
    return collection.output.Name;
  });
  //Get collection region
  const collectionRegion = geofenceCollectionResources[0].output.Region;
  //Get the collection to populate
  let collectionToPopulate: string = collectionNames[0];
  if (geofenceCollectionResources.length > 1) {
    collectionToPopulate = await prompter.pick<'one', string>('Select the Geofence Collection to populate with Geofences', collectionNames)
  }
  //Ask for geo json file path
  const geoJSONFilePath = join(await prompter.input(`Provide the path to GeoJSON file containing the Geofences for ${collectionToPopulate} collection. Refer <link> for a sample GeoJSON:`));
  if (!existsSync(geoJSONFilePath)) {
    throw new Error(`Cannot find GeoJSON file at ${geoJSONFilePath}`);
  }
  //Ask for the identifier option
  let uniqueIdentifier: string = 'id';
  const identifierWalkthroughOptions = [
    {name: 'No I will use the root level "id" field on Feature type. Auto-Assign if missing (this will UPDATE the GeoJSON file)', value: IdentifierOption.RootLevelID },
    {name: 'Yes I want to use one of the Geofence(Feature) properties as an identifier', value: IdentifierOption.CustomProperty}
  ];
  const identifierOption = await prompter.pick<'one', string>('Do you have an identifier field in the Geofence(Feature) properties?',identifierWalkthroughOptions) as IdentifierOption;
  if (identifierOption === IdentifierOption.CustomProperty) {
    uniqueIdentifier = await prompter.input('Provide the name of the property to use as a unique geofence identifier. Do not use Personal Identifiable Information such as email, username etc:')
  }
  //Validate the json file against schema
  let geoJSONObj: FeatureCollection;
  const validationSpinner = ora('Validating your GeoJSON file...');
  validationSpinner.start();
  try {
    geoJSONObj = validateGeoJSONFile(geoJSONFilePath, uniqueIdentifier, identifierOption);
    validationSpinner.succeed('Successfully validated GeoJSON file.');
  } catch (err) {
    validationSpinner.fail('Error occurs while validating GeoJSON file.');
    throw err;
  }
  //Update the GeoJSON file with auto-assigned ID
  if (identifierOption === IdentifierOption.RootLevelID) {
    writeFileSync(geoJSONFilePath, JSON.stringify(geoJSONObj, null, 2));
  }
  //Construct geofence collection parameters
  const geofenceCollectionParams = constructGeofenceCollectionParams({collectionToPopulate, uniqueIdentifier, identifierOption, geoJSONObj});
  //Upload geofences to collection
  const uploadSpinner = ora('Updating your Geofences in the collection...');
  uploadSpinner.start();
  try {
    let successCount = 0;
    const totalGeofenceCount = geofenceCollectionParams.Entries.length;
    for(let i = 0; i < totalGeofenceCount; i += MAX_ENTRIES_PER_BATCH){
      const geofenceCollectionPerBatch : GeofenceCollectionParams = {
        CollectionName: geofenceCollectionParams.CollectionName,
        Entries: geofenceCollectionParams.Entries.slice(i, i + MAX_ENTRIES_PER_BATCH)
      }
      const result = await bulkUploadGeofence(geofenceCollectionPerBatch, collectionRegion);
      successCount += result.Successes.length;
    }
    uploadSpinner.succeed(`Successfully added/updated ${successCount} Geofences in your "${collectionToPopulate}" collection`);
  } catch (err) {
    uploadSpinner.fail('Error occurs while uploading geofences.');
    throw err;
  }
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

const bulkUploadGeofence = async (params: GeofenceCollectionParams, region: string) => {
  const service = new Location({region});
  const geofenceNum = params.Entries.length;
  if (geofenceNum < MIN_ENTRIES_PER_BATCH) {
    throw new Error(`The uploaded geofences should have at least ${MIN_ENTRIES_PER_BATCH} item.`);
  }
  if (geofenceNum > MAX_ENTRIES_PER_BATCH) {
    throw new Error(`The uploaded geofences should have at most ${MAX_ENTRIES_PER_BATCH} items per batch.`);
  }
  return await service.batchPutGeofence(params).promise();
}