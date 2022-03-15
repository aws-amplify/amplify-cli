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
  removeMap,
  amplifyPushUpdate,
  removePlaceIndex,
  removeFirstDefaultMap,
  removeFirstDefaultPlaceIndex,
  generateResourceIdsInOrder,
  getGeoJSConfiguration,
  updateAuthAddUserGroups,
  addGeofenceCollectionWithDefault,
  getGeofenceCollection,
  removeGeofenceCollection,
  removeFirstDefaultGeofenceCollection
} from 'amplify-e2e-core';
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
    const mapId = Object.keys(oldMeta.geo).filter(key => oldMeta.geo[key].service === 'Map')[0];
    //remove map
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
    const placeIndexId = Object.keys(oldMeta.geo).filter(key => oldMeta.geo[key].service === 'PlaceIndex')[0];
    //remove place index
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
    await updateAuthAddUserGroups(projRoot, ['admin']);
    await addGeofenceCollectionWithDefault(projRoot, 'admin');
    await amplifyPushWithoutCodegen(projRoot);

    const oldMeta = getProjectMeta(projRoot);
    const collectionId = Object.keys(oldMeta.geo).filter(key => oldMeta.geo[key].service === 'GeofenceCollection')[0];
    //remove geofence collection
    await removeGeofenceCollection(projRoot);
    await amplifyPushUpdate(projRoot);
    const newMeta = getProjectMeta(projRoot);
    expect(newMeta.geo[collectionId]).toBeUndefined();
    const awsExport: any = getAWSExports(projRoot).default;
    expect(awsExport.geo).toBeUndefined();
  });

  it('init a project with default auth config and multiple map resources, then remove the default map', async () => {
    const [map1Id, map2Id, map3Id] = generateResourceIdsInOrder(3);
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addMapWithDefault(projRoot, { resourceName: map1Id, isFirstGeoResource: true });
    await addMapWithDefault(projRoot, { resourceName: map2Id, isAdditional: true, isDefault: false });
    await addMapWithDefault(projRoot, { resourceName: map3Id, isAdditional: true, isDefault: false });
    await amplifyPushWithoutCodegen(projRoot);
    const oldMeta = getProjectMeta(projRoot);
    expect(oldMeta.geo[map1Id].isDefault).toBe(true);
    expect(oldMeta.geo[map2Id].isDefault).toBe(false);
    const map1Name = oldMeta.geo[map1Id].output.Name;
    const map2Name = oldMeta.geo[map2Id].output.Name;
    const region = oldMeta.geo[map1Id].output.Region;
    //remove map
    await removeFirstDefaultMap(projRoot);
    await amplifyPushUpdate(projRoot);
    const newMeta = getProjectMeta(projRoot);
    expect(newMeta.geo[map1Id]).toBeUndefined();
    expect(newMeta.geo[map2Id].isDefault).toBe(true);
    const awsExport: any = getAWSExports(projRoot).default;
    expect(getGeoJSConfiguration(awsExport).maps.items[map1Name]).toBeUndefined();
    expect(getGeoJSConfiguration(awsExport).maps.items[map2Name]).toBeDefined();
    expect(getGeoJSConfiguration(awsExport).maps.default).toEqual(map2Name);
    expect(getGeoJSConfiguration(awsExport).region).toEqual(region);
  });

  it('init a project with default auth config and multiple index resources, then remove the default index', async () => {
    const [index1Id, index2Id, index3Id] = generateResourceIdsInOrder(3);
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addPlaceIndexWithDefault(projRoot, { resourceName: index1Id, isFirstGeoResource: true });
    await addPlaceIndexWithDefault(projRoot, { resourceName: index2Id, isAdditional: true, isDefault: false });
    await addPlaceIndexWithDefault(projRoot, { resourceName: index3Id, isAdditional: true, isDefault: false });
    await amplifyPushWithoutCodegen(projRoot);
    const oldMeta = getProjectMeta(projRoot);
    expect(oldMeta.geo[index1Id].isDefault).toBe(true);
    expect(oldMeta.geo[index2Id].isDefault).toBe(false);
    const index1Name = oldMeta.geo[index1Id].output.Name;
    const index2Name = oldMeta.geo[index2Id].output.Name;
    const region = oldMeta.geo[index1Id].output.Region;
    //remove place index
    await removeFirstDefaultPlaceIndex(projRoot);
    await amplifyPushUpdate(projRoot);
    const newMeta = getProjectMeta(projRoot);
    expect(newMeta.geo[index1Id]).toBeUndefined();
    expect(newMeta.geo[index2Id].isDefault).toBe(true);
    const awsExport: any = getAWSExports(projRoot).default;
    expect(getGeoJSConfiguration(awsExport).search_indices.items).toContain(index2Name);
    expect(getGeoJSConfiguration(awsExport).search_indices.items).not.toContain(index1Name);
    expect(getGeoJSConfiguration(awsExport).search_indices.default).toEqual(index2Name);
    expect(getGeoJSConfiguration(awsExport).region).toEqual(region);
  });

  it('init a project with default auth config and multiple geofence collection resources, then remove the default geofence collection', async () => {
    const [collection1Id, collection2Id, collection3Id] = generateResourceIdsInOrder(3);
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await updateAuthAddUserGroups(projRoot, ['admin']);
    await addGeofenceCollectionWithDefault(projRoot, 'admin', { resourceName: collection1Id });
    await addGeofenceCollectionWithDefault(projRoot, 'admin', { resourceName: collection2Id, isAdditional: true, isDefault: false });
    await addGeofenceCollectionWithDefault(projRoot, 'admin', { resourceName: collection3Id, isAdditional: true, isDefault: false });
    await amplifyPushWithoutCodegen(projRoot);
    const oldMeta = getProjectMeta(projRoot);
    expect(oldMeta.geo[collection1Id].isDefault).toBe(true);
    expect(oldMeta.geo[collection2Id].isDefault).toBe(false);
    const collection1Name = oldMeta.geo[collection1Id].output.Name;
    const collection2Name = oldMeta.geo[collection2Id].output.Name;
    const region = oldMeta.geo[collection1Id].output.Region;

    //remove geofence collection
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
});
