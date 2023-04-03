"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3MockDataBuilder = void 0;
const uuid = __importStar(require("uuid"));
const amplify_cli_core_1 = require("amplify-cli-core");
const lodash_1 = __importDefault(require("lodash"));
const s3_stack_transform_1 = require("../../../../provider-utils/awscloudformation/cdk-stack-builder/s3-stack-transform");
const s3_user_input_types_1 = require("../../../../provider-utils/awscloudformation/service-walkthrough-types/s3-user-input-types");
const s3_user_input_state_1 = require("../../../../provider-utils/awscloudformation/service-walkthroughs/s3-user-input-state");
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
        getResourceStatus: () => {
            return { allResources: S3MockDataBuilder.getMockGetAllResourcesNoExistingLambdas() };
        },
        copyBatch: jest.fn().mockReturnValue(new Promise((resolve) => resolve(true))),
        updateamplifyMetaAfterResourceAdd: jest.fn().mockReturnValue(new Promise((resolve) => resolve(true))),
        pathManager: {
            getBackendDirPath: jest.fn().mockReturnValue('mockTargetDir'),
        },
    },
};
jest.mock('amplify-cli-core');
const stateManagerMock = amplify_cli_core_1.stateManager;
stateManagerMock.getMeta.mockReturnValue({
    providers: {
        awscloudformation: { StackName: 'amplify-stackName' },
    },
});
const buildOverrideDirMock = amplify_cli_core_1.buildOverrideDir;
buildOverrideDirMock.mockResolvedValue(false);
const pathManagerMock = amplify_cli_core_1.pathManager;
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
        const cliInputs = {
            resourceName,
            bucketName,
            policyUUID: shortId,
            storageAccess: s3_user_input_types_1.S3AccessType.AUTH_AND_GUEST,
            guestAccess: [s3_user_input_types_1.S3PermissionType.READ],
            authAccess: [s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE, s3_user_input_types_1.S3PermissionType.READ, s3_user_input_types_1.S3PermissionType.DELETE],
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
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'getCliInputPayload').mockImplementation(() => cliInputs);
        const s3Transform = new s3_stack_transform_1.AmplifyS3ResourceStackTransform(resourceName, mockContext);
        await s3Transform.transform(amplify_cli_core_1.CLISubCommandType.ADD);
        expect(s3Transform.getCFN()).toMatchSnapshot();
        expect(lodash_1.default.isEqual(s3Transform.getCFNInputParams(), cliInputParams)).toEqual(true);
    });
});
class S3MockDataBuilder {
    constructor(__startCliInputState) {
        this.mockGroupAccess = {
            mockAdminGroup: [s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE, s3_user_input_types_1.S3PermissionType.READ, s3_user_input_types_1.S3PermissionType.DELETE],
            mockGuestGroup: [s3_user_input_types_1.S3PermissionType.READ],
        };
        this.defaultAuthPerms = [s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE, s3_user_input_types_1.S3PermissionType.READ, s3_user_input_types_1.S3PermissionType.DELETE];
        this.defaultGuestPerms = [s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE, s3_user_input_types_1.S3PermissionType.READ];
        this.simpleAuth = {
            resourceName: S3MockDataBuilder.mockResourceName,
            bucketName: S3MockDataBuilder.mockBucketName,
            policyUUID: S3MockDataBuilder.mockPolicyUUID,
            storageAccess: s3_user_input_types_1.S3AccessType.AUTH_ONLY,
            guestAccess: [],
            authAccess: this.defaultAuthPerms,
            groupAccess: {},
            triggerFunction: 'NONE',
        };
    }
    static getMockGetAllResourcesNoExistingLambdas() {
        return [{ service: 'Cognito', serviceType: 'managed' }];
    }
}
exports.S3MockDataBuilder = S3MockDataBuilder;
S3MockDataBuilder.mockBucketName = 'mock-stack-builder-bucket-name-99';
S3MockDataBuilder.mockResourceName = 'mockResourceName';
S3MockDataBuilder.mockPolicyUUID = 'cafe2021';
S3MockDataBuilder.mockPolicyUUID2 = 'cafe2022';
S3MockDataBuilder.mockFunctionName = `S3Trigger${S3MockDataBuilder.mockPolicyUUID}`;
S3MockDataBuilder.mockFunctioName2 = `S3Trigger${S3MockDataBuilder.mockPolicyUUID2}`;
S3MockDataBuilder.mockExistingFunctionName1 = 'triggerHandlerFunction1';
S3MockDataBuilder.mockExistingFunctionName2 = 'triggerHandlerFunction2';
S3MockDataBuilder.mockFilePath = '';
S3MockDataBuilder.mockAuthMeta = {
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
//# sourceMappingURL=s3-stack-builder.test.js.map