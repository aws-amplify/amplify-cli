import {
  initJSProjectWithProfile,
  deleteProject,
  createNewProjectDir,
  deleteProjectDir,
  addFeatureFlag,
  addApiWithSchema,
  addCustomResolver,
  apiGqlCompile,
  addCustomResourcesJson,
} from 'amplify-e2e-core';
import { join } from 'path';
import * as fs from 'fs-extra';

describe('overriding generated resolvers', () => {
  let projectDir: string;
  let apiName = 'simpleapi';

  beforeAll(async () => {
    projectDir = await createNewProjectDir('overrideresolvers');
    await initJSProjectWithProfile(projectDir, {});

    addFeatureFlag(projectDir, 'graphqltransformer', 'useexperimentalpipelinedtransformer', true);
  });

  afterAll(async () => {
    await deleteProject(projectDir);
    deleteProjectDir(projectDir);
  });

  it('adds the overwritten resolver to the build', async () => {
    const resolverName = 'Query.listTodos.req.vtl';
    const resolver = '$util.unauthorized()';
    const generatedResolverPath = join(projectDir, 'amplify', 'backend', 'api', apiName, 'build', 'pipelineFunctions', resolverName);

    await addApiWithSchema(projectDir, 'simple_model.graphql');
    await apiGqlCompile(projectDir, true);

    addCustomResolver(projectDir, apiName, resolverName, resolver);
    await apiGqlCompile(projectDir, true);

    expect(fs.readFileSync(generatedResolverPath)).toEqual(resolver);
  });
});

describe('custom resolvers', () => {
  let projectDir: string;
  let apiName = 'simpleapi';

  beforeAll(async () => {
    projectDir = await createNewProjectDir('overrideresolvers');
    await initJSProjectWithProfile(projectDir, {});

    addFeatureFlag(projectDir, 'graphqltransformer', 'useexperimentalpipelinedtransformer', true);
  });

  afterAll(async () => {
    await deleteProject(projectDir);
    deleteProjectDir(projectDir);
  });

  it('adds the overwritten resolver to the build', async () => {
    const resolverReqName = 'Query.commentsForTodo.req.vtl';
    const resolverResName = 'Query.commentsForTodo.res.vtl';

    const resolverReq = '$util.unauthorized()';
    const resolverRes = '$util.toJson({})';

    const generatedReqResolverPath = join(projectDir, 'amplify', 'backend', 'api', apiName, 'build', 'pipelineFunctions', resolverReqName);
    const generatedResResolverPath = join(projectDir, 'amplify', 'backend', 'api', apiName, 'build', 'pipelineFunctions', resolverResName);
    const stackPath = join(projectDir, 'amplify', 'backend', 'api', apiName, 'build', 'stacks', 'CustomResources.json');

    await addApiWithSchema(projectDir, 'simple_model.graphql');
    await apiGqlCompile(projectDir, true);

    addCustomResolver(projectDir, apiName, resolverReqName, resolverReq);
    addCustomResolver(projectDir, apiName, resolverResName, resolverRes);
    addCustomResourcesJson(projectDir, apiName);
    await apiGqlCompile(projectDir, true);

    expect(fs.readFileSync(generatedReqResolverPath)).toEqual(resolverReq);
    expect(fs.readFileSync(generatedResResolverPath)).toEqual(resolverRes);
    expect(fs.readFileSync(stackPath)).toEqual('{}');
  });
});
