export function getAllS3Defaults(project: any): {
    resourceName: string;
    bucketName: string;
    authPolicyName: string;
    unauthPolicyName: string;
    authRoleName: {
        Ref: string;
    };
    unauthRoleName: {
        Ref: string;
    };
    storageAccess: string;
    selectedGuestPermissions: string[];
    selectedAuthenticatedPermissions: string[];
};
export function getAllAuthAndGuestDefaults(): {
    AuthenticatedAllowList: string;
    GuestAllowList: string;
    s3PermissionsAuthenticatedPrivate: string;
    s3PermissionsAuthenticatedProtected: string;
    s3PermissionsAuthenticatedPublic: string;
    s3PermissionsAuthenticatedUploads: string;
    s3PermissionsGuestPublic: string;
    s3PermissionsGuestUploads: string;
    s3PrivatePolicy: string;
    s3ProtectedPolicy: string;
    s3PublicPolicy: string;
    s3ReadPolicy: string;
    s3UploadsPolicy: string;
    selectedAuthenticatedPermissions: string[];
    selectedGuestPermissions: string[];
};
export function getAllAuthDefaults(): {
    AuthenticatedAllowList: string;
    GuestAllowList: string;
    s3PermissionsAuthenticatedPrivate: string;
    s3PermissionsAuthenticatedProtected: string;
    s3PermissionsAuthenticatedPublic: string;
    s3PermissionsAuthenticatedUploads: string;
    s3PermissionsGuestPublic: string;
    s3PermissionsGuestUploads: string;
    s3PrivatePolicy: string;
    s3ProtectedPolicy: string;
    s3PublicPolicy: string;
    s3ReadPolicy: string;
    s3UploadsPolicy: string;
    selectedAuthenticatedPermissions: string[];
};
export function getAllAuthDefaultPerm(userInput: any): any;
export function getAllAuthAndGuestDefaultPerm(userInput: any): any;
//# sourceMappingURL=s3-defaults.d.ts.map