export declare const getFunctionCloudFormationTemplate: (functionName: string) => Promise<import("cloudform-types").Template>;
export declare const setFunctionCloudFormationTemplate: (functionName: string, cfnTemplate: object) => Promise<void>;
export declare function getNewCFNEnvVariables(oldCFNEnvVariables: any, currentDefaults: any, newCFNEnvVariables: any, newDefaults: any, apiResourceName?: any): any;
export declare function getNewCFNParameters(oldCFNParameters: any, currentDefaults: any, newCFNResourceParameters: any, newDefaults: any, apiResourceName?: any): any;
export declare function getIAMPolicies(resourceName: any, crudOptions: any): {
    policy: {};
    attributes: string[];
};
export declare function constructCFModelTableArnComponent(appsyncResourceName: any, resourceName: any, appsyncTableSuffix: any): Promise<any[]>;
export declare function constructCFModelTableNameComponent(appsyncResourceName: any, resourceName: any, appsyncTableSuffix: any): Promise<{
    'Fn::ImportValue': {
        'Fn::Sub': string;
    };
}>;
export declare function constructCloudWatchEventComponent(cfnFilePath: string, cfnContent: any): void;
//# sourceMappingURL=cloudformationHelpers.d.ts.map