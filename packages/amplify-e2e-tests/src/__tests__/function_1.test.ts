import { initJSProjectWithProfile, deleteProject, amplifyPushAuth, amplifyPush } from 'amplify-e2e-core';
import { addFunction, updateFunction, functionBuild, addLambdaTrigger, functionMockAssert, functionCloudInvoke } from 'amplify-e2e-core';
import { addLayer, LayerOptions } from 'amplify-e2e-core';
import { addSimpleDDB } from 'amplify-e2e-core';
import { addKinesis } from 'amplify-e2e-core';
import {
  createNewProjectDir,
  deleteProjectDir,
  getProjectMeta,
  getFunction,
  overrideFunctionSrc,
  getFunctionSrc,
  overrideLayerCode,
  overrideFunctionSrcPython,
  overrideLayerCodePython,
  overrideLayerCodeJava,
} from 'amplify-e2e-core';
import { addApiWithSchema } from 'amplify-e2e-core';

import { appsyncGraphQLRequest } from 'amplify-e2e-core';
import { getCloudWatchLogs, putKinesisRecords, invokeFunction, getCloudWatchEventRule, getEventSourceMappings } from 'amplify-e2e-core';
import fs from 'fs-extra';
import path from 'path';
import { retry, readJsonFile } from 'amplify-e2e-core';

