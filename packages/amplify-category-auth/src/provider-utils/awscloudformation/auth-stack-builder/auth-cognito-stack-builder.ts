/* eslint-disable*/
import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';
import * as cognito from '@aws-cdk/aws-cognito';
import * as lambda from '@aws-cdk/aws-lambda';
import { AmplifyAuthCognitoStackTemplate } from '@aws-amplify/cli-extensibility-helper';
import _ from 'lodash';
import * as fs from 'fs-extra';
import { AmplifyStackTemplate, FeatureFlags } from 'amplify-cli-core';
import {
  hostedUILambdaFilePath,
  hostedUIProviderLambdaFilePath,
  mfaLambdaFilePath,
  oauthLambdaFilePath,
  openIdLambdaFilePath,
  userPoolClientLambdaFilePath,
} from '../constants';
import { CognitoStackOptions } from '../service-walkthrough-types/cognito-user-input-types';
import { AttributeType } from '../service-walkthrough-types/awsCognito-user-input-types';

const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';
const ROOT_CFN_DESCRIPTION = 'Amplify Cognito Stack for AWS Amplify CLI';

const LambdaTriggersKeys = [
  'CreateAuthChallenge',
  'CustomMessage',
  'DefineAuthChallenge',
  'PostAuthentication',
  'PostConfirmation',
  'PreAuthentication',
  'PreSignup',
  'PreTokenGeneration',
  'VerifyAuthChallengeResponse',
];

const authProvidersList: Record<string, string> = {
  'graph.facebook.com': 'facebookAppId',
  'accounts.google.com': 'googleClientId',
  'www.amazon.com': 'amazonAppId',
  'appleid.apple.com': 'appleAppId',
};

/**
 *
 */
export type AmplifyAuthCognitoStackProps = {
  synthesizer: cdk.IStackSynthesizer;
};

/**
 *
 */
export class AmplifyAuthCognitoStack extends cdk.Stack implements AmplifyAuthCognitoStackTemplate {
  private _scope: cdk.Construct;
  private _cfnParameterMap: Map<string, cdk.CfnParameter> = new Map();
  private _cfnConditionMap: Map<string, cdk.CfnCondition> = new Map();
  private _cfnOutputMap: Map<string, cdk.CfnOutput> = new Map();
  private _cfnMappingMap: Map<string, cdk.CfnMapping> = new Map();
  private _cfnResourceMap: Map<string, cdk.CfnResource> = new Map();
  customMessageConfirmationBucket?: s3.CfnBucket | undefined;
  snsRole: iam.CfnRole | undefined;
  userPool: cognito.CfnUserPool | undefined;
  userPoolClientWeb: cognito.CfnUserPoolClient | undefined;
  userPoolClient: cognito.CfnUserPoolClient | undefined;
  identityPool: cognito.CfnIdentityPool | undefined;
  identityPoolRoleMap: cognito.CfnIdentityPoolRoleAttachment | undefined;
  lambdaConfigPermissions?: Record<string, lambda.CfnPermission>;
  lambdaTriggerPermissions?: Record<string, iam.CfnPolicy>;
  // customresources userPoolClient
  userPoolClientLambda?: lambda.CfnFunction;
  userPoolClientRole?: iam.CfnRole;
  userPoolClientLambdaPolicy?: iam.CfnPolicy;
  userPoolClientLogPolicy?: iam.CfnPolicy;
  userPoolClientInputs?: cdk.CustomResource;
  // customresources HostedUI
  hostedUICustomResource?: lambda.CfnFunction;
  hostedUICustomResourcePolicy?: iam.CfnPolicy;
  hostedUICustomResourceLogPolicy?: iam.CfnPolicy;
  hostedUICustomResourceInputs?: cdk.CustomResource;
  // custom resource HostedUI Provider
  hostedUIProvidersCustomResource?: lambda.CfnFunction;
  hostedUIProvidersCustomResourcePolicy?: iam.CfnPolicy;
  hostedUIProvidersCustomResourceLogPolicy?: iam.CfnPolicy;
  hostedUIProvidersCustomResourceInputs?: cdk.CustomResource;
  // custom resource OAUTH Provider
  oAuthCustomResource?: lambda.CfnFunction;
  oAuthCustomResourcePolicy?: iam.CfnPolicy;
  oAuthCustomResourceLogPolicy?: iam.CfnPolicy;
  oAuthCustomResourceInputs?: cdk.CustomResource;
  // custom resource MFA
  mfaLambda?: lambda.CfnFunction;
  mfaLogPolicy?: iam.CfnPolicy;
  mfaLambdaPolicy?: iam.CfnPolicy;
  mfaLambdaInputs?: cdk.CustomResource;
  mfaLambdaRole?: iam.CfnRole;

  // custom resource identity pool - OPenId Lambda Role
  openIdLambda?: lambda.CfnFunction;
  openIdLogPolicy?: iam.CfnPolicy;
  openIdLambdaIAMPolicy?: iam.CfnPolicy;
  openIdLambdaInputs?: cdk.CustomResource;
  openIdLambdaRole?: iam.CfnRole;

  constructor(scope: cdk.Construct, id: string, props: AmplifyAuthCognitoStackProps) {
    super(scope, id, props);
    this._scope = scope;
    this.templateOptions.templateFormatVersion = CFN_TEMPLATE_FORMAT_VERSION;
    this.templateOptions.description = ROOT_CFN_DESCRIPTION;
    this.lambdaConfigPermissions = {};
    this.lambdaTriggerPermissions = {};
  }

  /**
   *
   */
  addCfnResource(props: cdk.CfnResourceProps, logicalId: string): void {
    if (!this._cfnResourceMap.has(logicalId)) {
      this._cfnResourceMap.set(logicalId, new cdk.CfnResource(this, logicalId, props));
    } else {
      throw new Error(`Cfn Resource with LogicalId ${logicalId} already exists`);
    }
  }

