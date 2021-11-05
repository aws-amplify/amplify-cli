import { AmplifyCDKL1 } from '@aws-amplify/cli-extensibility-helper';
import * as cdk from '@aws-cdk/core';
import { $TSObject } from 'amplify-cli-core';

export interface AmplifyDDBResourceInputParameters {
  tableName: string;
  partitionKeyName: string;
  partitionKeyType: string;
  sortKeyName?: string;
  sortKeyType?: string;
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
  s3PrivatePolicy?: string; //default:"NONE"
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

//Base class for all storage resource stacks ( S3, DDB )
export class AmplifyResourceCfnStack extends cdk.Stack implements AmplifyCDKL1 {
  _cfnParameterMap: Map<string, cdk.CfnParameter> = new Map();
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id, undefined);
  }

  /**
   *
   * @param props :cdk.CfnOutputProps
   * @param logicalId: : lodicalId of the Resource
   */
  addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void {
    try {
      new cdk.CfnOutput(this, logicalId, props);
    } catch (error) {
      throw error;
    }
  }

  /**
   *
   * @param props
   * @param logicalId
   */
  addCfnMapping(props: cdk.CfnMappingProps, logicalId: string): void {
    try {
      new cdk.CfnMapping(this, logicalId, props);
    } catch (error) {
      throw error;
    }
  }

  /**
   *
   * @param props
   * @param logicalId
   */
  addCfnCondition(props: cdk.CfnConditionProps, logicalId: string): void {
    try {
      new cdk.CfnCondition(this, logicalId, props);
    } catch (error) {
      throw error;
    }
  }
  /**
   *
   * @param props
   * @param logicalId
   */
  addCfnResource(props: cdk.CfnResourceProps, logicalId: string): cdk.CfnResource {
    try {
      return new cdk.CfnResource(this, logicalId, props);
    } catch (error) {
      throw error;
    }
  }
  /**
   *
   * @param props
   * @param logicalId
   */
  addCfnParameter(props: cdk.CfnParameterProps, logicalId: string): void {
    try {
      if (this._cfnParameterMap.has(logicalId)) {
        throw new Error('logical Id already Exists');
      }
      this._cfnParameterMap.set(logicalId, new cdk.CfnParameter(this, logicalId, props));
    } catch (error) {
      throw error;
    }
  }

  //Generate convert cdk stack to cloudformation
  public renderCloudFormationTemplate = (): string => {
    return this._toCloudFormation();
  };
}

//Types used in Build/Params.json
export enum AmplifyBuildParamsPermissions {
  ALLOW = 'ALLOW',
  DISALLOW = 'DISALLOW',
}
