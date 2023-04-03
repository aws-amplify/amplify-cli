export function getAllDefaults(project: any): {
    botName: string;
    authRoleName: {
        Ref: string;
    };
    unauthRoleName: {
        Ref: string;
    };
    authRoleArn: {
        'Fn::GetAtt': string[];
    };
    shortId: string;
    resourceName: string;
    sessionTimeout: number;
    lexPolicyName: string;
    lambdaPolicyName: string;
    authPolicyName: string;
    unauthPolicyName: string;
    roleName: string;
    functionName: string;
    cloudWatchPolicyName: string;
};
//# sourceMappingURL=lex-defaults.d.ts.map