describe('nodejs', () => {
  describe('amplify add function', () => {
    let projRoot: string;

    beforeEach(async () => {
      projRoot = await createNewProjectDir('functions');
    });

    afterEach(async () => {
      await deleteProject(projRoot);
      deleteProjectDir(projRoot);
    });

    it('init a project and add simple function', async () => {
      await initJSProjectWithProfile(projRoot, {});
      await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
      await functionBuild(projRoot, {});
      await amplifyPushAuth(projRoot);
      const meta = getProjectMeta(projRoot);
      const { Arn: functionArn, Name: functionName, Region: region } = Object.keys(meta.function).map(key => meta.function[key])[0].output;
      expect(functionArn).toBeDefined();
      expect(functionName).toBeDefined();
      expect(region).toBeDefined();
      const cloudFunction = await getFunction(functionName, region);
      expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
    });

    it('graphql mutation should result in trigger called in minimal AppSync + trigger infra', async () => {
      await initJSProjectWithProfile(projRoot, {});
      await addApiWithSchema(projRoot, 'simple_model.graphql');
      await addFunction(projRoot, { functionTemplate: 'Lambda trigger', triggerType: 'DynamoDB' }, 'nodejs', addLambdaTrigger);

      await functionBuild(projRoot, {});
      await amplifyPush(projRoot);
      const meta = getProjectMeta(projRoot);
      const { Arn: functionArn, Name: functionName, Region: region } = Object.keys(meta.function).map(key => meta.function[key])[0].output;
      expect(functionArn).toBeDefined();
      expect(functionName).toBeDefined();
      expect(region).toBeDefined();
      const cloudFunction = await getFunction(functionName, region);
      expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);

      const createGraphQLPayload = (id, content) => ({
        query: `mutation{ createTodo(input:{id: ${id}, content:"${content}"}){ id, content }}`,
        variables: null,
      });

      const appsyncResource = Object.keys(meta.api).map(key => meta.api[key])[0];

      await retry(
        () => getEventSourceMappings(functionName, region),
        res => res.length > 0 && res[0].State === 'Enabled',
      );

      const fireGqlRequestAndCheckLogs: () => Promise<boolean> = async () => {
        const resp = (await appsyncGraphQLRequest(appsyncResource, createGraphQLPayload(Math.round(Math.random() * 1000), 'amplify'))) as {
          data: { createTodo: { id: string; content: string } };
        };
        const id = resp.data.createTodo.id;
        if (!id) {
          return false;
        }
        await retry(
          () => getCloudWatchLogs(region, `/aws/lambda/${functionName}`),
          logs => !!logs.find(logEntry => logEntry.message.includes(`"id":{"S":"${id}"},"content":{"S":"amplify"}`)),
          {
            stopOnError: false,
            times: 2,
          },
        );
        return true;
      };

      await retry(fireGqlRequestAndCheckLogs, res => res, {
        stopOnError: false,
        times: 2,
      });
    });

    it('records put into kinesis stream should result in trigger called in minimal kinesis + trigger infra', async () => {
      await initJSProjectWithProfile(projRoot, {});
      const random = Math.floor(Math.random() * 10000);
      await addKinesis(projRoot, { rightName: `kinesisintegtest${random}`, wrongName: '$' });
      await addFunction(projRoot, { functionTemplate: 'Lambda trigger', triggerType: 'Kinesis' }, 'nodejs', addLambdaTrigger);

      await functionBuild(projRoot, {});
      await amplifyPushAuth(projRoot);
      const meta = getProjectMeta(projRoot);
      const { Arn: functionArn, Name: functionName, Region: region } = Object.keys(meta.function).map(key => meta.function[key])[0].output;
      expect(functionArn).toBeDefined();
      expect(functionName).toBeDefined();
      expect(region).toBeDefined();
      const cloudFunction = await getFunction(functionName, region);
      expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);

      await retry(
        () => getEventSourceMappings(functionName, region),
        res => res.length > 0 && res[0].State === 'Enabled',
      );

      const kinesisResource = Object.keys(meta.analytics).map(key => meta.analytics[key])[0];

      const fireKinesisRequestAndCheckLogs = async () => {
        const resp = await putKinesisRecords(
          'integtest',
          '0',
          kinesisResource.output.kinesisStreamId,
          meta.providers.awscloudformation.Region,
        );
        if (!(resp.FailedRecordCount === 0 && resp.Records.length > 0)) {
          return false;
        }

        let eventId = `${resp.Records[0].ShardId}:${resp.Records[0].SequenceNumber}`;

        await retry(
          () => getCloudWatchLogs(meta.providers.awscloudformation.Region, `/aws/lambda/${functionName}`),
          logs => !!logs.find(logEntry => logEntry.message.includes(eventId)),
          {
            stopOnError: false,
            times: 2,
          },
        );
        return true;
      };

      await retry(fireKinesisRequestAndCheckLogs, res => res, {
        stopOnError: false,
        times: 2,
      });
    });

    it('should fail with approp message when adding lambda triggers to unexisting resources', async () => {
      await initJSProjectWithProfile(projRoot, {});

      // No AppSync resources have been configured in API category.
      await addFunction(
        projRoot,
        {
          functionTemplate: 'Lambda trigger',
          triggerType: 'DynamoDB',
          eventSource: 'AppSync',
          expectFailure: true,
        },
        'nodejs',
        addLambdaTrigger,
      );
      // There are no DynamoDB resources configured in your project currently
      await addFunction(
        projRoot,
        {
          functionTemplate: 'Lambda trigger',
          triggerType: 'DynamoDB',
          eventSource: 'DynamoDB',
          expectFailure: true,
        },
        'nodejs',
        addLambdaTrigger,
      );
      // No Kinesis streams resource to select. Please use "amplify add analytics" command to create a new Kinesis stream
      await addFunction(
        projRoot,
        {
          functionTemplate: 'Lambda trigger',
          triggerType: 'Kinesis',
          expectFailure: true,
        },
        'nodejs',
        addLambdaTrigger,
      );
    });

    it('should init and deploy storage DynamoDB + Lambda trigger', async () => {
      await initJSProjectWithProfile(projRoot, {});
      await addSimpleDDB(projRoot, {});
      await addFunction(
        projRoot,
        {
          functionTemplate: 'Lambda trigger',
          triggerType: 'DynamoDB',
          eventSource: 'DynamoDB',
        },
        'nodejs',
        addLambdaTrigger,
      );

      await amplifyPushAuth(projRoot);
      const meta = getProjectMeta(projRoot);
      const { Name: table1Name, Arn: table1Arn, Region: table1Region, StreamArn: table1StreamArn } = Object.keys(meta.storage).map(
        key => meta.storage[key],
      )[0].output;

      expect(table1Name).toBeDefined();
      expect(table1Arn).toBeDefined();
      expect(table1Region).toBeDefined();
      expect(table1StreamArn).toBeDefined();
    });
  });

  describe('amplify add function with additional permissions', () => {
    let projRoot: string;
    beforeEach(async () => {
      projRoot = await createNewProjectDir('fn-with-perm');
    });

    afterEach(async () => {
      await deleteProject(projRoot);
      deleteProjectDir(projRoot);
    });

    it('lambda with dynamoDB permissions should be able to scan ddb', async () => {
      await initJSProjectWithProfile(projRoot, {});

      const random = Math.floor(Math.random() * 10000);
      const fnName = `integtestfn${random}`;
      const ddbName = `integtestddb${random}`;

      // test ability to scan both appsync @model-backed and regular ddb tables
      await addApiWithSchema(projRoot, 'simple_model.graphql');
      await addSimpleDDB(projRoot, { name: ddbName });

      await addFunction(
        projRoot,
        {
          name: fnName,
          functionTemplate: 'Hello World',
          additionalPermissions: {
            permissions: ['storage'],
            choices: ['api', 'storage', 'function'],
            resources: [ddbName, 'Todo:@model(appsync)'],
            resourceChoices: [ddbName, 'Todo:@model(appsync)'],
            operations: ['read'],
          },
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

      await amplifyPush(projRoot);
      const meta = getProjectMeta(projRoot);
      const { GraphQLAPIIdOutput: appsyncId } = Object.keys(meta.api).map(key => meta.api[key])[0].output;
      const { Arn: functionArn, Name: functionName, Region: region } = Object.keys(meta.function).map(key => meta.function[key])[0].output;
      expect(appsyncId).toBeDefined();
      expect(functionName).toBeDefined();
      expect(region).toBeDefined();

      // test @model-backed dynamoDB scan
      const result1 = await invokeFunction(functionName, JSON.stringify({ tableName: `Todo-${appsyncId}-integtest` }), region);
      expect(result1.StatusCode).toBe(200);
      expect(result1.Payload).toBeDefined();

      const payload1 = JSON.parse(result1.Payload.toString());
      expect(payload1.errorType).toBeUndefined();
      expect(payload1.errorMessage).toBeUndefined();
      expect(payload1.Items).toBeDefined();
      expect(payload1.Count).toBeDefined();
      expect(payload1.ScannedCount).toBeDefined();

      // test regular storage resource dynamoDB scan
      const { Name: tableName } = Object.keys(meta.storage).map(key => meta.storage[key])[0].output;
      const result2 = await invokeFunction(functionName, JSON.stringify({ tableName }), region);
      expect(result2.StatusCode).toBe(200);
      expect(result2.Payload).toBeDefined();

      const payload2 = JSON.parse(result2.Payload.toString());
      expect(payload2.errorType).toBeUndefined();
      expect(payload2.errorMessage).toBeUndefined();
      expect(payload2.Items).toBeDefined();
      expect(payload2.Count).toBeDefined();
      expect(payload2.ScannedCount).toBeDefined();
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
        },
        'nodejs',
      );
      await amplifyPush(projRoot);

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

    it('@model-backed lambda function should generate envvars TODOTABLE_NAME, TODOTABLE_ARN, GRAPHQLAPIIDOUTPUT', async () => {
      await initJSProjectWithProfile(projRoot, {});
      await addApiWithSchema(projRoot, 'simple_model.graphql');

      const random = Math.floor(Math.random() * 10000);
      const fnName = `integtestfn${random}`;

      await addFunction(
        projRoot,
        {
          name: fnName,
          functionTemplate: 'Hello World',
          additionalPermissions: {
            permissions: ['storage'],
            choices: ['api', 'storage'],
            resources: ['Todo:@model(appsync)'],
            resourceChoices: ['Todo:@model(appsync)'],
            operations: ['read'],
          },
        },
        'nodejs',
      );

      let lambdaSource = getFunctionSrc(projRoot, fnName).toString();
      expect(lambdaSource.includes('TODOTABLE_NAME')).toBeTruthy();
      expect(lambdaSource.includes('TODOTABLE_ARN')).toBeTruthy();
      expect(lambdaSource.includes('GRAPHQLAPIIDOUTPUT')).toBeTruthy();
    });

    it('environment vars comment should update on permission update', async () => {
      await initJSProjectWithProfile(projRoot, {});
      const random = Math.floor(Math.random() * 10000);
      const funcName = `nodetestfn${random}`;
      const ddbName = `nodetestddb`;

      await addFunction(
        projRoot,
        {
          name: funcName,
          functionTemplate: 'Hello World',
        },
        'nodejs',
      );
      await addSimpleDDB(projRoot, { name: ddbName });
      await updateFunction(
        projRoot,
        {
          additionalPermissions: {
            permissions: ['storage'],
            choices: ['function', 'storage'],
            operations: ['read'],
            resources: [ddbName],
          },
        },
        'nodejs',
      );
      const lambdaHandlerContents = fs.readFileSync(
        path.join(projRoot, 'amplify', 'backend', 'function', funcName, 'src', 'index.js'),
        'utf8',
      );
      expect(lambdaHandlerContents).toMatchSnapshot();
    });

    it('adding api and storage permissions should not add duplicates to CFN', async () => {
      await initJSProjectWithProfile(projRoot, {});
      await addApiWithSchema(projRoot, 'two-model-schema.graphql');

      const random = Math.floor(Math.random() * 10000);
      const fnName = `integtestfn${random}`;
      const ddbName = `ddbTable${random}`;

      await addSimpleDDB(projRoot, { name: ddbName });
      await addFunction(
        projRoot,
        {
          name: fnName,
          functionTemplate: 'Hello World',
          additionalPermissions: {
            permissions: ['storage'],
            choices: ['api', 'storage'],
            resources: [ddbName, 'Post:@model(appsync)', 'Comment:@model(appsync)'],
            resourceChoices: [ddbName, 'Post:@model(appsync)', 'Comment:@model(appsync)'],
            operations: ['read'],
          },
        },
        'nodejs',
      );

      const lambdaCFN = readJsonFile(
        path.join(projRoot, 'amplify', 'backend', 'function', fnName, `${fnName}-cloudformation-template.json`),
      );
      expect(lambdaCFN.Resources.AmplifyResourcesPolicy.Properties.PolicyDocument.Statement.length).toBe(3);
    });
  });
});