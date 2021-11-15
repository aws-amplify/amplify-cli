import { $TSContext, pathManager, validate } from 'amplify-cli-core';
import { ServiceName } from "../service-utils/constants";
import { printer, formatter, prompter, alphanumeric } from 'amplify-prompts';
import { existsSync, readFileSync } from 'fs-extra';
import { join } from 'path';
import Ajv from 'ajv';
import GeoJSONSchema from 'amplify-category-geo/schema/GeoJSONSchema.json';
import { Location } from 'aws-sdk';
import { v4 as uuid } from "uuid";


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

const validateGeoJSONFile = (geoJSONFilePath: string) => {
  const data = JSON.parse(readFileSync(geoJSONFilePath, 'utf-8')) as FeatureCollection;
  //Validate against pre-defined schema
  const ajv = new Ajv();
  const validator = ajv.compile(GeoJSONSchema);
  if (!validator(data) as boolean) {
    throw new Error(`Data did not validate against the supplied schema. Underlying errors were ${JSON.stringify(validator.errors)}`);
  };
  const { features } = data;
  features.forEach((feature) => {
    const { coordinates } = feature.geometry;
    coordinates.forEach((linearRing, index) => {
      validateLinearRing(linearRing, index === 0);
    })
  });
  return data;
}

const validateLinearRing = (linearRing: Array<Array<number>>, isFirstRing: boolean) => {
  const numPoint = linearRing.length;
  //Check position number
  if (numPoint < 4) {
    throw new Error('Linear ring should have at least four positions.');
  }
  //Check if first position is identical to last one
  if (linearRing[0][0] === linearRing[numPoint-1][0] && linearRing[0][1] === linearRing[numPoint-1][1]) {
    throw new Error(`Linear ring ${linearRing} should have the identical values for first and last position.`);
  }
  //Check polygon wind direction
  const isClockWise: boolean = isClockWiseLinearRing(linearRing);
  if (isFirstRing) {
    //First Ring should be counter clockwise
    if (isClockWise) {
      throw new Error('The first linear ring is exterior ring and should be counter-closewise.')
    }
  } else {
    //Non-first should be clockwise
    if (!isClockWise) {
      throw new Error('The non-frist linear ring is interior and should be closewise.')
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

//Check the wind direction of linear ring. Assume the linear ring is valid and closed
//Refer https://stackoverflow.com/questions/1165647/how-to-determine-if-a-list-of-polygon-points-are-in-clockwise-order
const isClockWiseLinearRing = (linearRing: Array<Array<number>>): boolean => {
  let result = 0;
  for (let i = 1; i < linearRing.length; i++) {
    result += (linearRing[i][0] - linearRing[i-1][0]) * (linearRing[i][1] + linearRing[i-1][1]);
  }
  return result > 0;
}

type FeatureCollection = {
  type: "FeatureCollection";
  features: Feature[];
}

type Feature = {
  type: "Feature";
  properties: any;
  geometry: Geometry;
  id: string;
}

type Geometry = {
  type: "Polygon";
  coordinates: Array<Array<Array<number>>>;
}

type GeofenceCollectionParams = {
  CollectionName: string;
  Entries: GeofenceParams[];
}

type GeofenceParams = {
  GeofenceId: string;
  Geometry: {
    Polygon: Array<Array<Array<number>>>
  }
}

type FillParams = {
  collectionName: string;
  uniqueIdentifier: string;
  geoJSONObj: FeatureCollection;
}