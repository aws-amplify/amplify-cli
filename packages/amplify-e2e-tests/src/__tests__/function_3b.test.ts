import path from 'path';
import fs from 'fs-extra';
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
import { AmplifyCategories, JSONUtilities, pathManager } from '@aws-amplify/amplify-cli-core';

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

  const assertDotNetVersion = (): void => {
    const functionPath = pathManager.getResourceDirectoryPath(projRoot, AmplifyCategories.FUNCTION, funcName);
    const { functionRuntime } = JSONUtilities.readJson<any>(path.join(functionPath, 'amplify.state'));
    expect(functionRuntime).toEqual('dotnet8');
    const functionProjFilePath = path.join(functionPath, 'src', `${funcName}.csproj`);
    const functionProjFileContent = fs.readFileSync(functionProjFilePath, 'utf8');
    expect(functionProjFileContent).toContain('<TargetFramework>net8.0</TargetFramework>');
  };

  it('add dotnet hello world function and mock locally', async () => {
    await addFunction(
      projRoot,
      {
        name: funcName,
        functionTemplate: 'Hello World',
      },
      'dotnet8',
    );
    await functionMockAssert(projRoot, {
      funcName,
      successString: helloWorldSuccessString,
      eventFile: 'src/event.json',
    }); // will throw if successString is not in output

    assertDotNetVersion();
  });

  it('add dotnet hello world function and invoke in the cloud', async () => {
    await addFunction(
      projRoot,
      {
        name: funcName,
        functionTemplate: 'Hello World',
      },
      'dotnet8',
    );
    const payload = '{"key1":"value1","key2":"value2","key3":"value3"}';
    await amplifyPushAuth(projRoot);
    const response = await functionCloudInvoke(projRoot, { funcName, payload });
    expect(JSON.parse(response.Payload.transformToString())).toEqual(helloWorldSuccessObj);

    assertDotNetVersion();
  });

  it('add dotnet serverless function and mock locally', async () => {
    await addFunction(
      projRoot,
      {
        name: funcName,
        functionTemplate: 'Serverless',
      },
      'dotnet8',
    );
    await functionMockAssert(projRoot, {
      funcName,
      successString: serverlessSuccessString,
      eventFile: 'src/event.json',
    }); // will throw if successString is not in output

    assertDotNetVersion();
  });

  it('add dotnet crud function and invoke in the cloud', async () => {
    await addFunction(
      projRoot,
      {
        name: funcName,
        functionTemplate: 'CRUD function for DynamoDB (Integration with API Gateway)',
      },
      'dotnet8',
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
    console.log(response.Payload);
    expect(JSON.parse(response.Payload.transformToString()).statusCode).toEqual(200);

    assertDotNetVersion();
  });

  it('add dotnet ddb trigger function and and mock locally', async () => {
    await addSimpleDDBwithGSI(projRoot);
    await addFunction(
      projRoot,
      {
        name: funcName,
        functionTemplate: 'Trigger (DynamoDb, Kinesis)',
        triggerType: 'DynamoDB',
        eventSource: 'DynamoDB',
      },
      'dotnet8',
      addLambdaTrigger, // Adds DDB trigger by default
    );
    await functionMockAssert(projRoot, {
      funcName,
      successString: null,
      eventFile: 'src/event.json',
    }); // will throw if successString is not in output

    assertDotNetVersion();
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
      'dotnet8',
      addLambdaTrigger, // Adds DDB trigger by default
    );
    await functionMockAssert(projRoot, {
      funcName,
      successString: null,
      eventFile: 'src/event.json',
    }); // will throw if successString is not in output

    assertDotNetVersion();
  });
});
