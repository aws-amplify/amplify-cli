import { initJSProjectWithProfile, deleteProject, amplifyPushAuth, amplifyPush } from '../init';
import { addFunction, functionBuild } from '../categories/function';
import { addKinesis } from '../categories/analytics';
import { createNewProjectDir, deleteProjectDir, getProjectMeta, getFunction, sleep } from '../utils';
import { addApiWithSchema } from '../categories/api';

import { appsyncGraphQLRequest } from '../utils/appsync';
import { getCloudWatchLogs, putKinesisRecords } from '../utils/sdk-calls';

describe('amplify add function', () => {
  let projRoot: string;
  beforeEach(() => {
    projRoot = createNewProjectDir();
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project and add  simple function', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addFunction(projRoot, {});
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

  it('graphql mutation should result in trigger called in minimal appSynch + trigger infra', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addApiWithSchema(projRoot, 'simple_model.graphql');
    await addFunction(projRoot, { functionTemplate: 'lambdaTrigger', triggerType: 'DynamoDB' });

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
    await sleep(10 * 1000);

    const appsyncResource = Object.keys(meta.api).map(key => meta.api[key])[0];
    let resp = (await appsyncGraphQLRequest(appsyncResource, createGraphQLPayload(Math.round(Math.random() * 1000), 'amplify'))) as {
      data: { createTodo: { id: string; content: string } };
    };

    expect(resp.data.createTodo.id).toBeDefined();

    // sleep a bit to make sure lambda logs appear in cloudwatch
    await sleep(30 * 1000);

    const logs = await getCloudWatchLogs(meta.providers.awscloudformation.Region, `/aws/lambda/${functionName}`);
    // NOTE: this expects default Lambda DynamoDB trigger template to log dynamoDB json records
    const todoId = resp.data.createTodo.id;
    const dynamoDBNewImageEntry = logs.find(logEntry => logEntry.message.includes(`"id":{"S":"${todoId}"},"content":{"S":"amplify"}`));

    // dynamoDB event(NewImage) log record found
    expect(dynamoDBNewImageEntry).toBeDefined();
  });

  it('records put into kinesis stream should result in trigger called in minimal kinesis + trigger infra', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addKinesis(projRoot, { rightName: 'kinesisintegtest', wrongName: '$' });
    await addFunction(projRoot, { functionTemplate: 'lambdaTrigger', triggerType: 'Kinesis' });

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
    await sleep(10 * 1000);

    const kinesisResource = Object.keys(meta.analytics).map(key => meta.analytics[key])[0];
    const resp = await putKinesisRecords('integtest', '0', kinesisResource.output.kinesisStreamId, meta.providers.awscloudformation.Region);
    expect(resp.FailedRecordCount).toBe(0);
    expect(resp.Records.length).toBeGreaterThan(0);

    // sleep a bit to make sure lambda logs appear in cloudwatch
    await sleep(30 * 1000);

    let eventId = `${resp.Records[0].ShardId}:${resp.Records[0].SequenceNumber}`;
    const logs = await getCloudWatchLogs(meta.providers.awscloudformation.Region, `/aws/lambda/${functionName}`);
    // NOTE: this expects default Lambda Kinesis trigger template to log kinesis records
    const kinesisEntry = logs.find(logEntry => logEntry.message.includes(eventId));

    // dynamoDB event(NewImage) log record found
    expect(kinesisEntry).toBeDefined();
  });
});
