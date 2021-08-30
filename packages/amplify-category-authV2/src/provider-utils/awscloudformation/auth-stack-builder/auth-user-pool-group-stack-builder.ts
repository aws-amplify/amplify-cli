import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import { CfnUserPoolGroup } from '@aws-cdk/aws-cognito';
import { AmplifyUserPoolGroupStackTemplate } from './types';
import { AmplifyUserPoolGroupStackOptions } from './user-pool-group-stack-transform';

const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';
const ROOT_CFN_DESCRIPTION = 'Root Stack for AWS Amplify CLI';

export type AmplifyAuthCognitoStackProps = {
  synthesizer: cdk.IStackSynthesizer;
};

export class AmplifyUserPoolGroupStack extends cdk.Stack implements AmplifyUserPoolGroupStackTemplate {
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

  getCfnParameter(logicalId: string): cdk.CfnParameter | undefined {
    if (this._cfnParameterMap.has(logicalId)) {
      return this._cfnParameterMap.get(logicalId);
    } else {
      throw new Error(`Cfn Parameter with LogicalId ${logicalId} doesnt exist`);
    }
  }

  getCfnCondition(logicalId: string): cdk.CfnCondition | undefined {
    if (this._cfnConditionMap.has(logicalId)) {
      return this._cfnConditionMap.get(logicalId);
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
      if (props.identityPoolName) {
        this.userPoolGroup[`${group.groupName}`].addPropertyOverride('RoleArn', cdk.Fn.getAtt(`${group.groupName}GroupRole`, 'Arn'));
        this.userPoolGroupRole[`${group.groupName}`] = new iam.CfnRole(this, `${group.groupName}GroupRole`, {
          roleName: cdk.Fn.join('', [
            this.getCfnParameter(getCfnParamslogicalId(props.cognitoResourceName, 'UserPoolId'))!.valueAsString,
            `${group.groupName}GroupRole`,
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
                      Ref: `auth${props.cognitoResourceName}IdentityPoolId}`,
                    },
                  },
                  ForAnyValueStringLike: { 'cognito-identity.amazonaws.com:amr': 'authenticated' },
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
          zipFile: cdk.Fn.join('\n', [
            "const response = require('cfn-response');",
            "const AWS = require('aws-sdk');",
            'exports.handler = (event, context) => {',
            "if (event.RequestType == 'Delete') {",
            "    response.send(event, context, response.SUCCESS, {message: 'Request type delete'})",
            '};',
            "if (event.RequestType == 'Create' || event.RequestType == 'Update') {",
            '    let { identityPoolId, appClientID, appClientIDWeb, userPoolId, region }  = event.ResourceProperties;',
            '    try {',
            '       const cognitoidentity = new AWS.CognitoIdentity();',
            '       let params = {',
            '           IdentityPoolId: identityPoolId,',
            '           Roles: {',
            "               'authenticated': event.ResourceProperties.AuthRoleArn,",
            "               'unauthenticated': event.ResourceProperties.UnauthRoleArn,",
            '           },',
            '           RoleMappings: {}',
            '       };',
            '       if (appClientIDWeb) {',
            '           params.RoleMappings[`cognito-idp.${region}.amazonaws.com/${userPoolId}:${appClientIDWeb}`] = {',
            "               Type: 'Token',",
            "               AmbiguousRoleResolution: 'AuthenticatedRole',",
            '           }',
            '       }',
            '       if (appClientID) {',
            '           params.RoleMappings[`cognito-idp.${region}.amazonaws.com/${userPoolId}:${appClientID}`] = {',
            "               Type: 'Token',",
            "               AmbiguousRoleResolution: 'AuthenticatedRole',",
            '           }',
            '       }',
            '    cognitoidentity.setIdentityPoolRoles(params).promise();',
            "    response.send(event, context, response.SUCCESS, {message: 'Successfully updated identity pool.'})",
            '    } catch(err) {',
            "        response.send(event, context, response.FAILED, {message: 'Error updating identity pool'});",
            '    }',
            '   };',
            '};',
          ]),
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
          appClientIDWeb: cdk.Fn.ref(getCfnParamslogicalId(props.cognitoResourceName, 'appClientIDWeb')),
          appClientID: cdk.Fn.ref(getCfnParamslogicalId(props.cognitoResourceName, 'appClientID')),
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
