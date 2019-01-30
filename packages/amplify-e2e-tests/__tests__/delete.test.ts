require('../src/aws-matchers/'); // custom matcher for assertion

import { getProjectMeta, initProjectWithProfile, deleteProject } from '../src/init';
import { createNewProjectDir, deleteProjectDir } from '../src/utils';

describe('amplify delete', () => {
  let projRoot: string;
  beforeAll(async () => {
    jest.setTimeout(1000 * 60 * 20); // 20 minutes
    projRoot = createNewProjectDir();
    await initProjectWithProfile(projRoot, {});
  });

  afterAll(() => {
    deleteProjectDir(projRoot);
  });

  it('should delete resources', async () => {
    const meta = getProjectMeta(projRoot).providers.awscloudformation;
    expect(meta.Region).toBeDefined();
    const { AuthRoleName, UnauthRoleName, Region } = meta;

    await deleteProject(projRoot, true);
    expect(UnauthRoleName).not.toBeIAMRoleWithArn();
    expect(AuthRoleName).not.toBeIAMRoleWithArn();
  });
});
