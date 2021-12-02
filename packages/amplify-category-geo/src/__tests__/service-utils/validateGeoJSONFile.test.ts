import path from 'path';
import { IdentifierOption } from '../../service-utils/populateParams';
import { validateGeoJSONFile } from '../../service-utils/validateGeoJSONFile';

const assetRoot = path.resolve(path.join(__dirname, '..', 'assets'));

describe('Geo JSON file validation test', () => {
  it('should not throw error for a valid Geo JSON file', () => {
    expect(() => validateGeoJSONFile(path.join(assetRoot, 'validGeofence.json'))).not.toThrow();
  });
  it('should throw error for a invalid Geo JSON file with first and last position not identical', () => {
    expect(() => validateGeoJSONFile(path.join(assetRoot, 'invalidGeofence.notSameFirstAndLast.json'))).toThrowErrorMatchingSnapshot();
  });
  it('should throw error for a invalid Geo JSON file with less than 4 points in a linear ring', () => {
    expect(() => validateGeoJSONFile(path.join(assetRoot, 'invalidGeofence.lessThanFourPoints.json'))).toThrowErrorMatchingSnapshot();
  });
  it('should throw error for a invalid Geo JSON file with clockwise exterior ring', () => {
    expect(() => validateGeoJSONFile(path.join(assetRoot, 'invalidGeofence.clockwiseExteriorRing.json'))).toThrowErrorMatchingSnapshot();
  });
  it('should throw error if custom identifier is not found', () => {
    expect(() => validateGeoJSONFile(path.join(assetRoot, 'validGeofence.nameAsIdentifier.json'), 'id', IdentifierOption.CustomProperty)).toThrowErrorMatchingSnapshot();
  });
  it('should throw error for a invalid Geo JSON file with same identifier', () => {
    expect(() => validateGeoJSONFile(path.join(assetRoot, 'invalidGeofence.sameIdentifier.json'))).toThrowErrorMatchingSnapshot();
  });
  it('should throw error for a invalid Geo JSON file with counter-clockwise interior ring', () => {
    expect(() => validateGeoJSONFile(path.join(assetRoot, 'invalidGeofence.counterclockwiseInteriorRing.json'))).toThrowErrorMatchingSnapshot();
  });
});