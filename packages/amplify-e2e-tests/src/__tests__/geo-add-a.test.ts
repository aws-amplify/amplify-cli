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
  getGeoJSConfiguration,
} from '@aws-amplify/amplify-e2e-core';
import { existsSync } from 'fs';
import path from 'path';
import _ from 'lodash';
import { getAWSExports } from '../aws-exports/awsExports';

describe('amplify geo add a', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('geo-add-test');
    process.env.AMPLIFY_ENABLE_DEBUG_OUTPUT = 'true';
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
});
