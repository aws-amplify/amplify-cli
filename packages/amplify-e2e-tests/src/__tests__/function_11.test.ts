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

} from "@aws-amplify/amplify-e2e-core";


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
    
    // const apikeymeta = getProjectMeta(projRoot);
    // const { output } = apikeymeta.api[projName];
    // const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;

    // expect(GraphQLAPIIdOutput).toBeDefined();
    // expect(GraphQLAPIEndpointOutput).toBeDefined();
    // expect(GraphQLAPIKeyOutput).toBeDefined();

    
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
    
    // const apikeymeta = getProjectMeta(projRoot);
    // const { output } = apikeymeta.api[projName];
    // const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;

    // expect(GraphQLAPIIdOutput).toBeDefined();
    // expect(GraphQLAPIEndpointOutput).toBeDefined();
    // expect(GraphQLAPIKeyOutput).toBeDefined();

    
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
