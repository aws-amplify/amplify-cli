/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */

import {
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  addAuthWithDefault,
  addMapWithDefault,
  getProjectMeta,
  amplifyPushWithoutCodegen,
  getMap,
  generateRandomShortId,
  getGeoJSConfiguration,
} from "@aws-amplify/amplify-e2e-core";
import { existsSync } from "fs";
import path from "path";
import { getAWSExports } from "../aws-exports/awsExports";

describe("amplify geo add d", () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir("geo-add-test");
  });

  afterEach(async () => {
    const metaFilePath = path.join(projRoot, "amplify", "#current-cloud-backend", "amplify-meta.json");
    if (existsSync(metaFilePath)) {
      await deleteProject(projRoot);
    }
    deleteProjectDir(projRoot);
  });

  it("init a project with default auth config and add two map resources with the second set to default", async () => {
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
});
