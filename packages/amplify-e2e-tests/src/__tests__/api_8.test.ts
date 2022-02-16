import {
  addApiWithoutSchema,
  addFeatureFlag,
  addFunction,
  addRestApi,
  amplifyPushGraphQlWithCognitoPrompt,
  amplifyPushUpdate,
  checkIfBucketExists,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppSyncApi,
  getProjectMeta,
  initJSProjectWithProfile,
  updateApiSchema,
} from 'amplify-e2e-core';
import { readdirSync, readFileSync } from 'fs';
import * as path from 'path';

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
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  const validateMeta = async (meta?) => {
    meta = meta ?? getProjectMeta(projRoot);
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
      const { service, build, lastBuildTimeStamp, lastPackageTimeStamp, distZipFilename, lastPushTimeStamp, lastPushDirHash } =
        meta.function[key];
      expect(service).toBe('Lambda');
      expect(build).toBeTruthy();
      expect(lastBuildTimeStamp).toBeDefined();
      expect(lastPackageTimeStamp).toBeDefined();
      expect(distZipFilename).toBeDefined();
      expect(lastPushTimeStamp).toBeDefined();
      expect(lastPushDirHash).toBeDefined();
      seenAtLeastOneFunc = true;
    }
    expect(seenAtLeastOneFunc).toBe(true);
  };

  it('adds a rest api and then adds a path to the existing api', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
    await addRestApi(projRoot, { existingLambda: true });
    await addRestApi(projRoot, { isFirstRestApi: false, existingLambda: true, path: '/newpath' });
    await amplifyPushUpdate(projRoot);
    validateMeta();
  });

  it('migrates malformed project files during push', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
    await addRestApi(projRoot, { existingLambda: true, restrictAccess: true });

    const apisDirectory = path.join(projRoot, 'amplify', 'backend', 'api');
    const apis = readdirSync(apisDirectory);
    const apiName = apis[0];
    const apiDirectory = path.join(apisDirectory, apiName);
    const cfnTemplateFile = path.join(apiDirectory, 'build', `${apiName}-cloudformation-template.json`);
    const cfnTemplate = JSON.parse(readFileSync(cfnTemplateFile, 'utf8'));

    // The ApiId output is required
    expect(cfnTemplate.Outputs.ApiId).toBeDefined();

    await amplifyPushUpdate(projRoot);
    validateMeta();
  });

  it('amplify push prompt for cognito configuration if auth mode is missing', async () => {
    const envName = 'devtest';
    const projName = 'lambdaauthmode';
    await initJSProjectWithProfile(projRoot, { name: projName, envName });
    await addFeatureFlag(projRoot, 'graphqltransformer', 'useexperimentalpipelinedtransformer', true);
    await addFeatureFlag(projRoot, 'graphqltransformer', 'transformerversion', 2);
    await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
    await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
    await updateApiSchema(projRoot, projName, 'cognito_simple_model.graphql');
    await amplifyPushGraphQlWithCognitoPrompt(projRoot);

    const meta = getProjectMeta(projRoot);
    const region = meta.providers.awscloudformation.Region;
    const { output } = meta.api.lambdaauthmode;
    const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;
    const { graphqlApi } = await getAppSyncApi(GraphQLAPIIdOutput, region);

    expect(GraphQLAPIIdOutput).toBeDefined();
    expect(GraphQLAPIEndpointOutput).toBeDefined();
    expect(GraphQLAPIKeyOutput).toBeDefined();

    expect(graphqlApi).toBeDefined();
    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
    validateMeta(meta);
  });
});
