export declare const getSsmSdkParametersDeleteParameters: (keys: Array<string>) => SsmDeleteParameters;
export declare const getSsmSdkParametersGetParametersByPath: (appId: string, envName: string, nextToken?: string) => SsmGetParametersByPathArgument;
type SsmDeleteParameters = {
    Names: Array<string>;
};
type SsmGetParametersByPathArgument = {
    Path: string;
    NextToken?: string;
};
export {};
//# sourceMappingURL=get-ssm-sdk-parameters.d.ts.map