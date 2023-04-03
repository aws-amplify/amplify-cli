"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmplifyAuthCognitoStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const cognito = __importStar(require("aws-cdk-lib/aws-cognito"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const fs = __importStar(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const constants_1 = require("../constants");
const configure_sms_1 = require("../utils/configure-sms");
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
const authProvidersList = {
    'graph.facebook.com': 'facebookAppId',
    'accounts.google.com': 'googleClientId',
    'www.amazon.com': 'amazonAppId',
    'appleid.apple.com': 'appleAppId',
};
class AmplifyAuthCognitoStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        this._cfnParameterMap = new Map();
        this._cfnConditionMap = new Map();
        this._cfnOutputMap = new Map();
        this._cfnMappingMap = new Map();
        this._cfnResourceMap = new Map();
        this.generateCognitoStackResources = async (props) => {
            var _a, _b, _c, _d;
            const autoVerifiedAttributes = props.autoVerifiedAttributes
                ? props.autoVerifiedAttributes
                    .concat(props.aliasAttributes ? props.aliasAttributes : [])
                    .filter((attr, i, aliasAttributeArray) => ['email', 'phone_number'].includes(attr) && aliasAttributeArray.indexOf(attr) === i)
                : [];
            const configureSMS = (0, configure_sms_1.configureSmsOption)(props);
            if (props.verificationBucketName) {
                this.customMessageConfirmationBucket = new s3.CfnBucket(this, 'CustomMessageConfirmationBucket', {
                    bucketName: cdk.Fn.conditionIf('ShouldNotCreateEnvResources', cdk.Fn.ref('verificationBucketName'), cdk.Fn.join('-', [cdk.Fn.ref('verificationBucketName'), cdk.Fn.ref('env')])).toString(),
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
                        roleName: cdk.Fn.conditionIf('ShouldNotCreateEnvResources', `${props.resourceNameTruncated}_sns-role`, cdk.Fn.join('', [
                            'sns',
                            `${props.sharedId}`,
                            cdk.Fn.select(3, cdk.Fn.split('-', cdk.Fn.ref('AWS::StackName'))),
                            '-',
                            cdk.Fn.ref('env'),
                        ])).toString(),
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
                    userPoolName: cdk.Fn.conditionIf('ShouldNotCreateEnvResources', cdk.Fn.ref('userPoolName'), cdk.Fn.join('', [cdk.Fn.ref('userPoolName'), '-', cdk.Fn.ref('env')])).toString(),
                    policies: {
                        passwordPolicy: {
                            minimumLength: cdk.Fn.ref('passwordPolicyMinLength'),
                            requireLowercase: props.passwordPolicyCharacters.includes('Requires Lowercase'),
                            requireNumbers: props.passwordPolicyCharacters.includes('Requires Numbers'),
                            requireSymbols: props.passwordPolicyCharacters.includes('Requires Symbols'),
                            requireUppercase: props.passwordPolicyCharacters.includes('Requires Uppercase'),
                        },
                    },
                });
                if (props.usernameCaseSensitive !== undefined) {
                    this.userPool.usernameConfiguration = {
                        caseSensitive: props.usernameCaseSensitive,
                    };
                }
                if (props.requiredAttributes && props.requiredAttributes.length > 0) {
                    const schemaAttributes = [];
                    props.requiredAttributes.forEach((attr) => {
                        schemaAttributes.push({
                            name: attr,
                            required: true,
                            mutable: true,
                        });
                    });
                    this.userPool.schema = schemaAttributes;
                }
                if (!props.breakCircularDependency && props.triggers && props.dependsOn) {
                    props.dependsOn.forEach((trigger) => {
                        if (trigger.resourceName.includes('CreateAuthChallenge')) {
                            this.userPool.lambdaConfig = {
                                createAuthChallenge: cdk.Fn.ref(`function${props.resourceName}${'CreateAuthChallenge'}Arn`),
                            };
                        }
                        if (trigger.resourceName.includes('CustomMessage')) {
                            this.userPool.lambdaConfig = {
                                ...this.userPool.lambdaConfig,
                                customMessage: cdk.Fn.ref(`function${props.resourceName}${'CustomMessage'}Arn`),
                            };
                        }
                        if (trigger.resourceName.includes('DefineAuthChallenge')) {
                            this.userPool.lambdaConfig = {
                                ...this.userPool.lambdaConfig,
                                defineAuthChallenge: cdk.Fn.ref(`function${props.resourceName}${'DefineAuthChallenge'}Arn`),
                            };
                        }
                        if (trigger.resourceName.includes('PostAuthentication')) {
                            this.userPool.lambdaConfig = {
                                ...this.userPool.lambdaConfig,
                                postAuthentication: cdk.Fn.ref(`function${props.resourceName}${'PostAuthentication'}Arn`),
                            };
                        }
                        if (trigger.resourceName.includes('PostConfirmation')) {
                            this.userPool.lambdaConfig = {
                                ...this.userPool.lambdaConfig,
                                postConfirmation: cdk.Fn.ref(`function${props.resourceName}${'PostConfirmation'}Arn`),
                            };
                        }
                        if (trigger.resourceName.includes('PreAuthentication')) {
                            this.userPool.lambdaConfig = {
                                ...this.userPool.lambdaConfig,
                                preAuthentication: cdk.Fn.ref(`function${props.resourceName}${'PreAuthentication'}Arn`),
                            };
                        }
                        if (trigger.resourceName.includes('PreSignup')) {
                            this.userPool.lambdaConfig = {
                                ...this.userPool.lambdaConfig,
                                preSignUp: cdk.Fn.ref(`function${props.resourceName}${'PreSignup'}Arn`),
                            };
                        }
                        if (trigger.resourceName.includes('PreTokenGeneration')) {
                            this.userPool.lambdaConfig = {
                                ...this.userPool.lambdaConfig,
                                preTokenGeneration: cdk.Fn.ref(`function${props.resourceName}${'PreTokenGeneration'}Arn`),
                            };
                        }
                        if (trigger.resourceName.includes('VerifyAuthChallengeResponse')) {
                            this.userPool.lambdaConfig = {
                                ...this.userPool.lambdaConfig,
                                verifyAuthChallengeResponse: cdk.Fn.ref(`function${props.resourceName}${'VerifyAuthChallengeResponse'}Arn`),
                            };
                        }
                    });
                }
                if (autoVerifiedAttributes && autoVerifiedAttributes.length > 0) {
                    this.userPool.autoVerifiedAttributes = autoVerifiedAttributes;
                    this.userPool.userAttributeUpdateSettings = {
                        attributesRequireVerificationBeforeUpdate: autoVerifiedAttributes,
                    };
                }
                if (autoVerifiedAttributes.includes('email')) {
                    this.userPool.emailVerificationMessage = cdk.Fn.ref('emailVerificationMessage');
                    this.userPool.emailVerificationSubject = cdk.Fn.ref('emailVerificationSubject');
                }
                if (props.usernameAttributes && props.usernameAttributes[0] !== 'username') {
                    this.userPool.usernameAttributes = cdk.Fn.ref('usernameAttributes');
                }
                if (props.aliasAttributes && props.aliasAttributes.length > 0) {
                    this.userPool.aliasAttributes = cdk.Fn.ref('aliasAttributes');
                }
                this.userPool.mfaConfiguration = cdk.Fn.ref('mfaConfiguration');
                if (props.useEnabledMfas && props.mfaConfiguration !== 'OFF') {
                    if (configureSMS) {
                        this.userPool.enabledMfas = ['SMS_MFA'];
                    }
                    if (!lodash_1.default.isEmpty(props.mfaTypes) && props.mfaTypes.includes('TOTP')) {
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
                    this.userPool.addDependency(this.snsRole);
                }
                if (!props.breakCircularDependency && props.triggers && props.dependsOn) {
                    props.dependsOn.forEach((trigger) => {
                        LambdaTriggersKeys.forEach((key) => {
                            if (trigger.resourceName.includes(key)) {
                                const resourceKey = `UserPool${key}LambdaInvokePermission`;
                                this.lambdaConfigPermissions[`${resourceKey}`] = new lambda.CfnPermission(this, `${resourceKey}`, {
                                    action: 'lambda:invokeFunction',
                                    principal: 'cognito-idp.amazonaws.com',
                                    functionName: cdk.Fn.ref(`function${props.resourceName}${key}Name`),
                                    sourceArn: cdk.Fn.getAtt('UserPool', 'Arn').toString(),
                                });
                            }
                        });
                    });
                    if (!lodash_1.default.isEmpty(props.permissions)) {
                        this.generateIAMPolicies(props);
                    }
                }
                this.userPoolClientWeb = new cognito.CfnUserPoolClient(this, 'UserPoolClientWeb', {
                    userPoolId: cdk.Fn.ref('UserPool'),
                    clientName: `${props.resourceNameTruncated}_app_clientWeb`,
                    tokenValidityUnits: {
                        refreshToken: 'days',
                    },
                });
                if (props.userpoolClientSetAttributes) {
                    this.userPoolClientWeb.readAttributes = (_a = this._cfnParameterMap.get('userpoolClientReadAttributes')) === null || _a === void 0 ? void 0 : _a.valueAsList;
                    this.userPoolClientWeb.writeAttributes = (_b = this._cfnParameterMap.get('userpoolClientWriteAttributes')) === null || _b === void 0 ? void 0 : _b.valueAsList;
                }
                this.userPoolClientWeb.refreshTokenValidity = cdk.Fn.ref('userpoolClientRefreshTokenValidity');
                this.userPoolClientWeb.addDependency(this.userPool);
                this.userPoolClient = new cognito.CfnUserPoolClient(this, 'UserPoolClient', {
                    userPoolId: cdk.Fn.ref('UserPool'),
                    clientName: `${props.resourceNameTruncated}_app_client`,
                    tokenValidityUnits: {
                        refreshToken: 'days',
                    },
                });
                if (props.userpoolClientSetAttributes) {
                    this.userPoolClient.readAttributes = (_c = this._cfnParameterMap.get('userpoolClientReadAttributes')) === null || _c === void 0 ? void 0 : _c.valueAsList;
                    this.userPoolClient.writeAttributes = (_d = this._cfnParameterMap.get('userpoolClientWriteAttributes')) === null || _d === void 0 ? void 0 : _d.valueAsList;
                }
                this.userPoolClient.refreshTokenValidity = cdk.Fn.ref('userpoolClientRefreshTokenValidity');
                this.userPoolClient.generateSecret = cdk.Fn.ref('userpoolClientGenerateSecret');
                this.userPoolClient.addDependency(this.userPool);
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
                if (!props.useEnabledMfas && props.mfaConfiguration !== 'OFF') {
                    this.createMFACustomResource(props);
                }
            }
            if (props.authSelections === 'identityPoolAndUserPool' || props.authSelections === 'identityPoolOnly') {
                if (props.audiences && props.audiences.length > 0) {
                    this.createOpenIdLambdaCustomResource(props);
                }
                this.identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
                    identityPoolName: cdk.Fn.conditionIf('ShouldNotCreateEnvResources', props.identityPoolName, cdk.Fn.join('', [`${props.identityPoolName}`, '__', cdk.Fn.ref('env')])).toString(),
                    allowUnauthenticatedIdentities: cdk.Fn.ref('allowUnauthenticatedIdentities'),
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
                if (props.authProviders &&
                    !lodash_1.default.isEmpty(props.authProviders) &&
                    !(Object.keys(props.authProviders).length === 1 && props.authProviders[0] === 'accounts.google.com' && props.audiences)) {
                    this.identityPool.supportedLoginProviders = cdk.Lazy.any({
                        produce: () => {
                            var _a;
                            const supportedProvider = {};
                            (_a = props.authProviders) === null || _a === void 0 ? void 0 : _a.forEach((provider) => {
                                if (Object.keys(authProvidersList).includes(provider)) {
                                    supportedProvider[provider] = cdk.Fn.ref(authProvidersList[provider]);
                                }
                            });
                            return supportedProvider;
                        },
                    });
                }
                if (props.audiences && props.audiences.length > 0) {
                    this.identityPool.openIdConnectProviderArns = [cdk.Fn.getAtt('OpenIdLambdaInputs', 'providerArn').toString()];
                    this.identityPool.node.addDependency(this.openIdLambdaInputs.node.defaultChild);
                }
                if ((!props.audiences || props.audiences.length === 0) && props.authSelections !== 'identityPoolOnly') {
                    this.identityPool.node.addDependency(this.userPoolClientInputs.node.defaultChild);
                }
                this.identityPoolRoleMap = new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleMap', {
                    identityPoolId: cdk.Fn.ref('IdentityPool'),
                    roles: {
                        unauthenticated: cdk.Fn.ref('unauthRoleArn'),
                        authenticated: cdk.Fn.ref('authRoleArn'),
                    },
                });
                this.identityPoolRoleMap.addDependency(this.identityPool);
            }
        };
        this.renderCloudFormationTemplate = () => amplify_cli_core_1.JSONUtilities.stringify(this._toCloudFormation());
        this.generateIAMPolicies = (props) => {
            var _a;
            let resource;
            (_a = props.permissions) === null || _a === void 0 ? void 0 : _a.forEach((permission) => {
                if (permission.resource.paramType === 'string') {
                    resource = permission.resource.keys;
                }
                if (permission.resource.paramType === '!GetAtt') {
                    resource = cdk.Fn.getAtt(permission.resource.keys[0], permission.resource.keys[1]).toString();
                }
                if (permission.resource.paramType === '!Ref') {
                    resource = cdk.Fn.ref(permission.resource.keys);
                }
                const resourceKey = `${props.resourceName}${permission.trigger}${permission.policyName}`;
                this.lambdaTriggerPermissions[resourceKey] = new iam.CfnPolicy(this, resourceKey, {
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
        this._scope = scope;
        this.templateOptions.templateFormatVersion = CFN_TEMPLATE_FORMAT_VERSION;
        this.templateOptions.description = ROOT_CFN_DESCRIPTION;
        this.lambdaConfigPermissions = {};
        this.lambdaTriggerPermissions = {};
    }
    addCfnResource(props, logicalId) {
        if (!this._cfnResourceMap.has(logicalId)) {
            this._cfnResourceMap.set(logicalId, new cdk.CfnResource(this, logicalId, props));
        }
        else {
            throw new Error(`Cfn Resource with LogicalId ${logicalId} already exists`);
        }
    }
    getCfnOutput(logicalId) {
        if (this._cfnOutputMap.has(logicalId)) {
            return this._cfnOutputMap.get(logicalId);
        }
        throw new Error(`Cfn Output with LogicalId ${logicalId} doesn't exist`);
    }
    getCfnMapping(logicalId) {
        if (this._cfnMappingMap.has(logicalId)) {
            return this._cfnMappingMap.get(logicalId);
        }
        throw new Error(`Cfn Mapping with LogicalId ${logicalId} doesn't exist`);
    }
    addCfnOutput(props, logicalId) {
        if (!this._cfnOutputMap.has(logicalId)) {
            this._cfnOutputMap.set(logicalId, new cdk.CfnOutput(this, logicalId, props));
        }
        else {
            throw new Error(`Cfn Parameter with LogicalId ${logicalId} already exists`);
        }
    }
    addCfnMapping(props, logicalId) {
        if (!this._cfnMappingMap.has(logicalId)) {
            this._cfnMappingMap.set(logicalId, new cdk.CfnMapping(this, logicalId, props));
        }
        else {
            throw new Error(`Cfn Parameter with LogicalId ${logicalId} already exists`);
        }
    }
    addCfnCondition(props, logicalId) {
        if (!this._cfnConditionMap.has(logicalId)) {
            this._cfnConditionMap.set(logicalId, new cdk.CfnCondition(this, logicalId, props));
        }
        else {
            throw new Error(`Cfn Parameter with LogicalId ${logicalId} already exists`);
        }
    }
    addCfnParameter(props, logicalId) {
        if (!this._cfnParameterMap.has(logicalId)) {
            this._cfnParameterMap.set(logicalId, new cdk.CfnParameter(this, logicalId, props));
        }
        else {
            throw new Error(`Cfn Parameter with LogicalId ${logicalId} already exists`);
        }
    }
    getCfnParameter(logicalId) {
        if (this._cfnParameterMap.has(logicalId)) {
            return this._cfnParameterMap.get(logicalId);
        }
        throw new Error(`Cfn Parameter with LogicalId ${logicalId} doesn't exist`);
    }
    getCfnCondition(logicalId) {
        if (this._cfnConditionMap.has(logicalId)) {
            return this._cfnConditionMap.get(logicalId);
        }
        throw new Error(`Cfn Condition with LogicalId ${logicalId} doesn't exist`);
    }
    createUserPoolClientCustomResource(props) {
        this.userPoolClientRole = new iam.CfnRole(this, 'UserPoolClientRole', {
            roleName: cdk.Fn.conditionIf('ShouldNotCreateEnvResources', cdk.Fn.ref('userpoolClientLambdaRole'), cdk.Fn.join('', [
                'upClientLambdaRole',
                `${props.sharedId}`,
                cdk.Fn.select(3, cdk.Fn.split('-', cdk.Fn.ref('AWS::StackName'))),
                '-',
                cdk.Fn.ref('env'),
            ])).toString(),
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
        this.userPoolClientRole.addDependency(this.userPoolClient);
        this.userPoolClientLambda = new lambda.CfnFunction(this, 'UserPoolClientLambda', {
            code: {
                zipFile: fs.readFileSync(constants_1.userPoolClientLambdaFilePath, 'utf-8'),
            },
            handler: 'index.handler',
            role: cdk.Fn.getAtt('UserPoolClientRole', 'Arn').toString(),
            runtime: 'nodejs16.x',
            timeout: 300,
        });
        this.userPoolClientLambda.addDependency(this.userPoolClientRole);
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
        this.userPoolClientLambdaPolicy.addDependency(this.userPoolClientLambda);
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
        this.userPoolClientLogPolicy.addDependency(this.userPoolClientLambdaPolicy);
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
    createHostedUICustomResource() {
        this.hostedUICustomResource = new lambda.CfnFunction(this, 'HostedUICustomResource', {
            code: {
                zipFile: fs.readFileSync(constants_1.hostedUILambdaFilePath, 'utf-8'),
            },
            handler: 'index.handler',
            role: cdk.Fn.getAtt('UserPoolClientRole', 'Arn').toString(),
            runtime: 'nodejs16.x',
            timeout: 300,
        });
        this.hostedUICustomResource.addDependency(this.userPoolClientRole);
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
        this.hostedUICustomResourcePolicy.addDependency(this.hostedUICustomResource);
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
        this.hostedUICustomResourceLogPolicy.addDependency(this.hostedUICustomResourcePolicy);
        this.hostedUICustomResourceInputs = new cdk.CustomResource(this, 'HostedUICustomResourceInputs', {
            serviceToken: this.hostedUICustomResource.attrArn,
            resourceType: 'Custom::LambdaCallout',
            properties: {
                hostedUIDomainName: cdk.Fn.conditionIf('ShouldNotCreateEnvResources', cdk.Fn.ref('hostedUIDomainName'), cdk.Fn.join('-', [cdk.Fn.ref('hostedUIDomainName'), cdk.Fn.ref('env')])),
                userPoolId: cdk.Fn.ref('UserPool'),
            },
        });
        this.hostedUICustomResourceInputs.node.addDependency(this.hostedUICustomResourceLogPolicy);
    }
    createHostedUIProviderCustomResource() {
        this.hostedUIProvidersCustomResource = new lambda.CfnFunction(this, 'HostedUIProvidersCustomResource', {
            code: {
                zipFile: fs.readFileSync(constants_1.hostedUIProviderLambdaFilePath, 'utf-8'),
            },
            handler: 'index.handler',
            role: cdk.Fn.getAtt('UserPoolClientRole', 'Arn').toString(),
            runtime: 'nodejs16.x',
            timeout: 300,
        });
        this.hostedUIProvidersCustomResource.addDependency(this.userPoolClientRole);
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
        this.hostedUIProvidersCustomResourcePolicy.addDependency(this.hostedUIProvidersCustomResource);
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
        this.hostedUIProvidersCustomResourceLogPolicy.addDependency(this.hostedUIProvidersCustomResourcePolicy);
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
    createOAuthCustomResource() {
        this.oAuthCustomResource = new lambda.CfnFunction(this, 'OAuthCustomResource', {
            code: {
                zipFile: fs.readFileSync(constants_1.oauthLambdaFilePath, 'utf-8'),
            },
            handler: 'index.handler',
            role: cdk.Fn.getAtt('UserPoolClientRole', 'Arn').toString(),
            runtime: 'nodejs16.x',
            timeout: 300,
        });
        this.oAuthCustomResource.node.addDependency(this.hostedUICustomResourceInputs.node.defaultChild);
        this.oAuthCustomResource.node.addDependency(this.hostedUIProvidersCustomResourceInputs.node.defaultChild);
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
        this.oAuthCustomResourcePolicy.addDependency(this.oAuthCustomResource);
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
        this.oAuthCustomResourceLogPolicy.addDependency(this.oAuthCustomResourcePolicy);
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
    createMFACustomResource(props) {
        this.mfaLambdaRole = new iam.CfnRole(this, 'MFALambdaRole', {
            roleName: cdk.Fn.conditionIf('ShouldNotCreateEnvResources', `${props.resourceNameTruncated}_totp_lambda_role`, cdk.Fn.join('', [`${props.resourceNameTruncated}_totp_lambda_role`, '-', cdk.Fn.ref('env')])).toString(),
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
                                Resource: cdk.Fn.conditionIf('ShouldNotCreateEnvResources', `arn:aws:iam:::role/${props.resourceNameTruncated}_totp_lambda_role`, cdk.Fn.join('', [`arn:aws:iam:::role/${props.resourceNameTruncated}__totp_lambda_role`, '-', cdk.Fn.ref('env')])),
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
        this.mfaLambdaRole.addDependency(this.snsRole);
        this.mfaLambda = new lambda.CfnFunction(this, 'MFALambda', {
            code: {
                zipFile: fs.readFileSync(constants_1.mfaLambdaFilePath, 'utf-8'),
            },
            handler: 'index.handler',
            role: cdk.Fn.getAtt('MFALambdaRole', 'Arn').toString(),
            runtime: 'nodejs16.x',
            timeout: 300,
        });
        this.mfaLambda.addDependency(this.mfaLambdaRole);
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
                cdk.Fn.conditionIf('ShouldNotCreateEnvResources', `${props.resourceNameTruncated}_totp_lambda_role`, cdk.Fn.join('', [`${props.resourceNameTruncated}_totp_lambda_role`, '-', cdk.Fn.ref('env')])).toString(),
            ],
        });
        this.mfaLambdaPolicy.addDependency(this.mfaLambda);
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
                cdk.Fn.conditionIf('ShouldNotCreateEnvResources', `${props.resourceNameTruncated}_totp_lambda_role`, cdk.Fn.join('', [`${props.resourceNameTruncated}_totp_lambda_role`, '-', cdk.Fn.ref('env')])).toString(),
            ],
        });
        this.mfaLogPolicy.addDependency(this.mfaLambdaPolicy);
        this.mfaLambdaInputs = new cdk.CustomResource(this, 'MFALambdaInputs', {
            serviceToken: this.mfaLambda.attrArn,
            resourceType: 'Custom::LambdaCallout',
            properties: {
                mfaConfiguration: cdk.Fn.ref('mfaConfiguration'),
                totpEnabled: props.mfaTypes.includes('TOTP'),
                smsConfigCaller: cdk.Fn.getAtt('SNSRole', 'Arn'),
                smsAuthenticationMessage: cdk.Fn.ref('smsAuthenticationMessage'),
                smsConfigExternalId: `${props.resourceNameTruncated}_role_external_id`,
                userPoolId: cdk.Fn.ref('UserPool'),
            },
        });
        this.mfaLambdaInputs.node.addDependency(this.mfaLogPolicy);
    }
    createOpenIdLambdaCustomResource(props) {
        var _a;
        this.openIdLambdaRole = new iam.CfnRole(this, 'OpenIdLambdaRole', {
            roleName: cdk.Fn.conditionIf('ShouldNotCreateEnvResources', `${props.resourceNameTruncated}_openid_lambda_role`, cdk.Fn.join('', [`${props.resourceNameTruncated}_openid_lambda_role`, '-', cdk.Fn.ref('env')])).toString(),
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
                                Resource: cdk.Fn.conditionIf('ShouldNotCreateEnvResources', `arn:aws:iam:::role/${props.resourceNameTruncated}_openid_pass_role_policy`, cdk.Fn.join('', [`arn:aws:iam:::role/${props.resourceNameTruncated}_openid_pass_role_policy`, '-', cdk.Fn.ref('env')])),
                            },
                        ],
                    },
                },
            ],
        });
        this.openIdLambdaRole.node.addDependency(this.userPoolClientInputs.node.defaultChild);
        this.openIdLambda = new lambda.CfnFunction(this, 'OpenIdLambda', {
            code: {
                zipFile: fs.readFileSync(constants_1.openIdLambdaFilePath, 'utf-8'),
            },
            handler: 'index.handler',
            role: cdk.Fn.getAtt('OpenIdLambdaRole', 'Arn').toString(),
            runtime: 'nodejs16.x',
            timeout: 300,
        });
        this.openIdLambda.addDependency(this.openIdLambdaRole);
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
                cdk.Fn.conditionIf('ShouldNotCreateEnvResources', `${props.resourceNameTruncated}_openid_lambda_role`, cdk.Fn.join('', [`${props.resourceNameTruncated}_openid_lambda_role`, '-', cdk.Fn.ref('env')])).toString(),
            ],
        });
        this.openIdLambdaIAMPolicy.addDependency(this.openIdLambda);
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
                cdk.Fn.conditionIf('ShouldNotCreateEnvResources', `${props.resourceNameTruncated}_openid_lambda_role`, cdk.Fn.join('', [`${props.resourceNameTruncated}_openid_lambda_role`, '-', cdk.Fn.ref('env')])).toString(),
            ],
        });
        this.openIdLogPolicy.addDependency(this.openIdLambdaIAMPolicy);
        this.openIdLambdaInputs = new cdk.CustomResource(this, 'OpenIdLambdaInputs', {
            serviceToken: this.openIdLambda.attrArn,
            resourceType: 'Custom::LambdaCallout',
            properties: {
                clientIdList: (_a = props.audiences) === null || _a === void 0 ? void 0 : _a.join(),
                url: 'https://accounts.google.com',
            },
        });
        this.openIdLambdaInputs.node.addDependency(this.openIdLogPolicy);
    }
}
exports.AmplifyAuthCognitoStack = AmplifyAuthCognitoStack;
//# sourceMappingURL=auth-cognito-stack-builder.js.map