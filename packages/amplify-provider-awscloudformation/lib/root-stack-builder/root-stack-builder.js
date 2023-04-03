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
exports.AmplifyRootStackOutputs = exports.AmplifyRootStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const amplify_cli_core_1 = require("amplify-cli-core");
const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';
const ROOT_CFN_DESCRIPTION = 'Root Stack for AWS Amplify CLI';
class AmplifyRootStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        this._cfnParameterMap = new Map();
        this.generateRootStackResources = async () => {
            this.deploymentBucket = new s3.CfnBucket(this, 'DeploymentBucket', {
                bucketName: this._cfnParameterMap.get('DeploymentBucketName').valueAsString,
            });
            this.deploymentBucket.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);
            this.authRole = new iam.CfnRole(this, 'AuthRole', {
                roleName: this._cfnParameterMap.get('AuthRoleName').valueAsString,
                assumeRolePolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Sid: '',
                            Effect: 'Deny',
                            Principal: {
                                Federated: 'cognito-identity.amazonaws.com',
                            },
                            Action: 'sts:AssumeRoleWithWebIdentity',
                        },
                    ],
                },
            });
            this.unauthRole = new iam.CfnRole(this, 'UnauthRole', {
                roleName: this._cfnParameterMap.get('UnauthRoleName').valueAsString,
                assumeRolePolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Sid: '',
                            Effect: 'Deny',
                            Principal: {
                                Federated: 'cognito-identity.amazonaws.com',
                            },
                            Action: 'sts:AssumeRoleWithWebIdentity',
                        },
                    ],
                },
            });
        };
        this.renderCloudFormationTemplate = () => amplify_cli_core_1.JSONUtilities.stringify(this._toCloudFormation());
        this._scope = scope;
        this.templateOptions.templateFormatVersion = CFN_TEMPLATE_FORMAT_VERSION;
        this.templateOptions.description = ROOT_CFN_DESCRIPTION;
    }
    addCfnOutput(props, logicalId) {
        new cdk.CfnOutput(this, logicalId, props);
    }
    addCfnMapping(props, logicalId) {
        new cdk.CfnMapping(this, logicalId, props);
    }
    addCfnCondition(props, logicalId) {
        new cdk.CfnCondition(this, logicalId, props);
    }
    addCfnResource(props, logicalId) {
        new cdk.CfnResource(this, logicalId, props);
    }
    addCfnParameter(props, logicalId) {
        if (this._cfnParameterMap.has(logicalId)) {
            throw new amplify_cli_core_1.AmplifyError('DuplicateLogicalIdError', {
                message: `Logical Id already exists: ${logicalId}.`,
            });
        }
        this._cfnParameterMap.set(logicalId, new cdk.CfnParameter(this, logicalId, props));
    }
    getCfnParameter(logicalId) {
        if (this._cfnParameterMap.has(logicalId)) {
            return this._cfnParameterMap.get(logicalId);
        }
        throw new amplify_cli_core_1.AmplifyError('ParameterNotFoundError', {
            message: `Cfn Parameter with LogicalId ${logicalId} doesn't exist`,
        });
    }
}
exports.AmplifyRootStack = AmplifyRootStack;
class AmplifyRootStackOutputs extends cdk.Stack {
    constructor() {
        super(...arguments);
        this.renderCloudFormationTemplate = () => amplify_cli_core_1.JSONUtilities.stringify(this._toCloudFormation());
    }
    addCfnParameter() {
        throw new amplify_cli_core_1.AmplifyFault('NotImplementedFault', {
            message: 'Method not implemented.',
        });
    }
    addCfnOutput(props, logicalId) {
        new cdk.CfnOutput(this, logicalId, props);
    }
    addCfnMapping() {
        throw new amplify_cli_core_1.AmplifyFault('NotImplementedFault', {
            message: 'Method not implemented.',
        });
    }
    addCfnCondition() {
        throw new amplify_cli_core_1.AmplifyFault('NotImplementedFault', {
            message: 'Method not implemented.',
        });
    }
    addCfnResource() {
        throw new amplify_cli_core_1.AmplifyFault('NotImplementedFault', {
            message: 'Method not implemented.',
        });
    }
}
exports.AmplifyRootStackOutputs = AmplifyRootStackOutputs;
//# sourceMappingURL=root-stack-builder.js.map