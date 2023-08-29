/* These tests test the S3StackBuilder */

/* These tests test the AmplifyS3ResourceStackTransform and run the cdk builder tool which is used within this file */
import * as uuid from 'uuid';
import { $TSContext, CLISubCommandType, stateManager, buildOverrideDir, pathManager } from '@aws-amplify/amplify-cli-core';
import _ from 'lodash';
import { AmplifyS3ResourceStackTransform } from '../../../../provider-utils/awscloudformation/cdk-stack-builder/s3-stack-transform';
import {
  S3AccessType,
  S3PermissionType,
  S3UserInputs,
} from '../../../../provider-utils/awscloudformation/service-walkthrough-types/s3-user-input-types';
import { S3InputState } from '../../../../provider-utils/awscloudformation/service-walkthroughs/s3-user-input-state';

const mockContext = {
  amplify: {
    getProjectDetails: () => ({
      projectConfig: {
        projectName: 'mockProject',
      },
      amplifyMeta: {
        providers: {
          awscloudformation: { StackName: 'amplify-stackName' },
        },
      },
    }),
    getUserPoolGroupList: () => [],
    // eslint-disable-next-line
    getResourceStatus: () => {
      return { allResources: S3MockDataBuilder.getMockGetAllResourcesNoExistingLambdas() };
    }, //eslint-disable-line
    copyBatch: jest.fn().mockReturnValue(new Promise((resolve) => resolve(true))),
    updateamplifyMetaAfterResourceAdd: jest.fn().mockReturnValue(new Promise((resolve) => resolve(true))),
    pathManager: {
      getBackendDirPath: jest.fn().mockReturnValue('mockTargetDir'),
    },
  },
} as unknown as $TSContext;

jest.mock('@aws-amplify/amplify-cli-core');

const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
stateManagerMock.getMeta.mockReturnValue({
  providers: {
    awscloudformation: { StackName: 'amplify-stackName' },
  },
});
const buildOverrideDirMock = buildOverrideDir as jest.MockedFunction<typeof buildOverrideDir>;
buildOverrideDirMock.mockResolvedValue(false);

const pathManagerMock = pathManager as jest.Mocked<typeof pathManager>;
pathManagerMock.getBackendDirPath.mockReturnValue('mockBackendPath');
pathManagerMock.getResourceDirectoryPath.mockReturnValue('mockResourcePath');

jest.mock('fs-extra', () => ({
  readFileSync: () => jest.fn().mockReturnValue('{ "Cognito": { "provider": "aws"}}'),
  existsSync: jest.fn().mockReturnValue(true),
  ensureDirSync: jest.fn().mockReturnValue(true),
}));

jest.mock('../../../../provider-utils/awscloudformation/service-walkthroughs/s3-questions');
jest.mock('../../../../provider-utils/awscloudformation/service-walkthroughs/s3-walkthrough');

