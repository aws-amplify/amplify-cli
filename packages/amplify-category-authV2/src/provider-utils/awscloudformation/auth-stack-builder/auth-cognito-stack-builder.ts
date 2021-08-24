import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';
import * as cognito from '@aws-cdk/aws-cognito';
import * as lambda from '@aws-cdk/aws-lambda';
import { AmplifyAuthCognitoStackTemplate } from './types';
import { CfnUserPool, CfnUserPoolClient, CfnIdentityPool, CfnIdentityPoolRoleAttachment } from '@aws-cdk/aws-cognito';
import { AuthStackOptions } from '../service-walkthrough-types';
import _ from 'lodash';

const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';
const ROOT_CFN_DESCRIPTION = 'Root Stack for AWS Amplify CLI';

const LambdaTriggersKeys = [
  'CreateAuthChallenge',
  'CustomMessage',
  'DefineAuthChallenge',
  'PostAuthentication',
  'PostConfirmation',
  'PreAuthentication',
  'PreSignUp',
  'PreTokenGeneration',
  'VerifyAuthChallengeResponse',
];

const authProvidersList: Record<string, string> = {
  'graph.facebook.com': 'facebookAppId',
  'accounts.google.com': 'googleClientId',
  'www.amazon.com': 'amazonAppId',
  'appleid.apple.com': 'appleId',
};

export type AmplifyAuthCognitoStackProps = {
  synthesizer: cdk.IStackSynthesizer;
};

export class AmplifyAuthCognitoStack extends cdk.Stack implements AmplifyAuthCognitoStackTemplate {
  _scope: cdk.Construct;
  private _cfnParameterMap: Map<string, cdk.CfnParameter> = new Map();
  private _cfnConditionMap: Map<string, cdk.CfnCondition> = new Map();
  customMessageConfirmationBucket?: s3.CfnBucket;
  snsRole: iam.CfnRole | undefined;
  userPool: CfnUserPool | undefined;
  userPoolClientWeb: CfnUserPoolClient | undefined;
  userPoolClient: CfnUserPoolClient | undefined;
  identityPool: CfnIdentityPool | undefined;
  identityPoolRoleMap: CfnIdentityPoolRoleAttachment | undefined;
  lambdaConfigPermissions?: Record<string, lambda.CfnPermission>;
  lambdaTriggerPermissions?: Record<string, iam.CfnPolicy>;
  // customresources userPoolClient
  userPoolClientLambda?: lambda.CfnFunction;
  userPoolClientRole?: iam.CfnRole;
  userPoolClientLambdaPolicy?: iam.CfnPolicy;
  userPoolClientLogPolicy?: iam.CfnPolicy;
  userPoolClientInputs?: cdk.CfnCustomResource;
  // customresources HostedUI
  hostedUICustomResource?: lambda.CfnFunction;
  hostedUICustomResourcePolicy?: iam.CfnPolicy;
  hostedUICustomResourceLogPolicy?: iam.CfnPolicy;
  hostedUICustomResourceInputs?: cdk.CfnCustomResource;
  // custom resource HostedUI Provider
  hostedUIProvidersCustomResource?: lambda.CfnFunction;
  HostedUIProvidersCustomResourcePolicy?: iam.CfnPolicy;
  HostedUIProvidersCustomResourceLogPolicy?: iam.CfnPolicy;
  HostedUIProvidersCustomResourceInputs?: cdk.CfnCustomResource;
  // custom resource OAUTH Provider
  OAuthCustomResource?: lambda.CfnFunction;
  OAuthCustomResourcePolicy?: iam.CfnPolicy;
  OAuthCustomResourceLogPolicy?: iam.CfnPolicy;
  OAuthCustomResourceInputs?: cdk.CfnCustomResource;
  //custom resource MFA
  MFALambda?: lambda.CfnFunction;
  MFALogPolicy?: iam.CfnPolicy;
  MFALambdaPolicy?: iam.CfnPolicy;
  MFALambdaInputs?: cdk.CfnCustomResource;
  MFALambdaRole?: iam.CfnRole;

  //custom resource identity pool - OPenId Lambda Role
  OpenIdLambda?: lambda.CfnFunction;
  OpenIdLogPolicy?: iam.CfnPolicy;
  OpenIdLambdaIAMPolicy?: iam.CfnPolicy;
  OpenIdLambdaInputs?: cdk.CfnCustomResource;
  OpenIdLambdaRole?: iam.CfnRole;

