import { S3PermissionType, S3UserInputs } from '../../../../provider-utils/awscloudformation/service-walkthrough-types/s3-user-input-types';
export declare class S3MockDataBuilder {
    static mockBucketName: string;
    static mockResourceName: string;
    static mockPolicyUUID: string;
    static mockPolicyUUID2: string;
    static mockFunctionName: string;
    static mockFunctioName2: string;
    static mockExistingFunctionName1: string;
    static mockExistingFunctionName2: string;
    static mockFilePath: string;
    static mockAuthMeta: {
        service: string;
        providerPlugin: string;
        dependsOn: never[];
        customAuth: boolean;
        frontendAuthConfig: {
            loginMechanisms: string[];
            signupAttributes: string[];
            passwordProtectionSettings: {
                passwordPolicyMinLength: number;
                passwordPolicyCharacters: never[];
            };
            mfaConfiguration: string;
            mfaTypes: string[];
            verificationMechanisms: string[];
        };
    };
    mockGroupAccess: {
        mockAdminGroup: S3PermissionType[];
        mockGuestGroup: S3PermissionType[];
    };
    defaultAuthPerms: S3PermissionType[];
    defaultGuestPerms: S3PermissionType[];
    simpleAuth: S3UserInputs;
    constructor(__startCliInputState: S3UserInputs | undefined);
    static getMockGetAllResourcesNoExistingLambdas(): {
        service: string;
        serviceType: string;
    }[];
}
//# sourceMappingURL=s3-stack-builder.test.d.ts.map