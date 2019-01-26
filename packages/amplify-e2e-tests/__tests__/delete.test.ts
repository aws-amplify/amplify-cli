import * as AWS from 'aws-sdk';

import { getProjectMeta, initProject, deleteProject } from '../src/init';
import { createNewProjectDir, deleteProjectDir } from '../src/utils';

describe('amplify delete', () => {
  let projRoot: string;
  beforeAll(async () => {
    jest.setTimeout(1000 * 60 * 20); // 20 minutes
    projRoot = createNewProjectDir();
    await initProject(projRoot, {});
  });

  afterAll(() => {
    deleteProjectDir(projRoot);
  });

  it('should delete resources', async () => {
    const meta = getProjectMeta(projRoot).providers.awscloudformation;
    expect(meta.Region).toBeDefined();
    const { AuthRoleName, UnauthRoleName, Region } = meta;

    await deleteProject(projRoot, true);
    const iam = new AWS.IAM({ region: Region });
    await expect(iam.getRole({ RoleName: UnauthRoleName }).promise()).rejects.toThrowError(
      'cannot be found'
    );
    await expect(iam.getRole({ RoleName: AuthRoleName }).promise()).rejects.toThrowError(
      'cannot be found'
    );
  });
});
