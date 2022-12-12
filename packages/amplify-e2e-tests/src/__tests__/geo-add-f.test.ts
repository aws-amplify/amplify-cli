/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */

import {
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  addAuthWithDefault,
  getProjectMeta,
  amplifyPushWithoutCodegen,
  generateRandomShortId,
  getGeoJSConfiguration,
  updateAuthAddUserGroups,
  addGeofenceCollectionWithDefault,
  getGeofenceCollection,
} from "@aws-amplify/amplify-e2e-core";
import { existsSync } from "fs";
import path from "path";
import { getAWSExports } from "../aws-exports/awsExports";

describe("amplify geo add", () => {
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

  it("init a project with default auth config and add two geofence collection resources with the second set to default", async () => {
    const collection1Id = `geofencecollection${generateRandomShortId()}`;
    const collection2Id = `geofencecollection${generateRandomShortId()}`;
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    const cognitoGroups = ["admin", "admin1"];
    await updateAuthAddUserGroups(projRoot, cognitoGroups);
    await addGeofenceCollectionWithDefault(projRoot, cognitoGroups, { resourceName: collection1Id });
    await addGeofenceCollectionWithDefault(projRoot, cognitoGroups, { resourceName: collection2Id, isAdditional: true });
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
