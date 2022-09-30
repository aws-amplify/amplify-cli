/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */

import {
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  addAuthWithDefault,
  addPlaceIndexWithDefault,
  getProjectMeta,
  amplifyPushWithoutCodegen,
  getPlaceIndex,
  getGeoJSConfiguration,
} from '@aws-amplify/amplify-e2e-core';
import { existsSync } from 'fs';
import path from 'path';
import _ from 'lodash';
import { getAWSExports } from '../aws-exports/awsExports';

describe('amplify geo add b', () => {
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

});
