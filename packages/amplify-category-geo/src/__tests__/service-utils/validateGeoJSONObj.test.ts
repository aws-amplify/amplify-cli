import path from 'path';
import { readFileSync } from 'fs-extra';
import { FeatureCollection, IdentifierOption } from '../../service-utils/importParams';
import { validateGeoJSONObj } from '../../service-utils/validateGeoJSONObj';

const assetRoot = path.resolve(path.join(__dirname, '..', 'assets'));

const loadGeoJSONObj = (geoJSONFileName: string): FeatureCollection => JSON.parse(readFileSync(path.join(assetRoot, geoJSONFileName), 'utf-8')) as FeatureCollection;

describe('Geo JSON file validation test', () => {
  it('should not throw error for a valid Geo JSON file', () => {
    expect(() => validateGeoJSONObj(loadGeoJSONObj('validGeofence.json'))).not.toThrow();
  });
  it('should throw error for a invalid Geo JSON file with first and last position not identical', () => {
    expect(() => validateGeoJSONObj(loadGeoJSONObj('invalidGeofence.notSameFirstAndLast.json'))).toThrowErrorMatchingSnapshot();
  });
  it('should throw error for a invalid Geo JSON file with less than 4 points in a linear ring', () => {
    expect(() => validateGeoJSONObj(loadGeoJSONObj('invalidGeofence.lessThanFourPoints.json'))).toThrowErrorMatchingSnapshot();
  });
  it('should throw error for a invalid Geo JSON file with clockwise exterior ring', () => {
    expect(() => validateGeoJSONObj(loadGeoJSONObj('invalidGeofence.clockwiseExteriorRing.json'))).toThrowErrorMatchingSnapshot();
  });
  it('should throw error if custom identifier is not found', () => {
    expect(() => validateGeoJSONObj(loadGeoJSONObj('validGeofence.nameAsIdentifier.json'), 'id', IdentifierOption.CustomProperty)).toThrowErrorMatchingSnapshot();
  });
  it('should throw error for a invalid Geo JSON file with same identifier', () => {
    expect(() => validateGeoJSONObj(loadGeoJSONObj('invalidGeofence.sameIdentifier.json'))).toThrowErrorMatchingSnapshot();
  });
  it('should throw error for a invalid Geo JSON file with counter-clockwise interior ring', () => {
    expect(() => validateGeoJSONObj(loadGeoJSONObj('invalidGeofence.counterclockwiseInteriorRing.json'))).toThrowErrorMatchingSnapshot();
  });
});