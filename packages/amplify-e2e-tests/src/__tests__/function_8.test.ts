import {
  addFunction,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  functionBuild,
  functionCloudInvoke,
  functionMockAssert,
  getCloudWatchEventRule,
  getFunction,
  getProjectMeta,
  initJSProjectWithProfile,
  updateFunction,
} from '@aws-amplify/amplify-e2e-core';
import { v4 as uuid } from 'uuid';

describe('java function tests', () => {
  const helloWorldSuccessObj = {
    greetings: 'Hello John Doe!',
  };
  const helloWorldSuccessString = '  "greetings": "Hello John Doe!"';
  let projRoot: string;
  let funcName: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('java-functions');
    await initJSProjectWithProfile(projRoot, {});

    const [shortId] = uuid().split('-');
    funcName = `javatestfn${shortId}`;

    await addFunction(
      projRoot,
      {
        name: funcName,
        functionTemplate: 'Hello World',
      },
      'java',
    );
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('add java hello world function and mock locally', async () => {
    await functionMockAssert(projRoot, {
      funcName,
      successString: helloWorldSuccessString,
      eventFile: 'src/event.json',
    }); // will throw if successString is not in output
  });

  it('add java hello world function and invoke in the cloud', async () => {
    const payload = '{"firstName":"John","lastName" : "Doe"}';
    await amplifyPushAuth(projRoot);
    const response = await functionCloudInvoke(projRoot, { funcName, payload });
    expect(JSON.parse(response.Payload.toString())).toEqual(helloWorldSuccessObj);
  });
});

describe('amplify add/update/remove function based on schedule rule', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('schedule');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('add a schedule rule for daily', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addFunction(
      projRoot,
      {
        functionTemplate: 'Hello World',
        schedulePermissions: {
          interval: 'Daily',
        },
      },
      'nodejs',
    );
    await functionBuild(projRoot);
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const {
      Arn: functionArn,
      Name: functionName,
      Region: region,
      CloudWatchEventRule: ruleName,
    } = Object.keys(meta.function).map((key) => meta.function[key])[0].output;
    expect(functionArn).toBeDefined();
    expect(functionName).toBeDefined();
    expect(region).toBeDefined();
    expect(ruleName).toBeDefined();
    const cloudFunction = await getFunction(functionName, region);
    expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
    const ScheduleRuleName = await getCloudWatchEventRule(functionArn, meta.providers.awscloudformation.Region);
    expect(ScheduleRuleName.RuleNames[0]).toEqual(ruleName);
  });

  it('update a schedule rule for daily', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addFunction(
      projRoot,
      {
        functionTemplate: 'Hello World',
        schedulePermissions: {
          interval: 'Daily',
        },
      },
      'nodejs',
    );
    await functionBuild(projRoot);
    await updateFunction(
      projRoot,
      {
        functionTemplate: 'Hello World',
        schedulePermissions: {
          interval: 'Daily',
          action: 'Update the schedule',
        },
      },
      'nodejs',
    );
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const {
      Arn: functionArn,
      Name: functionName,
      Region: region,
      CloudWatchEventRule: ruleName,
    } = Object.keys(meta.function).map((key) => meta.function[key])[0].output;
    expect(functionArn).toBeDefined();
    expect(functionName).toBeDefined();
    expect(region).toBeDefined();
    expect(ruleName).toBeDefined();

    const cloudFunction = await getFunction(functionName, region);
    expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
    const ScheduleRuleName = await getCloudWatchEventRule(functionArn, meta.providers.awscloudformation.Region);
    expect(ScheduleRuleName.RuleNames[0]).toEqual(ruleName);
  });

  it('remove a schedule rule for daily', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addFunction(
      projRoot,
      {
        functionTemplate: 'Hello World',
        schedulePermissions: {
          interval: 'Daily',
        },
      },
      'nodejs',
    );
    await functionBuild(projRoot);
    await updateFunction(
      projRoot,
      {
        functionTemplate: 'Hello World',
        schedulePermissions: {
          interval: 'Daily',
          action: 'Remove the schedule',
        },
      },
      'nodejs',
    );
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const {
      Arn: functionArn,
      Name: functionName,
      Region: region,
      CloudWatchEventRule: ruleName,
    } = Object.keys(meta.function).map((key) => meta.function[key])[0].output;
    expect(functionArn).toBeDefined();
    expect(functionName).toBeDefined();
    expect(region).toBeDefined();
    expect(ruleName).toBeUndefined();

    const cloudFunction = await getFunction(functionName, region);
    expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
  });
});
