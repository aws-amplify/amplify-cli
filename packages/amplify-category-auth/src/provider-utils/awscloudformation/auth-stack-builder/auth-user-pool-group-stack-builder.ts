import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import { CfnUserPoolGroup } from '@aws-cdk/aws-cognito';
import { AmplifyUserPoolGroupStackTemplate } from './types';
import { AmplifyUserPoolGroupStackOptions } from './user-pool-group-stack-transform';
import { AmplifyStackTemplate } from 'amplify-cli-core';
import * as fs from 'fs-extra';
import { roleMapLambdaFilePath } from '../constants';

const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';
const ROOT_CFN_DESCRIPTION = 'Root Stack for AWS Amplify CLI';

export type AmplifyAuthCognitoStackProps = {
  synthesizer: cdk.IStackSynthesizer;
};

export class AmplifyUserPoolGroupStack extends cdk.Stack implements AmplifyUserPoolGroupStackTemplate, AmplifyStackTemplate {
  _scope: cdk.Construct;
  private _cfnParameterMap: Map<string, cdk.CfnParameter> = new Map();
  private _cfnConditionMap: Map<string, cdk.CfnCondition> = new Map();
  userPoolGroup: Record<string, CfnUserPoolGroup>;
  userPoolGroupRole: Record<string, iam.CfnRole>;
  roleMapCustomResource?: cdk.CustomResource;
  roleMapLambdaFunction?: lambda.CfnFunction;
  lambdaExecutionRole?: iam.CfnRole;

  constructor(scope: cdk.Construct, id: string, props: AmplifyAuthCognitoStackProps) {
    super(scope, id, props);
    this._scope = scope;
    this.templateOptions.templateFormatVersion = CFN_TEMPLATE_FORMAT_VERSION;
    this.templateOptions.description = ROOT_CFN_DESCRIPTION;
    this.userPoolGroup = {};
    this.userPoolGroupRole = {};
  }
  getCfnOutput(logicalId: string): cdk.CfnOutput {
    throw new Error('Method not implemented.');
  }
  getCfnMapping(logicalId: string): cdk.CfnMapping {
    throw new Error('Method not implemented.');
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
      throw new Error(error);
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
      throw new Error(error);
    }
  }

  /**
   *
   * @param props
   * @param logicalId
   */
  addCfnResource(props: cdk.CfnResourceProps, logicalId: string): void {
    try {
      new cdk.CfnResource(this, logicalId, props);
    } catch (error) {
      throw new Error(error);
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
      throw new Error(error);
    }
  }

  /**
   *
   * @param props
   * @param logicalId
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

  getCfnParameter(logicalId: string): cdk.CfnParameter {
    if (this._cfnParameterMap.has(logicalId)) {
      return this._cfnParameterMap.get(logicalId)!;
    } else {
      throw new Error(`Cfn Parameter with LogicalId ${logicalId} doesnt exist`);
    }
  }

  getCfnCondition(logicalId: string): cdk.CfnCondition {
    if (this._cfnConditionMap.has(logicalId)) {
      return this._cfnConditionMap.get(logicalId)!;
    } else {
      throw new Error(`Cfn Parameter with LogicalId ${logicalId} doesnt exist`);
    }
  }

  // add Function for Custom Resource in Root stack
  /**
   *
   * @param _
   * @returns
   */
  public renderCloudFormationTemplate = (_: cdk.ISynthesisSession): string => {
    return JSON.stringify(this._toCloudFormation(), undefined, 2);
  };

  generateUserPoolGroupResources = async (props: AmplifyUserPoolGroupStackOptions) => {
    props.groups.forEach(group => {
      this.userPoolGroup[`${group.groupName}`] = new CfnUserPoolGroup(this, `${group.groupName}Group`, {
        userPoolId: this.getCfnParameter(getCfnParamslogicalId(props.cognitoResourceName, 'UserPoolId'))!.valueAsString,
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
            this.getCfnParameter(getCfnParamslogicalId(props.cognitoResourceName, 'UserPoolId'))!.valueAsString,
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
          this.userPoolGroupRole[`${group.groupName}`].addPropertyOverride('Policies', JSON.stringify(group.customPolicies, null, 4));
        }
      }
    });

    if (props.identityPoolName) {
      this.lambdaExecutionRole = new iam.CfnRole(this, 'LambdaExecutionRole', {
        roleName: cdk.Fn.conditionIf(
          'ShouldNotCreateEnvResources',
          props.cognitoResourceName,
          cdk.Fn.join('', [`${props.cognitoResourceName}-ExecutionRole`, cdk.Fn.ref('env')]).toString(),
        ).toString(),
        assumeRolePolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: ['lambda.amazonaws.com'],
              },
              Action: ['sts:AssumeRole'],
            },
          ],
        },
        policies: [
          {
            policyName: 'UserGroupLogPolicy',
            policyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
                  Resource: 'arn:aws:logs:*:*:*',
                },
              ],
            },
          },
          {
            policyName: 'UserGroupExecutionPolicy',
            policyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'cognito-identity:SetIdentityPoolRoles',
                    'cognito-identity:ListIdentityPools',
                    'cognito-identity:describeIdentityPool',
                  ],
                  Resource: '*',
                },
              ],
            },
          },
          {
            policyName: 'UserGroupPassRolePolicy',
            policyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['iam:PassRole'],
                  Resource: [
                    {
                      Ref: 'AuthRoleArn',
                    },
                    {
                      Ref: 'UnauthRoleArn',
                    },
                  ],
                },
              ],
            },
          },
        ],
      });
      // lambda function for RoleMap Custom Resource
      this.roleMapLambdaFunction = new lambda.CfnFunction(this, 'RoleMapLambdaFunction', {
        code: {
          zipFile: fs.readFileSync(roleMapLambdaFilePath, 'utf-8'),
        },
        handler: 'index.handler',
        runtime: 'nodejs12.x',
        timeout: 300,
        role: cdk.Fn.getAtt('LambdaExecutionRole', 'Arn').toString(),
      });

      // adding custom trigger roleMap function
      this.roleMapCustomResource = new cdk.CustomResource(this, 'RoleMapFunctionInput', {
        serviceToken: this.roleMapLambdaFunction.attrArn,
        resourceType: 'Custom::LambdaCallout',
        properties: {
          AuthRoleArn: cdk.Fn.ref('AuthRoleArn'),
          UnauthRoleArn: cdk.Fn.ref('UnauthRoleArn'),
          identityPoolId: cdk.Fn.ref(getCfnParamslogicalId(props.cognitoResourceName, 'IdentityPoolId')),
          userPoolId: cdk.Fn.ref(getCfnParamslogicalId(props.cognitoResourceName, 'UserPoolId')),
          appClientIDWeb: cdk.Fn.ref(getCfnParamslogicalId(props.cognitoResourceName, 'AppClientIDWeb')),
          appClientID: cdk.Fn.ref(getCfnParamslogicalId(props.cognitoResourceName, 'AppClientID')),
          region: cdk.Fn.ref('AWS::Region'),
          env: cdk.Fn.ref('env'),
        },
      });
    }
  };
}

