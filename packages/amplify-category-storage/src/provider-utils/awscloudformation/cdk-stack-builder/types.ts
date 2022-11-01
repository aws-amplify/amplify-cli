/* eslint-disable no-new */
import { AmplifyCDKL1 } from '@aws-amplify/cli-extensibility-helper';
import * as cdk from '@aws-cdk/core';
import { $TSAny, $TSObject } from 'amplify-cli-core';
import { DdbAttrType } from '../cfn-template-utils';

/**
 * AmplifyDDBResourceInputParameters
 */
export interface AmplifyDDBResourceInputParameters {
  tableName: string;
  partitionKeyName: string;
  partitionKeyType: DdbAttrType;
  sortKeyName?: string;
  sortKeyType?: DdbAttrType;
}

/**
 * AmplifyCfnParamType
 */
export type AmplifyCfnParamType = {
  params: Array<string>;
  paramType: string;
  default?: string;
};

/**
 * AmplifyS3ResourceInputParameters
 */
export interface AmplifyS3ResourceInputParameters {
  bucketName?: string;
  resourceName?: string;
  policyUUID?: string;
  authPolicyName?: string;
  unauthPolicyName?: string;
  authRoleName?: $TSObject;
  unauthRoleName?: $TSObject;
  s3PublicPolicy?: string;
  s3PrivatePolicy?: string; // default:"NONE"
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

/**
 * Base class for all storage resource stacks ( S3, DDB )
 */
export class AmplifyResourceCfnStack extends cdk.Stack implements AmplifyCDKL1 {
  _cfnParameterMap: Map<string, cdk.CfnParameter> = new Map();
  _cfnParameterValues: $TSObject;

  constructor(scope: cdk.Construct, id: string) {
    super(scope, id, undefined);
    this._cfnParameterValues = {};
  }

  /**
   * adds CloudFormation output to stack
   */
  addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void {
    // eslint-disable-next-line no-new
    new cdk.CfnOutput(this, logicalId, props);
  }

  /**
   * adds CloudFormation mapping to stack
   */
  addCfnMapping(props: cdk.CfnMappingProps, logicalId: string): void {
    // eslint-disable-next-line no-new
    new cdk.CfnMapping(this, logicalId, props);
  }

  /**
   * adds CloudFormation condition to stack
   */
  addCfnCondition(props: cdk.CfnConditionProps, logicalId: string): void {
    // eslint-disable-next-line no-new
    new cdk.CfnCondition(this, logicalId, props);
  }

  /**
   * adds CloudFormation resource to stack
   */
  addCfnResource(props: cdk.CfnResourceProps, logicalId: string): cdk.CfnResource {
    return new cdk.CfnResource(this, logicalId, props);
  }

  /**
   * add CloudFormation parameter to stack
   * @param props : cdk.CfnParameterProps
   * @param logicalId : logical identifier of the parameter
   * @param value ?: optional value to be stored in build/parameters.json
   */
  addCfnParameter(props: cdk.CfnParameterProps, logicalId: string, value?: $TSAny): void {
    if (this._cfnParameterMap.has(logicalId)) {
      throw new Error('logical Id already Exists');
    }
    if (value !== undefined) {
      this._cfnParameterValues[logicalId] = value;
    }
    this._cfnParameterMap.set(logicalId, new cdk.CfnParameter(this, logicalId, props));
  }

  /**
   * get CloudFormation parameter values
   */
  getCfnParameterValues(): $TSObject {
    return this._cfnParameterValues;
  }

  // Generate convert cdk stack to cloudformation
  public renderCloudFormationTemplate = (): string => this._toCloudFormation();
}

/**
 * Types used in Build/Params.json
 */
export enum AmplifyBuildParamsPermissions {
  ALLOW = 'ALLOW',
  DISALLOW = 'DISALLOW',
}
