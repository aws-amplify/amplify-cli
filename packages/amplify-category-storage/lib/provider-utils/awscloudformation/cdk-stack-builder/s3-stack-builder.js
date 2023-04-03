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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmplifyS3ResourceCfnStack = void 0;
const iamCdk = __importStar(require("aws-cdk-lib/aws-iam"));
const lambdaCdk = __importStar(require("aws-cdk-lib/aws-lambda"));
const s3Cdk = __importStar(require("aws-cdk-lib/aws-s3"));
const aws_s3_1 = require("aws-cdk-lib/aws-s3");
const cdk = __importStar(require("aws-cdk-lib"));
const amplify_cli_core_1 = require("amplify-cli-core");
const s3_user_input_types_1 = require("../service-walkthrough-types/s3-user-input-types");
const s3AuthAPI = __importStar(require("../service-walkthroughs/s3-auth-api"));
const s3_user_input_state_1 = require("../service-walkthroughs/s3-user-input-state");
const types_1 = require("./types");
class AmplifyS3ResourceCfnStack extends types_1.AmplifyResourceCfnStack {
    constructor(scope, s3ResourceName, props, cfnInputParams) {
        super(scope, s3ResourceName);
        this.notificationConfiguration = {
            lambdaConfigurations: [],
        };
        this._props = (0, s3_user_input_types_1.defaultS3UserInputs)();
        this._cfnInputParams = {};
        this.createTriggerLambdaCFNParams = (triggerParameterName, triggerFunction) => {
            const triggerFunctionARN = `function${triggerFunction}Arn`;
            const triggerFunctionName = `function${triggerFunction}Name`;
            const triggerFunctionLambdaExecutionRole = `function${triggerFunction}LambdaExecutionRole`;
            const params = [triggerFunctionARN, triggerFunctionName, triggerFunctionLambdaExecutionRole];
            const s3CfnTriggerFunctionParams = params.map((param) => ({
                params: [param],
                paramType: 'String',
                default: param,
            }));
            s3CfnTriggerFunctionParams.push({
                params: [triggerParameterName],
                paramType: 'String',
            });
            return s3CfnTriggerFunctionParams;
        };
        this.emptyNotificationsConfiguration = () => ({
            lambdaConfigurations: [],
        });
        this.isAmplifyStackLegacy = () => {
            const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
            const stackName = amplifyMeta.providers.awscloudformation.StackName;
            return !stackName.startsWith('amplify-');
        };
        this.buildCORSRules = () => {
            const corsRule = {
                id: 'S3CORSRuleId1',
                maxAge: 3000,
                exposedHeaders: ['x-amz-server-side-encryption', 'x-amz-request-id', 'x-amz-id-2', 'ETag'],
                allowedHeaders: ['*'],
                allowedOrigins: ['*'],
                allowedMethods: [aws_s3_1.HttpMethods.GET, aws_s3_1.HttpMethods.HEAD, aws_s3_1.HttpMethods.PUT, aws_s3_1.HttpMethods.POST, aws_s3_1.HttpMethods.DELETE],
            };
            const corsConfig = {
                corsRules: [corsRule],
            };
            return corsConfig;
        };
        this.filterRuleAppendRegionToLambdaTriggerPrefix = (triggerPrefix) => {
            const regionRef = cdk.Fn.ref('AWS::Region');
            const filterRule = {
                name: 'prefix',
                value: cdk.Fn.join('', [triggerPrefix.prefix, regionRef]),
            };
            return filterRule;
        };
        this.filterRulePlainStringLambdaTriggerPrefix = (triggerPrefix) => {
            const filterRule = {
                name: 'prefix',
                value: triggerPrefix.prefix,
            };
            return filterRule;
        };
        this.buildTriggerPrefixRule = (triggerPrefix) => {
            if (triggerPrefix.prefixTransform === s3_user_input_types_1.S3TriggerPrefixTransform.ATTACH_REGION) {
                const filterRule = this.filterRuleAppendRegionToLambdaTriggerPrefix(triggerPrefix);
                return filterRule;
            }
            const filterRule = this.filterRulePlainStringLambdaTriggerPrefix(triggerPrefix);
            return filterRule;
        };
        this.createAndSetIAMPolicies = () => {
            if (this._cfnInputParams.s3PermissionsAuthenticatedPublic !== types_1.AmplifyBuildParamsPermissions.DISALLOW) {
                this.s3AuthPublicPolicy = this.createS3AuthPublicPolicy();
            }
            if (this._cfnInputParams.s3PermissionsAuthenticatedProtected !== types_1.AmplifyBuildParamsPermissions.DISALLOW) {
                this.s3AuthProtectedPolicy = this.createS3AuthProtectedPolicy();
            }
            if (this._cfnInputParams.s3PermissionsAuthenticatedPrivate !== types_1.AmplifyBuildParamsPermissions.DISALLOW) {
                this.s3AuthPrivatePolicy = this.createS3AuthPrivatePolicy();
            }
            if (this._cfnInputParams.s3PermissionsAuthenticatedUploads !== types_1.AmplifyBuildParamsPermissions.DISALLOW) {
                this.s3AuthUploadPolicy = this.createS3AuthUploadPolicy();
            }
            if (this._cfnInputParams.s3PermissionsGuestPublic !== types_1.AmplifyBuildParamsPermissions.DISALLOW) {
                this.s3GuestPublicPolicy = this.createS3GuestPublicPolicy();
            }
            if (this._cfnInputParams.s3PermissionsGuestUploads !== types_1.AmplifyBuildParamsPermissions.DISALLOW) {
                this.s3GuestUploadPolicy = this.createGuestUploadsPolicy();
            }
            this.s3AuthReadPolicy = this.createS3AuthReadPolicy();
            this.s3GuestReadPolicy = this.createS3GuestReadPolicy();
        };
        this.createS3IAMPolicyDocument = (refStr, pathStr, actionStr, effect) => {
            const props = {
                resources: [cdk.Fn.join('', ['arn:aws:s3:::', cdk.Fn.ref(refStr), pathStr])],
                actions: cdk.Fn.split(',', cdk.Fn.ref(actionStr)),
                effect,
            };
            const policyDocument = new iamCdk.PolicyDocument();
            const policyStatement = new iamCdk.PolicyStatement(props);
            policyDocument.addStatements(policyStatement);
            return policyDocument;
        };
        this.createMultiStatementIAMPolicyDocument = (policyStatements) => {
            const policyDocument = new iamCdk.PolicyDocument();
            policyStatements.forEach((policyStatement) => {
                const props = {
                    resources: policyStatement.pathStr
                        ? [cdk.Fn.join('', ['arn:aws:s3:::', cdk.Fn.ref(policyStatement.refStr), policyStatement.pathStr])]
                        : [cdk.Fn.join('', ['arn:aws:s3:::', cdk.Fn.ref(policyStatement.refStr)])],
                    conditions: policyStatement.conditions,
                    actions: policyStatement.actions,
                    effect: policyStatement.effect,
                };
                const statement = new iamCdk.PolicyStatement(props);
                policyDocument.addStatements(statement);
            });
            return policyDocument;
        };
        this.createS3AuthPublicPolicy = () => {
            const policyDefinition = {
                logicalId: 'S3AuthPublicPolicy',
                isPolicyNameAbsolute: false,
                policyNameRef: 's3PublicPolicy',
                roleRefs: ['authRoleName'],
                condition: this.conditions.CreateAuthPublic,
                statements: [
                    {
                        refStr: 'S3Bucket',
                        pathStr: '/public/*',
                        actions: ['s3PermissionsAuthenticatedPublic'],
                        effect: iamCdk.Effect.ALLOW,
                    },
                ],
                dependsOn: [this.s3Bucket],
            };
            const policy = this.createIAMPolicy(policyDefinition, true);
            return policy;
        };
        this.createS3AuthProtectedPolicy = () => {
            const policyDefinition = {
                logicalId: 'S3AuthProtectedPolicy',
                isPolicyNameAbsolute: false,
                policyNameRef: 's3ProtectedPolicy',
                roleRefs: ['authRoleName'],
                condition: this.conditions.CreateAuthProtected,
                statements: [
                    {
                        refStr: 'S3Bucket',
                        pathStr: '/protected/${cognito-identity.amazonaws.com:sub}/*',
                        actions: ['s3PermissionsAuthenticatedProtected'],
                        effect: iamCdk.Effect.ALLOW,
                    },
                ],
                dependsOn: [this.s3Bucket],
            };
            const policy = this.createIAMPolicy(policyDefinition, true);
            return policy;
        };
        this.createS3AuthPrivatePolicy = () => {
            const policyDefinition = {
                logicalId: 'S3AuthPrivatePolicy',
                isPolicyNameAbsolute: false,
                policyNameRef: 's3PrivatePolicy',
                roleRefs: ['authRoleName'],
                condition: this.conditions.CreateAuthPrivate,
                statements: [
                    {
                        refStr: 'S3Bucket',
                        pathStr: '/private/${cognito-identity.amazonaws.com:sub}/*',
                        actions: ['s3PermissionsAuthenticatedPrivate'],
                        effect: iamCdk.Effect.ALLOW,
                    },
                ],
                dependsOn: [this.s3Bucket],
            };
            const policy = this.createIAMPolicy(policyDefinition, true);
            return policy;
        };
        this.createS3AuthUploadPolicy = () => {
            const policyDefinition = {
                logicalId: 'S3AuthUploadPolicy',
                isPolicyNameAbsolute: false,
                policyNameRef: 's3UploadsPolicy',
                roleRefs: ['authRoleName'],
                condition: this.conditions.CreateAuthUploads,
                statements: [
                    {
                        refStr: 'S3Bucket',
                        pathStr: '/uploads/*',
                        actions: ['s3PermissionsAuthenticatedUploads'],
                        effect: iamCdk.Effect.ALLOW,
                    },
                ],
                dependsOn: [this.s3Bucket],
            };
            const policy = this.createIAMPolicy(policyDefinition, true);
            return policy;
        };
        this.createS3GuestPublicPolicy = () => {
            const policyDefinition = {
                logicalId: 'S3GuestPublicPolicy',
                isPolicyNameAbsolute: false,
                policyNameRef: 's3PublicPolicy',
                roleRefs: ['unauthRoleName'],
                condition: this.conditions.CreateGuestPublic,
                statements: [
                    {
                        refStr: 'S3Bucket',
                        pathStr: '/public/*',
                        actions: ['s3PermissionsGuestPublic'],
                        effect: iamCdk.Effect.ALLOW,
                    },
                ],
                dependsOn: [this.s3Bucket],
            };
            const policy = this.createIAMPolicy(policyDefinition, true);
            return policy;
        };
        this.createGuestUploadsPolicy = () => {
            const policyDefinition = {
                logicalId: 'S3GuestUploadPolicy',
                isPolicyNameAbsolute: false,
                policyNameRef: 's3UploadsPolicy',
                roleRefs: ['unauthRoleName'],
                condition: this.conditions.CreateGuestUploads,
                statements: [
                    {
                        refStr: 'S3Bucket',
                        pathStr: '/uploads/*',
                        actions: ['s3PermissionsGuestUploads'],
                        effect: iamCdk.Effect.ALLOW,
                    },
                ],
                dependsOn: [this.s3Bucket],
            };
            const policy = this.createIAMPolicy(policyDefinition, true);
            return policy;
        };
        this.createS3AuthReadPolicy = () => {
            const policyDefinition = {
                logicalId: 'S3AuthReadPolicy',
                isPolicyNameAbsolute: false,
                policyNameRef: 's3ReadPolicy',
                roleRefs: ['authRoleName'],
                condition: this.conditions.CreateAuthReadAndList,
                statements: [
                    {
                        refStr: 'S3Bucket',
                        pathStr: '/protected/*',
                        actions: ['s3:GetObject'],
                        effect: iamCdk.Effect.ALLOW,
                    },
                    {
                        refStr: 'S3Bucket',
                        actions: ['s3:ListBucket'],
                        conditions: {
                            StringLike: {
                                's3:prefix': [
                                    'public/',
                                    'public/*',
                                    'protected/',
                                    'protected/*',
                                    'private/${cognito-identity.amazonaws.com:sub}/',
                                    'private/${cognito-identity.amazonaws.com:sub}/*',
                                ],
                            },
                        },
                        effect: iamCdk.Effect.ALLOW,
                    },
                ],
                dependsOn: [this.s3Bucket],
            };
            const policy = this.createMultiStatementIAMPolicy(policyDefinition);
            return policy;
        };
        this.createS3GuestReadPolicy = () => {
            const policyDefinition = {
                logicalId: 'S3GuestReadPolicy',
                isPolicyNameAbsolute: false,
                policyNameRef: 's3ReadPolicy',
                roleRefs: ['unauthRoleName'],
                condition: this.conditions.CreateGuestReadAndList,
                statements: [
                    {
                        refStr: 'S3Bucket',
                        pathStr: '/protected/*',
                        actions: ['s3:GetObject'],
                        effect: iamCdk.Effect.ALLOW,
                    },
                    {
                        refStr: 'S3Bucket',
                        actions: ['s3:ListBucket'],
                        conditions: {
                            StringLike: {
                                's3:prefix': ['public/', 'public/*', 'protected/', 'protected/*'],
                            },
                        },
                        effect: iamCdk.Effect.ALLOW,
                    },
                ],
                dependsOn: [this.s3Bucket],
            };
            const policy = this.createMultiStatementIAMPolicy(policyDefinition);
            return policy;
        };
        this.addFunctionToTriggerPolicyDefinition = (policyDefinition, functionName) => {
            const newRoleRef = `function${functionName}LambdaExecutionRole`;
            const newPolicyDefinition = policyDefinition;
            if (policyDefinition.roleRefs && policyDefinition.roleRefs.includes(newRoleRef)) {
                return policyDefinition;
            }
            newPolicyDefinition.roleRefs = policyDefinition.roleRefs ? policyDefinition.roleRefs.concat([newRoleRef]) : [newRoleRef];
            return newPolicyDefinition;
        };
        this.createTriggerPolicyFromPolicyDefinition = (policyDefinition) => {
            const policy = this.createIAMPolicy(policyDefinition, false);
            return policy;
        };
        this.buildResourceFromPolicyDefinition = (policyDefinitionStatement) => {
            const resourceStrArr = ['arn:aws:s3:::', { Ref: policyDefinitionStatement.refStr }];
            if (policyDefinitionStatement.pathStr && policyDefinitionStatement.pathStr.length > 0) {
                resourceStrArr.push(policyDefinitionStatement.pathStr);
            }
            return {
                'Fn::Join': ['', resourceStrArr],
            };
        };
        this.buildActionFromPolicyDefinition = (policyDefinitionStatement, IsActionRef) => {
            if (!policyDefinitionStatement.actions) {
                return [];
            }
            if (!policyDefinitionStatement.isActionAbsolute && IsActionRef === true) {
                const actionRef = policyDefinitionStatement.actions[0];
                const actions = {
                    'Fn::Split': [
                        ',',
                        {
                            Ref: actionRef,
                        },
                    ],
                };
                return actions;
            }
            return policyDefinitionStatement.actions;
        };
        this.createMultiStatementIAMPolicy = (policyDefinition) => {
            const props = {
                policyName: cdk.Fn.ref(policyDefinition.policyNameRef),
                roles: policyDefinition.roleRefs.map((roleRef) => cdk.Fn.ref(roleRef)),
                policyDocument: this.createMultiStatementIAMPolicyDocument(policyDefinition.statements),
            };
            const policy = new iamCdk.CfnPolicy(this, policyDefinition.logicalId, props);
            if (policyDefinition.dependsOn) {
                policyDefinition.dependsOn.map((dependency) => policy.addDependency(dependency));
            }
            if (policyDefinition.condition) {
                policy.cfnOptions.condition = policyDefinition.condition;
            }
            return policy;
        };
        this.buildGroupPolicyLogicalID = (groupName) => `${groupName}GroupPolicy`;
        this.buildGroupPolicyName = (groupName) => `${groupName}-group-s3-policy`;
        this.buildGroupRoleName = (groupName) => `${groupName}GroupRole`;
        this.buildCDKGroupRoles = (groupName, authResourceName) => {
            const roles = [cdk.Fn.join('', [cdk.Fn.ref(`auth${authResourceName}UserPoolId`), `-${this.buildGroupRoleName(groupName)}`])];
            return roles;
        };
        this._buildCDKGroupPolicyStatements = (groupPerms) => {
            const policyStatementList = [];
            const bucketArn = cdk.Fn.join('', ['arn:aws:s3:::', cdk.Fn.ref('S3Bucket')]).toString();
            const permissions = s3_user_input_state_1.S3InputState.getCfnPermissionsFromInputPermissions(groupPerms);
            policyStatementList.push(new iamCdk.PolicyStatement({
                resources: [`${bucketArn}/*`],
                actions: permissions,
                effect: iamCdk.Effect.ALLOW,
            }));
            if (groupPerms.includes(s3_user_input_types_1.S3PermissionType.READ)) {
                policyStatementList.push(new iamCdk.PolicyStatement({
                    resources: [`${bucketArn}`],
                    actions: [s3_user_input_state_1.S3CFNPermissionType.LIST],
                    effect: iamCdk.Effect.ALLOW,
                }));
            }
            return policyStatementList;
        };
        this._buildCDKGroupPolicyDocument = (policyStatementList) => {
            const policyDocument = new iamCdk.PolicyDocument();
            policyStatementList.forEach((policyStatement) => {
                policyDocument.addStatements(policyStatement);
            });
            return policyDocument;
        };
        this._setCFNParams = (paramDefinitions) => {
            paramDefinitions.params.forEach((paramName) => {
                const cfnParam = {
                    type: paramDefinitions.paramType,
                };
                if (paramDefinitions.default) {
                    cfnParam.default = paramDefinitions.default;
                }
                this.addCfnParameter(cfnParam, paramName);
            });
        };
        this.buildS3DependsOnFunctionCfn = (functionName) => {
            const s3DependsOnLambda = {
                category: 'function',
                resourceName: functionName,
                attributes: ['Name', 'Arn', 'LambdaExecutionRole'],
            };
            return s3DependsOnLambda;
        };
        this.buildS3DependsOnUserPoolIdCfn = (authResourceName) => {
            const dependsOnAuth = {
                category: 'auth',
                resourceName: authResourceName,
                attributes: ['UserPoolId'],
            };
            return dependsOnAuth;
        };
        this.buildS3DependsOnUserPoolGroupRoleListCfn = (selectedUserPoolGroupList) => {
            if (selectedUserPoolGroupList && selectedUserPoolGroupList.length > 0) {
                const userPoolGroupRoleList = selectedUserPoolGroupList.map((groupName) => {
                    const dependsOnAuth = {
                        category: 'auth',
                        resourceName: 'userPoolGroups',
                        attributes: [`${groupName}GroupRole`],
                    };
                    return dependsOnAuth;
                });
                return userPoolGroupRoleList;
            }
            return [];
        };
        this.scope = scope;
        this.id = s3ResourceName;
        this._props = props;
        this._cfnInputParams = cfnInputParams;
        this.templateOptions.templateFormatVersion = CFN_TEMPLATE_FORMAT_VERSION;
        this.templateOptions.description = S3_ROOT_CFN_DESCRIPTION;
        this.s3BucketName = this.buildBucketName();
        this.s3DependsOnResources = [];
        this.notificationConfiguration = {
            lambdaConfigurations: [],
        };
    }
    getGroupListFromProps() {
        const groupList = this._props.groupAccess ? Object.keys(this._props.groupAccess) : [];
        return groupList;
    }
    getS3ResourceFriendlyName() {
        return this.id;
    }
    getS3BucketName() {
        return this.s3BucketName;
    }
    getS3DependsOn() {
        return this.s3DependsOnResources;
    }
    _addNotificationsLambdaConfigurations(newLambdaConfigurations) {
        const existingLambdaConfigurations = this.notificationConfiguration.lambdaConfigurations;
        this.notificationConfiguration = {
            lambdaConfigurations: existingLambdaConfigurations.concat(newLambdaConfigurations),
        };
    }
    configureTriggerPolicy() {
        var _a;
        let s3TriggerPolicyDefinition;
        if (this._props.triggerFunction && this._props.triggerFunction !== 'NONE') {
            s3TriggerPolicyDefinition = this.createTriggerPolicyDefinition('S3TriggerBucketPolicy', this._props.triggerFunction);
        }
        if (((_a = this._props.adminTriggerFunction) === null || _a === void 0 ? void 0 : _a.triggerFunction) &&
            this._props.adminTriggerFunction.triggerFunction !== 'NONE' &&
            this._props.adminTriggerFunction.triggerFunction !== this._props.triggerFunction) {
            const adminTriggerFunctionName = this._props.adminTriggerFunction.triggerFunction;
            s3TriggerPolicyDefinition = s3TriggerPolicyDefinition
                ? this.addFunctionToTriggerPolicyDefinition(s3TriggerPolicyDefinition, adminTriggerFunctionName)
                : this.createTriggerPolicyDefinition('S3TriggerBucketPolicy', adminTriggerFunctionName);
        }
        if (s3TriggerPolicyDefinition) {
            this.s3TriggerPolicy = this.createTriggerPolicyFromPolicyDefinition(s3TriggerPolicyDefinition);
        }
    }
    _conditionallyBuildTriggerLambdaParams(triggerFunction) {
        var _a;
        let triggerLambdaFunctionParams;
        if (((_a = this._props.adminTriggerFunction) === null || _a === void 0 ? void 0 : _a.triggerFunction) &&
            this._props.adminTriggerFunction.triggerFunction !== 'NONE' &&
            this._props.adminTriggerFunction.triggerFunction !== this._props.triggerFunction) {
            triggerLambdaFunctionParams = {
                category: amplify_cli_core_1.AmplifyCategories.STORAGE,
                tag: 'triggerFunction',
                triggerFunction,
                permissions: [s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE, s3_user_input_types_1.S3PermissionType.READ, s3_user_input_types_1.S3PermissionType.DELETE],
                triggerEvents: [s3_user_input_types_1.S3TriggerEventType.OBJ_PUT_POST_COPY, s3_user_input_types_1.S3TriggerEventType.OBJ_REMOVED],
                triggerPrefix: [
                    { prefix: 'protected/', prefixTransform: s3_user_input_types_1.S3TriggerPrefixTransform.ATTACH_REGION },
                    { prefix: 'private/', prefixTransform: s3_user_input_types_1.S3TriggerPrefixTransform.ATTACH_REGION },
                    { prefix: 'public/', prefixTransform: s3_user_input_types_1.S3TriggerPrefixTransform.ATTACH_REGION },
                ],
            };
        }
        else {
            triggerLambdaFunctionParams = {
                category: amplify_cli_core_1.AmplifyCategories.STORAGE,
                tag: 'triggerFunction',
                triggerFunction,
                permissions: [s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE, s3_user_input_types_1.S3PermissionType.READ, s3_user_input_types_1.S3PermissionType.DELETE],
                triggerEvents: [s3_user_input_types_1.S3TriggerEventType.OBJ_PUT_POST_COPY, s3_user_input_types_1.S3TriggerEventType.OBJ_REMOVED],
            };
        }
        return triggerLambdaFunctionParams;
    }
    async generateCfnStackResources(context) {
        var _a;
        this.s3Bucket = new s3Cdk.CfnBucket(this, 'S3Bucket', {
            bucketName: this.s3BucketName,
            corsConfiguration: this.buildCORSRules(),
        });
        this.s3Bucket.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);
        if (this._props.triggerFunction && this._props.triggerFunction !== 'NONE') {
            const triggerLambdaFunctionParams = this._conditionallyBuildTriggerLambdaParams(this._props.triggerFunction);
            const newLambdaConfigurations = this.buildLambdaConfigFromTriggerParams(triggerLambdaFunctionParams);
            this._addNotificationsLambdaConfigurations(newLambdaConfigurations);
            this.triggerLambdaPermissions = this.createInvokeFunctionS3Permission('TriggerPermissions', this._props.triggerFunction);
            this.s3Bucket.addDependency(this.triggerLambdaPermissions);
            this.s3DependsOnResources.push(this.buildS3DependsOnFunctionCfn(this._props.triggerFunction));
        }
        if (((_a = this._props.adminTriggerFunction) === null || _a === void 0 ? void 0 : _a.triggerFunction) &&
            this._props.adminTriggerFunction.triggerFunction !== 'NONE' &&
            this._props.adminTriggerFunction.triggerFunction !== this._props.triggerFunction) {
            const adminLambdaConfigurations = this.buildLambdaConfigFromTriggerParams(this._props.adminTriggerFunction);
            this._addNotificationsLambdaConfigurations(adminLambdaConfigurations);
            this.adminTriggerLambdaPermissions = this.createInvokeFunctionS3Permission('AdminTriggerPermissions', this._props.adminTriggerFunction.triggerFunction);
            this.s3Bucket.addDependency(this.adminTriggerLambdaPermissions);
            this.s3DependsOnResources.push(this.buildS3DependsOnFunctionCfn(this._props.adminTriggerFunction.triggerFunction));
        }
        if (this.notificationConfiguration.lambdaConfigurations &&
            this.notificationConfiguration.lambdaConfigurations.length > 0) {
            this.s3Bucket.notificationConfiguration = this.notificationConfiguration;
        }
        this.createAndSetIAMPolicies();
        const groupList = this.getGroupListFromProps();
        if (groupList && groupList.length > 0) {
            const authResourceName = await s3AuthAPI.getAuthResourceARN(context);
            this.authResourceName = authResourceName;
            this.s3GroupPolicyList = this.createS3AmplifyGroupPolicies(authResourceName, groupList, this._props.groupAccess);
            this.addGroupParams(authResourceName);
            this.s3DependsOnResources.push(this.buildS3DependsOnUserPoolIdCfn(authResourceName));
            const userPoolGroupList = this.buildS3DependsOnUserPoolGroupRoleListCfn(groupList);
            this.s3DependsOnResources = this.s3DependsOnResources.concat(userPoolGroupList);
        }
        this.configureTriggerPolicy();
    }
    addGroupParams(authResourceName) {
        const groupList = this.getGroupListFromProps();
        if (groupList && groupList.length > 0) {
            const s3CfnParams = [
                {
                    params: [`auth${authResourceName}UserPoolId`],
                    paramType: 'String',
                    default: `auth${authResourceName}UserPoolId`,
                },
            ];
            for (const groupName of groupList) {
                s3CfnParams.push({
                    params: [`authuserPoolGroups${this.buildGroupRoleName(groupName)}`],
                    paramType: 'String',
                    default: `authuserPoolGroups${this.buildGroupRoleName(groupName)}`,
                });
            }
            s3CfnParams.map((params) => this._setCFNParams(params));
        }
        return undefined;
    }
    addParameters() {
        var _a;
        let s3CfnParams = [
            {
                params: ['env', 'bucketName', 'authRoleName', 'unauthRoleName', 'authPolicyName', 'unauthPolicyName'],
                paramType: 'String',
            },
            {
                params: ['s3PublicPolicy', 's3PrivatePolicy', 's3ProtectedPolicy', 's3UploadsPolicy', 's3ReadPolicy'],
                paramType: 'String',
                default: 'NONE',
            },
            {
                params: [
                    's3PermissionsAuthenticatedPublic',
                    's3PermissionsAuthenticatedProtected',
                    's3PermissionsAuthenticatedPrivate',
                    's3PermissionsAuthenticatedUploads',
                    's3PermissionsGuestPublic',
                    's3PermissionsGuestUploads',
                    'AuthenticatedAllowList',
                    'GuestAllowList',
                ],
                paramType: 'String',
                default: types_1.AmplifyBuildParamsPermissions.DISALLOW,
            },
            {
                params: ['selectedGuestPermissions', 'selectedAuthenticatedPermissions'],
                paramType: 'CommaDelimitedList',
                default: 'NONE',
            },
        ];
        if (this._props.triggerFunction && this._props.triggerFunction !== 'NONE') {
            const triggerFunctionCFNParams = this.createTriggerLambdaCFNParams('triggerFunction', this._props.triggerFunction);
            s3CfnParams = s3CfnParams.concat(triggerFunctionCFNParams);
        }
        if (((_a = this._props.adminTriggerFunction) === null || _a === void 0 ? void 0 : _a.triggerFunction) &&
            this._props.adminTriggerFunction.triggerFunction !== 'NONE' &&
            this._props.adminTriggerFunction.triggerFunction !== this._props.triggerFunction) {
            const adminTriggerFunctionCFNParams = this.createTriggerLambdaCFNParams('adminTriggerFunction', this._props.adminTriggerFunction.triggerFunction);
            s3CfnParams = s3CfnParams.concat(adminTriggerFunctionCFNParams);
        }
        s3CfnParams.map((params) => this._setCFNParams(params));
    }
    addConditions() {
        this.conditions = {
            ShouldNotCreateEnvResources: new cdk.CfnCondition(this, 'ShouldNotCreateEnvResources', {
                expression: cdk.Fn.conditionEquals(cdk.Fn.ref('env'), 'NONE'),
            }),
            CreateAuthPublic: new cdk.CfnCondition(this, 'CreateAuthPublic', {
                expression: cdk.Fn.conditionNot(cdk.Fn.conditionEquals(cdk.Fn.ref('s3PermissionsAuthenticatedPublic'), types_1.AmplifyBuildParamsPermissions.DISALLOW)),
            }),
            CreateAuthProtected: new cdk.CfnCondition(this, 'CreateAuthProtected', {
                expression: cdk.Fn.conditionNot(cdk.Fn.conditionEquals(cdk.Fn.ref('s3PermissionsAuthenticatedProtected'), types_1.AmplifyBuildParamsPermissions.DISALLOW)),
            }),
            CreateAuthPrivate: new cdk.CfnCondition(this, 'CreateAuthPrivate', {
                expression: cdk.Fn.conditionNot(cdk.Fn.conditionEquals(cdk.Fn.ref('s3PermissionsAuthenticatedPrivate'), types_1.AmplifyBuildParamsPermissions.DISALLOW)),
            }),
            CreateAuthUploads: new cdk.CfnCondition(this, 'CreateAuthUploads', {
                expression: cdk.Fn.conditionNot(cdk.Fn.conditionEquals(cdk.Fn.ref('s3PermissionsAuthenticatedUploads'), types_1.AmplifyBuildParamsPermissions.DISALLOW)),
            }),
            CreateGuestPublic: new cdk.CfnCondition(this, 'CreateGuestPublic', {
                expression: cdk.Fn.conditionNot(cdk.Fn.conditionEquals(cdk.Fn.ref('s3PermissionsGuestPublic'), types_1.AmplifyBuildParamsPermissions.DISALLOW)),
            }),
            CreateGuestUploads: new cdk.CfnCondition(this, 'CreateGuestUploads', {
                expression: cdk.Fn.conditionNot(cdk.Fn.conditionEquals(cdk.Fn.ref('s3PermissionsGuestUploads'), types_1.AmplifyBuildParamsPermissions.DISALLOW)),
            }),
            CreateAuthReadAndList: new cdk.CfnCondition(this, 'AuthReadAndList', {
                expression: cdk.Fn.conditionNot(cdk.Fn.conditionEquals(cdk.Fn.ref('AuthenticatedAllowList'), types_1.AmplifyBuildParamsPermissions.DISALLOW)),
            }),
            CreateGuestReadAndList: new cdk.CfnCondition(this, 'GuestReadAndList', {
                expression: cdk.Fn.conditionNot(cdk.Fn.conditionEquals(cdk.Fn.ref('GuestAllowList'), types_1.AmplifyBuildParamsPermissions.DISALLOW)),
            }),
        };
        return this.conditions;
    }
    addOutputs() {
        this.addCfnOutput({
            value: cdk.Fn.ref('S3Bucket'),
            description: 'Bucket name for the S3 bucket',
        }, 'BucketName');
        this.addCfnOutput({
            value: cdk.Fn.ref('AWS::Region'),
        }, 'Region');
    }
    buildBucketName() {
        const bucketRef = cdk.Fn.ref('bucketName');
        const envRef = cdk.Fn.ref('env');
        const bucketNameSuffixRef = cdk.Fn.select(3, cdk.Fn.split('-', cdk.Fn.ref('AWS::StackName')));
        const bucketFinalName = this.isAmplifyStackLegacy()
            ? cdk.Fn.join('', [bucketRef, '-', envRef])
            : cdk.Fn.join('', [bucketRef, bucketNameSuffixRef, '-', envRef]);
        return cdk.Fn.conditionIf('ShouldNotCreateEnvResources', bucketRef, bucketFinalName).toString();
    }
    buildNotificationLambdaConfiguration() {
        const triggerFunctionArnRef = cdk.Fn.ref(`function${this._props.triggerFunction}Arn`);
        const lambdaConfigurations = [
            {
                event: 's3:ObjectCreated:*',
                function: triggerFunctionArnRef,
            },
            {
                event: 's3:ObjectRemoved:*',
                function: triggerFunctionArnRef,
            },
        ];
        return lambdaConfigurations;
    }
    buildLambdaConfigFromTriggerParams(functionParams) {
        const lambdaConfigurations = [];
        const triggerFunctionArnRef = cdk.Fn.ref(`function${functionParams.triggerFunction}Arn`);
        if (functionParams.permissions) {
            for (const triggerEvent of functionParams.triggerEvents) {
                if (functionParams.triggerPrefix) {
                    for (const triggerPrefixDefinition of functionParams.triggerPrefix) {
                        const lambdaConfig = {
                            event: triggerEvent,
                            function: triggerFunctionArnRef,
                            filter: {
                                s3Key: {
                                    rules: [this.buildTriggerPrefixRule(triggerPrefixDefinition)],
                                },
                            },
                        };
                        lambdaConfigurations.push(lambdaConfig);
                    }
                }
                else {
                    const lambdaConfig = {
                        event: triggerEvent,
                        function: triggerFunctionArnRef,
                    };
                    lambdaConfigurations.push(lambdaConfig);
                }
            }
        }
        return lambdaConfigurations;
    }
    createInvokeFunctionS3Permission(logicalId, triggerFunctionName) {
        const sourceArn = cdk.Fn.join('', ['arn:aws:s3:::', this.buildBucketName()]);
        const resourceDefinition = {
            action: 'lambda:InvokeFunction',
            functionName: cdk.Fn.ref(`function${triggerFunctionName}Name`),
            principal: 's3.amazonaws.com',
            sourceAccount: cdk.Fn.ref('AWS::AccountId'),
            sourceArn,
        };
        const lambdaPermission = new lambdaCdk.CfnPermission(this, logicalId, resourceDefinition);
        return lambdaPermission;
    }
    createTriggerPolicyDefinition(logicalId, triggerFunctionName) {
        const policyDefinition = {
            logicalId,
            isPolicyNameAbsolute: true,
            policyNameRef: 'amplify-lambda-execution-policy-storage',
            roleRefs: [`function${triggerFunctionName}LambdaExecutionRole`],
            statements: [
                {
                    refStr: 'S3Bucket',
                    pathStr: '',
                    isActionAbsolute: true,
                    actions: ['s3:ListBucket'],
                    effect: iamCdk.Effect.ALLOW,
                },
                {
                    refStr: 'S3Bucket',
                    pathStr: '/*',
                    isActionAbsolute: true,
                    actions: ['s3:PutObject', 's3:GetObject', 's3:ListBucket', 's3:DeleteObject'],
                    effect: iamCdk.Effect.ALLOW,
                },
            ],
            dependsOn: [this.s3Bucket],
        };
        return policyDefinition;
    }
    createIAMPolicy(policyDefinition, actionRef) {
        const policyL1 = {};
        policyL1.Properties = {};
        if (policyDefinition.isPolicyNameAbsolute) {
            policyL1.Properties.policyName = policyDefinition.policyNameRef;
        }
        else {
            policyL1.Properties.policyName = {
                Ref: policyDefinition.policyNameRef,
            };
        }
        policyL1.Properties.roles = policyDefinition.roleRefs.map((roleRef) => ({
            Ref: roleRef,
        }));
        policyL1.Properties.policyDocument = {
            Version: '2012-10-17',
            Statement: [],
        };
        const policyStatements = [];
        for (const policyDefinitionStatement of policyDefinition.statements) {
            const policyStatement = {};
            policyStatement.Effect = policyDefinitionStatement.effect;
            if (policyDefinitionStatement.actions) {
                policyStatement.Action = this.buildActionFromPolicyDefinition(policyDefinitionStatement, actionRef);
            }
            policyStatement.Resource = [this.buildResourceFromPolicyDefinition(policyDefinitionStatement)];
            policyStatements.push(policyStatement);
        }
        policyL1.Properties.policyDocument.Statement = policyStatements;
        const policy = new iamCdk.CfnPolicy(this, policyDefinition.logicalId, policyL1.Properties);
        if (policyDefinition.dependsOn) {
            policyDefinition.dependsOn.map((dependency) => policy.addDependency(dependency));
        }
        if (policyDefinition.condition) {
            policy.cfnOptions.condition = policyDefinition.condition;
        }
        return policy;
    }
    createS3AmplifyGroupPolicies(authResourceName, groupList, groupPolicyMap) {
        const groupPolicyList = [];
        for (const groupName of groupList) {
            const logicalID = this.buildGroupPolicyLogicalID(groupName);
            const groupPolicyName = this.buildGroupPolicyName(groupName);
            const policyStatementList = this._buildCDKGroupPolicyStatements(groupPolicyMap[groupName]);
            const props = {
                policyName: groupPolicyName,
                roles: this.buildCDKGroupRoles(groupName, authResourceName),
                policyDocument: this._buildCDKGroupPolicyDocument(policyStatementList),
            };
            const groupPolicy = new iamCdk.CfnPolicy(this, logicalID, props);
            groupPolicyList.push(groupPolicy);
        }
        return groupPolicyList;
    }
}
exports.AmplifyS3ResourceCfnStack = AmplifyS3ResourceCfnStack;
const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';
const S3_ROOT_CFN_DESCRIPTION = 'S3 Resource for AWS Amplify CLI';
//# sourceMappingURL=s3-stack-builder.js.map