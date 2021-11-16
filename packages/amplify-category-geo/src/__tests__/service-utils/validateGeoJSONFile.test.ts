import path from 'path';
import { validateGeoJSONFile } from '../../service-utils/validateGeoJSONFile';

const assetRoot = path.resolve(path.join(__dirname, '..', 'assets'));

describe('Geo JSON file validation test', () => {
  it('should not throw error for a valid Geo JSON file', () => {
    expect(() => validateGeoJSONFile(path.join(assetRoot, 'validGeofence.json'))).not.toThrow();
  });
});