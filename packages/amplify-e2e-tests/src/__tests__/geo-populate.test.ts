import {
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  addAuthWithDefault,
  updateAuthAddUserGroups,
  addMapWithDefault,
  addPlaceIndexWithDefault,
  getProjectMeta,
  amplifyPushWithoutCodegen,
  removeMap,
  amplifyPushUpdate,
  removePlaceIndex,
  removeFirstDefaultMap,
  removeFirstDefaultPlaceIndex,
  generateResourceIdsInOrder,
  getGeoJSConfiguration,
  addGeofenceCollectionWithDefault,
  populateGeofencesWithDefault,
} from 'amplify-e2e-core';
import { existsSync } from 'fs';
import path from 'path';
import { getAWSExports } from '../aws-exports/awsExports';

describe('amplify geo populate', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('geo-populate-test');
  });

  afterEach(async () => {
    const metaFilePath = path.join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
    if (existsSync(metaFilePath)) {
      await deleteProject(projRoot);
    }
    deleteProjectDir(projRoot);
  });

  it('should throw error if there is no geofence collection provisioned', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await updateAuthAddUserGroups(projRoot, ['admin']);
    await addGeofenceCollectionWithDefault(projRoot);
    await expect(populateGeofencesWithDefault(projRoot)).rejects.toThrowError();
  });
  it('should upload a valid GeoJSON file with auto-generated root level ID to provisioned geofence collection', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await updateAuthAddUserGroups(projRoot, ['admin']);
    await addGeofenceCollectionWithDefault(projRoot);
    await amplifyPushWithoutCodegen(projRoot);
    await expect(populateGeofencesWithDefault(projRoot, { geoJSONFileName: 'valid-root-level-id.json' })).resolves.not.toThrow();
  });
  it('should upload a valid GeoJSON file with custom property to provisioned geofence collection', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await updateAuthAddUserGroups(projRoot, ['admin']);
    await addGeofenceCollectionWithDefault(projRoot);
    await amplifyPushWithoutCodegen(projRoot);
    const config = { geoJSONFileName: 'valid-custom-property.json', isRootLevelID: false, customProperty: 'name' };
    await expect(populateGeofencesWithDefault(projRoot, config)).resolves.not.toThrow();
  });
  it('should throw error if the GeoJSON file does not exist', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await updateAuthAddUserGroups(projRoot, ['admin']);
    await addGeofenceCollectionWithDefault(projRoot);
    await amplifyPushWithoutCodegen(projRoot);
    await expect(populateGeofencesWithDefault(projRoot, { geoJSONFileName: 'not-exist.json' })).rejects.toThrowError();
  });
  it('should throw error and not upload file if the GeoJSON file is invalid', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await updateAuthAddUserGroups(projRoot, ['admin']);
    await addGeofenceCollectionWithDefault(projRoot);
    await amplifyPushWithoutCodegen(projRoot);
    await expect(populateGeofencesWithDefault(projRoot, { geoJSONFileName: 'invalid-missing-coordinate.json' })).rejects.toThrowError();
  });
  it('should upload GeoJSON file with more than 10 features and not throw error', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await updateAuthAddUserGroups(projRoot, ['admin']);
    await addGeofenceCollectionWithDefault(projRoot);
    await amplifyPushWithoutCodegen(projRoot);
    await expect(populateGeofencesWithDefault(projRoot, { geoJSONFileName: 'valid-more-than-ten-features.json' })).resolves.not.toThrow();
  });
});