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
exports.AmplifyBuildParamsPermissions = exports.AmplifyResourceCfnStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
class AmplifyResourceCfnStack extends cdk.Stack {
    constructor(scope, id) {
        super(scope, id, undefined);
        this._cfnParameterMap = new Map();
        this.renderCloudFormationTemplate = () => this._toCloudFormation();
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
        return new cdk.CfnResource(this, logicalId, props);
    }
    addCfnParameter(props, logicalId) {
        if (this._cfnParameterMap.has(logicalId)) {
            throw new Error('logical Id already Exists');
        }
        this._cfnParameterMap.set(logicalId, new cdk.CfnParameter(this, logicalId, props));
    }
}
exports.AmplifyResourceCfnStack = AmplifyResourceCfnStack;
var AmplifyBuildParamsPermissions;
(function (AmplifyBuildParamsPermissions) {
    AmplifyBuildParamsPermissions["ALLOW"] = "ALLOW";
    AmplifyBuildParamsPermissions["DISALLOW"] = "DISALLOW";
})(AmplifyBuildParamsPermissions = exports.AmplifyBuildParamsPermissions || (exports.AmplifyBuildParamsPermissions = {}));
//# sourceMappingURL=types.js.map