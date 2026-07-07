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
  getGeoJSConfiguration,
  updateAuthAddUserGroups,
  addGeofenceCollectionWithDefault,
  getGeofenceCollection,
} from '@aws-amplify/amplify-e2e-core';
import { existsSync } from 'fs';
import path from 'path';
import _ from 'lodash';
import { getAWSExports } from '../aws-exports/awsExports';

describe('amplify geo add c', () => {
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

  it('init a project with default auth config and add the geofence collection resource', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    const cognitoGroups = ['admin', 'admin1'];
    await updateAuthAddUserGroups(projRoot, cognitoGroups);
    await addGeofenceCollectionWithDefault(projRoot, cognitoGroups);
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
});
