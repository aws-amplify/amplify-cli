import {
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  addAuthWithDefault,
  updateAuthAddUserGroups,
  amplifyPushWithoutCodegen,
  addGeofenceCollectionWithDefault,
  importGeofencesWithDefault,
  getProjectMeta,
  getGeofenceCollection,
  getGeoJSONObj,
  listGeofences,
} from '@aws-amplify/amplify-e2e-core';
import { existsSync } from 'fs';
import path from 'path';
import _ from 'lodash';

describe('amplify geo import', () => {
  let projRoot: string;
  let collectionName: string;
  let region: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('geo-import-test');
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    const cognitoGroups = ['admin', 'admin1'];
    await updateAuthAddUserGroups(projRoot, cognitoGroups);
    await addGeofenceCollectionWithDefault(projRoot, cognitoGroups);
    await amplifyPushWithoutCodegen(projRoot);
    const meta = getProjectMeta(projRoot);
    expect(meta.geo).toBeDefined();
    const collectionId = _.findKey(meta.geo, ['service', 'GeofenceCollection']);
    collectionName = meta.geo[collectionId].output.Name;
    region = meta.geo[collectionId].output.Region;
    const collection = await getGeofenceCollection(collectionName, region);
    expect(collection.CollectionName).toBeDefined();
  });

  afterEach(async () => {
    const metaFilePath = path.join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
    if (existsSync(metaFilePath)) {
      await deleteProject(projRoot);
    }
    deleteProjectDir(projRoot);
  });

  it('should upload GeoJSON file with more than 10 features and not throw error', async () => {
    const geoJSONFileName = 'valid-more-than-ten-features.json';
    await expect(importGeofencesWithDefault(projRoot, { geoJSONFileName })).resolves.not.toThrow();
    // check if geofence is provisioned in collection
    const { features } = getGeoJSONObj(geoJSONFileName);
    const geofenceIDs: string[] = features.map((feature) => feature.id);
    const { Entries } = await listGeofences(collectionName, region);
    expect(Entries).toBeDefined();
    expect(Entries.length).toEqual(geofenceIDs.length);
    Entries.forEach((entry) => {
      expect(geofenceIDs).toContain(entry.GeofenceId);
    });
  });
});
