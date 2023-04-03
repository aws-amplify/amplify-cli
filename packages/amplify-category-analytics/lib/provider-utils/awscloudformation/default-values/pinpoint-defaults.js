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
exports.getAllDefaults = void 0;
const uuid = __importStar(require("uuid"));
const getAllDefaults = (project) => {
    const appName = project.projectConfig.projectName.toLowerCase();
    const [shortId] = uuid.v4().split('-');
    const authRoleName = {
        Ref: 'AuthRoleName',
    };
    const unauthRoleName = {
        Ref: 'UnauthRoleName',
    };
    const authRoleArn = {
        'Fn::GetAtt': ['AuthRole', 'Arn'],
    };
    const defaults = {
        appName,
        resourceName: appName,
        roleName: `pinpointLambdaRole${shortId}`,
        cloudformationPolicyName: `cloudformationPolicy${shortId}`,
        cloudWatchPolicyName: `cloudWatchPolicy${shortId}`,
        pinpointPolicyName: `pinpointPolicy${shortId}`,
        authPolicyName: `pinpoint_amplify_${shortId}`,
        unauthPolicyName: `pinpoint_amplify_${shortId}`,
        authRoleName,
        unauthRoleName,
        authRoleArn,
    };
    return defaults;
};
exports.getAllDefaults = getAllDefaults;
//# sourceMappingURL=pinpoint-defaults.js.map