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
    process.env.AMPLIFY_ENABLE_DEBUG_OUTPUT = 'true';
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
  it('should upload a valid GeoJSON file with custom property to provisioned geofence collection', async () => {
    const geoJSONFileName = 'valid-custom-property.json';
    const config = { geoJSONFileName, isRootLevelID: false, customProperty: 'name' };
    await expect(importGeofencesWithDefault(projRoot, config)).resolves.not.toThrow();
    // check if geofence is provisioned in collection
    const { features } = getGeoJSONObj(geoJSONFileName);
    const geofenceID = features.map((feature) => feature.properties.name)[0];
    expect(geofenceID).toBeDefined();
    const geofence = await getGeofence(collectionName, geofenceID, region);
    expect(geofence.GeofenceId).toEqual(geofenceID);
  });
});
