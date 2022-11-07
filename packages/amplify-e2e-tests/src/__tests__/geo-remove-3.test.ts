import {
  addAuthWithDefault,
  addGeofenceCollectionWithDefault,
  amplifyPushUpdate,
  amplifyPushWithoutCodegen,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  generateResourceIdsInOrder,
  getGeoJSConfiguration,
  getProjectMeta,
  initJSProjectWithProfile,
  removeFirstDefaultGeofenceCollection,
  updateAuthAddUserGroups,
  addDeviceTrackerWithDefault,
  removeFirstDefaultDeviceTracker,
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

  it('init a project with default auth config and multiple geofence collection resources, then remove the default geofence collection', async () => {
    const [collection1Id, collection2Id, collection3Id] = generateResourceIdsInOrder(3);
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    const cognitoGroups = ['admin', 'admin1'];
    await updateAuthAddUserGroups(projRoot, cognitoGroups);
    await addGeofenceCollectionWithDefault(projRoot, cognitoGroups, { resourceName: collection1Id });
    await addGeofenceCollectionWithDefault(projRoot, cognitoGroups, { resourceName: collection2Id, isAdditional: true, isDefault: false });
    await addGeofenceCollectionWithDefault(projRoot, cognitoGroups, { resourceName: collection3Id, isAdditional: true, isDefault: false });
    await amplifyPushWithoutCodegen(projRoot);
    const oldMeta = getProjectMeta(projRoot);
    expect(oldMeta.geo[collection1Id].isDefault).toBe(true);
    expect(oldMeta.geo[collection2Id].isDefault).toBe(false);
    const collection1Name = oldMeta.geo[collection1Id].output.Name;
    const collection2Name = oldMeta.geo[collection2Id].output.Name;
    const region = oldMeta.geo[collection1Id].output.Region;

    // remove geofence collection
    await removeFirstDefaultGeofenceCollection(projRoot);
    await amplifyPushUpdate(projRoot);
    const newMeta = getProjectMeta(projRoot);
    expect(newMeta.geo[collection1Id]).toBeUndefined();
    expect(newMeta.geo[collection2Id].isDefault).toBe(true);
    const awsExport: any = getAWSExports(projRoot).default;
    expect(getGeoJSConfiguration(awsExport).geofenceCollections.items).toContain(collection2Name);
    expect(getGeoJSConfiguration(awsExport).geofenceCollections.items).not.toContain(collection1Name);
    expect(getGeoJSConfiguration(awsExport).geofenceCollections.default).toEqual(collection2Name);
    expect(getGeoJSConfiguration(awsExport).region).toEqual(region);
  });

  it('init a project with default auth config and multiple device tracker resources, then remove the default device tracker', async () => {
    const [deviceTracker1Id, deviceTracker2Id, deviceTracker3Id] = generateResourceIdsInOrder(3);
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    const cognitoGroups = ['admin', 'admin1'];
    await updateAuthAddUserGroups(projRoot, cognitoGroups);
    await addDeviceTrackerWithDefault(projRoot, cognitoGroups, { resourceName: deviceTracker1Id });
    await addDeviceTrackerWithDefault(projRoot, cognitoGroups, { resourceName: deviceTracker2Id, isAdditional: true, isDefault: false });
    await addDeviceTrackerWithDefault(projRoot, cognitoGroups, { resourceName: deviceTracker3Id, isAdditional: true, isDefault: false });
    await amplifyPushWithoutCodegen(projRoot);
    const oldMeta = getProjectMeta(projRoot);
    expect(oldMeta.geo[deviceTracker1Id].isDefault).toBe(true);
    expect(oldMeta.geo[deviceTracker2Id].isDefault).toBe(false);
    const tracker1Name = oldMeta.geo[deviceTracker1Id].output.Name;
    const tracker2Name = oldMeta.geo[deviceTracker2Id].output.Name;
    const region = oldMeta.geo[deviceTracker1Id].output.Region;

    // remove deviceTracker
    await removeFirstDefaultDeviceTracker(projRoot);
    await amplifyPushUpdate(projRoot);
    const newMeta = getProjectMeta(projRoot);
    expect(newMeta.geo[deviceTracker1Id]).toBeUndefined();
    expect(newMeta.geo[deviceTracker2Id].isDefault).toBe(true);
    const awsExport: any = getAWSExports(projRoot).default;
    expect(getGeoJSConfiguration(awsExport).trackers.items).toContain(tracker2Name);
    expect(getGeoJSConfiguration(awsExport).trackers.items).not.toContain(tracker1Name);
    expect(getGeoJSConfiguration(awsExport).trackers.default).toEqual(tracker2Name);
    expect(getGeoJSConfiguration(awsExport).region).toEqual(region);
  });
});