describe('Test S3 transform generates correct CFN template', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Generated s3 template with all CLI configurations set with no overrides', async () => {
    const resourceName = 'mockResource';
    const bucketName = 'mockBucketName';
    const [shortId] = uuid.v4().split('-');
    const mockTriggerFunction = 'S3TriggerMockTriggerCafe2021';
    const cliInputs: S3UserInputs = {
      resourceName,
      bucketName,
      policyUUID: shortId,
      storageAccess: S3AccessType.AUTH_AND_GUEST,
      guestAccess: [S3PermissionType.READ],
      authAccess: [S3PermissionType.CREATE_AND_UPDATE, S3PermissionType.READ, S3PermissionType.DELETE],
      triggerFunction: mockTriggerFunction,
      adminTriggerFunction: undefined,
      additionalTriggerFunctions: undefined,
      groupAccess: undefined,
    };

    const cliInputParams = {
      bucketName,
      selectedGuestPermissions: ['s3:GetObject', 's3:ListBucket'],
      selectedAuthenticatedPermissions: ['s3:PutObject', 's3:GetObject', 's3:ListBucket', 's3:DeleteObject'],
      unauthRoleName: { Ref: 'UnauthRoleName' },
      authRoleName: { Ref: 'AuthRoleName' },
      triggerFunction: mockTriggerFunction,
      s3PrivatePolicy: `Private_policy_${shortId}`,
      s3ProtectedPolicy: `Protected_policy_${shortId}`,
      s3PublicPolicy: `Public_policy_${shortId}`,
      s3ReadPolicy: `read_policy_${shortId}`,
      s3UploadsPolicy: `Uploads_policy_${shortId}`,
      authPolicyName: `s3_amplify_${shortId}`,
      unauthPolicyName: `s3_amplify_${shortId}`,
      AuthenticatedAllowList: 'ALLOW',
      GuestAllowList: 'ALLOW',
      s3PermissionsAuthenticatedPrivate: 's3:PutObject,s3:GetObject,s3:DeleteObject',
      s3PermissionsAuthenticatedProtected: 's3:PutObject,s3:GetObject,s3:DeleteObject',
      s3PermissionsAuthenticatedPublic: 's3:PutObject,s3:GetObject,s3:DeleteObject',
      s3PermissionsAuthenticatedUploads: 's3:PutObject',
      s3PermissionsGuestPublic: 's3:GetObject',
      s3PermissionsGuestUploads: 'DISALLOW',
    };

    jest.spyOn(S3InputState.prototype, 'getCliInputPayload').mockImplementation(() => cliInputs);
    const s3Transform = new AmplifyS3ResourceStackTransform(resourceName, mockContext);
    await s3Transform.transform(CLISubCommandType.ADD);
    expect(s3Transform.getCFN()).toMatchSnapshot();
    expect(_.isEqual(s3Transform.getCFNInputParams(), cliInputParams)).toEqual(true);
  });
});

export class S3MockDataBuilder {
  static mockBucketName = 'mock-stack-builder-bucket-name-99'; // s3 bucket naming rules allows alphanumeric and hyphens
  static mockResourceName = 'mockResourceName';
  static mockPolicyUUID = 'cafe2021';
  static mockPolicyUUID2 = 'cafe2022';
  static mockFunctionName = `S3Trigger${S3MockDataBuilder.mockPolicyUUID}`;
  // eslint-disable-next-line spellcheck/spell-checker
  static mockFunctioName2 = `S3Trigger${S3MockDataBuilder.mockPolicyUUID2}`;
  static mockExistingFunctionName1 = 'triggerHandlerFunction1';
  static mockExistingFunctionName2 = 'triggerHandlerFunction2';
  static mockFilePath = '';
  static mockAuthMeta = {
    service: 'Cognito',
    providerPlugin: 'awscloudformation',
    dependsOn: [],
    customAuth: false,
    frontendAuthConfig: {
      loginMechanisms: ['PREFERRED_USERNAME'],
      signupAttributes: ['EMAIL'],
      passwordProtectionSettings: {
        passwordPolicyMinLength: 8,
        passwordPolicyCharacters: [],
      },
      mfaConfiguration: 'OFF',
      mfaTypes: ['SMS'],
      verificationMechanisms: ['EMAIL'],
    },
  };

  mockGroupAccess = {
    mockAdminGroup: [S3PermissionType.CREATE_AND_UPDATE, S3PermissionType.READ, S3PermissionType.DELETE],
    mockGuestGroup: [S3PermissionType.READ],
  };

  defaultAuthPerms = [S3PermissionType.CREATE_AND_UPDATE, S3PermissionType.READ, S3PermissionType.DELETE];
  defaultGuestPerms = [S3PermissionType.CREATE_AND_UPDATE, S3PermissionType.READ];

  simpleAuth: S3UserInputs = {
    resourceName: S3MockDataBuilder.mockResourceName,
    bucketName: S3MockDataBuilder.mockBucketName,
    policyUUID: S3MockDataBuilder.mockPolicyUUID,
    storageAccess: S3AccessType.AUTH_ONLY,
    guestAccess: [],
    authAccess: this.defaultAuthPerms,
    groupAccess: {},
    triggerFunction: 'NONE',
  };

  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor() {
    /* noop */
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  static getMockGetAllResourcesNoExistingLambdas() {
    return [{ service: 'Cognito', serviceType: 'managed' }];
  }
}
