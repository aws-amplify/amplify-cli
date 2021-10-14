import {
  amplifyPush,
  amplifyPushUpdate,
  deleteProject,
  initJSProjectWithProfile,
  listAttachedRolePolicies,
  listRolePolicies,
  updateAuthAddAdminQueries,
} from 'amplify-e2e-core';
import * as path from 'path';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync';
import gql from 'graphql-tag';
const providerName = 'awscloudformation';

import {
  addApiWithSchema,
  addApiWithSchemaAndConflictDetection,
  addRestApi,
  updateAPIWithResolutionStrategy,
  apiUpdateToggleDataStore,
  addFunction,
  addSimpleDDB,
  checkIfBucketExists,
  createNewProjectDir,
  deleteProjectDir,
  getAppSyncApi,
  getProjectMeta,
  getLocalEnvInfo,
  getTransformConfig,
  enableAdminUI,
} from 'amplify-e2e-core';
import { TRANSFORM_CURRENT_VERSION } from 'graphql-transformer-core';
import _ from 'lodash';

// to deal with bug in cognito-identity-js
(global as any).fetch = require('node-fetch');
// to deal with subscriptions in node env
(global as any).WebSocket = require('ws');

describe('amplify add api (REST)', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('rest-api');
  });

  afterEach(async () => {
    const meta = getProjectMeta(projRoot);
    expect(meta.providers.awscloudformation).toBeDefined();
    const {
      AuthRoleArn: authRoleArn,
      UnauthRoleArn: unauthRoleArn,
      DeploymentBucketName: bucketName,
      Region: region,
      StackId: stackId,
    } = meta.providers.awscloudformation;
    expect(authRoleArn).toBeDefined();
    expect(unauthRoleArn).toBeDefined();
    expect(region).toBeDefined();
    expect(stackId).toBeDefined();
    const bucketExists = await checkIfBucketExists(bucketName, region);
    expect(bucketExists).toMatchObject({});

    expect(meta.function).toBeDefined();
    let seenAtLeastOneFunc = false;
    for (let key of Object.keys(meta.function)) {
      const {
        service,
        build,
        lastBuildTimeStamp,
        lastPackageTimeStamp,
        distZipFilename,
        lastPushTimeStamp,
        lastPushDirHash,
      } = meta.function[key];
      expect(service).toBe('Lambda');
      expect(build).toBeTruthy();
      expect(lastBuildTimeStamp).toBeDefined();
      expect(lastPackageTimeStamp).toBeDefined();
      expect(distZipFilename).toBeDefined();
      expect(lastPushTimeStamp).toBeDefined();
      expect(lastPushDirHash).toBeDefined();
      seenAtLeastOneFunc = true;
    }
    expect(seenAtLeastOneFunc).toBeTruthy();

    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project, add a DDB, then add a crud rest api', async () => {
    const randomId = await global.getRandomId();
    const DDB_NAME = `ddb${randomId}`;
    await initJSProjectWithProfile(projRoot, {});
    await addSimpleDDB(projRoot, { name: DDB_NAME });
    await addRestApi(projRoot, { isCrud: true });
    await amplifyPushUpdate(projRoot);

    const meta = getProjectMeta(projRoot);
    expect(meta.storage[DDB_NAME]).toBeDefined();
    const { service, lastPushTimeStamp, lastPushDirHash } = meta.storage[DDB_NAME];
    expect(service).toBe('DynamoDB');
    expect(lastPushTimeStamp).toBeDefined();
    expect(lastPushDirHash).toBeDefined();
  });

  it('init a project, then add a serverless rest api', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addRestApi(projRoot, { isCrud: false });
    await amplifyPushUpdate(projRoot);
  });

  it('init a project, create lambda and attach it to an api', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
    await addRestApi(projRoot, { existingLambda: true });
    await amplifyPushUpdate(projRoot);
  });

  it('init a project, create lambda and attach multiple rest apis', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
    await addRestApi(projRoot, {
      existingLambda: true,
      restrictAccess: true,
      allowGuestUsers: true,
    });
    await addRestApi(projRoot, {
      isFirstRestApi: false,
      existingLambda: true,
      restrictAccess: true,
      allowGuestUsers: true,
    });
    await addRestApi(projRoot, {
      isFirstRestApi: false,
      existingLambda: true,
      restrictAccess: true,
      allowGuestUsers: false,
    });
    await addRestApi(projRoot, { isFirstRestApi: false, existingLambda: true });
    await updateAuthAddAdminQueries(projRoot);
    await amplifyPushUpdate(projRoot);

    const amplifyMeta = getProjectMeta(projRoot);
    const meta = amplifyMeta.providers.awscloudformation;
    const { AuthRoleName, UnauthRoleName, Region } = meta;

    expect(await listRolePolicies(AuthRoleName, Region)).toEqual([]);
    expect(await listRolePolicies(UnauthRoleName, Region)).toEqual([]);

    const authPolicies = await listAttachedRolePolicies(AuthRoleName, Region);
    expect(authPolicies.length).toBeGreaterThan(0);

    for (let i = 0; i < authPolicies.length; i++) {
      expect(authPolicies[i].PolicyName).toMatch(/PolicyAPIGWAuth\d/);
    }

    const unauthPolicies = await listAttachedRolePolicies(UnauthRoleName, Region);
    expect(unauthPolicies.length).toBeGreaterThan(0);

    for (let i = 0; i < unauthPolicies.length; i++) {
      expect(unauthPolicies[i].PolicyName).toMatch(/PolicyAPIGWUnauth\d/);
    }
  });

  it('adds a rest api and then adds a path to the existing api', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
    await addRestApi(projRoot, { existingLambda: true });
    await addRestApi(projRoot, { isFirstRestApi: false, existingLambda: true, path: '/newpath' });
    await amplifyPushUpdate(projRoot);
  });

  it('migrates malformed project files during push', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
    await addRestApi(projRoot, { existingLambda: true, restrictAccess: true });

    const apisDirectory = path.join(projRoot, 'amplify', 'backend', 'api');
    const apis = readdirSync(apisDirectory);
    const apiName = apis[0];
    const apiDirectory = path.join(apisDirectory, apiName);
    const cfnTemplateFile = path.join(apiDirectory, `${apiName}-cloudformation-template.json`);
    const cfnTemplate = JSON.parse(readFileSync(cfnTemplateFile, 'utf8'));

    // The ApiId output is required, and will be added automatically if it is missing.
    cfnTemplate.Outputs.ApiId = undefined;

    writeFileSync(cfnTemplateFile, JSON.stringify(cfnTemplate));
    await amplifyPushUpdate(projRoot);
  });
});
