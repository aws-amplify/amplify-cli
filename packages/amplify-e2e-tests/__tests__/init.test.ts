import * as AWS from 'aws-sdk';

import { getProjectMeta, initProject, deleteProject } from '../src/init';
import { createNewProjectDir, deleteProjectDir} from '../src/utils'

describe('amplify init', () => {
  let projRoot: string;
  beforeAll(() => {
    projRoot = createNewProjectDir();
    jest.setTimeout(1000 * 60 * 20); // 20 minutes
  });

  afterAll(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot)
  });

  it('should init the project', async () => {
    await initProject(projRoot, {});
    const meta = getProjectMeta(projRoot).providers.awscloudformation;
    expect(meta.Region).toBeDefined();
    const {
      AuthRoleName,
      UnauthRoleName,
      StackName,
      Region,
      UnauthRoleArn,
      AuthRoleArn,
      DeploymentBucketName
    } = meta;
    const iam = new AWS.IAM({ region: Region });

    const { Role: unAuthRole } = await iam.getRole({ RoleName: UnauthRoleName }).promise();
    expect(unAuthRole.Arn).toEqual(UnauthRoleArn);

    const { Role: authRole } = await iam.getRole({ RoleName: AuthRoleName }).promise();
    expect(authRole.Arn).toEqual(AuthRoleArn);

    expect(async () => {
      const s3 = new AWS.S3();
      await s3.headBucket({ Bucket: meta.DeploymentBucketName }).promise();
    }).not.toThrow();
  });
});
