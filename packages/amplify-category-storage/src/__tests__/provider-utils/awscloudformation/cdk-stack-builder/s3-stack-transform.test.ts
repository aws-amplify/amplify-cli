import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { AmplifyS3ResourceStackTransform } from '../../../../provider-utils/awscloudformation/cdk-stack-builder/s3-stack-transform';
import { S3UserInputs } from '../../../../provider-utils/awscloudformation/service-walkthrough-types/s3-user-input-types';
import { S3InputState } from '../../../../provider-utils/awscloudformation/service-walkthroughs/s3-user-input-state';

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  pathManager: {
    getBackendDirPath: jest.fn().mockReturnValue('mockbackendpath'),
  },
  AmplifyError: class AmplifyError extends Error {
    constructor(code: string, options: { message: string }) {
      super(options.message);
      this.name = code;
    }
  },
}));

jest.mock('../../../../provider-utils/awscloudformation/service-walkthroughs/s3-user-input-state');

const userInput: S3UserInputs = {
  resourceName: 'storage',
  bucketName: 'bucket',
  policyUUID: 'abc123',
  storageAccess: undefined,
  guestAccess: [],
  authAccess: [],
};

const importedAuthMeta = { auth: { cognitoauth: { service: 'Cognito', serviceType: 'imported' } } };
const managedAuthMeta = { auth: { cognitoauth: { service: 'Cognito', serviceType: 'managed' } } };

const buildContext = (meta: unknown, envName: string): $TSContext =>
  ({
    amplify: {
      getProjectMeta: jest.fn().mockReturnValue(meta),
      getEnvInfo: jest.fn().mockReturnValue({ envName }),
    },
  } as unknown as $TSContext);

const stubInputState = (): void => {
  jest.spyOn(S3InputState.prototype, 'getCliInputPayload').mockReturnValue(userInput);
  jest.spyOn(S3InputState.prototype, 'getUserInput').mockReturnValue(userInput);
  jest.spyOn(S3InputState, 'getCfnPermissionsFromInputPermissions').mockReturnValue([]);
};

describe('AmplifyS3ResourceStackTransform', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('appends the environment name to IAM policy names when auth is imported', () => {
    stubInputState();
    const transform = new AmplifyS3ResourceStackTransform('storage', buildContext(importedAuthMeta, 'prod'));
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

  it('keeps the legacy (env-agnostic) IAM policy names when auth is not imported', () => {
    // Managed auth gives each environment its own roles, so names never collide. Keeping the
    // legacy name avoids forcing a policy replacement on every existing storage app on upgrade.
    stubInputState();
    const transform = new AmplifyS3ResourceStackTransform('storage', buildContext(managedAuthMeta, 'prod'));
    transform.generateCfnInputParameters();

    expect(transform.getCFNInputParams()).toMatchObject({
      s3PrivatePolicy: 'Private_policy_abc123',
      s3ProtectedPolicy: 'Protected_policy_abc123',
      s3PublicPolicy: 'Public_policy_abc123',
      s3ReadPolicy: 'read_policy_abc123',
      s3UploadsPolicy: 'Uploads_policy_abc123',
      authPolicyName: 's3_amplify_abc123',
      unauthPolicyName: 's3_amplify_abc123',
    });
  });

  it('throws when auth is imported but the current environment name cannot be determined', () => {
    // Imported auth needs the env suffix; a blank envName would otherwise degrade to a
    // shared "_undefined" name and re-collide, so we fail fast instead.
    stubInputState();
    const transform = new AmplifyS3ResourceStackTransform('storage', buildContext(importedAuthMeta, ''));

    expect(() => transform.generateCfnInputParameters()).toThrow(/environment name/);
  });
});
