import {
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  addAuthWithDefault,
  updateAuthAddUserGroups,
  amplifyPushWithoutCodegen,
  addGeofenceCollectionWithDefault,
  populateGeofencesWithDefault,
  getProjectMeta,
  getGeofenceCollection
} from 'amplify-e2e-core';
import { existsSync } from 'fs';
import path from 'path';
import _ from 'lodash';

describe('amplify geo populate', () => {
  let projRoot: string;
  beforeAll(async () => {
    projRoot = await createNewProjectDir('geo-populate-test');
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await updateAuthAddUserGroups(projRoot, ['admin']);
    await addGeofenceCollectionWithDefault(projRoot, 'admin');
  });

  afterAll(async () => {
    const metaFilePath = path.join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
    if (existsSync(metaFilePath)) {
      await deleteProject(projRoot);
    }
    deleteProjectDir(projRoot);
  });

  it('should throw error if there is no geofence collection provisioned', async () => {
    await expect(populateGeofencesWithDefault(projRoot)).rejects.toThrowError();
  });

  describe('GeoJSON uploading tests', () => {
    beforeAll(async () => {
      await amplifyPushWithoutCodegen(projRoot);
      const meta = getProjectMeta(projRoot);
      expect(meta.geo).toBeDefined();
      const collectionId = _.findKey(meta.geo, ['service', 'GeofenceCollection']);
      const collectionName = meta.geo[collectionId].output.Name;
      const region = meta.geo[collectionId].output.Region;
      const collection = await getGeofenceCollection(collectionName, region);
      expect(collection.CollectionName).toBeDefined();
    });
    it('should upload a valid GeoJSON file with auto-generated root level ID to provisioned geofence collection', async () => {
      await expect(populateGeofencesWithDefault(projRoot, { geoJSONFileName: 'valid-root-level-id.json' })).resolves.not.toThrow();
    });
    it('should upload a valid GeoJSON file with custom property to provisioned geofence collection', async () => {
      const config = { geoJSONFileName: 'valid-custom-property.json', isRootLevelID: false, customProperty: 'name' };
      await expect(populateGeofencesWithDefault(projRoot, config)).resolves.not.toThrow();
    });
    it('should throw error if the GeoJSON file does not exist', async () => {
      await expect(populateGeofencesWithDefault(projRoot, { geoJSONFileName: 'not-exist.json' })).rejects.toThrowError();
    });
    it('should throw error and not upload file if the GeoJSON file is invalid', async () => {
      await expect(populateGeofencesWithDefault(projRoot, { geoJSONFileName: 'invalid-missing-coordinate.json' })).rejects.toThrowError();
    });
    it('should upload GeoJSON file with more than 10 features and not throw error', async () => {
      await expect(populateGeofencesWithDefault(projRoot, { geoJSONFileName: 'valid-more-than-ten-features.json' })).resolves.not.toThrow();
    });
  });
});