import { initJSProjectWithProfile, deleteProject, amplifyPushAuth, amplifyPush } from '../init';
import { addFunction, updateFunction, functionBuild, addLambdaTrigger } from '../categories/function';
import { addSimpleDDB } from '../categories/storage';
import { addKinesis } from '../categories/analytics';
import { createNewProjectDir, deleteProjectDir, getProjectMeta, getFunction, sleep, overrideFunctionSrc, getFunctionSrc } from '../utils';
import { addApiWithSchema } from '../categories/api';

import { appsyncGraphQLRequest } from '../utils/appsync';
import { getCloudWatchLogs, putKinesisRecords, invokeFunction, getCloudWatchEventRule } from '../utils/sdk-calls';

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

    it('init a project and add  simple function', async () => {
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

      // NOTE: the next graphQL request will not get logged unless we wait a bit
      // trigger is not directly available right after cloudformation deploys???
      // I am not sure whether this is an issue on CF side or not
      await sleep(30 * 1000);

      const appsyncResource = Object.keys(meta.api).map(key => meta.api[key])[0];
      let resp = (await appsyncGraphQLRequest(appsyncResource, createGraphQLPayload(Math.round(Math.random() * 1000), 'amplify'))) as {
        data: { createTodo: { id: string; content: string } };
      };

      expect(resp.data.createTodo.id).toBeDefined();

      // sleep a bit to make sure lambda logs appear in cloudwatch
      await sleep(100 * 1000);

      const logs = await getCloudWatchLogs(meta.providers.awscloudformation.Region, `/aws/lambda/${functionName}`);
      // NOTE: this expects default Lambda DynamoDB trigger template to log dynamoDB json records
      const todoId = resp.data.createTodo.id;
      const dynamoDBNewImageEntry = logs.find(logEntry => logEntry.message.includes(`"id":{"S":"${todoId}"},"content":{"S":"amplify"}`));

      // dynamoDB event(NewImage) log record found
      expect(dynamoDBNewImageEntry).toBeDefined();
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

      // NOTE: the next graphQL request will not get logged unless we wait a bit
      // trigger is not directly available right after cloudformation deploys???
      // I am not sure whether this is an issue on CF side or not
      await sleep(30 * 1000);

      const kinesisResource = Object.keys(meta.analytics).map(key => meta.analytics[key])[0];
      const resp = await putKinesisRecords(
        'integtest',
        '0',
        kinesisResource.output.kinesisStreamId,
        meta.providers.awscloudformation.Region,
      );
      expect(resp.FailedRecordCount).toBe(0);
      expect(resp.Records.length).toBeGreaterThan(0);

      // sleep a bit to make sure lambda logs appear in cloudwatch
      await sleep(50 * 1000);

      let eventId = `${resp.Records[0].ShardId}:${resp.Records[0].SequenceNumber}`;
      const logs = await getCloudWatchLogs(meta.providers.awscloudformation.Region, `/aws/lambda/${functionName}`);
      // NOTE: this expects default Lambda Kinesis trigger template to log kinesis records
      const kinesisEntry = logs.find(logEntry => logEntry.message.includes(eventId));

      // dynamoDB event(NewImage) log record found
      expect(kinesisEntry).toBeDefined();
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
  });
});

describe('go function tests', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('go-functions');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('add go hello world function', async () => {
    await initJSProjectWithProfile(projRoot, {});

    const random = Math.floor(Math.random() * 10000);
    const fnName = `gotestfn${random}`;

    await addFunction(
      projRoot,
      {
        name: fnName,
        functionTemplate: 'Hello World',
      },
      'go',
    );
  });

  it('add node hello world function', async () => {
    await initJSProjectWithProfile(projRoot, {});

    const random = Math.floor(Math.random() * 10000);
    const fnName = `gotestfn${random}`;

    await addFunction(
      projRoot,
      {
        name: fnName,
        functionTemplate: 'Hello World',
      },
      'nodejs',
    );
  });
});

describe('python function tests', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('py-functions');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('add python hello world function', async () => {
    await initJSProjectWithProfile(projRoot, {});

    const random = Math.floor(Math.random() * 10000);
    const fnName = `pytestfn${random}`;

    await addFunction(
      projRoot,
      {
        name: fnName,
        functionTemplate: 'Hello World',
      },
      'python',
    );
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
});

describe.only('amplify add/update/remove function based on schedule rule', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('schedule');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('add a schedule rule for daily ', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addFunction(
      projRoot,
      {
        functionTemplate: 'helloWorld',
        schedulePermissions: {
          interval: 'Daily',
        },
      },
      'nodejs',
    );
    await functionBuild(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const { Arn: functionArn, Name: functionName, Region: region, CloudWatchEventRule: ruleName } = Object.keys(meta.function).map(
      key => meta.function[key],
    )[0].output;
    expect(functionArn).toBeDefined();
    expect(functionName).toBeDefined();
    expect(region).toBeDefined();
    expect(ruleName).toBeDefined();
    const cloudFunction = await getFunction(functionName, region);
    expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
    const ScheduleRuleName = await getCloudWatchEventRule(functionArn, meta.providers.awscloudformation.Region);
    expect(ScheduleRuleName.RuleNames[0]).toEqual(ruleName);
  });
  it('update a schedule rule for daily ', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addFunction(
      projRoot,
      {
        functionTemplate: 'helloWorld',
        schedulePermissions: {
          interval: 'Daily',
        },
      },
      'nodejs',
    );
    await functionBuild(projRoot, {});
    await updateFunction(
      projRoot,
      {
        functionTemplate: 'helloWorld',
        schedulePermissions: {
          interval: 'Daily',
          action: 'Update the schedule',
        },
      },
      'nodejs',
    );
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const { Arn: functionArn, Name: functionName, Region: region, CloudWatchEventRule: ruleName } = Object.keys(meta.function).map(
      key => meta.function[key],
    )[0].output;
    expect(functionArn).toBeDefined();
    expect(functionName).toBeDefined();
    expect(region).toBeDefined();
    expect(ruleName).toBeDefined();

    const cloudFunction = await getFunction(functionName, region);
    expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
    const ScheduleRuleName = await getCloudWatchEventRule(functionArn, meta.providers.awscloudformation.Region);
    expect(ScheduleRuleName.RuleNames[0]).toEqual(ruleName);
  });

  it('remove a schedule rule for daily ', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addFunction(
      projRoot,
      {
        functionTemplate: 'helloWorld',
        schedulePermissions: {
          interval: 'Daily',
        },
      },
      'nodejs',
    );
    await functionBuild(projRoot, {});
    await updateFunction(
      projRoot,
      {
        functionTemplate: 'helloWorld',
        schedulePermissions: {
          interval: 'Daily',
          action: 'Remove the schedule',
        },
      },
      'nodejs',
    );
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const { Arn: functionArn, Name: functionName, Region: region, CloudWatchEventRule: ruleName } = Object.keys(meta.function).map(
      key => meta.function[key],
    )[0].output;
    expect(functionArn).toBeDefined();
    expect(functionName).toBeDefined();
    expect(region).toBeDefined();
    expect(ruleName).toBeUndefined();

    const cloudFunction = await getFunction(functionName, region);
    expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
  });
});
