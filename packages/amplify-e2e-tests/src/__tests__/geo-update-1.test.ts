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
  updateMapWithDefault,
  updatePlaceIndexWithDefault,
  generateResourceIdsInOrder,
  getGeoJSConfiguration,
  updateAuthAddUserGroups,
  addGeofenceCollectionWithDefault,
  getGeofenceCollection,
  updateGeofenceCollectionWithDefault,
} from 'amplify-e2e-core';
import { existsSync } from 'fs';
import path from 'path';
import { getAWSExports } from '../aws-exports/awsExports';

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

  it('init a project with default auth config, add the map resource and update the auth config', async () => {
    const [map1Id, map2Id] = generateResourceIdsInOrder(2);
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addMapWithDefault(projRoot, { resourceName: map1Id, isFirstGeoResource: true });
    await addMapWithDefault(projRoot, { resourceName: map2Id, isAdditional: true, isDefault: false });
    await updateMapWithDefault(projRoot);
    await amplifyPushWithoutCodegen(projRoot);

    const meta = getProjectMeta(projRoot);
    const mapName = meta.geo[map1Id].output.Name;
    const region = meta.geo[map1Id].output.Region;
    const map = await getMap(mapName, region);
    expect(map.MapName).toBeDefined();
    expect(meta.geo[map1Id].accessType).toBe('AuthorizedAndGuestUsers');
    const awsExport: any = getAWSExports(projRoot).default;
    expect(getGeoJSConfiguration(awsExport).maps.items[mapName]).toBeDefined();
    expect(getGeoJSConfiguration(awsExport).maps.default).toEqual(mapName);
    expect(getGeoJSConfiguration(awsExport).region).toEqual(region);
  });

  it('init a project with default auth config, add the place index resource and update the auth config', async () => {
    const [index1Id, index2Id] = generateResourceIdsInOrder(2);
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addPlaceIndexWithDefault(projRoot, { resourceName: index1Id, isFirstGeoResource: true });
    await addPlaceIndexWithDefault(projRoot, { resourceName: index2Id, isAdditional: true, isDefault: false });
    await updatePlaceIndexWithDefault(projRoot);
    await amplifyPushWithoutCodegen(projRoot);

    const meta = getProjectMeta(projRoot);
    const placeIndexName = meta.geo[index1Id].output.Name;
    const region = meta.geo[index1Id].output.Region;
    const placeIndex = await getPlaceIndex(placeIndexName, region);
    expect(placeIndex.IndexName).toBeDefined();
    expect(meta.geo[index1Id].accessType).toBe('AuthorizedAndGuestUsers');
    const awsExport: any = getAWSExports(projRoot).default;
    expect(getGeoJSConfiguration(awsExport).search_indices.items).toContain(placeIndexName);
    expect(getGeoJSConfiguration(awsExport).search_indices.default).toEqual(placeIndexName);
    expect(getGeoJSConfiguration(awsExport).region).toEqual(region);
  });

  it('init a project with default auth config, add the geofence collection resource and update the auth config', async () => {
    const [collection1Id, collection2Id] = generateResourceIdsInOrder(2);
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    const cognitoGroups = ['admin', 'admin1'];
    await updateAuthAddUserGroups(projRoot, cognitoGroups);
    await addGeofenceCollectionWithDefault(projRoot, cognitoGroups, { resourceName: collection1Id });
    await addGeofenceCollectionWithDefault(projRoot, cognitoGroups, { resourceName: collection2Id, isAdditional: true, isDefault: false });
    await updateGeofenceCollectionWithDefault(projRoot, cognitoGroups);
    await amplifyPushWithoutCodegen(projRoot);

    const meta = getProjectMeta(projRoot);
    const collectionName = meta.geo[collection1Id].output.Name;
    const region = meta.geo[collection1Id].output.Region;
    const collection = await getGeofenceCollection(collectionName, region);
    expect(collection.CollectionName).toBeDefined();
    const awsExport: any = getAWSExports(projRoot).default;
    expect(getGeoJSConfiguration(awsExport).geofenceCollections.items).toContain(collectionName);
    expect(getGeoJSConfiguration(awsExport).geofenceCollections.default).toEqual(collectionName);
    expect(getGeoJSConfiguration(awsExport).region).toEqual(region);
  });
});
