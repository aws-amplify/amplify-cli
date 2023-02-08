import Ajv from 'ajv';
import GeoJSONSchema from '@aws-amplify/amplify-category-geo/schema/GeoJSONSchema.json';
import { v4 as uuid } from 'uuid';
import { printer } from 'amplify-prompts';
import { FeatureCollection, IdentifierOption } from './importParams';

const MAX_VERTICES_NUM_PER_POLYGON = 1000;

export const validateGeoJSONObj = (data: FeatureCollection, uniqueIdentifier = 'id', identifierOption: IdentifierOption = IdentifierOption.RootLevelID) => {
  // Validate against pre-defined schema
  const ajv = new Ajv();
  const validator = ajv.compile(GeoJSONSchema);
  if (!validator(data) as boolean) {
    throw new Error(`The input GeoJSON file failed JSON schema validation. Underlying errors were ${JSON.stringify(validator.errors, undefined, 2)}`);
  }
  const { features } = data;
  const identifierSet = new Set();
  const duplicateValuesSet = new Set();
  features.forEach(feature => {
    // Check for identifier uniqueness
    let identifierFieldValue: string;
    if (identifierOption === IdentifierOption.RootLevelID) {
      if (!feature.id) {
        feature.id = uuid();
        printer.info(`No root level id found. Auto assigning feature with id ${feature.id}.`);
      }
      identifierFieldValue = feature.id;
    } else {
      identifierFieldValue = feature.properties[uniqueIdentifier];
      // Check if custom identifier exists in property
      if (!identifierFieldValue) {
        throw new Error(`Identifier field ${uniqueIdentifier} is missing in the feature property`);
      }
    }
    if (identifierSet.has(identifierFieldValue)) {
      duplicateValuesSet.add(identifierFieldValue);
    }
    identifierSet.add(identifierFieldValue);
    // Additional validation for each linear ring
    const { coordinates } = feature.geometry;
    let vertexCount = 0;
    coordinates.forEach((linearRing, index) => {
      validateLinearRing(linearRing, index === 0, identifierFieldValue);
      vertexCount += linearRing.length;
    });
    if (vertexCount > MAX_VERTICES_NUM_PER_POLYGON) {
      throw new Error(`Polygon should have at most ${MAX_VERTICES_NUM_PER_POLYGON} vertices.`);
    }
  });
  if (duplicateValuesSet.size > 0) {
    throw new Error(`Identifier field "${uniqueIdentifier}" is not unique in GeoJSON. The following duplicate values are founded: [${Array.from(duplicateValuesSet).map(v => `"${v}"`).join(', ')}]`);
  }
  return data;
};

/**
 * Validate linear ring for those not captured by JSON Schema, including first and last identical position, winding direction
 * @param linearRing Array of coordinates
 * @param isFirstRing Whether it is first(exterior) ring
 */
const validateLinearRing = (linearRing: Array<Array<number>>, isFirstRing: boolean, featureIdentity: string) => {
  const numPoint = linearRing.length;
  // Check if first position is identical to last one
  if (!(linearRing[0][0] === linearRing[numPoint-1][0] && linearRing[0][1] === linearRing[numPoint-1][1])) {
    throw new Error(`Linear ring of feature "${featureIdentity}" should have identical values for the first and last position.`);
  }
  // Check polygon wind direction
  const isClockWise: boolean = isClockWiseLinearRing(linearRing);
  if (isFirstRing) {
    // First Ring should be counter clockwise
    if (isClockWise) {
      throw new Error('The first linear ring is an exterior ring and should be counter-clockwise.')
    }
  } else if (!isClockWise) {
    // Non-first should be clockwise
    throw new Error('The interior ring should be clockwise.');
  }
};

// Check the wind direction of linear ring. Assume the linear ring is valid and closed
const isClockWiseLinearRing = (linearRing: Array<Array<number>>): boolean => {
  let result = 0;
  for (let i = 1; i < linearRing.length; i++) {
    result += (linearRing[i][0] - linearRing[i-1][0]) * (linearRing[i][1] + linearRing[i-1][1]);
  }
  return result > 0;
};
