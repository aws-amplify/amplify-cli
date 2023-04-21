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
  getGeofence,
  getGeoJSONObj,
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

  it('should throw error and not upload file if the GeoJSON file is invalid', async () => {
    const geoJSONFileName = 'invalid-missing-coordinate.json';
    await expect(importGeofencesWithDefault(projRoot, { geoJSONFileName })).rejects.toThrowError();
    // check if geofence is provisioned in collection
    const { features } = getGeoJSONObj(geoJSONFileName);
    const geofenceID = features.map((feature) => feature.id)[0];
    expect(geofenceID).toBeDefined();
    await expect(getGeofence(collectionName, geofenceID, region)).rejects.toThrowError();
  });
});
