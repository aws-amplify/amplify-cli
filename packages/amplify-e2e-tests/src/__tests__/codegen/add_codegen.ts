import {
  addApiWithoutSchema,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  getProjectMeta,
  amplifyPush,
  updateApiSchema,
  createRandomName,
} from 'amplify-e2e-core';
import * as path from 'path';
import { existsSync } from 'fs-extra';
import { addCodegen } from '../../codegen/add';

describe('amplify codegen add', () => {
  let projRoot: string;
  let projRootExternalApi: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('add_codegen');
    projRootExternalApi = await createNewProjectDir('add_codegen_external_api');
  });

  afterEach(async () => {
    await Promise.all([projRoot, projRootExternalApi].map(async root => {
      if (existsSync(path.join(root, 'amplify', '#current-cloud-backend', 'amplify-meta.json'))) {
        await deleteProject(root);
      }
      deleteProjectDir(root);
      return Promise.resolve();
    }));
  });

  it('allows adding codegen to a project with api', async () => {
    const projName = createRandomName();
    await initJSProjectWithProfile(projRoot, { name: projName });
    await addApiWithoutSchema(projRoot);
    await updateApiSchema(projRoot, projName, 'simple_model.graphql');
    await expect(addCodegen(projRoot, {})).resolves.not.toThrow();
  });

  it('allows adding codegen to a project without an api using an api id', async () => {
    // Set up project 1 with API
    const proj1Name = createRandomName();
    await initJSProjectWithProfile(projRoot, { name: proj1Name });
    await addApiWithoutSchema(projRoot);
    await updateApiSchema(projRoot, proj1Name, 'simple_model.graphql');
    await amplifyPush(projRoot);

    // Get API Id
    const { GraphQLAPIIdOutput } = getProjectMeta(projRoot).api[proj1Name].output;
    expect(GraphQLAPIIdOutput).toBeDefined();

    // Setup Project 2
    const proj2Name = createRandomName();
    await initJSProjectWithProfile(projRootExternalApi, { name: proj2Name });
    await expect(addCodegen(projRootExternalApi, { apiId: GraphQLAPIIdOutput })).resolves.not.toThrow();
  });
});
