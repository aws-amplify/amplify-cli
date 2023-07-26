/* eslint-disable max-classes-per-file */
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { CfnUserPoolGroup } from 'aws-cdk-lib/aws-cognito';
import { AmplifyUserPoolGroupStackTemplate } from '@aws-amplify/cli-extensibility-helper';
import { JSONUtilities } from '@aws-amplify/amplify-cli-core';
import { Construct } from 'constructs';
// eslint-disable-next-line import/no-cycle
import { AmplifyUserPoolGroupStackOptions } from './user-pool-group-stack-transform';

const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';
const ROOT_CFN_DESCRIPTION = 'Root Stack for AWS Amplify CLI';

/**
 * Input parameters to the AuthCognitoStack constructor
 */
export type AmplifyAuthCognitoStackProps = {
  synthesizer: cdk.IStackSynthesizer;
};

/**
 * CDK stack that contains the UserPool Group resources
 */
export class AmplifyUserPoolGroupStack extends cdk.Stack implements AmplifyUserPoolGroupStackTemplate {
  _scope: Construct;
  private _cfnParameterMap: Map<string, cdk.CfnParameter> = new Map();
  private _cfnConditionMap: Map<string, cdk.CfnCondition> = new Map();
  userPoolGroup: Record<string, CfnUserPoolGroup>;
  userPoolGroupRole: Record<string, iam.CfnRole>;

  constructor(scope: Construct, id: string, props: AmplifyAuthCognitoStackProps) {
    super(scope, id, props);
    this._scope = scope;
    this.templateOptions.templateFormatVersion = CFN_TEMPLATE_FORMAT_VERSION;
    this.templateOptions.description = ROOT_CFN_DESCRIPTION;
    this.userPoolGroup = {};
    this.userPoolGroupRole = {};
  }

  /**
   * Not implemented
   */
  // eslint-disable-next-line class-methods-use-this
  getCfnOutput(/* logicalId: string */): cdk.CfnOutput {
    throw new Error('Method not implemented.');
  }

  /**
   * Not implemented
   */
  // eslint-disable-next-line class-methods-use-this
  getCfnMapping(/* logicalId: string */): cdk.CfnMapping {
    throw new Error('Method not implemented.');
  }

