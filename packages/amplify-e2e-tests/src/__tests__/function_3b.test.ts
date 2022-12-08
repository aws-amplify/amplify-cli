import {
  initJSProjectWithProfile,
  deleteProject,
  amplifyPushAuth,
  addFunction,
  functionMockAssert,
  functionCloudInvoke,
  createNewProjectDir,
  deleteProjectDir,
  generateRandomShortId,
  addSimpleDDBwithGSI,
  addLambdaTrigger,
  createNewDynamoDBForCrudTemplate,
  addKinesis,
} from '@aws-amplify/amplify-e2e-core';

describe('dotnet function tests', () => {
  const helloWorldSuccessObj = {
    key1: 'VALUE1',
    key2: 'VALUE2',
    key3: 'VALUE3',
  };
  const helloWorldSuccessString = '  "key3": "VALUE3"';
  const serverlessSuccessString = '  "statusCode": 200,';
  let projRoot: string;
  let funcName: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('dotnet-functions');
    await initJSProjectWithProfile(projRoot, {});

    funcName = `dotnettestfn${generateRandomShortId()}`;
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('add dotnet hello world function and mock locally', async () => {
    await addFunction(
      projRoot,
      {
        name: funcName,
        functionTemplate: 'Hello World',
      },
      'dotnetCore31',
    );
    await functionMockAssert(projRoot, {
      funcName,
      successString: helloWorldSuccessString,
      eventFile: 'src/event.json',
    }); // will throw if successString is not in output
  });

  it('add dotnet hello world function and invoke in the cloud', async () => {
    await addFunction(
      projRoot,
      {
        name: funcName,
        functionTemplate: 'Hello World',
      },
      'dotnetCore31',
    );
    const payload = '{"key1":"value1","key2":"value2","key3":"value3"}';
    await amplifyPushAuth(projRoot);
    const response = await functionCloudInvoke(projRoot, { funcName, payload });
    expect(JSON.parse(response.Payload.toString())).toEqual(helloWorldSuccessObj);
  });

  it('add dotnet serverless function and mock locally', async () => {
    await addFunction(
      projRoot,
      {
        name: funcName,
        functionTemplate: 'Serverless',
      },
      'dotnetCore31',
    );
    await functionMockAssert(projRoot, {
      funcName,
      successString: serverlessSuccessString,
      eventFile: 'src/event.json',
    }); // will throw if successString is not in output
  });

  it('add dotnet crud function and invoke in the cloud', async () => {
    await addFunction(
      projRoot,
      {
        name: funcName,
        functionTemplate: 'CRUD function for DynamoDB (Integration with API Gateway)',
      },
      'dotnetCore31',
      createNewDynamoDBForCrudTemplate,
    );
    const payload = JSON.stringify({
      body: null,
      resource: '/items/{proxy+}',
      path: '/items/column1:foo',
      httpMethod: 'GET',
    });
    await amplifyPushAuth(projRoot);
    const response = await functionCloudInvoke(projRoot, { funcName, payload });
    expect(JSON.parse(response.Payload.toString()).statusCode).toEqual(200);
  });

  it('add dotnet ddb trigger function and and mock locally', async () => {
    await addSimpleDDBwithGSI(projRoot, {});
    await addFunction(
      projRoot,
      {
        name: funcName,
        functionTemplate: 'Trigger (DynamoDb, Kinesis)',
        triggerType: 'DynamoDB',
        eventSource: 'DynamoDB',
      },
      'dotnetCore31',
      addLambdaTrigger, // Adds DDB trigger by default
    );
    await functionMockAssert(projRoot, {
      funcName,
      successString: null,
      eventFile: 'src/event.json',
    }); // will throw if successString is not in output
  });

  it('add dotnet kinesis trigger function and and mock locally', async () => {
    await addKinesis(projRoot, { rightName: `kinesisintegtest${generateRandomShortId()}`, wrongName: '$' });
    await addFunction(
      projRoot,
      {
        name: funcName,
        functionTemplate: 'Trigger (DynamoDb, Kinesis)',
        triggerType: 'Kinesis',
      },
      'dotnetCore31',
      addLambdaTrigger, // Adds DDB trigger by default
    );
    await functionMockAssert(projRoot, {
      funcName,
      successString: null,
      eventFile: 'src/event.json',
    }); // will throw if successString is not in output
  });
});
