import { readFileSync } from 'fs-extra';
import Ajv from 'ajv';
import { FeatureCollection, IdentifierOption } from './populateParams';
import GeoJSONSchema from 'amplify-category-geo/schema/GeoJSONSchema.json';
import { v4 as uuid } from 'uuid';
import { printer } from 'amplify-prompts';


export const validateGeoJSONFile = (geoJSONFilePath: string, uniqueIdentifier: string = 'id', identifierOption: IdentifierOption = IdentifierOption.RootLevelID) => {
  const data = JSON.parse(readFileSync(geoJSONFilePath, 'utf-8')) as FeatureCollection;
  //Validate against pre-defined schema
  const ajv = new Ajv();
  const validator = ajv.compile(GeoJSONSchema);
  if (!validator(data) as boolean) {
    throw new Error(`The input GeoJSON file failed JSON schema validation. Underlying errors were ${JSON.stringify(validator.errors)}`);
  };
  const { features } = data;
  let identifierSet = new Set();
  features.forEach((feature) => {
    //Check for identifier uniqueness
    let identifierField: string;
    if (identifierOption === IdentifierOption.RootLevelID) {
      if (!feature.id) {
        feature.id = uuid();
        printer.info(`No root level id found. Auto assigning feature with id ${feature.id}.`)
      }
      identifierField = feature.id
    }
    else {
      identifierField = feature.properties[uniqueIdentifier];
      //Check if custom identifier exists in property
      if (!identifierField) {
        throw new Error(`Identifier field ${uniqueIdentifier} is missing in the feature property`)
      }
    }
    if (identifierSet.has(identifierField)) {
      throw new Error(`Identifier field ${uniqueIdentifier} is not unique in GeoJSON.`)
    }
    identifierSet.add(identifierField);
    //Additional validation for each linear ring
    const { coordinates } = feature.geometry;
    coordinates.forEach((linearRing, index) => {
      validateLinearRing(linearRing, index === 0, identifierField);
    })
  });
  return data;
}

/**
 * Validate linear ring for those not captured by JSON Schema, incluidng first and last identical position, winding direction
 * @param linearRing Array of coordinates
 * @param isFirstRing Whether it is first(exterior) ring
 */
const validateLinearRing = (linearRing: Array<Array<number>>, isFirstRing: boolean, featureIdentity: string) => {
  const numPoint = linearRing.length;
  //Check if first position is identical to last one
  if (!(linearRing[0][0] === linearRing[numPoint-1][0] && linearRing[0][1] === linearRing[numPoint-1][1])) {
    throw new Error(`Linear ring of feature "${featureIdentity}" should have the identical values for first and last position.`);
  }
  //Check polygon wind direction
  const isClockWise: boolean = isClockWiseLinearRing(linearRing);
  if (isFirstRing) {
    //First Ring should be counter clockwise
    if (isClockWise) {
      throw new Error('The first linear ring is exterior ring and should be counter-clockwise.')
    }
  } else {
    //Non-first should be clockwise
    if (!isClockWise) {
      throw new Error('The interior ring should be clockwise.')
    }
  }
};

//Check the wind direction of linear ring. Assume the linear ring is valid and closed
const isClockWiseLinearRing = (linearRing: Array<Array<number>>): boolean => {
  let result = 0;
  for (let i = 1; i < linearRing.length; i++) {
    result += (linearRing[i][0] - linearRing[i-1][0]) * (linearRing[i][1] + linearRing[i-1][1]);
  }
  return result > 0;
}