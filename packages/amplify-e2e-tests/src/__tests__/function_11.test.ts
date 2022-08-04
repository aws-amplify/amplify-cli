import {
  addApi,
  addFunction,
  amplifyPush,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getBackendConfig,
  initJSProjectWithProfile,
  getProjectMeta,
  getFunction,
  functionBuild,
  amplifyPushAuth,
  invokeFunction

} from "@aws-amplify/amplify-e2e-core";
import { v4 as uuid } from "uuid";
import path from "path";
import { existsSync } from "fs";

describe("Lambda AppSync nodejs", () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir("lambda-appsync-nodejs");
  });

  afterEach(async () => {
    const metaFilePath = path.join(projRoot, "amplify", "#current-cloud-backend", "amplify-meta.json");
    if (existsSync(metaFilePath)) {
      await deleteProject(projRoot);
    }
    deleteProjectDir(projRoot);
  });

  it.only("add nodejs appsync function", async () => {
    
    await initJSProjectWithProfile(projRoot, {});
    
    await addApi(projRoot, {
      'API key': {},
      transformerVersion: 2
    });
    await amplifyPush(projRoot);

    expect(getBackendConfig(projRoot)).toBeDefined();

    var beforeMeta = getBackendConfig(projRoot);
    console.log(beforeMeta);
    console.log(Object.keys(beforeMeta.api.lambdaappsyncnodejsa.output))
    const apiName = Object.keys(beforeMeta.api)[0];
    console.log(apiName);

    expect(apiName).toBeDefined();

    
    await addFunction(
      projRoot, 
      { 
        functionTemplate: 'AppSync Todo',
        additionalPermissions: {
            permissions: ['api'],
            choices: ['api'],
            resources: [apiName],
            operations: ['Query'],
          },
        },
      'nodejs'
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
    
    
    const payloadObj = {test1: 'hello' };
    const fnResponse = await invokeFunction(functionName, JSON.stringify(payloadObj), region);
    
    console.log(fnResponse);
    expect(fnResponse.StatusCode).toBe(200);
    // expect(fnResponse.Payload).toBeDefined();
    // const gqlResponse = JSON.parse(fnResponse.Payload as string);

    // expect(gqlResponse.data).toBeDefined();
    // expect(gqlResponse.data.createTodo.name).toEqual('todo');
  });
});
