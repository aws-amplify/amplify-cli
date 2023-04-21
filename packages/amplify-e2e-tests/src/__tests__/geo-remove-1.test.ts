import {
  addAuthWithDefault,
  addGeofenceCollectionWithDefault,
  addMapWithDefault,
  addPlaceIndexWithDefault,
  amplifyPushUpdate,
  amplifyPushWithoutCodegen,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  initJSProjectWithProfile,
  removeGeofenceCollection,
  removeMap,
  removePlaceIndex,
  updateAuthAddUserGroups,
} from '@aws-amplify/amplify-e2e-core';
import { existsSync } from 'fs';
import path from 'path';
import { getAWSExports } from '../aws-exports/awsExports';

describe('amplify geo remove', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('geo-remove-test');
  });

  afterEach(async () => {
    const metaFilePath = path.join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
    if (existsSync(metaFilePath)) {
      await deleteProject(projRoot);
    }
    deleteProjectDir(projRoot);
  });

  it('init a project with default auth config and the map resource, then remove the map', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addMapWithDefault(projRoot, { isFirstGeoResource: true });
    await amplifyPushWithoutCodegen(projRoot);

    const oldMeta = getProjectMeta(projRoot);
    const mapId = Object.keys(oldMeta.geo).filter((key) => oldMeta.geo[key].service === 'Map')[0];
    // remove map
    await removeMap(projRoot);
    await amplifyPushUpdate(projRoot);
    const newMeta = getProjectMeta(projRoot);
    expect(newMeta.geo[mapId]).toBeUndefined();
    const awsExport: any = getAWSExports(projRoot).default;
    expect(awsExport.geo).toBeUndefined();
  });

  it('init a project with default auth config and the place index resource, then remove the place index', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addPlaceIndexWithDefault(projRoot, { isFirstGeoResource: true });
    await amplifyPushWithoutCodegen(projRoot);

    const oldMeta = getProjectMeta(projRoot);
    const placeIndexId = Object.keys(oldMeta.geo).filter((key) => oldMeta.geo[key].service === 'PlaceIndex')[0];
    // remove place index
    await removePlaceIndex(projRoot);
    await amplifyPushUpdate(projRoot);
    const newMeta = getProjectMeta(projRoot);
    expect(newMeta.geo[placeIndexId]).toBeUndefined();
    const awsExport: any = getAWSExports(projRoot).default;
    expect(awsExport.geo).toBeUndefined();
  });

  it('init a project with default auth config and the geofence collection resource, then remove the geofence collection', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    const cognitoGroups = ['admin', 'admin1'];
    await updateAuthAddUserGroups(projRoot, cognitoGroups);
    await addGeofenceCollectionWithDefault(projRoot, cognitoGroups);
    await amplifyPushWithoutCodegen(projRoot);

    const oldMeta = getProjectMeta(projRoot);
    const collectionId = Object.keys(oldMeta.geo).filter((key) => oldMeta.geo[key].service === 'GeofenceCollection')[0];
    // remove geofence collection
    await removeGeofenceCollection(projRoot);
    await amplifyPushUpdate(projRoot);
    const newMeta = getProjectMeta(projRoot);
    expect(newMeta.geo[collectionId]).toBeUndefined();
    const awsExport: any = getAWSExports(projRoot).default;
    expect(awsExport.geo).toBeUndefined();
  });
});
