require('../src/aws-matchers/'); // custom matcher for assertion
import {
  initProjectWithProfile,
  deleteProject,
  amplifyPush
} from '../src/init';
import { addApiWithSimpleModel } from '../src/categories/api';
import { createNewProjectDir, deleteProjectDir, getProjectMeta } from '../src/utils';

describe('amplify add api', () => {
  let projRoot: string;
  beforeEach(() => {
    projRoot = createNewProjectDir();
    jest.setTimeout(1000 * 60 * 60); // 1 hour
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project and add the simple_model api', async () => {
    await initProjectWithProfile(projRoot, { name: 'simplemodel' });
    await addApiWithSimpleModel(projRoot, {});
    await amplifyPush(projRoot);
    const { output } = getProjectMeta(projRoot).api.simplemodel;

    // TODO - Validate these using control plane API calls.
    const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;
    
    await expect(GraphQLAPIIdOutput).toBeDefined()
    await expect(GraphQLAPIEndpointOutput).toBeDefined()
    await expect(GraphQLAPIKeyOutput).toBeDefined()
  });
});
