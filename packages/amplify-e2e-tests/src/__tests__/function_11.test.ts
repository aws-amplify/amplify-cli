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
  invokeFunction,
  addApiWithoutSchema,
  updateApiSchema,
  generateRandomShortId,
  sleep

} from "@aws-amplify/amplify-e2e-core";

import Lambda from "aws-sdk/clients/lambda";


describe("Lambda AppSync nodejs: ", () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir("lambda-appsync-nodejs");
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it("API key test", async () => {
    
    const projName = `apikeymodel${generateRandomShortId()}`;
    
    await initJSProjectWithProfile(projRoot, {name: projName});
    
    await addApi(projRoot, {
      'API key': {},
      transformerVersion: 2,
    });

    expect(getBackendConfig(projRoot)).toBeDefined();
    
    var beforeMeta = getBackendConfig(projRoot);
    const apiName = Object.keys(beforeMeta.api)[0];

    expect(apiName).toBeDefined();

    
    await addFunction(
      projRoot, 
      { 
        functionTemplate: 'AppSync Todo',
        appSyncAuthType: 'API_KEY',
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
    await amplifyPush(projRoot);
    
    const meta = getProjectMeta(projRoot);
    const { Arn: functionArn, Name: functionName, Region: region } = Object.keys(meta.function).map(key => meta.function[key])[0].output;
    
    expect(functionArn).toBeDefined();
    expect(functionName).toBeDefined();
    expect(region).toBeDefined();
    
    const cloudFunction = await getFunction(functionName, region);
    expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
    
    
    const payloadObj = {test: 'test' };
    const fnResponse = await invokeFunction(functionName, JSON.stringify(payloadObj), region);
    
    expect(fnResponse.StatusCode).toBe(200);
    expect(fnResponse.Payload).toBeDefined();
    
    const gqlResponse = JSON.parse(fnResponse.Payload as string);
    expect(gqlResponse.body).toBeDefined();
    
  });
  
  it("IAM test", async () => {
    const projName = `iammodel${generateRandomShortId()}`;
    
    await initJSProjectWithProfile(projRoot, {name: projName});
    
    await addApiWithoutSchema(projRoot, { transformerVersion: 2 });
    await updateApiSchema(projRoot, projName, 'iam_simple_model.graphql');

    expect(getBackendConfig(projRoot)).toBeDefined();
    
    var beforeMeta = getBackendConfig(projRoot);
    const apiName = Object.keys(beforeMeta.api)[0];
 

    expect(apiName).toBeDefined();

    
    await addFunction(
      projRoot, 
      { 
        functionTemplate: 'AppSync Todo',
        appSyncAuthType: 'IAM',
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
    await amplifyPush(projRoot);
    
    const meta = getProjectMeta(projRoot);
    const { Arn: functionArn, Name: functionName, Region: region } = Object.keys(meta.function).map(key => meta.function[key])[0].output;
    
    expect(functionArn).toBeDefined();
    expect(functionName).toBeDefined();
    expect(region).toBeDefined();
    
    const cloudFunction = await getFunction(functionName, region);
    expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
    
    
    const payloadObj = {test: 'test' };
    const fnResponse = await invokeFunction(functionName, JSON.stringify(payloadObj), region);
    
    expect(fnResponse.StatusCode).toBe(200);
    expect(fnResponse.Payload).toBeDefined();
    
    const gqlResponse = JSON.parse(fnResponse.Payload as string);
    
    expect(gqlResponse.body).toBeDefined();
  });
  
  
});


describe("Lambda AppSync Java: ", () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir("lambda-appsync-java");
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it("API key test", async () => {
    
    const projName = `apikeymodel${generateRandomShortId()}`;
    
    await initJSProjectWithProfile(projRoot, {name: projName});
    
    await addApi(projRoot, {
      'API key': {},
      transformerVersion: 2,
    });

    expect(getBackendConfig(projRoot)).toBeDefined();
    
    var beforeMeta = getBackendConfig(projRoot);
    const apiName = Object.keys(beforeMeta.api)[0];

    expect(apiName).toBeDefined();

    
    await addFunction(
      projRoot, 
      { 
        functionTemplate: 'AppSync Todo',
        appSyncAuthType: 'API_KEY',
        additionalPermissions: {
            permissions: ['api'],
            choices: ['api'],
            resources: [apiName],
            operations: ['Query'],
          },
        },
      'java'
      );
      
    await functionBuild(projRoot, {});
    await amplifyPush(projRoot);
    
    
    const meta = getProjectMeta(projRoot);
    const { Arn: functionArn, Name: functionName, Region: region } = Object.keys(meta.function).map(key => meta.function[key])[0].output;
    
    const lam = new Lambda({
      region : region,
    });
    var params = {
      FunctionName: functionName, 
      MemorySize: 200,
      Timeout: 50,
    };
    
    await lam.updateFunctionConfiguration(params, function(err){
      if(err) console.log(err, err.stack);
    });
    
    await sleep(1000 * 20);
    
    expect(functionArn).toBeDefined();
    expect(functionName).toBeDefined();
    expect(region).toBeDefined();
    
    const cloudFunction = await getFunction(functionName, region);
    expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
    
    
    const payloadObj = {test: 'test' };
    const fnResponse = await invokeFunction(functionName, JSON.stringify(payloadObj), region);
    
    expect(fnResponse.StatusCode).toBe(200);
    expect(fnResponse.Payload).toBeDefined();
    
    var gqlResponse = JSON.parse(fnResponse.Payload as string);
    gqlResponse = gqlResponse.replace(/\\"/g, '"');
    gqlResponse = JSON.parse(gqlResponse as string);
    expect(gqlResponse.data).toBeDefined();
    
  });
  
  it("IAM test", async () => {
    const projName = `iammodel${generateRandomShortId()}`;
    
    await initJSProjectWithProfile(projRoot, {name: projName});
    
    await addApiWithoutSchema(projRoot, { transformerVersion: 2 });
    await updateApiSchema(projRoot, projName, 'iam_simple_model.graphql');

    expect(getBackendConfig(projRoot)).toBeDefined();
    
    var beforeMeta = getBackendConfig(projRoot);
    const apiName = Object.keys(beforeMeta.api)[0];
 

    expect(apiName).toBeDefined();

    
    await addFunction(
      projRoot, 
      { 
        functionTemplate: 'AppSync Todo',
        appSyncAuthType: 'IAM',
        additionalPermissions: {
            permissions: ['api'],
            choices: ['api'],
            resources: [apiName],
            operations: ['Query'],
          },
        },
      'java'
      );
      
    await functionBuild(projRoot, {});
    await amplifyPush(projRoot);
    
    const meta = getProjectMeta(projRoot);
    const { Arn: functionArn, Name: functionName, Region: region } = Object.keys(meta.function).map(key => meta.function[key])[0].output;
    
      const lam = new Lambda({
      region : region,
    });
    var params = {
      FunctionName: functionName,
      MemorySize: 200,
      Timeout: 50,
    };
    
    await lam.updateFunctionConfiguration(params, function(err){
      if(err) console.log(err, err.stack);
    });
    
    await sleep(1000 * 20);
    
    expect(functionArn).toBeDefined();
    expect(functionName).toBeDefined();
    expect(region).toBeDefined();
    
    const cloudFunction = await getFunction(functionName, region);
    expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
    
    
    const payloadObj = {test: 'test' };
    const fnResponse = await invokeFunction(functionName, JSON.stringify(payloadObj), region);
    
    expect(fnResponse.StatusCode).toBe(200);
    expect(fnResponse.Payload).toBeDefined();
    
    var gqlResponse = JSON.parse(fnResponse.Payload as string);
    gqlResponse = gqlResponse.replace(/\\"/g, '"');
    gqlResponse = JSON.parse(gqlResponse as string);
    expect(gqlResponse.data).toBeDefined();
  });
  
  
});