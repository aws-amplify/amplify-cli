import {
  addAuthWithDefault,
  addMapWithDefault,
  addPlaceIndexWithDefault,
  amplifyPushUpdate,
  amplifyPushWithoutCodegen,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  generateResourceIdsInOrder,
  getGeoJSConfiguration,
  getProjectMeta,
  initJSProjectWithProfile,
  removeFirstDefaultMap,
  removeFirstDefaultPlaceIndex,
} from "@aws-amplify/amplify-e2e-core";
import { existsSync } from "fs";
import path from "path";
import { getAWSExports } from "../aws-exports/awsExports";

describe("amplify geo remove", () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir("geo-remove-test");
  });

  afterEach(async () => {
    const metaFilePath = path.join(projRoot, "amplify", "#current-cloud-backend", "amplify-meta.json");
    if (existsSync(metaFilePath)) {
      await deleteProject(projRoot);
    }
    deleteProjectDir(projRoot);
  });

  it("init a project with default auth config and multiple map resources, then remove the default map", async () => {
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
    // remove map
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

  it("init a project with default auth config and multiple index resources, then remove the default index", async () => {
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
    // remove place index
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
});
