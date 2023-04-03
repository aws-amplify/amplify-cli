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
exports.AmplifyUserPoolGroupStackOutputs = exports.AmplifyUserPoolGroupStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const aws_cognito_1 = require("aws-cdk-lib/aws-cognito");
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const fs = __importStar(require("fs-extra"));
const constants_1 = require("../constants");
const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';
const ROOT_CFN_DESCRIPTION = 'Root Stack for AWS Amplify CLI';
class AmplifyUserPoolGroupStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        this._cfnParameterMap = new Map();
        this._cfnConditionMap = new Map();
        this.renderCloudFormationTemplate = () => JSON.stringify(this._toCloudFormation(), undefined, 2);
        this.generateUserPoolGroupResources = async (props) => {
            props.groups.forEach((group) => {
                this.userPoolGroup[`${group.groupName}`] = new aws_cognito_1.CfnUserPoolGroup(this, `${group.groupName}Group`, {
                    userPoolId: this.getCfnParameter(getCfnParamsLogicalId(props.cognitoResourceName, 'UserPoolId')).valueAsString,
                    groupName: group.groupName,
                    precedence: group.precedence,
                });
                this.userPoolGroup[`${group.groupName}`].description = 'override success';
                if (props.identityPoolName) {
                    this.userPoolGroup[`${group.groupName}`].addPropertyOverride('RoleArn', cdk.Fn.getAtt(`${group.groupName}GroupRole`, 'Arn').toString());
                    this.userPoolGroupRole[`${group.groupName}`] = new iam.CfnRole(this, `${group.groupName}GroupRole`, {
                        roleName: cdk.Fn.join('', [
                            this.getCfnParameter(getCfnParamsLogicalId(props.cognitoResourceName, 'UserPoolId')).valueAsString,
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
                    roleName: cdk.Fn.conditionIf('ShouldNotCreateEnvResources', props.cognitoResourceName, cdk.Fn.join('', [`${props.cognitoResourceName}-ExecutionRole-`, cdk.Fn.ref('env')]).toString()).toString(),
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
                this.roleMapLambdaFunction = new lambda.CfnFunction(this, 'RoleMapFunction', {
                    code: {
                        zipFile: fs.readFileSync(constants_1.roleMapLambdaFilePath, 'utf-8'),
                    },
                    handler: 'index.handler',
                    runtime: 'nodejs16.x',
                    timeout: 300,
                    role: cdk.Fn.getAtt('LambdaExecutionRole', 'Arn').toString(),
                });
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
        this._scope = scope;
        this.templateOptions.templateFormatVersion = CFN_TEMPLATE_FORMAT_VERSION;
        this.templateOptions.description = ROOT_CFN_DESCRIPTION;
        this.userPoolGroup = {};
        this.userPoolGroupRole = {};
    }
    getCfnOutput() {
        throw new Error('Method not implemented.');
    }
    getCfnMapping() {
        throw new Error('Method not implemented.');
    }
    addCfnOutput(props, logicalId) {
        try {
            new cdk.CfnOutput(this, logicalId, props);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    addCfnMapping(props, logicalId) {
        try {
            new cdk.CfnMapping(this, logicalId, props);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    addCfnResource(props, logicalId) {
        try {
            new cdk.CfnResource(this, logicalId, props);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    addCfnParameter(props, logicalId) {
        try {
            if (this._cfnParameterMap.has(logicalId)) {
                throw new Error('logical Id already Exists');
            }
            this._cfnParameterMap.set(logicalId, new cdk.CfnParameter(this, logicalId, props));
        }
        catch (error) {
            throw new Error(error);
        }
    }
    addCfnCondition(props, logicalId) {
        try {
            if (this._cfnConditionMap.has(logicalId)) {
                throw new Error('logical Id already Exists');
            }
            this._cfnConditionMap.set(logicalId, new cdk.CfnCondition(this, logicalId, props));
        }
        catch (error) {
            throw new Error(error);
        }
    }
    getCfnParameter(logicalId) {
        if (this._cfnParameterMap.has(logicalId)) {
            return this._cfnParameterMap.get(logicalId);
        }
        throw new Error(`CloudFormation Parameter with LogicalId ${logicalId} doesn't exist`);
    }
    getCfnCondition(logicalId) {
        if (this._cfnConditionMap.has(logicalId)) {
            return this._cfnConditionMap.get(logicalId);
        }
        throw new Error(`CloudFormation Parameter with LogicalId ${logicalId} doesn't exist`);
    }
}
exports.AmplifyUserPoolGroupStack = AmplifyUserPoolGroupStack;
const getCfnParamsLogicalId = (cognitoResourceName, cfnParamName) => `auth${cognitoResourceName}${cfnParamName}`;
class AmplifyUserPoolGroupStackOutputs extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        this.renderCloudFormationTemplate = () => amplify_cli_core_1.JSONUtilities.stringify(this._toCloudFormation());
    }
    getCfnParameter() {
        throw new Error('Method not implemented.');
    }
    getCfnOutput() {
        throw new Error('Method not implemented.');
    }
    getCfnMapping() {
        throw new Error('Method not implemented.');
    }
    getCfnCondition() {
        throw new Error('Method not implemented.');
    }
    addCfnParameter() {
        throw new Error('Method not implemented.');
    }
    addCfnOutput(props, logicalId) {
        try {
            new cdk.CfnOutput(this, logicalId, props);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    addCfnMapping() {
        throw new Error('Method not implemented.');
    }
    addCfnCondition() {
        throw new Error('Method not implemented.');
    }
    addCfnResource() {
        throw new Error('Method not implemented.');
    }
}
exports.AmplifyUserPoolGroupStackOutputs = AmplifyUserPoolGroupStackOutputs;
//# sourceMappingURL=auth-user-pool-group-stack-builder.js.map