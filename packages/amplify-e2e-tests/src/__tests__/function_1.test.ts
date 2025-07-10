import {
  initJSProjectWithProfile,
  deleteProject,
  amplifyPushAuth,
  amplifyPush,
  addFunction,
  functionBuild,
  addLambdaTrigger,
  addSimpleDDB,
  addKinesis,
  createNewProjectDir,
  deleteProjectDir,
  getProjectMeta,
  getFunction,
  addApiWithoutSchema,
  updateApiSchema,
  appsyncGraphQLRequest,
  getCloudWatchLogs,
  putKinesisRecords,
  invokeFunction,
  getEventSourceMappings,
  retry,
  generateRandomShortId,
} from '@aws-amplify/amplify-e2e-core';

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

    it('init a project and add simple function and uncomment cors header', async () => {
      await initJSProjectWithProfile(projRoot, {});
      const functionName = `testcorsfunction${generateRandomShortId()}`;
      process.env.AMPLIFY_CLI_LAMBDA_CORS_HEADER = 'true';
      await addFunction(projRoot, { functionTemplate: 'Hello World', name: functionName }, 'nodejs');
      await functionBuild(projRoot);
      await amplifyPushAuth(projRoot);
      const meta = getProjectMeta(projRoot);
      const { Arn: functionArn, Name, Region: region } = Object.keys(meta.function).map((key) => meta.function[key])[0].output;
      expect(functionArn).toBeDefined();
      expect(functionName).toBeDefined();
      expect(region).toBeDefined();
      const cloudFunction = await getFunction(Name, region);
      const response = await invokeFunction(Name, JSON.stringify({}), region);
      const payload = JSON.parse(response.Payload as string);
      expect(payload.headers['Access-Control-Allow-Origin']).toEqual('*');
      expect(payload.headers['Access-Control-Allow-Headers']).toEqual('*');
      expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
      delete process.env.AMPLIFY_CLI_LAMBDA_CORS_HEADER;
    });

    it('init a project and add simple function', async () => {
      await initJSProjectWithProfile(projRoot, {});
      await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
      await functionBuild(projRoot);
      await amplifyPushAuth(projRoot);
      const meta = getProjectMeta(projRoot);
      const {
        Arn: functionArn,
        Name: functionName,
        Region: region,
      } = Object.keys(meta.function).map((key) => meta.function[key])[0].output;
      expect(functionArn).toBeDefined();
      expect(functionName).toBeDefined();
      expect(region).toBeDefined();
      const cloudFunction = await getFunction(functionName, region);
      expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
    });

    it('graphql mutation should result in trigger called in minimal AppSync + trigger infra', async () => {
      await initJSProjectWithProfile(projRoot, {
        name: 'graphqltriggerinfra',
      });
      await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
      await updateApiSchema(projRoot, 'graphqltriggerinfra', 'simple_model.graphql');
      await addFunction(projRoot, { functionTemplate: 'Lambda trigger', triggerType: 'DynamoDB' }, 'nodejs', addLambdaTrigger);

      await functionBuild(projRoot);
      await amplifyPush(projRoot);
      const meta = getProjectMeta(projRoot);
      const {
        Arn: functionArn,
        Name: functionName,
        Region: region,
      } = Object.keys(meta.function).map((key) => meta.function[key])[0].output;
      expect(functionArn).toBeDefined();
      expect(functionName).toBeDefined();
      expect(region).toBeDefined();
      const cloudFunction = await getFunction(functionName, region);
      expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);

      const createGraphQLPayload = (id, content) => ({
        query: `mutation{ createTodo(input:{id: ${id}, content:"${content}"}){ id, content }}`,
        variables: null,
      });

      const appsyncResource = Object.keys(meta.api).map((key) => meta.api[key])[0];

      await retry(
        () => getEventSourceMappings(functionName, region),
        (res) => res.length > 0 && res[0].State === 'Enabled',
      );

      const fireGqlRequestAndCheckLogs: () => Promise<boolean> = async () => {
        const resp = (await appsyncGraphQLRequest(appsyncResource, createGraphQLPayload(Math.round(Math.random() * 1000), 'amplify'))) as {
          data: { createTodo: { id: string; content: string } };
        };
        const { id } = resp.data.createTodo;
        if (!id) {
          return false;
        }
        await retry(
          () => getCloudWatchLogs(region, `/aws/lambda/${functionName}`),
          (logs) => !!logs.find((logEntry) => logEntry.message.includes(`"id":{"S":"${id}"},"content":{"S":"amplify"}`)),
          {
            stopOnError: false,
            times: 2,
          },
        );
        return true;
      };

      await retry(fireGqlRequestAndCheckLogs, (res) => res, {
        stopOnError: false,
        times: 2,
      });
    });

    it('records put into kinesis stream should result in trigger called in minimal kinesis + trigger infra', async () => {
      await initJSProjectWithProfile(projRoot, {});
      await addKinesis(projRoot, { rightName: `kinesisintegtest${generateRandomShortId()}`, wrongName: '$' });
      await addFunction(projRoot, { functionTemplate: 'Lambda trigger', triggerType: 'Kinesis' }, 'nodejs', addLambdaTrigger);

      await functionBuild(projRoot);
      await amplifyPushAuth(projRoot);
      const meta = getProjectMeta(projRoot);
      const {
        Arn: functionArn,
        Name: functionName,
        Region: region,
      } = Object.keys(meta.function).map((key) => meta.function[key])[0].output;
      expect(functionArn).toBeDefined();
      expect(functionName).toBeDefined();
      expect(region).toBeDefined();
      const cloudFunction = await getFunction(functionName, region);
      expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);

      await retry(
        () => getEventSourceMappings(functionName, region),
        (res) => res.length > 0 && res[0].State === 'Enabled',
      );

      const kinesisResource = Object.keys(meta.analytics).map((key) => meta.analytics[key])[0];

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

        const eventId = `${resp.Records[0].ShardId}:${resp.Records[0].SequenceNumber}`;

        await retry(
          () => getCloudWatchLogs(meta.providers.awscloudformation.Region, `/aws/lambda/${functionName}`),
          (logs) => !!logs.find((logEntry) => logEntry.message.includes(eventId)),
          {
            stopOnError: false,
            times: 2,
          },
        );
        return true;
      };

      await retry(fireKinesisRequestAndCheckLogs, (res) => res, {
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
      const {
        Name: table1Name,
        Arn: table1Arn,
        Region: table1Region,
        StreamArn: table1StreamArn,
      } = Object.keys(meta.storage).map((key) => meta.storage[key])[0].output;

      expect(table1Name).toBeDefined();
      expect(table1Arn).toBeDefined();
      expect(table1Region).toBeDefined();
      expect(table1StreamArn).toBeDefined();
    });
  });
});
