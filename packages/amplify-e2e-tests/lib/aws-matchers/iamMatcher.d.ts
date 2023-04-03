export declare const toBeIAMRoleWithArn: (roleName: string, arn?: string) => Promise<{
    message: () => string;
    pass: boolean;
}>;
export declare const toHaveValidPolicyConditionMatchingIdpId: (roleName: string, idpId: string) => Promise<{
    message: () => string;
    pass: boolean;
}>;
