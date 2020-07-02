import { v4 as uuid } from 'uuid';
import { initJSProjectWithProfile, deleteProject, amplifyPushAuth, amplifyPush } from 'amplify-e2e-core';
import { addFunction, addLayer, invokeFunction, updateFunction, updateLayer, validateLayerMetadata } from 'amplify-e2e-core';
import { createNewProjectDir, deleteProjectDir, getProjectMeta, overrideFunctionSrc } from 'amplify-e2e-core';
import { addApiWithSchema } from 'amplify-e2e-core';

describe('amplify function migration', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('functions');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('existing lambda updated with additional permissions should be able to scan ddb', async () => {
    await initJSProjectWithProfile(projRoot, {});

    const random = Math.floor(Math.random() * 10000);
    const fnName = `integtestfn${random}`;
    await addFunction(
      projRoot,
      {
        name: fnName,
        functionTemplate: 'Hello World',
      },
      'nodejs',
    );

    overrideFunctionSrc(
      projRoot,
      fnName,
      `
      const AWS = require('aws-sdk');
      const DDB = new AWS.DynamoDB();

      exports.handler = function(event, context) {
        return DDB.scan({ TableName: event.tableName }).promise()
      }
    `,
    );

    await amplifyPushAuth(projRoot);
    let meta = getProjectMeta(projRoot);
    const { Arn: functionArn, Name: functionName, Region: region } = Object.keys(meta.function).map(key => meta.function[key])[0].output;
    expect(functionArn).toBeDefined();
    expect(functionName).toBeDefined();
    expect(region).toBeDefined();

    await addApiWithSchema(projRoot, 'simple_model.graphql');
    await updateFunction(
      projRoot,
      {
        name: fnName,
        additionalPermissions: {
          permissions: ['storage'],
          choices: ['function', 'api', 'storage'],
          resources: ['Todo:@model(appsync)'],
          resourceChoices: ['Todo:@model(appsync)'],
          operations: ['read'],
        },
        testingWithLatestCodebase: true,
      },
      'nodejs',
    );
    await amplifyPush(projRoot, true);

    meta = getProjectMeta(projRoot);
    const { GraphQLAPIIdOutput: appsyncId } = Object.keys(meta.api).map(key => meta.api[key])[0].output;
    const result = await invokeFunction(functionName, JSON.stringify({ tableName: `Todo-${appsyncId}-integtest` }), region);
    expect(result.StatusCode).toBe(200);
    expect(result.Payload).toBeDefined();

    const payload = JSON.parse(result.Payload.toString());
    expect(payload.errorType).toBeUndefined();
    expect(payload.errorMessage).toBeUndefined();
    expect(payload.Items).toBeDefined();
    expect(payload.Count).toBeDefined();
    expect(payload.ScannedCount).toBeDefined();
  });

  it('Add 2 functions, upgrade cli, add layer, update a function to depend on layer', async () => {
    const [shortId] = uuid().split('-');
    const function1 = 'function1' + shortId;
    const function2 = 'function2' + shortId;
    await initJSProjectWithProfile(projRoot, {});
    await addFunction(projRoot, { name: function1, functionTemplate: 'Hello World' }, 'nodejs', undefined);
    await addFunction(projRoot, { name: function2, functionTemplate: 'Hello World' }, 'nodejs', undefined);
    await amplifyPushAuth(projRoot);

    const layerName = `test${shortId}`;
    const layerSettings = {
      layerName,
      versionChanged: true,
      runtimes: ['nodejs'],
    };
    await addLayer(projRoot, layerSettings, true);
    await updateFunction(
      projRoot,
      {
        layerOptions: {
          select: [layerName],
          expectedListOptions: [layerName],
          versions: { [layerName]: { version: 1, expectedVersionOptions: [1] } },
        },
        name: function1,
        testingWithLatestCodebase: true,
      },
      'nodejs',
    );
    await amplifyPushAuth(projRoot, true);
    const meta = getProjectMeta(projRoot);
    await validateLayerMetadata(layerName, meta);
  });
});
