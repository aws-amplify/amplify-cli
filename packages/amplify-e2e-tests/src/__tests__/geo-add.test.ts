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
  generateRandomShortId,
  getGeoJSConfiguration,
  updateAuthAddUserGroups,
  addGeofenceCollectionWithDefault,
  getGeofenceCollection
} from 'amplify-e2e-core';
import { existsSync } from 'fs';
import path from 'path';
import { getAWSExports } from '../aws-exports/awsExports';
import _ from 'lodash';

describe('amplify geo add', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('geo-add-test');
  });

  afterEach(async () => {
    const metaFilePath = path.join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
    if (existsSync(metaFilePath)) {
      await deleteProject(projRoot);
    }
    deleteProjectDir(projRoot);
  });

  it('init a project with default auth config and add the map resource', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addMapWithDefault(projRoot, { isFirstGeoResource: true });
    await amplifyPushWithoutCodegen(projRoot);

    const meta = getProjectMeta(projRoot);
    expect(meta.geo).toBeDefined();
    const mapId = _.findKey(meta.geo, ['service', 'Map']);
    const mapName = meta.geo[mapId].output.Name;
    const region = meta.geo[mapId].output.Region;
    const map = await getMap(mapName, region);
    const awsExport: any = getAWSExports(projRoot).default;
    expect(map.MapName).toBeDefined();
    expect(getGeoJSConfiguration(awsExport).maps.items[mapName]).toBeDefined();
    expect(getGeoJSConfiguration(awsExport).maps.default).toEqual(mapName);
    expect(getGeoJSConfiguration(awsExport).region).toEqual(region);
  });

  it('init a project with default auth config and add the place index resource', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addPlaceIndexWithDefault(projRoot, { isFirstGeoResource: true });
    await amplifyPushWithoutCodegen(projRoot);

    const meta = getProjectMeta(projRoot);
    expect(meta.geo).toBeDefined();
    const placeIndexId = _.findKey(meta.geo, ['service', 'PlaceIndex']);
    const indexName = meta.geo[placeIndexId].output.Name;
    const region = meta.geo[placeIndexId].output.Region;
    const placeIndex = await getPlaceIndex(indexName, region);
    const awsExport: any = getAWSExports(projRoot).default;
    expect(placeIndex.IndexName).toBeDefined();
    expect(getGeoJSConfiguration(awsExport).search_indices.items).toContain(indexName);
    expect(getGeoJSConfiguration(awsExport).search_indices.default).toEqual(indexName);
    expect(getGeoJSConfiguration(awsExport).region).toEqual(region);
  });

  it('init a project with default auth config and add the geofence collection resource', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await updateAuthAddUserGroups(projRoot, ['admin']);
    await addGeofenceCollectionWithDefault(projRoot, 'admin');
    await amplifyPushWithoutCodegen(projRoot);

    const meta = getProjectMeta(projRoot);
    expect(meta.geo).toBeDefined();
    const collectionId = _.findKey(meta.geo, ['service', 'GeofenceCollection']);
    const collectionName = meta.geo[collectionId].output.Name;
    const region = meta.geo[collectionId].output.Region;
    const collection = await getGeofenceCollection(collectionName, region);
    const awsExport: any = getAWSExports(projRoot).default;
    expect(collection.CollectionName).toBeDefined();
    expect(getGeoJSConfiguration(awsExport).geofenceCollections.items).toContain(collectionName);
    expect(getGeoJSConfiguration(awsExport).geofenceCollections.default).toEqual(collectionName);
    expect(getGeoJSConfiguration(awsExport).region).toEqual(region);
  });

  it('init a project with default auth config and add two map resources with the second set to default', async () => {
    const map1Id = `map${generateRandomShortId()}`;
    const map2Id = `map${generateRandomShortId()}`;
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addMapWithDefault(projRoot, { resourceName: map1Id, isFirstGeoResource: true });
    await addMapWithDefault(projRoot, { resourceName: map2Id, isAdditional: true });
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

  it('init a project with default auth config and add two place index resources with the second set to default', async () => {
    const index1Id = `placeindex${generateRandomShortId()}`;
    const index2Id = `placeindex${generateRandomShortId()}`;
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addPlaceIndexWithDefault(projRoot, { resourceName: index1Id, isFirstGeoResource: true });
    await addPlaceIndexWithDefault(projRoot, { resourceName: index2Id, isAdditional: true });
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

  it('init a project with default auth config and add two geofence collection resources with the second set to default', async () => {
    const collection1Id = `geofencecollection${generateRandomShortId()}`;
    const collection2Id = `geofencecollection${generateRandomShortId()}`;
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await updateAuthAddUserGroups(projRoot, ['admin']);
    await addGeofenceCollectionWithDefault(projRoot, 'admin', { resourceName: collection1Id });
    await addGeofenceCollectionWithDefault(projRoot, 'admin', { resourceName: collection2Id, isAdditional: true });
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
});