  constructor(scope: cdk.Construct, id: string, props: AmplifyAuthCognitoStackProps) {
    super(scope, id, props);
    this._scope = scope;
    this.templateOptions.templateFormatVersion = CFN_TEMPLATE_FORMAT_VERSION;
    this.templateOptions.description = ROOT_CFN_DESCRIPTION;
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

  getCfnParameter(logicalId: string): cdk.CfnParameter | undefined {
    if (this._cfnParameterMap.has(logicalId)) {
      return this._cfnParameterMap.get(logicalId);
    } else {
      throw new Error(`Cfn Parameter with LogicalId ${logicalId} doesnt exist`);
    }
  }

  generateCognitoStackResources = async (props: AuthStackOptions) => {
    if (props.verificationBucketName) {
      this.customMessageConfirmationBucket = new s3.CfnBucket(this, 'CustomMessageConfirmationBucket', {
        bucketName: cdk.Fn.conditionIf(
          'ShouldNotCreateEnvResources',
          cdk.Fn.ref('verificationBucketName'),
          cdk.Fn.join('-', [cdk.Fn.ref('verificationBucketName'), cdk.Fn.ref('env')]),
        ).toString(),
        accessControl: s3.BucketAccessControl.PRIVATE,
        corsConfiguration: {
          corsRules: [
            {
              allowedHeaders: ['Authorization', 'Content-length'],
              allowedMethods: ['GET'],
              allowedOrigins: ['*'],
              maxAge: 3000,
            },
          ],
        },
      });
      this.customMessageConfirmationBucket.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);
    }

    if (props.authSelections !== 'identityPoolOnly') {
      this.snsRole = new iam.CfnRole(this, 'SNSRole', {
        roleName: cdk.Fn.conditionIf(
          'ShouldNotCreateEnvResources',
          `${props.resourceNameTruncated}_sns-role`,
          cdk.Fn.join('', [
            'sns',
            `${props.sharedId}`,
            cdk.Fn.select(3, cdk.Fn.split('-', cdk.Fn.ref('AWS::StackName'))),
            '-',
            cdk.Fn.ref('env'),
          ]),
        ).toString(),
        assumeRolePolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Sid: '',
              Effect: 'Allow',
              Principal: {
                Service: 'cognito-idp.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
              Condition: {
                StringEquals: {
                  'sts:ExternalId': `${props.resourceNameTruncated}_role_external_id`,
                },
              },
            },
          ],
        },
        policies: [
          {
            policyName: `${props.resourceNameTruncated}-sns-policy`,
            policyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: 'sns:Publish',
                  Resource: '*',
                },
              ],
            },
          },
        ],
      });

      this.userPool = new cognito.CfnUserPool(this, 'UserPool', {
        userPoolName: cdk.Fn.conditionIf(
          'ShouldNotCreateEnvResources',
          cdk.Fn.ref('userpoolName'),
          cdk.Fn.join('', [cdk.Fn.ref('userPoolName'), '-', cdk.Fn.ref('env')]),
        ).toString(),
      });
      if (props.requiredAttributes && props.requiredAttributes.length > 0) {
        if (props.usernameAttributes !== undefined) {
          this.userPool.usernameAttributes = [`${props.usernameCaseSensitive}`];
        }
        props.requiredAttributes.forEach(attr => {
          this.userPool!.schema = [
            {
              name: attr,
              required: true,
              mutable: true,
            },
          ];
        });
      }
      if (!props.breakCircularDependency && !_.isEmpty(props.triggers) && !_.isEmpty(props.dependsOn)) {
        let lambdaConfigProp: { [x: string]: string };
        props.dependsOn?.forEach(trigger => {
          LambdaTriggersKeys.forEach(key => {
            if (trigger.resourceName.includes(key)) {
              lambdaConfigProp[key] = cdk.Fn.ref(`${props.resourceName}${key}Arn`);
            }
          });
        });
        this.userPool.lambdaConfig = cdk.Lazy.anyValue({
          produce: () => {
            return lambdaConfigProp;
          },
        });
      }

      if (props.autoVerifiedAttributes && props.autoVerifiedAttributes.length > 0) {
        this.userPool.autoVerifiedAttributes = [cdk.Fn.ref('autoVerifiedattributes')];
      }

      if (props.autoVerifiedAttributes.includes('email')) {
        this.userPool.emailVerificationMessage = cdk.Fn.ref('emailVerificationMessage');
        this.userPool.emailVerificationSubject = cdk.Fn.ref('emailVerificationSubject');
      }

      this.userPool.policies = {
        passwordPolicy: {
          minimumLength: this._cfnParameterMap.get('passwordPolicyMinLength')?.valueAsNumber,
          requireLowercase: props.passwordPolicyCharacters!.includes('Requires Lowercase'),
          requireNumbers: props.passwordPolicyCharacters!.includes('Requires Numbers'),
          requireSymbols: props.passwordPolicyCharacters!.includes('Requires Symbols'),
          requireUppercase: props.passwordPolicyCharacters!.includes('Requires Uppercase'),
        },
      };

      //TODO: change this
      if (props.usernameAttributes && props.usernameAttributes.length == 1 && (props.usernameAttributes[0] as string) !== 'username') {
        this.userPool.usernameAttributes = [cdk.Fn.ref('usernameAttributes')];
      }

      this.userPool.mfaConfiguration = cdk.Fn.ref('mfaConfiguration');

      this.userPool.smsVerificationMessage = cdk.Fn.ref('smsVerificationMessage');
      this.userPool.smsAuthenticationMessage = cdk.Fn.ref('smsAuthenticationMessage');

      this.userPool.smsConfiguration = {
        externalId: `${props.resourceNameTruncated}_role_external_id`,
        snsCallerArn: cdk.Fn.getAtt('SNSRole', 'Arn').toString(),
      };

      if (props.mfaConfiguration != 'OFF') {
        this.userPool.addDependsOn(this.snsRole);
      }

      this.userPool.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN, {
        applyToUpdateReplacePolicy: true,
        default: cdk.RemovalPolicy.RETAIN,
      });

      // updating Lambda Config when FF is (breakcirculardependency : false)

      if (!props.breakCircularDependency && props.triggers && props.dependsOn) {
        props.dependsOn.forEach(trigger => {
          LambdaTriggersKeys.forEach(key => {
            if (trigger.resourceName.includes(key)) {
              const resourceKey = `UserPool${key}LambdaInvokePermission`;
              this.lambdaConfigPermissions![`${resourceKey}`] = new lambda.CfnPermission(this, `${resourceKey}`, {
                action: 'lambda:invokeFunction',
                principal: 'cognito-idp.amazonaws.com',
                functionName: cdk.Fn.ref(`${props.resourceName}${key}`),
                sourceArn: cdk.Fn.getAtt('Userpool', 'Arn').toString(),
              });
            }
          });
        });
        //Updating lambda role with permissions to Cognito
        if (!_.isEmpty(props.permissions)) {
          props.permissions?.forEach(permission => {
            const resourceKey = `${props.resourceName}${permission.trigger}${permission.policyName}`;
            this.lambdaTriggerPermissions![resourceKey] = new iam.CfnPolicy(this, resourceKey, {
              policyName: resourceKey,
              policyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: permission.effect,
                    Action: cdk.Lazy.anyValue({
                      produce: () => {
                        permission.actions.forEach(action => {
                          return action;
                        });
                      },
                    }),
                    Resource: cdk.Lazy.stringValue({
                      produce: () => {
                        if (permission.resource.paramType === 'string') {
                          return permission.resource.keys as string;
                        }
                        if (permission.resource.paramType === '!GetAtt') {
                          return cdk.Fn.getAtt(permission.resource.keys[0], permission.resource.keys[1]).toString();
                        }
                        if (permission.resource.paramType === '!Ref') {
                          return cdk.Fn.ref(permission.resource.keys as string);
                        }
                      },
                    }),
                  },
                ],
              },
              roles: [cdk.Fn.join('', [`${props.resourceName}${permission.trigger}`, '-', cdk.Fn.ref('env')])],
            });
          });
        }
      }
      /**
       *   # Created provide application access to user pool
            # Depends on UserPool for ID reference
       */
      this.userPoolClientWeb = new cognito.CfnUserPoolClient(this, 'UserPoolClientWeb', {
        userPoolId: cdk.Fn.ref('UserPool'),
        clientName: `${props.resourceNameTruncated} _app_clientWeb`,
      });
      if (props.userpoolClientSetAttributes) {
        this.userPoolClientWeb.readAttributes = this._cfnParameterMap.get('userpoolClientReadAttributes')?.valueAsList;
        this.userPoolClientWeb.writeAttributes = this._cfnParameterMap.get('userpoolClientWriteAttributes')?.valueAsList;
      }
      this.userPoolClientWeb.refreshTokenValidity = this._cfnParameterMap.get('userpoolClientRefreshTokenValidity')?.valueAsNumber;
      this.userPoolClientWeb.addDependsOn(this.userPool);

      this.userPoolClient = new cognito.CfnUserPoolClient(this, 'UserPoolClientWeb', {
        userPoolId: cdk.Fn.ref('UserPool'),
        clientName: `${props.resourceNameTruncated} _app_clientWeb`,
      });
      if (props.userpoolClientSetAttributes) {
        this.userPoolClient.readAttributes = this._cfnParameterMap.get('userpoolClientReadAttributes')?.valueAsList;
        this.userPoolClient.writeAttributes = this._cfnParameterMap.get('userpoolClientWriteAttributes')?.valueAsList;
      }
      this.userPoolClient.refreshTokenValidity = this._cfnParameterMap.get('userpoolClientRefreshTokenValidity')?.valueAsNumber;
      this.userPoolClient.generateSecret = (cdk.Fn.ref('userpoolClientGenerateSecret') as unknown) as boolean;
      this.userPoolClient.addDependsOn(this.userPool);

      // UserPool Lambda Resources

      // this.createUserPoolClientCustomResource(props);
      // this.createHostedUICustomResource();
      // this.createOAuthCustomResource();
      // if(props.mfaConfiguration != 'OFF'){
      //   this.createMFACustomResource();
      // }
    }
    // Begin IdentityPool Resources
    if (props.authSelections === 'identityPoolAndUserPool' || props.authSelections === 'identityPoolOnly') {
      //this.createOpenIdLambdaCustomResource();

      this.identityPool = new CfnIdentityPool(this, 'IdentityPool', {
        identityPoolName: cdk.Fn.conditionIf(
          'ShouldNotCreateEnvResources',
          props.identityPoolName,
          cdk.Fn.join('', [`${props.identityPoolName}_openid_lambda_role`, '-', cdk.Fn.ref('env')]),
        ).toString(),
        allowUnauthenticatedIdentities: (cdk.Fn.ref('allowUnauthenticatedIdentities') as unknown) as boolean,
      });
      if (props.authSelections !== 'identityPoolOnly') {
        this.identityPool.cognitoIdentityProviders = [
          {
            clientId: cdk.Fn.ref('UserPoolClient'),
            providerName: cdk.Fn.sub('cognito-idp.${region}.amazonaws.com/${client}', {
              region: cdk.Fn.ref('AWS::Region'),
              client: cdk.Fn.ref('UserPool'),
            }),
          },
          {
            clientId: cdk.Fn.ref('UserPoolClientWeb'),
            providerName: cdk.Fn.sub('cognito-idp.${region}.amazonaws.com/${client}', {
              region: cdk.Fn.ref('AWS::Region'),
              client: cdk.Fn.ref('UserPool'),
            }),
          },
        ];
      }

      if (
        props.authProviders &&
        !_.isEmpty(props.authProviders) &&
        !(Object.keys(props.authProviders).length === 1 && props.authProviders[0] === 'accounts.google.com' && props.audiences)
      ) {
        this.identityPool.supportedLoginProviders = cdk.Lazy.anyValue({
          produce: () => {
            let supprtedProvider: any;
            props.authProviders.forEach(provider => {
              if (Object.keys(authProvidersList).includes(provider)) {
                supprtedProvider[provider] = cdk.Fn.ref(authProvidersList[provider]);
              }
            });
            return supprtedProvider;
          },
        });
      }
      if (props.audiences && props.audiences.length > 0) {
        this.identityPool.openIdConnectProviderArns = [cdk.Fn.getAtt('OpenIdLambdaInputs', 'providerArn').toString()];
        //this.identityPool.addDependsOn(this.OpenIdLambdaInputs);
      }

      if ((!props.audiences || props.audiences.length === 0) && props.authSelections !== 'identityPoolOnly') {
        //this.identityPool.addDependsOn(this.userPoolClientInputs);
      }
      /**
       *  # Created to map Auth and Unauth roles to the identity pool
          # Depends on Identity Pool for ID ref
       */
      this.identityPoolRoleMap = new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleMap', {
        identityPoolId: cdk.Fn.ref('IdentityPool'),
        roles: {
          unauthenticated: cdk.Fn.ref('unauthRoleArn'),
          authenticated: cdk.Fn.ref('authRoleArn'),
        },
      });
      this.identityPoolRoleMap.addDependsOn(this.identityPool);
    }
  };

  // add Function for Custom Resource in Root stack
  /**
   *
   * @param _
   * @returns
   */
  public renderCloudFormationTemplate = (_: cdk.ISynthesisSession): string => {
    return JSON.stringify(this._toCloudFormation(), undefined, 2);
  };

  createUserPoolClientCustomResource(props: AuthStackOptions) {
    // this.userPoolClientRole = new iam.Role(this,'UserPoolClientRole',{
    //   roleName: cdk.Fn.conditionIf('ShouldNotCreateEnvResources',cdk.Fn.ref('userPoolClientLambdaRole'),cdk.Fn.join('',
    //   ['upClientLambdaRole',`${props.sharedId}`,cdk.Fn.select(3,cdk.Fn.split('-',cdk.Fn.ref('AWS::StackName'))),'_',cdk.Fn.ref('env')])).toString(),
    //   assumeRolePolicyDocument:{
    //     Version: '2012-10-17',
    //     Statement:[
    //       {
    //         Effect: "Allow",
    //         Principal:{
    //           Service: "lambda.amazonaws.com"
    //         },
    //         Action: 'sts:AssumeRole'
    //       }
    //     ]
    //   }
    //   //assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    // });
    // this.userPoolClientRole.addDependsOn(this.userPoolClient!);
    // this.userPoolClientLambda = new lambda.CfnFunction(this,'UserPoolClientLambda',{
    //   code:{
    //     zipFile:cdk.Fn.join('-',[
    //     ])
    //   }
    // })
  }
}
