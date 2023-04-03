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
exports.invokeS3AddResource = exports.invokeS3RegisterAdminTrigger = exports.invokeS3RemoveAdminLambdaTrigger = exports.invokeS3AddStorageLambdaTrigger = exports.invokeS3GetAllDefaults = exports.invokeS3GetUserInputs = exports.invokeS3GetResourceName = void 0;
const uuid = __importStar(require("uuid"));
async function invokeS3GetResourceName(context) {
    const s3ResourceName = await context.amplify.invokePluginMethod(context, 'storage', undefined, 's3GetResourceName', [context]);
    return s3ResourceName;
}
exports.invokeS3GetResourceName = invokeS3GetResourceName;
async function invokeS3GetUserInputs(context, s3ResourceName) {
    const s3UserInputs = await context.amplify.invokePluginMethod(context, 'storage', undefined, 's3GetUserInput', [context, s3ResourceName]);
    return s3UserInputs;
}
exports.invokeS3GetUserInputs = invokeS3GetUserInputs;
async function invokeS3GetAllDefaults(context, s3AccessType) {
    const project = context.amplify.getProjectDetails();
    const [shortId] = uuid.v4().split('-');
    const s3DefaultUserInput = await context.amplify.invokePluginMethod(context, 'storage', undefined, 's3GetBucketUserInputDefault', [
        project,
        shortId,
        s3AccessType,
    ]);
    return s3DefaultUserInput;
}
exports.invokeS3GetAllDefaults = invokeS3GetAllDefaults;
async function invokeS3AddStorageLambdaTrigger(context, s3ResourceName, S3UserInputTriggerFunctionParams) {
    const s3UserInputs = await context.amplify.invokePluginMethod(context, 'storage', undefined, 's3AddStorageLambdaTrigger', [
        context,
        s3ResourceName,
        S3UserInputTriggerFunctionParams,
    ]);
    return s3UserInputs;
}
exports.invokeS3AddStorageLambdaTrigger = invokeS3AddStorageLambdaTrigger;
async function invokeS3RemoveAdminLambdaTrigger(context, s3ResourceName) {
    const s3UserInputs = await context.amplify.invokePluginMethod(context, 'storage', undefined, 's3RemoveAdminLambdaTrigger', [
        context,
        s3ResourceName,
    ]);
    return s3UserInputs;
}
exports.invokeS3RemoveAdminLambdaTrigger = invokeS3RemoveAdminLambdaTrigger;
async function invokeS3RegisterAdminTrigger(context, s3ResourceName, adminLambdaTrigger) {
    const s3UserInputs = await context.amplify.invokePluginMethod(context, 'storage', undefined, 's3RegisterAdminTrigger', [
        context,
        s3ResourceName,
        adminLambdaTrigger,
    ]);
    return s3UserInputs;
}
exports.invokeS3RegisterAdminTrigger = invokeS3RegisterAdminTrigger;
async function invokeS3AddResource(context, storageUserInput) {
    const storageResourceName = await context.amplify.invokePluginMethod(context, 'storage', undefined, 's3CreateStorageResource', [
        context,
        storageUserInput,
    ]);
    return storageResourceName;
}
exports.invokeS3AddResource = invokeS3AddResource;
//# sourceMappingURL=storage-api.js.map