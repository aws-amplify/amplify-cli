import { AmplifyCDKL1 } from '@aws-amplify/cli-extensibility-helper';
import * as cdk from 'aws-cdk-lib';
import { $TSObject } from 'amplify-cli-core';
import { Construct } from 'constructs';
import { DdbAttrType } from '../cfn-template-utils';
export interface AmplifyDDBResourceInputParameters {
    tableName: string;
    partitionKeyName: string;
    partitionKeyType: DdbAttrType;
    sortKeyName?: string;
    sortKeyType?: DdbAttrType;
}
export type AmplifyCfnParamType = {
    params: Array<string>;
    paramType: string;
    default?: string;
};
export interface AmplifyS3ResourceInputParameters {
    bucketName?: string;
    resourceName?: string;
    policyUUID?: string;
    authPolicyName?: string;
    unauthPolicyName?: string;
    authRoleName?: $TSObject;
    unauthRoleName?: $TSObject;
    s3PublicPolicy?: string;
    s3PrivatePolicy?: string;
    s3ProtectedPolicy?: string;
    s3UploadsPolicy?: string;
    s3ReadPolicy?: string;
    s3PermissionsAuthenticatedPublic?: string;
    s3PermissionsAuthenticatedProtected?: string;
    s3PermissionsAuthenticatedPrivate?: string;
    s3PermissionsAuthenticatedUploads?: string;
    s3PermissionsGuestPublic?: string;
    s3PermissionsGuestUploads?: string;
    AuthenticatedAllowList?: string;
    GuestAllowList?: string;
    selectedGuestPermissions?: Array<string>;
    selectedAuthenticatedPermissions?: Array<string>;
    triggerFunction?: string;
    adminTriggerFunction?: string;
}
export declare class AmplifyResourceCfnStack extends cdk.Stack implements AmplifyCDKL1 {
    _cfnParameterMap: Map<string, cdk.CfnParameter>;
    constructor(scope: Construct, id: string);
    addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void;
    addCfnMapping(props: cdk.CfnMappingProps, logicalId: string): void;
    addCfnCondition(props: cdk.CfnConditionProps, logicalId: string): void;
    addCfnResource(props: cdk.CfnResourceProps, logicalId: string): cdk.CfnResource;
    addCfnParameter(props: cdk.CfnParameterProps, logicalId: string): void;
    renderCloudFormationTemplate: () => string;
}
export declare enum AmplifyBuildParamsPermissions {
    ALLOW = "ALLOW",
    DISALLOW = "DISALLOW"
}
//# sourceMappingURL=types.d.ts.map