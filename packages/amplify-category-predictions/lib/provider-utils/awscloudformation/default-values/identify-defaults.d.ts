export default function getAllDefaults(project: any): {
    resourceName: string;
    region: any;
    identifyPolicyName: string;
    service: string;
    authRoleName: {
        Ref: string;
    };
    unauthRoleName: {
        Ref: string;
    };
    adminAuthProtected: string;
    adminGuestProtected: string;
};
//# sourceMappingURL=identify-defaults.d.ts.map