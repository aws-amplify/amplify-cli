/* eslint-disable spellcheck/spell-checker */
import {
  addAuthWithDefault,
  amplifyPushForce,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  initJSProjectWithProfile,
  amplifyPushAuth,
} from '@aws-amplify/amplify-e2e-core';
import * as AWS from 'aws-sdk';

import { reportError } from '../../../amplify-cli/src/commands/diagnose';
import { Context } from '../../../amplify-cli/src/domain/context';

const reportErrorMock = reportError as jest.MockedFunction<typeof reportError>;
jest.mock('../../../amplify-cli/src/commands/diagnose', () => ({
  reportError: jest.fn(async (__context: Context, __error: Error | undefined): Promise<void> => {
    /* no-op */
  }),
}));

describe('amplify push ', () => {
  let pushProjRoot: string;
  beforeEach(async () => {
    pushProjRoot = await createNewProjectDir('push-test');
  });

  afterEach(async () => {
    await deleteProject(pushProjRoot);
    deleteProjectDir(pushProjRoot);
  });

  it('test push --force override current-cloud-backed zip', async () => {
    await initJSProjectWithProfile(pushProjRoot, {
      disableAmplifyAppCreation: false,
      name: 'testPush',
    });

    await addAuthWithDefault(pushProjRoot);
    const amplifyMeta = getProjectMeta(pushProjRoot);
    const meta = amplifyMeta.providers.awscloudformation;
    const bucketName = meta.DeploymentBucketName;

    const s3 = new AWS.S3();
    await s3
      .deleteObject({
        Bucket: bucketName,
        Key: '#current-cloud-backend.zip',
      })
      .promise();

    await expect(amplifyPushAuth(pushProjRoot)).rejects.toThrow();
    await amplifyPushForce(pushProjRoot);
  });
});