  /**
   *
   */
  getCfnOutput(logicalId: string): cdk.CfnOutput {
    if (this._cfnOutputMap.has(logicalId)) {
      return this._cfnOutputMap.get(logicalId)!;
    }
    throw new Error(`Cfn Output with LogicalId ${logicalId} doesnt exist`);
  }

  /**
   *
   */
  getCfnMapping(logicalId: string): cdk.CfnMapping {
    if (this._cfnMappingMap.has(logicalId)) {
      return this._cfnMappingMap.get(logicalId)!;
    }
    throw new Error(`Cfn Mapping with LogicalId ${logicalId} doesnt exist`);
  }

  /**
   *
   * @param props :cdk.CfnOutputProps
   * @param logicalId: : lodicalId of the Resource
   */
  addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void {
    if (!this._cfnOutputMap.has(logicalId)) {
      this._cfnOutputMap.set(logicalId, new cdk.CfnOutput(this, logicalId, props));
    } else {
      throw new Error(`Cfn Parameter with LogicalId ${logicalId} already exists`);
    }
  }

  /**
   *
   * @param props
   * @param logicalId
   */
  addCfnMapping(props: cdk.CfnMappingProps, logicalId: string): void {
    if (!this._cfnMappingMap.has(logicalId)) {
      this._cfnMappingMap.set(logicalId, new cdk.CfnMapping(this, logicalId, props));
    } else {
      throw new Error(`Cfn Parameter with LogicalId ${logicalId} already exists`);
    }
  }

  /**
   *
   * @param props
   * @param logicalId
   */
  addCfnCondition(props: cdk.CfnConditionProps, logicalId: string): void {
    if (!this._cfnConditionMap.has(logicalId)) {
      this._cfnConditionMap.set(logicalId, new cdk.CfnCondition(this, logicalId, props));
    } else {
      throw new Error(`Cfn Parameter with LogicalId ${logicalId} already exists`);
    }
  }

  /**
   *
   * @param props
   * @param logicalId
   */
  addCfnParameter(props: cdk.CfnParameterProps, logicalId: string): void {
    if (!this._cfnParameterMap.has(logicalId)) {
      this._cfnParameterMap.set(logicalId, new cdk.CfnParameter(this, logicalId, props));
    } else {
      throw new Error(`Cfn Parameter with LogicalId ${logicalId} already exists`);
    }
  }

  /**
   *
   */
  getCfnParameter(logicalId: string): cdk.CfnParameter {
    if (this._cfnParameterMap.has(logicalId)) {
      return this._cfnParameterMap.get(logicalId)!;
    }
    throw new Error(`Cfn Parameter with LogicalId ${logicalId} doesnt exist`);
  }

  /**
   *
   */
  getCfnCondition(logicalId: string): cdk.CfnCondition {
    if (this._cfnConditionMap.has(logicalId)) {
      return this._cfnConditionMap.get(logicalId)!;
    }
    throw new Error(`Cfn Condition with LogicalId ${logicalId} doesnt exist`);
  }

  // getDefaultuserAttributeUpdateSettings = (props:CognitoStackOptions) : string[] => {
  //   const defaultuserAttributeUpdateSettings = [AttributeType.EMAIL];
  //   if (FeatureFlags.getBoolean('auth.forceAliasAttributes')) {
  //     let aliasAtrributeSetting =  _.isEmpty(props.aliasAttributes) ? props.requiredAttributes! : props.aliasAttributes!;
  //     /**
  //      * covert ["email,phone_number"] ===> ["email" ,"phone_number"]
  //      */
  //     if(aliasAtrributeSetting[0] === AttributeType.EMAIL_AND_PHONE_NUMBER){
  //       aliasAtrributeSetting = aliasAtrributeSetting[0].split(',').map(attribute => attribute.trim());
  //     }
  //     return aliasAtrributeSetting ?? defaultuserAttributeUpdateSettings;
  //   } else {
  //     let usernameAtrributeSetting =  _.isEmpty(props.usernameAttributes) ? props.requiredAttributes! : props.usernameAttributes!;
  //     if(usernameAtrributeSetting[0] === AttributeType.EMAIL_AND_PHONE_NUMBER){
  //       usernameAtrributeSetting = usernameAtrributeSetting[0].split(',').map(attribute => attribute.trim());
  //     }
  //     return usernameAtrributeSetting ?? defaultuserAttributeUpdateSettings;
  //   }
  // }

  // getUserAttributeUpdateSettings = (props: CognitoStackOptions): string[] => {
  //   if(!_.isEmpty(props.userAttributeUpdateSettings)) {
  //     const userAttributeUpdateSettings = props.userAttributeUpdateSettings!;
  //     if(userAttributeUpdateSettings[0] === AttributeType.EMAIL_AND_PHONE_NUMBER){
  //       return userAttributeUpdateSettings[0].split(',').map(attribute => attribute.trim());
  //     }
  //     else{
  //       return props.userAttributeUpdateSettings!;
  //     }
  //   }
  //   else{
  //     return this.getDefaultuserAttributeUpdateSettings(props);
  //   }
  // }