  /**
   * Add an output to the template
   */
  addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void {
    try {
      // eslint-disable-next-line no-new
      new cdk.CfnOutput(this, logicalId, props);
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Add a mapping to the template
   */
  addCfnMapping(props: cdk.CfnMappingProps, logicalId: string): void {
    try {
      // eslint-disable-next-line no-new
      new cdk.CfnMapping(this, logicalId, props);
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Add a resource to the template
   */
  addCfnResource(props: cdk.CfnResourceProps, logicalId: string): void {
    try {
      // eslint-disable-next-line no-new
      new cdk.CfnResource(this, logicalId, props);
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Add a template parameter
   */
  addCfnParameter(props: cdk.CfnParameterProps, logicalId: string): void {
    try {
      if (this._cfnParameterMap.has(logicalId)) {
        throw new Error('logical Id already Exists');
      }
      this._cfnParameterMap.set(logicalId, new cdk.CfnParameter(this, logicalId, props));
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Add a template condition
   */
  addCfnCondition(props: cdk.CfnConditionProps, logicalId: string): void {
    try {
      if (this._cfnConditionMap.has(logicalId)) {
        throw new Error('logical Id already Exists');
      }
      this._cfnConditionMap.set(logicalId, new cdk.CfnCondition(this, logicalId, props));
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Get the parameter with the given logical id
   */
  getCfnParameter(logicalId: string): cdk.CfnParameter {
    if (this._cfnParameterMap.has(logicalId)) {
      return this._cfnParameterMap.get(logicalId)!;
    }
    throw new Error(`CloudFormation Parameter with LogicalId ${logicalId} doesn't exist`);
  }

  /**
   * Get the condition with the given logical id
   */
  getCfnCondition(logicalId: string): cdk.CfnCondition {
    if (this._cfnConditionMap.has(logicalId)) {
      return this._cfnConditionMap.get(logicalId)!;
    }
    throw new Error(`CloudFormation Parameter with LogicalId ${logicalId} doesn't exist`);
  }

  // add Function for Custom Resource in Root stack
  public renderCloudFormationTemplate = (): string => JSON.stringify(this._toCloudFormation(), undefined, 2);

  generateUserPoolGroupResources = async (props: AmplifyUserPoolGroupStackOptions): Promise<void> => {
    props.groups.forEach((group) => {
      this.userPoolGroup[`${group.groupName}`] = new CfnUserPoolGroup(this, `${group.groupName}Group`, {
        userPoolId: this.getCfnParameter(getCfnParamsLogicalId(props.cognitoResourceName, 'UserPoolId'))!.valueAsString,
        groupName: group.groupName,
        precedence: group.precedence,
      });
      this.userPoolGroup[`${group.groupName}`].description = 'override success';
      if (props.identityPoolName) {
        this.userPoolGroup[`${group.groupName}`].addPropertyOverride(
          'RoleArn',
          cdk.Fn.getAtt(`${group.groupName}GroupRole`, 'Arn').toString(),
        );
        this.userPoolGroupRole[`${group.groupName}`] = new iam.CfnRole(this, `${group.groupName}GroupRole`, {
          roleName: cdk.Fn.join('', [
            this.getCfnParameter(getCfnParamsLogicalId(props.cognitoResourceName, 'UserPoolId'))!.valueAsString,
            `-${group.groupName}GroupRole`,
          ]),
          assumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Sid: '',
                Effect: 'Allow',
                Principal: {
                  Federated: 'cognito-identity.amazonaws.com',
                },
                Action: 'sts:AssumeRoleWithWebIdentity',
                Condition: {
                  StringEquals: {
                    'cognito-identity.amazonaws.com:aud': {
                      Ref: `auth${props.cognitoResourceName}IdentityPoolId`,
                    },
                  },
                  'ForAnyValue:StringLike': { 'cognito-identity.amazonaws.com:amr': 'authenticated' },
                },
              },
            ],
          },
        });
        if (group.customPolicies && group.customPolicies.length > 0) {
          this.userPoolGroupRole[`${group.groupName}`].addPropertyOverride('Policies', group.customPolicies);
        }
      }
    });
  };
}

const getCfnParamsLogicalId = (cognitoResourceName: string, cfnParamName: string): string => `auth${cognitoResourceName}${cfnParamName}`;

/**
 * additional class to merge CFN parameters and CFN outputs as cdk doesn't allow same logical ID of constructs in same stack
 */
export class AmplifyUserPoolGroupStackOutputs extends cdk.Stack {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(scope: Construct, id: string, props: AmplifyAuthCognitoStackProps) {
    super(scope, id, props);
  }

  /**
   * Not implemented
   */
  // eslint-disable-next-line class-methods-use-this
  getCfnParameter(/* logicalId: string */): cdk.CfnParameter {
    throw new Error('Method not implemented.');
  }

  /**
   * Not implemented
   */
  // eslint-disable-next-line class-methods-use-this
  getCfnOutput(/* logicalId: string */): cdk.CfnOutput {
    throw new Error('Method not implemented.');
  }

  /**
   * Not implemented
   */
  // eslint-disable-next-line class-methods-use-this
  getCfnMapping(/* logicalId: string */): cdk.CfnMapping {
    throw new Error('Method not implemented.');
  }

  /**
   * Not implemented
   */
  // eslint-disable-next-line class-methods-use-this
  getCfnCondition(/* logicalId: string */): cdk.CfnCondition {
    throw new Error('Method not implemented.');
  }

  /**
   * Not implemented
   */
  // eslint-disable-next-line class-methods-use-this
  addCfnParameter(/* props: cdk.CfnParameterProps, logicalId: string */): void {
    throw new Error('Method not implemented.');
  }

  /**
   * Add an output to the stack
   */
  addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void {
    try {
      // eslint-disable-next-line no-new
      new cdk.CfnOutput(this, logicalId, props);
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Not implemented
   */
  // eslint-disable-next-line class-methods-use-this
  addCfnMapping(/* props: cdk.CfnMappingProps, logicalId: string */): void {
    throw new Error('Method not implemented.');
  }

  /**
   * Not implemented
   */
  // eslint-disable-next-line class-methods-use-this
  addCfnCondition(/* props: cdk.CfnConditionProps, logicalId: string */): void {
    throw new Error('Method not implemented.');
  }

  /**
   * Not implemented
   */
  // eslint-disable-next-line class-methods-use-this
  addCfnResource(/* props: cdk.CfnResourceProps, logicalId: string */): void {
    throw new Error('Method not implemented.');
  }

  public renderCloudFormationTemplate = (): string => JSONUtilities.stringify(this._toCloudFormation())!;
}
