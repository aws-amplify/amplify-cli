import {
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  addAuthWithDefault,
  addMapWithDefault,
  addPlaceIndexWithDefault,
  getProjectMeta,
  amplifyPushWithoutCodegen,
  getMap,
  getPlaceIndex,
  updateSecondMapAsDefault,
  updateSecondPlaceIndexAsDefault,
  generateResourceIdsInOrder,
  getGeoJSConfiguration,
  updateAuthAddUserGroups,
  addGeofenceCollectionWithDefault,
  getGeofenceCollection,
  updateSecondGeofenceCollectionAsDefault,
  addDeviceTrackerWithDefault,
} from '@aws-amplify/amplify-e2e-core';
import { existsSync } from 'fs';
import path from 'path';
import { getAWSExports } from '../aws-exports/awsExports';
import { updateDeviceTrackerWithDefault } from '../../../amplify-e2e-core/src/categories/geo';
import { getDeviceLocationTracker } from '../../../amplify-e2e-core/src/utils/sdk-calls';

describe('amplify geo update', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('geo-update-test');
  });

  afterEach(async () => {
    const metaFilePath = path.join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
    if (existsSync(metaFilePath)) {
      await deleteProject(projRoot);
    }
    deleteProjectDir(projRoot);
  });

  it('init a project with default auth config, add multiple map resources and update the default map', async () => {
    const [map1Id, map2Id, map3Id] = generateResourceIdsInOrder(3);
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addMapWithDefault(projRoot, { resourceName: map1Id, isFirstGeoResource: true });
    await addMapWithDefault(projRoot, { resourceName: map2Id, isAdditional: true, isDefault: false });
    await addMapWithDefault(projRoot, { resourceName: map3Id, isAdditional: true, isDefault: false });
    await updateSecondMapAsDefault(projRoot);
    await amplifyPushWithoutCodegen(projRoot);

    // check amplify meta file
    const meta = getProjectMeta(projRoot);
    expect(meta.geo[map1Id].isDefault).toBe(false);
    expect(meta.geo[map2Id].isDefault).toBe(true);
    // check if resource is provisioned in cloud
    const region = meta.geo[map1Id].output.Region;
    const map1Name = meta.geo[map1Id].output.Name;
    const map2Name = meta.geo[map2Id].output.Name;
    const map1 = await getMap(map1Name, region);
    const map2 = await getMap(map2Name, region);
    expect(map1.MapName).toBeDefined();
    expect(map2.MapName).toBeDefined();
    // check aws export file
    const awsExport: any = getAWSExports(projRoot).default;
    expect(getGeoJSConfiguration(awsExport).maps.items[map1Name]).toBeDefined();
    expect(getGeoJSConfiguration(awsExport).maps.items[map2Name]).toBeDefined();
    expect(getGeoJSConfiguration(awsExport).maps.default).toEqual(map2Name);
    expect(getGeoJSConfiguration(awsExport).region).toEqual(region);
  });

  it('init a project with default auth config, add multiple place index resources and update the default index', async () => {
    const [index1Id, index2Id, index3Id] = generateResourceIdsInOrder(3);
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addPlaceIndexWithDefault(projRoot, { resourceName: index1Id, isFirstGeoResource: true });
    await addPlaceIndexWithDefault(projRoot, { resourceName: index2Id, isAdditional: true, isDefault: false });
    await addPlaceIndexWithDefault(projRoot, { resourceName: index3Id, isAdditional: true, isDefault: false });
    await updateSecondPlaceIndexAsDefault(projRoot);
    await amplifyPushWithoutCodegen(projRoot);

    // check amplify meta file
    const meta = getProjectMeta(projRoot);
    expect(meta.geo[index1Id].isDefault).toBe(false);
    expect(meta.geo[index2Id].isDefault).toBe(true);
    // check if resource is provisioned in cloud
    const region = meta.geo[index1Id].output.Region;
    const index1Name = meta.geo[index1Id].output.Name;
    const index2Name = meta.geo[index2Id].output.Name;
    const index1 = await getPlaceIndex(index1Name, region);
    const index2 = await getPlaceIndex(index2Name, region);
    expect(index1.IndexName).toBeDefined();
    expect(index2.IndexName).toBeDefined();
    // check aws export file
    const awsExport: any = getAWSExports(projRoot).default;
    expect(getGeoJSConfiguration(awsExport).search_indices.items).toContain(index1Name);
    expect(getGeoJSConfiguration(awsExport).search_indices.items).toContain(index2Name);
    expect(getGeoJSConfiguration(awsExport).search_indices.default).toEqual(index2Name);
    expect(getGeoJSConfiguration(awsExport).region).toEqual(region);
  });

  it('init a project with default auth config, add multiple geofence collection resources and update the default collection', async () => {
    const [collection1Id, collection2Id, collection3Id] = generateResourceIdsInOrder(3);
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    const cognitoGroups = ['admin', 'admin1'];
    await updateAuthAddUserGroups(projRoot, cognitoGroups);
    await addGeofenceCollectionWithDefault(projRoot, cognitoGroups, { resourceName: collection1Id });
    await addGeofenceCollectionWithDefault(projRoot, cognitoGroups, { resourceName: collection2Id, isAdditional: true, isDefault: false });
    await addGeofenceCollectionWithDefault(projRoot, cognitoGroups, { resourceName: collection3Id, isAdditional: true, isDefault: false });
    await updateSecondGeofenceCollectionAsDefault(projRoot, cognitoGroups);
    await amplifyPushWithoutCodegen(projRoot);

    // check amplify meta file
    const meta = getProjectMeta(projRoot);
    expect(meta.geo[collection1Id].isDefault).toBe(false);
    expect(meta.geo[collection2Id].isDefault).toBe(true);
    // check if resource is provisioned in cloud
    const region = meta.geo[collection1Id].output.Region;
    const collection1Name = meta.geo[collection1Id].output.Name;
    const collection2Name = meta.geo[collection2Id].output.Name;
    const collection1 = await getGeofenceCollection(collection1Name, region);
    const collection2 = await getGeofenceCollection(collection2Name, region);
    expect(collection1.CollectionName).toBeDefined();
    expect(collection2.CollectionName).toBeDefined();
    // check aws export file
    const awsExport: any = getAWSExports(projRoot).default;
    expect(getGeoJSConfiguration(awsExport).geofenceCollections.items).toContain(collection1Name);
    expect(getGeoJSConfiguration(awsExport).geofenceCollections.items).toContain(collection2Name);
    expect(getGeoJSConfiguration(awsExport).geofenceCollections.default).toEqual(collection2Name);
    expect(getGeoJSConfiguration(awsExport).region).toEqual(region);
  });

  it.only('init a project with default auth config and add two device location tracker resources and update the first to be default', async () => {
    const [deviceTracker1Id, deviceTracker2Id] = generateResourceIdsInOrder(3);
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    const cognitoGroups = ['admin', 'admin1'];
    await updateAuthAddUserGroups(projRoot, cognitoGroups);
    await addDeviceTrackerWithDefault(projRoot, cognitoGroups, { resourceName: deviceTracker1Id });
    await addDeviceTrackerWithDefault(projRoot, cognitoGroups, { resourceName: deviceTracker2Id, isAdditional: true });
    await updateDeviceTrackerWithDefault(projRoot, cognitoGroups);
    await amplifyPushWithoutCodegen(projRoot);

    // check amplify meta file
    const meta = getProjectMeta(projRoot);
    expect(meta.geo[deviceTracker1Id].isDefault).toBe(true);
    expect(meta.geo[deviceTracker2Id].isDefault).toBe(false);
    // check if resource is provisioned in cloud
    const region = meta.geo[deviceTracker1Id].output.Region;
    const deviceTracker1Name = meta.geo[deviceTracker1Id].output.Name;
    const deviceTracker2Name = meta.geo[deviceTracker2Id].output.Name;
    const deviceTracker1 = await getDeviceLocationTracker(deviceTracker1Name, region);
    const deviceTracker2 = await getDeviceLocationTracker(deviceTracker2Name, region);
    expect(deviceTracker1.TrackerName).toBeDefined();
    expect(deviceTracker2.TrackerName).toBeDefined();
    // check aws export file
    const awsExport: any = getAWSExports(projRoot).default;
    expect(getGeoJSConfiguration(awsExport).trackers.items).toContain(deviceTracker1Name);
    expect(getGeoJSConfiguration(awsExport).trackers.items).toContain(deviceTracker2Name);
    expect(getGeoJSConfiguration(awsExport).trackers.default).toEqual(deviceTracker1Name);
    expect(getGeoJSConfiguration(awsExport).region).toEqual(region);
  });
});
