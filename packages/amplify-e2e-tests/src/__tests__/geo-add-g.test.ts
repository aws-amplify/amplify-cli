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
  addDeviceTrackerWithDefault,
  getDeviceLocationTracker,
} from '@aws-amplify/amplify-e2e-core';
import { existsSync } from 'fs';
import * as fs from 'fs-extra';
import path from 'path';
import { getAWSExports } from '../aws-exports/awsExports';
import { addDeviceTrackerWithDefault, addGeofenceCollectionWithDefault } from '../../../amplify-e2e-core/src/categories/geo';
import { getDeviceLocationTracker } from '../../../amplify-e2e-core/src/utils/sdk-calls';

describe('amplify geo add g', () => {
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

  it('init a project with default auth config and add two device location tracker resources with the second set to default', async () => {
    const deviceTracker1Id = `deviceTracker${generateRandomShortId()}`;
    const deviceTracker2Id = `deviceTracker${generateRandomShortId()}`;
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    const cognitoGroups = ['admin', 'admin1'];
    await updateAuthAddUserGroups(projRoot, cognitoGroups);
    await addDeviceTrackerWithDefault(projRoot, cognitoGroups, { resourceName: deviceTracker1Id });
    await addDeviceTrackerWithDefault(projRoot, cognitoGroups, { resourceName: deviceTracker2Id, isAdditional: true });
    await amplifyPushWithoutCodegen(projRoot);

    // check amplify meta file
    const meta = getProjectMeta(projRoot);
    expect(meta.geo[deviceTracker1Id].isDefault).toBe(false);
    expect(meta.geo[deviceTracker2Id].isDefault).toBe(true);
    // check if resource is provisioned in cloud
    const region = meta.geo[deviceTracker1Id].output.Region;
    const deviceTracker1Name = meta.geo[deviceTracker1Id].output.Name;
    const deviceTracker2Name = meta.geo[deviceTracker2Id].output.Name;
    const deviceTracker1 = await getDeviceLocationTracker(deviceTracker1Name, region);
    const deviceTracker2 = await getDeviceLocationTracker(deviceTracker2Name, region);
    expect(deviceTracker1.TrackerName).toBeDefined();
    expect(deviceTracker2.TrackerName).toBeDefined();
    // check aws export file
    const awsExport: any = getAWSExports(projRoot).default;
    expect(getGeoJSConfiguration(awsExport).trackers.items).toContain(deviceTracker1Name);
    expect(getGeoJSConfiguration(awsExport).trackers.items).toContain(deviceTracker2Name);
    expect(getGeoJSConfiguration(awsExport).trackers.default).toEqual(deviceTracker2Name);
    expect(getGeoJSConfiguration(awsExport).region).toEqual(region);
  });

  it('add a device location tracker resource with advanced setting - set position filtering method', async () => {
    const deviceTracker1Id = `deviceTracker${generateRandomShortId()}`;
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    const cognitoGroups = ['admin', 'admin1'];
    await updateAuthAddUserGroups(projRoot, cognitoGroups);
    await addDeviceTrackerWithDefault(projRoot, cognitoGroups, { resourceName: deviceTracker1Id }, 'setPositionFilteringMethod');
    await amplifyPushWithoutCodegen(projRoot);

    // check amplify meta file
    const meta = getProjectMeta(projRoot);
    // check if resource is provisioned in cloud
    const region = meta.geo[deviceTracker1Id].output.Region;
    const deviceTracker1Name = meta.geo[deviceTracker1Id].output.Name;
    expect(meta.geo[deviceTracker1Id].positionFiltering).toEqual('AccuracyBased');
    const deviceTracker1 = await getDeviceLocationTracker(deviceTracker1Name, region);
    expect(deviceTracker1.TrackerName).toBeDefined();
    // check aws export file
    const awsExport: any = getAWSExports(projRoot).default;
    expect(getGeoJSConfiguration(awsExport).trackers.items).toContain(deviceTracker1Name);
    expect(getGeoJSConfiguration(awsExport).region).toEqual(region);
  });

  it('add a device location tracker resource with advanced setting - grant access to other devices', async () => {
    const deviceTracker1Id = `deviceTracker${generateRandomShortId()}`;
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    const cognitoGroups = ['admin', 'admin1'];
    await updateAuthAddUserGroups(projRoot, cognitoGroups);
    await addDeviceTrackerWithDefault(projRoot, cognitoGroups, { resourceName: deviceTracker1Id }, 'grantOtherAccess');
    await amplifyPushWithoutCodegen(projRoot);

    const cfnTemplatePath: string = path.join(projRoot, 'amplify', '#current-cloud-backend', 'awscloudformation', 'build', 'geo', deviceTracker1Id, `${deviceTracker1Id}-cloudformation-template.json`);
    const cfnTemplate = JSON.parse(fs.readFileSync(cfnTemplatePath, 'utf8'));
    cognitoGroups.forEach(group => {
      expect(cfnTemplate.Resources[`${group}DeviceLocationTrackingPolicy`].Properties.PolicyDocument.Statement.Condition).toBeUndefined();
    });
  });

  it('add a device location tracker resource with advanced setting - link geofence collection', async () => {
    const deviceTracker1Id = `deviceTracker${generateRandomShortId()}`;
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    const cognitoGroups = ['admin', 'admin1'];
    await updateAuthAddUserGroups(projRoot, cognitoGroups);
    await addGeofenceCollectionWithDefault(projRoot, cognitoGroups, { resourceName: 'geofenceCollection1' });
    await addDeviceTrackerWithDefault(projRoot, cognitoGroups, { resourceName: deviceTracker1Id }, 'linkGeofenceCollection');
    await amplifyPushWithoutCodegen(projRoot);

    // check amplify meta file
    const meta = getProjectMeta(projRoot);
    // check if resource is provisioned in cloud
    const region = meta.geo[deviceTracker1Id].output.Region;
    const deviceTracker1Name = meta.geo[deviceTracker1Id].output.Name;
    expect(meta.geo[deviceTracker1Id].linkedGeofenceCollections).toContain('geofenceCollection1');
    const deviceTracker1 = await getDeviceLocationTracker(deviceTracker1Name, region);
    expect(deviceTracker1.TrackerName).toBeDefined();
    // check aws export file
    const awsExport: any = getAWSExports(projRoot).default;
    expect(getGeoJSConfiguration(awsExport).trackers.items).toContain(deviceTracker1Name);
    expect(getGeoJSConfiguration(awsExport).region).toEqual(region);
  });
});
