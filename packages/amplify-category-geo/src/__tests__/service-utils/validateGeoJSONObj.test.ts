import path from 'path';
import { readFileSync } from 'fs-extra';
import { FeatureCollection, IdentifierOption } from '../../service-utils/importParams';
import { validateGeoJSONObj } from '../../service-utils/validateGeoJSONObj';

const assetRoot = path.resolve(path.join(__dirname, '..', 'assets'));

const loadGeoJSONObj = (geoJSONFileName: string): FeatureCollection =>
  JSON.parse(readFileSync(path.join(assetRoot, geoJSONFileName), 'utf-8')) as FeatureCollection;

describe('Geo JSON file validation test', () => {
  it('should not throw error for a valid Geo JSON file', () => {
    expect(() => validateGeoJSONObj(loadGeoJSONObj('validGeofence.json'))).not.toThrow();
  });
  it('should throw error for a invalid Geo JSON file with first and last position not identical', () => {
    expect(() => validateGeoJSONObj(loadGeoJSONObj('invalidGeofence.notSameFirstAndLast.json'))).toThrowErrorMatchingInlineSnapshot(
      `"Linear ring of feature "notSameFirstAndLast" should have identical values for the first and last position."`,
    );
  });
  it('should throw error for a invalid Geo JSON file with less than 4 points in a linear ring', () => {
    expect(() => validateGeoJSONObj(loadGeoJSONObj('invalidGeofence.lessThanFourPoints.json'))).toThrowErrorMatchingInlineSnapshot(`
"The input GeoJSON file failed JSON schema validation. Underlying errors were [
  {
    "keyword": "minItems",
    "dataPath": ".features[0].geometry.coordinates[0]",
    "schemaPath": "#/minItems",
    "params": {
      "limit": 4
    },
    "message": "should NOT have fewer than 4 items"
  }
]"
`);
  });
  it('should throw error for a invalid Geo JSON file with clockwise exterior ring', () => {
    expect(() => validateGeoJSONObj(loadGeoJSONObj('invalidGeofence.clockwiseExteriorRing.json'))).toThrowErrorMatchingInlineSnapshot(
      `"The first linear ring is an exterior ring and should be counter-clockwise."`,
    );
  });
  it('should throw error if custom identifier is not found', () => {
    expect(() =>
      validateGeoJSONObj(loadGeoJSONObj('validGeofence.nameAsIdentifier.json'), 'id', IdentifierOption.CustomProperty),
    ).toThrowErrorMatchingInlineSnapshot(`"Identifier field id is missing in the feature property"`);
  });
  it('should throw error for a invalid Geo JSON file with same identifier', () => {
    expect(() =>
      validateGeoJSONObj(loadGeoJSONObj('invalidGeofence.sameIdentifier.json'), 'name', IdentifierOption.CustomProperty),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Identifier field "name" is not unique in GeoJSON. The following duplicate values are founded: ["myGeofence", "myGeofence2"]"`,
    );
  });
  it('should throw error for a invalid Geo JSON file with counter-clockwise interior ring', () => {
    expect(() =>
      validateGeoJSONObj(loadGeoJSONObj('invalidGeofence.counterclockwiseInteriorRing.json')),
    ).toThrowErrorMatchingInlineSnapshot(`"The interior ring should be clockwise."`);
  });
});
