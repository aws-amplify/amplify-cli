import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { AmplifyS3ResourceStackTransform } from '../../../../provider-utils/awscloudformation/cdk-stack-builder/s3-stack-transform';
import { S3UserInputs } from '../../../../provider-utils/awscloudformation/service-walkthrough-types/s3-user-input-types';
import { S3InputState } from '../../../../provider-utils/awscloudformation/service-walkthroughs/s3-user-input-state';

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  pathManager: {
    getBackendDirPath: jest.fn().mockReturnValue('mockbackendpath'),
  },
}));

jest.mock('../../../../provider-utils/awscloudformation/service-walkthroughs/s3-user-input-state');

describe('AmplifyS3ResourceStackTransform', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('includes the environment name in IAM policy names', () => {
    const userInput: S3UserInputs = {
      resourceName: 'storage',
      bucketName: 'bucket',
      policyUUID: 'abc123',
      storageAccess: undefined,
      guestAccess: [],
      authAccess: [],
    };
    const context = {
      amplify: {
        getEnvInfo: jest.fn().mockReturnValue({ envName: 'prod' }),
      },
    } as unknown as $TSContext;

    jest.spyOn(S3InputState.prototype, 'getCliInputPayload').mockReturnValue(userInput);
    jest.spyOn(S3InputState.prototype, 'getUserInput').mockReturnValue(userInput);
    jest.spyOn(S3InputState, 'getCfnPermissionsFromInputPermissions').mockReturnValue([]);

    const transform = new AmplifyS3ResourceStackTransform('storage', context);
    transform.generateCfnInputParameters();

    expect(transform.getCFNInputParams()).toMatchObject({
      s3PrivatePolicy: 'Private_policy_abc123_prod',
      s3ProtectedPolicy: 'Protected_policy_abc123_prod',
      s3PublicPolicy: 'Public_policy_abc123_prod',
      s3ReadPolicy: 'read_policy_abc123_prod',
      s3UploadsPolicy: 'Uploads_policy_abc123_prod',
      authPolicyName: 's3_amplify_abc123_prod',
      unauthPolicyName: 's3_amplify_abc123_prod',
    });
  });
});
