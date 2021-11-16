import { readFileSync } from 'fs-extra';
import Ajv from 'ajv';
import { FeatureCollection } from './fillParams';
import GeoJSONSchema from 'amplify-category-geo/schema/GeoJSONSchema.json';


export const validateGeoJSONFile = (geoJSONFilePath: string) => {
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
  if (!(linearRing[0][0] === linearRing[numPoint-1][0] && linearRing[0][1] === linearRing[numPoint-1][1])) {
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

//Check the wind direction of linear ring. Assume the linear ring is valid and closed
//Refer https://stackoverflow.com/questions/1165647/how-to-determine-if-a-list-of-polygon-points-are-in-clockwise-order
const isClockWiseLinearRing = (linearRing: Array<Array<number>>): boolean => {
  let result = 0;
  for (let i = 1; i < linearRing.length; i++) {
    result += (linearRing[i][0] - linearRing[i-1][0]) * (linearRing[i][1] + linearRing[i-1][1]);
  }
  return result > 0;
}