  generateCognitoStackResources = async (props: CognitoStackOptions) => {
    const autoVerifiedAttributes = props.autoVerifiedAttributes
      ? props.autoVerifiedAttributes
        .concat(props.aliasAttributes ? props.aliasAttributes : [])
        .filter((attr, i, aliasAttributeArray) => ['email', 'phone_number'].includes(attr) && aliasAttributeArray.indexOf(attr) === i)
      : [];
    const configureSMS = (props.autoVerifiedAttributes && props.autoVerifiedAttributes.includes('phone_number'))
      || (props.mfaConfiguration != 'OFF' && props.mfaTypes && props.mfaTypes.includes('SMS Text Message'))
      || (props.requiredAttributes && props.requiredAttributes.includes('phone_number'))
      || (props.usernameAttributes && props.usernameAttributes.includes(AttributeType.PHONE_NUMBER));

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
      if (!props.useEnabledMfas || configureSMS) {
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
                Action: ['sts:AssumeRole'],
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
                    Action: ['sns:Publish'],
                    Resource: '*',
                  },
                ],
              },
            },
          ],
        });
      }

      this.userPool = new cognito.CfnUserPool(this, 'UserPool', {
        userPoolName: cdk.Fn.conditionIf(
          'ShouldNotCreateEnvResources',
          cdk.Fn.ref('userPoolName'),
          cdk.Fn.join('', [cdk.Fn.ref('userPoolName'), '-', cdk.Fn.ref('env')]),
        ).toString(),
        policies: {
          passwordPolicy: {
            minimumLength: cdk.Fn.ref('passwordPolicyMinLength') as unknown as number,
            requireLowercase: props.passwordPolicyCharacters!.includes('Requires Lowercase'),
            requireNumbers: props.passwordPolicyCharacters!.includes('Requires Numbers'),
            requireSymbols: props.passwordPolicyCharacters!.includes('Requires Symbols'),
            requireUppercase: props.passwordPolicyCharacters!.includes('Requires Uppercase'),
          },
        },
      });

      if (props.usernameCaseSensitive !== undefined) {
        this.userPool.usernameConfiguration = {
          caseSensitive: props.usernameCaseSensitive,
        };
      }

      if (props.requiredAttributes && props.requiredAttributes.length > 0) {
        const schemaAttributes: cognito.CfnUserPool.SchemaAttributeProperty[] = [];
        props.requiredAttributes.forEach(attr => {
          schemaAttributes.push({
            name: attr,
            required: true,
            mutable: true,
          });
        });
        this.userPool!.schema = schemaAttributes;
      }

      if (!props.breakCircularDependency && props.triggers && props.dependsOn) {
        props.dependsOn!.forEach(trigger => {
          if (trigger.resourceName.includes('CreateAuthChallenge')) {
            this.userPool!.lambdaConfig = {
              createAuthChallenge: cdk.Fn.ref(`function${props.resourceName}${'CreateAuthChallenge'}Arn`),
            };
          }
          if (trigger.resourceName.includes('CustomMessage')) {
            this.userPool!.lambdaConfig = {
              ...this.userPool!.lambdaConfig,
              customMessage: cdk.Fn.ref(`function${props.resourceName}${'CustomMessage'}Arn`),
            };
          }
          if (trigger.resourceName.includes('DefineAuthChallenge')) {
            this.userPool!.lambdaConfig = {
              ...this.userPool!.lambdaConfig,
              defineAuthChallenge: cdk.Fn.ref(`function${props.resourceName}${'DefineAuthChallenge'}Arn`),
            };
          }
          if (trigger.resourceName.includes('PostAuthentication')) {
            this.userPool!.lambdaConfig = {
              ...this.userPool!.lambdaConfig,
              postAuthentication: cdk.Fn.ref(`function${props.resourceName}${'PostAuthentication'}Arn`),
            };
          }
          if (trigger.resourceName.includes('PostConfirmation')) {
            this.userPool!.lambdaConfig = {
              ...this.userPool!.lambdaConfig,
              postConfirmation: cdk.Fn.ref(`function${props.resourceName}${'PostConfirmation'}Arn`),
            };
          }
          if (trigger.resourceName.includes('PreAuthentication')) {
            this.userPool!.lambdaConfig = {
              ...this.userPool!.lambdaConfig,
              preAuthentication: cdk.Fn.ref(`function${props.resourceName}${'PreAuthentication'}Arn`),
            };
          }
          if (trigger.resourceName.includes('PreSignup')) {
            this.userPool!.lambdaConfig = {
              ...this.userPool!.lambdaConfig,
              preSignUp: cdk.Fn.ref(`function${props.resourceName}${'PreSignup'}Arn`),
            };
          }
          if (trigger.resourceName.includes('PreTokenGeneration')) {
            this.userPool!.lambdaConfig = {
              ...this.userPool!.lambdaConfig,
              preTokenGeneration: cdk.Fn.ref(`function${props.resourceName}${'PreTokenGeneration'}Arn`),
            };
          }
          if (trigger.resourceName.includes('VerifyAuthChallengeResponse')) {
            this.userPool!.lambdaConfig = {
              ...this.userPool!.lambdaConfig,
              verifyAuthChallengeResponse: cdk.Fn.ref(`function${props.resourceName}${'VerifyAuthChallengeResponse'}Arn`),
            };
          }
        });
      }

      if (autoVerifiedAttributes && autoVerifiedAttributes.length > 0) {
        this.userPool!.autoVerifiedAttributes = autoVerifiedAttributes;
        this.userPool!.userAttributeUpdateSettings = {
          attributesRequireVerificationBeforeUpdate:  props.userAutoVerifiedAttributeUpdateSettings!,
        }
      }

      if (autoVerifiedAttributes.includes('email')) {
        this.userPool.emailVerificationMessage = cdk.Fn.ref('emailVerificationMessage');
        this.userPool.emailVerificationSubject = cdk.Fn.ref('emailVerificationSubject');
      }

      // TODO: change this
      if (props.usernameAttributes && (props.usernameAttributes[0] as string) !== 'username') {
        this.userPool.usernameAttributes = cdk.Fn.ref('usernameAttributes') as unknown as string[];
      }
      // alias attributes
      if (props.aliasAttributes && props.aliasAttributes.length > 0) {
        this.userPool.aliasAttributes = cdk.Fn.ref('aliasAttributes') as unknown as string[];
      }

      this.userPool.mfaConfiguration = cdk.Fn.ref('mfaConfiguration');
      if (props.useEnabledMfas && props.mfaConfiguration !== 'OFF') {
        if (configureSMS) {
          this.userPool.enabledMfas = ['SMS_MFA'];
        }
        if (!_.isEmpty(props.mfaTypes) && props.mfaTypes!.includes('TOTP')) {
          this.userPool.enabledMfas = [...(this.userPool.enabledMfas || []), 'SOFTWARE_TOKEN_MFA'];
        }
      }

      if (!props.useEnabledMfas || configureSMS) {
        this.userPool.smsVerificationMessage = cdk.Fn.ref('smsVerificationMessage');
        this.userPool.smsAuthenticationMessage = cdk.Fn.ref('smsAuthenticationMessage');
        this.userPool.smsConfiguration = {
          externalId: `${props.resourceNameTruncated}_role_external_id`,
          snsCallerArn: cdk.Fn.getAtt('SNSRole', 'Arn').toString(),
        };
      }

      if (configureSMS) {
        this.userPool.addDependsOn(this.snsRole!);
      }

      // updating Lambda Config when FF is (breakcirculardependency : false)

      if (!props.breakCircularDependency && props.triggers && props.dependsOn) {
        props.dependsOn.forEach(trigger => {
          LambdaTriggersKeys.forEach(key => {
            if (trigger.resourceName.includes(key)) {
              const resourceKey = `UserPool${key}LambdaInvokePermission`;
              this.lambdaConfigPermissions![`${resourceKey}`] = new lambda.CfnPermission(this, `${resourceKey}`, {
                action: 'lambda:invokeFunction',
                principal: 'cognito-idp.amazonaws.com',
                functionName: cdk.Fn.ref(`function${props.resourceName}${key}Name`),
                sourceArn: cdk.Fn.getAtt('UserPool', 'Arn').toString(),
              });
            }
          });
        });
        // Updating lambda role with permissions to Cognito
        if (!_.isEmpty(props.permissions)) {
          this.generateIAMPolicies(props);
        }
      }
      /**
       *   # Created provide application access to user pool
            # Depends on UserPool for ID reference
       */
      this.userPoolClientWeb = new cognito.CfnUserPoolClient(this, 'UserPoolClientWeb', {
        userPoolId: cdk.Fn.ref('UserPool'),
        clientName: `${props.resourceNameTruncated}_app_clientWeb`,
      });
      if (props.userpoolClientSetAttributes) {
        this.userPoolClientWeb.readAttributes = this._cfnParameterMap.get('userpoolClientReadAttributes')?.valueAsList;
        this.userPoolClientWeb.writeAttributes = this._cfnParameterMap.get('userpoolClientWriteAttributes')?.valueAsList;
      }
      this.userPoolClientWeb.refreshTokenValidity = cdk.Fn.ref('userpoolClientRefreshTokenValidity') as unknown as number;
      this.userPoolClientWeb.addDependsOn(this.userPool);

      this.userPoolClient = new cognito.CfnUserPoolClient(this, 'UserPoolClient', {
        userPoolId: cdk.Fn.ref('UserPool'),
        clientName: `${props.resourceNameTruncated}_app_client`,
      });
      if (props.userpoolClientSetAttributes) {
        this.userPoolClient.readAttributes = this._cfnParameterMap.get('userpoolClientReadAttributes')?.valueAsList;
        this.userPoolClient.writeAttributes = this._cfnParameterMap.get('userpoolClientWriteAttributes')?.valueAsList;
      }
      this.userPoolClient.refreshTokenValidity = cdk.Fn.ref('userpoolClientRefreshTokenValidity') as unknown as number;
      this.userPoolClient.generateSecret = cdk.Fn.ref('userpoolClientGenerateSecret') as unknown as boolean;
      this.userPoolClient.addDependsOn(this.userPool);

      this.createUserPoolClientCustomResource(props);
      if (props.hostedUIDomainName) {
        this.createHostedUICustomResource();
      }
      if (props.hostedUIProviderMeta) {
        this.createHostedUIProviderCustomResource();
      }
      if (props.oAuthMetadata) {
        this.createOAuthCustomResource();
      }
      if (!props.useEnabledMfas && props.mfaConfiguration != 'OFF') {
        this.createMFACustomResource(props);
      }
    }
    // Begin IdentityPool Resources
    if (props.authSelections === 'identityPoolAndUserPool' || props.authSelections === 'identityPoolOnly') {
      if (props.audiences && props.audiences.length > 0) {
        this.createOpenIdLambdaCustomResource(props);
      }

      this.identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
        identityPoolName: cdk.Fn.conditionIf(
          'ShouldNotCreateEnvResources',
          props.identityPoolName,
          cdk.Fn.join('', [`${props.identityPoolName}`, '__', cdk.Fn.ref('env')]),
        ).toString(),
        allowUnauthenticatedIdentities: cdk.Fn.ref('allowUnauthenticatedIdentities') as unknown as boolean,
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
        props.authProviders
        && !_.isEmpty(props.authProviders)
        && !(Object.keys(props.authProviders).length === 1 && props.authProviders[0] === 'accounts.google.com' && props.audiences)
      ) {
        this.identityPool.supportedLoginProviders = cdk.Lazy.anyValue({
          produce: () => {
            const supprtedProvider: any = {};
            props.authProviders?.forEach(provider => {
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
        this.identityPool.node.addDependency(this.openIdLambdaInputs!.node!.defaultChild!);
      }

      if ((!props.audiences || props.audiences.length === 0) && props.authSelections !== 'identityPoolOnly') {
        this.identityPool.node.addDependency(this.userPoolClientInputs!.node!.defaultChild!);
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
  public renderCloudFormationTemplate = (_: cdk.ISynthesisSession): string => JSON.stringify(this._toCloudFormation(), undefined, 2);

  /**
   *
   */
  createUserPoolClientCustomResource(props: CognitoStackOptions) {
    // iam role
    this.userPoolClientRole = new iam.CfnRole(this, 'UserPoolClientRole', {
      roleName: cdk.Fn.conditionIf(
        'ShouldNotCreateEnvResources',
        cdk.Fn.ref('userpoolClientLambdaRole'),
        cdk.Fn.join('', [
          'upClientLambdaRole',
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
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
    });
    this.userPoolClientRole.addDependsOn(this.userPoolClient!);

    // lambda function
    this.userPoolClientLambda = new lambda.CfnFunction(this, 'UserPoolClientLambda', {
      code: {
        zipFile: fs.readFileSync(userPoolClientLambdaFilePath, 'utf-8'),
      },
      handler: 'index.handler',
      role: cdk.Fn.getAtt('UserPoolClientRole', 'Arn').toString(),
      runtime: 'nodejs14.x',
      timeout: 300,
    });
    this.userPoolClientLambda.addDependsOn(this.userPoolClientRole);

    // userPool client lambda policy
    /**
     *   # Sets userpool policy for the role that executes the Userpool Client Lambda
        # Depends on UserPool for Arn
        # Marked as depending on UserPoolClientRole for easier to understand CFN sequencing
     */
    this.userPoolClientLambdaPolicy = new iam.CfnPolicy(this, 'UserPoolClientLambdaPolicy', {
      policyName: `${props.resourceNameTruncated}_userpoolclient_lambda_iam_policy`,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['cognito-idp:DescribeUserPoolClient'],
            Resource: cdk.Fn.getAtt('UserPool', 'Arn'),
          },
        ],
      },
      roles: [cdk.Fn.ref('UserPoolClientRole')],
    });
    this.userPoolClientLambdaPolicy.addDependsOn(this.userPoolClientLambda);

    // userPool Client Log policy

    this.userPoolClientLogPolicy = new iam.CfnPolicy(this, 'UserPoolClientLogPolicy', {
      policyName: `${props.resourceNameTruncated}_userpoolclient_lambda_log_policy`,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
            Resource: cdk.Fn.sub('arn:aws:logs:${region}:${account}:log-group:/aws/lambda/${lambda}:log-stream:*', {
              region: cdk.Fn.ref('AWS::Region'),
              account: cdk.Fn.ref('AWS::AccountId'),
              lambda: cdk.Fn.ref('UserPoolClientLambda'),
            }),
          },
        ],
      },
      roles: [cdk.Fn.ref('UserPoolClientRole')],
    });
    this.userPoolClientLogPolicy.addDependsOn(this.userPoolClientLambdaPolicy);

    // userPoolClient Custom Resource
    this.userPoolClientInputs = new cdk.CustomResource(this, 'UserPoolClientInputs', {
      serviceToken: this.userPoolClientLambda.attrArn,
      resourceType: 'Custom::LambdaCallout',
      properties: {
        clientId: cdk.Fn.ref('UserPoolClient'),
        userpoolId: cdk.Fn.ref('UserPool'),
      },
    });
    this.userPoolClientInputs.node.addDependency(this.userPoolClientLogPolicy);
  }

  /**
   *
   */
  createHostedUICustomResource() {
    // lambda function
    this.hostedUICustomResource = new lambda.CfnFunction(this, 'HostedUICustomResource', {
      code: {
        zipFile: fs.readFileSync(hostedUILambdaFilePath, 'utf-8'),
      },
      handler: 'index.handler',
      role: cdk.Fn.getAtt('UserPoolClientRole', 'Arn').toString(),
      runtime: 'nodejs14.x',
      timeout: 300,
    });
    this.hostedUICustomResource.addDependsOn(this.userPoolClientRole!);

    // userPool client lambda policy
    /**
     *   # Sets userpool policy for the role that executes the Userpool Client Lambda
        # Depends on UserPool for Arn
        # Marked as depending on UserPoolClientRole for easier to understand CFN sequencing
     */
    this.hostedUICustomResourcePolicy = new iam.CfnPolicy(this, 'HostedUICustomResourcePolicy', {
      policyName: cdk.Fn.join('-', [cdk.Fn.ref('UserPool'), cdk.Fn.ref('hostedUI')]),
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['cognito-idp:CreateUserPoolDomain', 'cognito-idp:DescribeUserPool', 'cognito-idp:DeleteUserPoolDomain'],
            Resource: cdk.Fn.getAtt('UserPool', 'Arn'),
          },
          {
            Effect: 'Allow',
            Action: ['cognito-idp:DescribeUserPoolDomain'],
            Resource: '*',
          },
        ],
      },
      roles: [cdk.Fn.ref('UserPoolClientRole')],
    });
    this.hostedUICustomResourcePolicy.addDependsOn(this.hostedUICustomResource);

    // userPool Client Log policy

    this.hostedUICustomResourceLogPolicy = new iam.CfnPolicy(this, 'HostedUICustomResourceLogPolicy', {
      policyName: cdk.Fn.join('-', [cdk.Fn.ref('UserPool'), 'hostedUILogPolicy']),
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
            Resource: cdk.Fn.sub('arn:aws:logs:${region}:${account}:log-group:/aws/lambda/${lambda}:log-stream:*', {
              region: cdk.Fn.ref('AWS::Region'),
              account: cdk.Fn.ref('AWS::AccountId'),
              lambda: cdk.Fn.ref('HostedUICustomResource'),
            }),
          },
        ],
      },
      roles: [cdk.Fn.ref('UserPoolClientRole')],
    });
    this.hostedUICustomResourceLogPolicy.addDependsOn(this.hostedUICustomResourcePolicy);

    // userPoolClient Custom Resource
    this.hostedUICustomResourceInputs = new cdk.CustomResource(this, 'HostedUICustomResourceInputs', {
      serviceToken: this.hostedUICustomResource.attrArn,
      resourceType: 'Custom::LambdaCallout',
      properties: {
        hostedUIDomainName: cdk.Fn.conditionIf(
          'ShouldNotCreateEnvResources',
          cdk.Fn.ref('hostedUIDomainName'),
          cdk.Fn.join('-', [cdk.Fn.ref('hostedUIDomainName'), cdk.Fn.ref('env')]),
        ),
        userPoolId: cdk.Fn.ref('UserPool'),
      },
    });
    this.hostedUICustomResourceInputs.node.addDependency(this.hostedUICustomResourceLogPolicy);
  }

  /**
   *
   */
  createHostedUIProviderCustomResource() {
    // lambda function
    this.hostedUIProvidersCustomResource = new lambda.CfnFunction(this, 'HostedUIProvidersCustomResource', {
      code: {
        zipFile: fs.readFileSync(hostedUIProviderLambdaFilePath, 'utf-8'),
      },
      handler: 'index.handler',
      role: cdk.Fn.getAtt('UserPoolClientRole', 'Arn').toString(),
      runtime: 'nodejs14.x',
      timeout: 300,
    });
    this.hostedUIProvidersCustomResource.addDependsOn(this.userPoolClientRole!);

    // userPool client lambda policy
    /**
     *   # Sets userpool policy for the role that executes the Userpool Client Lambda
        # Depends on UserPool for Arn
        # Marked as depending on UserPoolClientRole for easier to understand CFN sequencing
     */
    this.hostedUIProvidersCustomResourcePolicy = new iam.CfnPolicy(this, 'HostedUIProvidersCustomResourcePolicy', {
      policyName: cdk.Fn.join('-', [cdk.Fn.ref('UserPool'), 'hostedUIProvider']),
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'cognito-idp:CreateIdentityProvider',
              'cognito-idp:UpdateIdentityProvider',
              'cognito-idp:ListIdentityProviders',
              'cognito-idp:DeleteIdentityProvider',
            ],
            Resource: cdk.Fn.getAtt('UserPool', 'Arn'),
          },
          {
            Effect: 'Allow',
            Action: ['cognito-idp:DescribeUserPoolDomain'],
            Resource: '*',
          },
        ],
      },
      roles: [cdk.Fn.ref('UserPoolClientRole')],
    });
    this.hostedUIProvidersCustomResourcePolicy.addDependsOn(this.hostedUIProvidersCustomResource);

    // userPool Client Log policy

    this.hostedUIProvidersCustomResourceLogPolicy = new iam.CfnPolicy(this, 'HostedUIProvidersCustomResourceLogPolicy', {
      policyName: cdk.Fn.join('-', [cdk.Fn.ref('UserPool'), 'hostedUIProviderLogPolicy']),
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
            Resource: cdk.Fn.sub('arn:aws:logs:${region}:${account}:log-group:/aws/lambda/${lambda}:log-stream:*', {
              region: cdk.Fn.ref('AWS::Region'),
              account: cdk.Fn.ref('AWS::AccountId'),
              lambda: cdk.Fn.ref('HostedUIProvidersCustomResource'),
            }),
          },
        ],
      },
      roles: [cdk.Fn.ref('UserPoolClientRole')],
    });
    this.hostedUIProvidersCustomResourceLogPolicy.addDependsOn(this.hostedUIProvidersCustomResourcePolicy);

    // userPoolClient Custom Resource
    this.hostedUIProvidersCustomResourceInputs = new cdk.CustomResource(this, 'HostedUIProvidersCustomResourceInputs', {
      serviceToken: this.hostedUIProvidersCustomResource.attrArn,
      resourceType: 'Custom::LambdaCallout',
      properties: {
        hostedUIProviderMeta: cdk.Fn.ref('hostedUIProviderMeta'),
        hostedUIProviderCreds: cdk.Fn.ref('hostedUIProviderCreds'),
        userPoolId: cdk.Fn.ref('UserPool'),
      },
    });
    this.hostedUIProvidersCustomResourceInputs.node.addDependency(this.hostedUIProvidersCustomResourceLogPolicy);
  }

  /**
   *
   */
  createOAuthCustomResource() {
    // lambda function
    this.oAuthCustomResource = new lambda.CfnFunction(this, 'OAuthCustomResource', {
      code: {
        zipFile: fs.readFileSync(oauthLambdaFilePath, 'utf-8'),
      },
      handler: 'index.handler',
      role: cdk.Fn.getAtt('UserPoolClientRole', 'Arn').toString(),
      runtime: 'nodejs14.x',
      timeout: 300,
    });

    this.oAuthCustomResource.node.addDependency(this.hostedUICustomResourceInputs!.node!.defaultChild!);
    this.oAuthCustomResource.node.addDependency(this.hostedUIProvidersCustomResourceInputs!.node!.defaultChild!);

    // userPool client lambda policy
    /**
     *   # Sets userpool policy for the role that executes the Userpool Client Lambda
        # Depends on UserPool for Arn
        # Marked as depending on UserPoolClientRole for easier to understand CFN sequencing
     */
    this.oAuthCustomResourcePolicy = new iam.CfnPolicy(this, 'OAuthCustomResourcePolicy', {
      policyName: cdk.Fn.join('-', [cdk.Fn.ref('UserPool'), 'OAuth']),
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['cognito-idp:UpdateUserPoolClient'],
            Resource: cdk.Fn.getAtt('UserPool', 'Arn'),
          },
        ],
      },
      roles: [cdk.Fn.ref('UserPoolClientRole')],
    });
    this.oAuthCustomResourcePolicy.addDependsOn(this.oAuthCustomResource);

    // Oauth Log policy

    this.oAuthCustomResourceLogPolicy = new iam.CfnPolicy(this, 'OAuthCustomResourceLogPolicy', {
      policyName: cdk.Fn.join('-', [cdk.Fn.ref('UserPool'), 'OAuthLogPolicy']),
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
            Resource: cdk.Fn.sub('arn:aws:logs:${region}:${account}:log-group:/aws/lambda/${lambda}:log-stream:*', {
              region: cdk.Fn.ref('AWS::Region'),
              account: cdk.Fn.ref('AWS::AccountId'),
              lambda: cdk.Fn.ref('OAuthCustomResource'),
            }),
          },
        ],
      },
      roles: [cdk.Fn.ref('UserPoolClientRole')],
    });
    this.oAuthCustomResourceLogPolicy.addDependsOn(this.oAuthCustomResourcePolicy);

    // oAuth Custom Resource
    this.oAuthCustomResourceInputs = new cdk.CustomResource(this, 'OAuthCustomResourceInputs', {
      serviceToken: this.oAuthCustomResource.attrArn,
      resourceType: 'Custom::LambdaCallout',
      properties: {
        hostedUIProviderMeta: cdk.Fn.ref('hostedUIProviderMeta'),
        oAuthMetadata: cdk.Fn.ref('oAuthMetadata'),
        webClientId: cdk.Fn.ref('UserPoolClientWeb'),
        nativeClientId: cdk.Fn.ref('UserPoolClient'),
        userPoolId: cdk.Fn.ref('UserPool'),
      },
    });
    this.oAuthCustomResourceInputs.node.addDependency(this.oAuthCustomResourceLogPolicy);
  }

  /**
   *
   */
  createMFACustomResource(props: CognitoStackOptions) {
    // iam role
    this.mfaLambdaRole = new iam.CfnRole(this, 'MFALambdaRole', {
      roleName: cdk.Fn.conditionIf(
        'ShouldNotCreateEnvResources',
        `${props.resourceNameTruncated}_totp_lambda_role`,
        cdk.Fn.join('', [`${props.resourceNameTruncated}_totp_lambda_role`, '-', cdk.Fn.ref('env')]),
      ).toString(),
      assumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
      policies: [
        {
          policyName: `${props.resourceNameTruncated}_totp_pass_role_policy`,
          policyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['iam:PassRole'],
                Resource: cdk.Fn.conditionIf(
                  'ShouldNotCreateEnvResources',
                  `arn:aws:iam:::role/${props.resourceNameTruncated}_totp_lambda_role`,
                  cdk.Fn.join('', [`arn:aws:iam:::role/${props.resourceNameTruncated}__totp_lambda_role`, '-', cdk.Fn.ref('env')]),
                ),
              },
            ],
          },
        },
        {
          policyName: `${props.resourceNameTruncated}_sns_pass_role_policy`,
          policyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['iam:PassRole'],
                Resource: cdk.Fn.getAtt('SNSRole', 'Arn'),
              },
            ],
          },
        },
      ],
    });
    this.mfaLambdaRole.addDependsOn(this.snsRole!);
    // lambda function
    /**
     *   Lambda which sets MFA config values
         Depends on MFALambdaRole for role ARN
     */
    this.mfaLambda = new lambda.CfnFunction(this, 'MFALambda', {
      code: {
        zipFile: fs.readFileSync(mfaLambdaFilePath, 'utf-8'),
      },
      handler: 'index.handler',
      role: cdk.Fn.getAtt('MFALambdaRole', 'Arn').toString(),
      runtime: 'nodejs14.x',
      timeout: 300,
    });
    this.mfaLambda.addDependsOn(this.mfaLambdaRole);

    // MFA lambda policy
    /**
    # Sets policy for the role that executes the MFA Lambda
    # Depends on Userpool for Arn
    # Marked as depending on MFALambda for easier to understand CFN sequencing
     */
    this.mfaLambdaPolicy = new iam.CfnPolicy(this, 'MFALambdaPolicy', {
      policyName: `${props.resourceNameTruncated}_totp_lambda_iam_policy`,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['cognito-idp:SetUserPoolMfaConfig'],
            Resource: cdk.Fn.getAtt('UserPool', 'Arn'),
          },
        ],
      },
      roles: [
        cdk.Fn.conditionIf(
          'ShouldNotCreateEnvResources',
          `${props.resourceNameTruncated}_totp_lambda_role`,
          cdk.Fn.join('', [`${props.resourceNameTruncated}_totp_lambda_role`, '-', cdk.Fn.ref('env')]),
        ).toString(),
      ],
    });
    this.mfaLambdaPolicy.addDependsOn(this.mfaLambda);

    // mfa Log policy

    this.mfaLogPolicy = new iam.CfnPolicy(this, 'MFALogPolicy', {
      policyName: `${props.resourceNameTruncated}_totp_lambda_log_policy`,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
            Resource: cdk.Fn.sub('arn:aws:logs:${region}:${account}:log-group:/aws/lambda/${lambda}:log-stream:*', {
              region: cdk.Fn.ref('AWS::Region'),
              account: cdk.Fn.ref('AWS::AccountId'),
              lambda: cdk.Fn.ref('MFALambda'),
            }),
          },
        ],
      },
      roles: [
        cdk.Fn.conditionIf(
          'ShouldNotCreateEnvResources',
          `${props.resourceNameTruncated}_totp_lambda_role`,
          cdk.Fn.join('', [`${props.resourceNameTruncated}_totp_lambda_role`, '-', cdk.Fn.ref('env')]),
        ).toString(),
      ],
    });
    this.mfaLogPolicy.addDependsOn(this.mfaLambdaPolicy);

    // mfa Custom Resource
    /**
      # Values passed to MFA Lambda
      # Depends on UserPool for Arn
      # Depends on MFALambda for Arn
      # Marked as depending on MFALambdaPolicy for easier to understand CFN sequencing
     */
    this.mfaLambdaInputs = new cdk.CustomResource(this, 'MFALambdaInputs', {
      serviceToken: this.mfaLambda.attrArn,
      resourceType: 'Custom::LambdaCallout',
      properties: {
        mfaConfiguration: cdk.Fn.ref('mfaConfiguration'),
        totpEnabled: props.mfaTypes!.includes('TOTP'),
        smsConfigCaller: cdk.Fn.getAtt('SNSRole', 'Arn'),
        smsAuthenticationMessage: cdk.Fn.ref('smsAuthenticationMessage'),
        smsConfigExternalId: `${props.resourceNameTruncated}_role_external_id`,
        userPoolId: cdk.Fn.ref('UserPool'),
      },
    });
    this.mfaLambdaInputs.node.addDependency(this.mfaLogPolicy);
  }

  /**
   *
   */
  createOpenIdLambdaCustomResource(props: CognitoStackOptions) {
    // iam role
    /**
      # Created to execute Lambda which sets MFA config values
      # Depends on UserPoolClientInputs to prevent further identity pool resources from being created before userpool is ready
     */
    this.openIdLambdaRole = new iam.CfnRole(this, 'OpenIdLambdaRole', {
      roleName: cdk.Fn.conditionIf(
        'ShouldNotCreateEnvResources',
        `${props.resourceNameTruncated}_openid_lambda_role`,
        cdk.Fn.join('', [`${props.resourceNameTruncated}_openid_lambda_role`, '-', cdk.Fn.ref('env')]),
      ).toString(),
      assumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
      policies: [
        {
          policyName: `${props.resourceNameTruncated}_openid_pass_role_policy`,
          policyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['iam:PassRole'],
                Resource: cdk.Fn.conditionIf(
                  'ShouldNotCreateEnvResources',
                  `arn:aws:iam:::role/${props.resourceNameTruncated}_openid_pass_role_policy`,
                  cdk.Fn.join('', [`arn:aws:iam:::role/${props.resourceNameTruncated}_openid_pass_role_policy`, '-', cdk.Fn.ref('env')]),
                ),
              },
            ],
          },
        },
      ],
    });
    // TODO
    this.openIdLambdaRole!.node.addDependency(this.userPoolClientInputs!.node!.defaultChild!);
    // lambda function
    /**
     *   Lambda which sets MFA config values
         Depends on MFALambdaRole for role ARN
     */
    this.openIdLambda = new lambda.CfnFunction(this, 'OpenIdLambda', {
      code: {
        zipFile: fs.readFileSync(openIdLambdaFilePath, 'utf-8'),
      },
      handler: 'index.handler',
      role: cdk.Fn.getAtt('OpenIdLambdaRole', 'Arn').toString(),
      runtime: 'nodejs14.x',
      timeout: 300,
    });
    this.openIdLambda.addDependsOn(this.openIdLambdaRole);

    // OPenId lambda policy
    /**
    # Sets policy for the role that executes the OpenId Lambda
    # Depends on OpenIdLambda for Arn
    # Marked as depending on MFALambda for easier to understand CFN sequencing
     */
    this.openIdLambdaIAMPolicy = new iam.CfnPolicy(this, 'OpenIdLambdaIAMPolicy', {
      policyName: `${props.resourceNameTruncated}_openid_lambda_iam_policy`,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['iam:CreateOpenIDConnectProvider', 'iam:GetOpenIDConnectProvider', 'iam:AddClientIDToOpenIDConnectProvider'],
            Resource: cdk.Fn.sub('arn:aws:iam::${account}:oidc-provider/accounts.google.com', {
              account: cdk.Fn.ref('AWS::AccountId'),
            }),
          },
          {
            Effect: 'Allow',
            Action: ['iam:ListOpenIDConnectProviders'],
            Resource: cdk.Fn.sub('arn:aws:iam::${account}:oidc-provider/${selector}', {
              account: cdk.Fn.ref('AWS::AccountId'),
              selector: '*',
            }),
          },
        ],
      },
      roles: [
        cdk.Fn.conditionIf(
          'ShouldNotCreateEnvResources',
          `${props.resourceNameTruncated}_openid_lambda_role`,
          cdk.Fn.join('', [`${props.resourceNameTruncated}_openid_lambda_role`, '-', cdk.Fn.ref('env')]),
        ).toString(),
      ],
    });
    this.openIdLambdaIAMPolicy.addDependsOn(this.openIdLambda);

    // openId Log policy
    /**
    # Sets log policy for the role that executes the OpenId  Lambda
    # Depends on OpenIdLambda for Arn
    # Marked as depending on UserPoolClientLambdaPolicy for easier to understand CFN sequencing
     */

    this.openIdLogPolicy = new iam.CfnPolicy(this, 'OpenIdLogPolicy', {
      policyName: `${props.resourceNameTruncated}_openid_lambda_log_policy`,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
            Resource: cdk.Fn.sub('arn:aws:logs:${region}:${account}:log-group:/aws/lambda/${lambda}:log-stream:*', {
              region: cdk.Fn.ref('AWS::Region'),
              account: cdk.Fn.ref('AWS::AccountId'),
              lambda: cdk.Fn.ref('OpenIdLambda'),
            }),
          },
        ],
      },
      roles: [
        cdk.Fn.conditionIf(
          'ShouldNotCreateEnvResources',
          `${props.resourceNameTruncated}_openid_lambda_role`,
          cdk.Fn.join('', [`${props.resourceNameTruncated}_openid_lambda_role`, '-', cdk.Fn.ref('env')]),
        ).toString(),
      ],
    });
    this.openIdLogPolicy.addDependsOn(this.openIdLambdaIAMPolicy);

    // openId Custom Resource
    /**
      # Values passed to OpenId Lambda
      # Depends on OpenId for Arn
      # Marked as depending on OpenIdLogPolicy for easier to understand CFN sequencing
     */
    this.openIdLambdaInputs = new cdk.CustomResource(this, 'OpenIdLambdaInputs', {
      serviceToken: this.openIdLambda.attrArn,
      resourceType: 'Custom::LambdaCallout',
      properties: {
        clientIdList: props.audiences?.join(),
        url: 'https://accounts.google.com',
      },
    });
    this.openIdLambdaInputs.node.addDependency(this.openIdLogPolicy);
  }

  generateIAMPolicies = (props: CognitoStackOptions): void => {
    let resource: string;
    props.permissions?.forEach(permission => {
      if (permission.resource.paramType === 'string') {
        resource = permission.resource.keys as string;
      }
      if (permission.resource.paramType === '!GetAtt') {
        resource = cdk.Fn.getAtt(permission.resource.keys[0], permission.resource.keys[1]).toString();
      }
      if (permission.resource.paramType === '!Ref') {
        resource = cdk.Fn.ref(permission.resource.keys as string);
      }
      const resourceKey = `${props.resourceName}${permission.trigger}${permission.policyName}`;
      this.lambdaTriggerPermissions![resourceKey] = new iam.CfnPolicy(this, resourceKey, {
        policyName: resourceKey,
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: permission.effect,
              Action: permission.actions,
              Resource: resource,
            },
          ],
        },
        roles: [cdk.Fn.join('', [`${props.resourceName}${permission.trigger}`, '-', cdk.Fn.ref('env')])],
      });
    });
  };
}
