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
  updateSecondMapAsDefault,
  updateSecondPlaceIndexAsDefault,
  generateRandomShortId,
  getGeoJSConfiguration
} from 'amplify-e2e-core';
import { existsSync } from 'fs';
import path from 'path';
import { getAWSExports } from '../aws-exports/awsExports';

export function generateTwoResourceIdsInOrder(): string[] {
  const resourceIdArr: string[] = [];
  resourceIdArr.push(generateRandomShortId());
  resourceIdArr.push(generateRandomShortId());
  return resourceIdArr.sort();
}

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
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addMapWithDefault(projRoot, { isFirstGeoResource: true });
    await updateMapWithDefault(projRoot);
    await amplifyPushWithoutCodegen(projRoot);

    const meta = getProjectMeta(projRoot);
    const geoMeta = Object.keys(meta.geo).filter(key => meta.geo[key].service === 'Map').map(key => meta.geo[key])[0]
    const mapName = geoMeta.output.Name;
    const region = meta.providers.awscloudformation.Region;
    const map = await getMap(mapName, region);
    expect(map.MapName).toBeDefined();
    expect(geoMeta.accessType).toBe('AuthorizedAndGuestUsers');
    const awsExport: any = getAWSExports(projRoot).default;
    expect(getGeoJSConfiguration(awsExport).maps.items[mapName]).toBeDefined();
    expect(getGeoJSConfiguration(awsExport).maps.default).toEqual(mapName);
    expect(getGeoJSConfiguration(awsExport).region).toEqual(region);
  });

  it('init a project with default auth config, add the place index resource and update the auth config', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addPlaceIndexWithDefault(projRoot, { isFirstGeoResource: true });
    await updatePlaceIndexWithDefault(projRoot);
    await amplifyPushWithoutCodegen(projRoot);

    const meta = getProjectMeta(projRoot);
    const geoMeta = Object.keys(meta.geo).filter(key => meta.geo[key].service === 'PlaceIndex').map(key => meta.geo[key])[0]
    const placeIndexName = geoMeta.output.Name;
    const region = meta.providers.awscloudformation.Region;
    const placeIndex = await getPlaceIndex(placeIndexName, region);
    expect(placeIndex.IndexName).toBeDefined();
    expect(geoMeta.accessType).toBe('AuthorizedAndGuestUsers');
    const awsExport: any = getAWSExports(projRoot).default;
    expect(getGeoJSConfiguration(awsExport).search_indices.items).toContain(placeIndexName);
    expect(getGeoJSConfiguration(awsExport).search_indices.default).toEqual(placeIndexName);
    expect(getGeoJSConfiguration(awsExport).region).toEqual(region);
  });

  it('init a project with default auth config, add multiple map resources and update the default map', async () => {
    const [map1Id, map2Id] = generateTwoResourceIdsInOrder();
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addMapWithDefault(projRoot, { resourceName: map1Id, isFirstGeoResource: true });
    await addMapWithDefault(projRoot, { resourceName: map2Id, isAdditional: true, isDefault: false });
    await updateSecondMapAsDefault(projRoot);
    await amplifyPushWithoutCodegen(projRoot);

    //check amplify meta file
    const meta = getProjectMeta(projRoot);
    expect(meta.geo[map1Id].isDefault).toBe(false);
    expect(meta.geo[map2Id].isDefault).toBe(true);
    //check if resource is provisioned in cloud
    const region = meta.providers.awscloudformation.Region;
    const map1Name = meta.geo[map1Id].output.Name;
    const map2Name = meta.geo[map2Id].output.Name;
    const map1 = await getMap(map1Name, region);
    const map2 = await getMap(map2Name, region);
    expect(map1.MapName).toBeDefined();
    expect(map2.MapName).toBeDefined();
    //check aws export file
    const awsExport: any = getAWSExports(projRoot).default;
    expect(getGeoJSConfiguration(awsExport).maps.items[map1Name]).toBeDefined();
    expect(getGeoJSConfiguration(awsExport).maps.items[map2Name]).toBeDefined();
    expect(getGeoJSConfiguration(awsExport).maps.default).toEqual(map2Name);
    expect(getGeoJSConfiguration(awsExport).region).toEqual(region);
  });

  it('init a project with default auth config, add multiple place index resources and update the default index', async () => {
    const [index1Id, index2Id] = generateTwoResourceIdsInOrder();
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addPlaceIndexWithDefault(projRoot, { resourceName: index1Id, isFirstGeoResource: true });
    await addPlaceIndexWithDefault(projRoot, { resourceName: index2Id, isAdditional: true, isDefault: false });
    await updateSecondPlaceIndexAsDefault(projRoot);
    await amplifyPushWithoutCodegen(projRoot);

    //check amplify meta file
    const meta = getProjectMeta(projRoot);
    expect(meta.geo[index1Id].isDefault).toBe(false);
    expect(meta.geo[index2Id].isDefault).toBe(true);
    //check if resource is provisioned in cloud
    const region = meta.providers.awscloudformation.Region;
    const index1Name = meta.geo[index1Id].output.Name;
    const index2Name = meta.geo[index2Id].output.Name;
    const index1 = await getPlaceIndex(index1Name, region);
    const index2 = await getPlaceIndex(index2Name, region);
    expect(index1.IndexName).toBeDefined();
    expect(index2.IndexName).toBeDefined();
    //check aws export file
    const awsExport: any = getAWSExports(projRoot).default;
    expect(getGeoJSConfiguration(awsExport).search_indices.items).toContain(index1Name);
    expect(getGeoJSConfiguration(awsExport).search_indices.items).toContain(index2Name);
    expect(getGeoJSConfiguration(awsExport).search_indices.default).toEqual(index2Name);
    expect(getGeoJSConfiguration(awsExport).region).toEqual(region);
  });
})