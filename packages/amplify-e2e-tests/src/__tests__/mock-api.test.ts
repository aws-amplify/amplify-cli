import {
  addApiWithBlankSchema,
  addCustomResolver,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  updateApiSchema,
  cancelAmplifyMockApi,
} from 'amplify-e2e-core';
import { existsSync } from 'fs';
import path from 'path';
import { addCodegen } from '../codegen/add';
import * as fs from 'fs-extra';

describe('amplify mock api (GraphQL)', () => {
  let projRoot: string;
  let projFolderName: string;
  let apiName: string;

  beforeEach(async () => {
    projFolderName = 'mockapi';
    apiName = 'mockapi';
    projRoot = await createNewProjectDir(projFolderName);
  });

  afterEach(async () => {
    const metaFilePath = path.join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
    if (existsSync(metaFilePath)) {
      await deleteProject(projRoot);
    }
    deleteProjectDir(projRoot);
  });

  it('mock does not delete custom slot resolvers V2', async () => {
    const projName = 'simplemodel';
    await initJSProjectWithProfile(projRoot, { name: projName });
    await addApiWithBlankSchema(projRoot, { apiName });
    await updateApiSchema(projRoot, apiName, 'simple_model.graphql');

    const resolverReqInitName = 'Query.getTodo.init.1.req.vtl';
    const resolverReqName = 'Query.getTodo.req.vtl';
    const resolver = '$util.unauthorized()';

    await addCustomResolver(projRoot, apiName, resolverReqInitName, resolver);
    await addCustomResolver(projRoot, apiName, resolverReqName, resolver);

    await addCodegen(projRoot, {});
    await cancelAmplifyMockApi(projRoot, {});

    const resolversPath = path.join(projRoot, 'amplify', 'backend', 'api', apiName, 'resolvers');
    const files = await fs.readdir(resolversPath);
    expect(files.includes('Query.getTodo.init.1.req.vtl')).toBeTruthy();
    expect(files.includes('Query.getTodo.req.vtl')).toBeTruthy();
    expect(files).toHaveLength(3);
  });
});