export const getCfnParamslogicalId = (cognitoResourceName: string, cfnParamName: string): string => {
  return `auth${cognitoResourceName}${cfnParamName}`;
};

/**
 * additional class to merge CFN parameters and CFN outputs as cdk doesnt allow same logical ID of constructs in same stack
 */
export class AmplifyUserPoolGroupStackOutputs extends cdk.Stack implements AmplifyStackTemplate {
  constructor(scope: cdk.Construct, id: string, props: AmplifyAuthCognitoStackProps) {
    super(scope, id, props);
  }
  getCfnParameter(logicalId: string): cdk.CfnParameter {
    throw new Error('Method not implemented.');
  }
  getCfnOutput(logicalId: string): cdk.CfnOutput {
    throw new Error('Method not implemented.');
  }
  getCfnMapping(logicalId: string): cdk.CfnMapping {
    throw new Error('Method not implemented.');
  }
  getCfnCondition(logicalId: string): cdk.CfnCondition {
    throw new Error('Method not implemented.');
  }

  addCfnParameter(props: cdk.CfnParameterProps, logicalId: string): void {
    throw new Error('Method not implemented.');
  }
  addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void {
    try {
      new cdk.CfnOutput(this, logicalId, props);
    } catch (error) {
      throw new Error(error);
    }
  }
  addCfnMapping(props: cdk.CfnMappingProps, logicalId: string): void {
    throw new Error('Method not implemented.');
  }
  addCfnCondition(props: cdk.CfnConditionProps, logicalId: string): void {
    throw new Error('Method not implemented.');
  }
  addCfnResource(props: cdk.CfnResourceProps, logicalId: string): void {
    throw new Error('Method not implemented.');
  }

  public renderCloudFormationTemplate = (_: cdk.ISynthesisSession): string => {
    return JSON.stringify((this as any)._toCloudFormation(), undefined, 2);
  };
}
