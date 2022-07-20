/* eslint-disable max-classes-per-file */
import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import { CfnUserPoolGroup } from '@aws-cdk/aws-cognito';
import { AmplifyUserPoolGroupStackTemplate } from '@aws-amplify/cli-extensibility-helper';
import * as fs from 'fs-extra';
// eslint-disable-next-line import/no-cycle
import { AmplifyUserPoolGroupStackOptions } from './user-pool-group-stack-transform';
import { roleMapLambdaFilePath } from '../constants';

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
  public renderCloudFormationTemplate = (__: cdk.ISynthesisSession): string => JSON.stringify(this._toCloudFormation(), undefined, 2);

  generateUserPoolGroupResources = async (props: AmplifyUserPoolGroupStackOptions): Promise<void> => {
    props.groups.forEach(group => {
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

    if (props.identityPoolName) {
      this.lambdaExecutionRole = new iam.CfnRole(this, 'LambdaExecutionRole', {
        roleName: cdk.Fn.conditionIf(
          'ShouldNotCreateEnvResources',
          props.cognitoResourceName,
          cdk.Fn.join('', [`${props.cognitoResourceName}-ExecutionRole-`, cdk.Fn.ref('env')]).toString(),
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
      this.roleMapLambdaFunction = new lambda.CfnFunction(this, 'RoleMapFunction', {
        code: {
          zipFile: fs.readFileSync(roleMapLambdaFilePath, 'utf-8'),
        },
        handler: 'index.handler',
        runtime: 'nodejs14.x',
        timeout: 300,
        role: cdk.Fn.getAtt('LambdaExecutionRole', 'Arn').toString(),
      });

      // eslint-disable-next-line no-new
      new iam.CfnPolicy(this, 'LambdaCloudWatchPolicy', {
        policyName: 'UserGroupLogPolicy',
        roles: [this.lambdaExecutionRole.ref],
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
              Resource: {
                'Fn::Sub': [
                  'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${lambdaName}:log-stream:*',
                  {
                    lambdaName: this.roleMapLambdaFunction.ref,
                  },
                ],
              },
            },
          ],
        },
      });

      // adding custom trigger roleMap function
      this.roleMapCustomResource = new cdk.CustomResource(this, 'RoleMapFunctionInput', {
        serviceToken: this.roleMapLambdaFunction.attrArn,
        resourceType: 'Custom::LambdaCallout',
        properties: {
          AuthRoleArn: cdk.Fn.ref('AuthRoleArn'),
          UnauthRoleArn: cdk.Fn.ref('UnauthRoleArn'),
          identityPoolId: cdk.Fn.ref(getCfnParamsLogicalId(props.cognitoResourceName, 'IdentityPoolId')),
          userPoolId: cdk.Fn.ref(getCfnParamsLogicalId(props.cognitoResourceName, 'UserPoolId')),
          appClientIDWeb: cdk.Fn.ref(getCfnParamsLogicalId(props.cognitoResourceName, 'AppClientIDWeb')),
          appClientID: cdk.Fn.ref(getCfnParamsLogicalId(props.cognitoResourceName, 'AppClientID')),
          region: cdk.Fn.ref('AWS::Region'),
          env: cdk.Fn.ref('env'),
        },
      });
      this.roleMapCustomResource.node.addDependency(this.roleMapLambdaFunction);
    }
  };
}

const getCfnParamsLogicalId = (cognitoResourceName: string, cfnParamName: string): string => `auth${cognitoResourceName}${cfnParamName}`;

/**
 * additional class to merge CFN parameters and CFN outputs as cdk doesn't allow same logical ID of constructs in same stack
 */
export class AmplifyUserPoolGroupStackOutputs extends cdk.Stack {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(scope: cdk.Construct, id: string, props: AmplifyAuthCognitoStackProps) {
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

  public renderCloudFormationTemplate =
  (__: cdk.ISynthesisSession): string => JSON.stringify(this._toCloudFormation(), undefined, 2);
}
