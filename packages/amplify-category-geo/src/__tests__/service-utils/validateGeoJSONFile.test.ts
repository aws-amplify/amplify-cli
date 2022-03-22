import path from 'path';
import { IdentifierOption } from '../../service-utils/importParams';
import { validateGeoJSONFile } from '../../service-utils/validateGeoJSONFile';

const assetRoot = path.resolve(path.join(__dirname, '..', 'assets'));

describe('Geo JSON file validation test', () => {
  it('should not throw error for a valid Geo JSON file', () => {
    expect(() => validateGeoJSONFile(path.join(assetRoot, 'validGeofence.json'))).not.toThrow();
  });
  it('should throw error for a invalid Geo JSON file with first and last position not identical', () => {
    expect(() => validateGeoJSONFile(path.join(assetRoot, 'invalidGeofence.notSameFirstAndLast.json'))).toThrowErrorMatchingInlineSnapshot(
      '"Linear ring of feature \\"notSameFirstAndLast\\" should have the identical values for first and last position."',
    );
  });
  it('should throw error for a invalid Geo JSON file with less than 4 points in a linear ring', () => {
    expect(() => validateGeoJSONFile(path.join(assetRoot, 'invalidGeofence.lessThanFourPoints.json'))).toThrowErrorMatchingInlineSnapshot(
      '"The input GeoJSON file failed JSON schema validation. Underlying errors were [{\\"keyword\\":\\"minItems\\",\\"dataPath\\":\\".features[0].geometry.coordinates[0]\\",\\"schemaPath\\":\\"#/minItems\\",\\"params\\":{\\"limit\\":4},\\"message\\":\\"should NOT have fewer than 4 items\\"}]"',
    );
  });
  it('should throw error for a invalid Geo JSON file with clockwise exterior ring', () => {
    expect(() => validateGeoJSONFile(path.join(assetRoot, 'invalidGeofence.clockwiseExteriorRing.json'))).toThrowErrorMatchingInlineSnapshot('"The first linear ring is exterior ring and should be counter-clockwise."');
  });
  it('should throw error if custom identifier is not found', () => {
    expect(() => validateGeoJSONFile(path.join(assetRoot, 'validGeofence.nameAsIdentifier.json'), 'id', IdentifierOption.CustomProperty)).toThrowErrorMatchingInlineSnapshot('"Identifier field id is missing in the feature property"');
  });
  it('should throw error for a invalid Geo JSON file with same identifier', () => {
    expect(() => validateGeoJSONFile(path.join(assetRoot, 'invalidGeofence.sameIdentifier.json'))).toThrowErrorMatchingInlineSnapshot(
      '"Identifier field id is not unique in GeoJSON."',
    );
  });
  it('should throw error for a invalid Geo JSON file with counter-clockwise interior ring', () => {
    expect(() => validateGeoJSONFile(path.join(assetRoot, 'invalidGeofence.counterclockwiseInteriorRing.json'))).toThrowErrorMatchingInlineSnapshot('"The interior ring should be clockwise."');
  });
});
