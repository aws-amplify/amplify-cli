import {
  initJSProjectWithProfile,
  deleteProject,
  createNewProjectDir,
  deleteProjectDir,
  addFeatureFlag,
  addApiWithoutSchema,
  addCustomResolver,
  apiGqlCompile,
  updateApiSchema,
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

    await addApiWithoutSchema(projectDir, { apiName });
    await updateApiSchema(projectDir, apiName, 'simple_model.graphql');
    await apiGqlCompile(projectDir, true);

    expect(fs.readFileSync(generatedResolverPath).toString()).not.toEqual(resolver);

    addCustomResolver(projectDir, apiName, resolverName, resolver);
    await apiGqlCompile(projectDir, true);

    expect(fs.readFileSync(generatedResolverPath).toString()).toEqual(resolver);
  });
});
