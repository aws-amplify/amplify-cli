import * as cdk from 'aws-cdk-lib';
export interface AmplifyStackTemplate {
    addCfnParameter: (props: cdk.CfnParameterProps, logicalId: string) => void;
    addCfnOutput: (props: cdk.CfnOutputProps, logicalId: string) => void;
    addCfnMapping: (props: cdk.CfnMappingProps, logicalId: string) => void;
    addCfnCondition: (props: cdk.CfnConditionProps, logicalId: string) => void;
    getCfnParameter: (logicalId: string) => cdk.CfnParameter;
    getCfnOutput: (logicalId: string) => cdk.CfnOutput;
    getCfnMapping: (logicalId: string) => cdk.CfnMapping;
    getCfnCondition: (logicalId: string) => cdk.CfnCondition;
}
export interface Template {
    AWSTemplateFormatVersion?: string;
    Description?: string;
    Metadata?: Record<string, any>;
    Parameters?: Record<string, any>;
    Mappings?: {
        [key: string]: {
            [key: string]: Record<string, string | number | string[]>;
        };
    };
    Conditions?: Record<string, any>;
    Transform?: any;
    Resources?: Record<string, any>;
    Outputs?: Record<string, any>;
}
//# sourceMappingURL=amplify-base-cdk-types.d.ts.map