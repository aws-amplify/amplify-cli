"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.legacyLayerMigration = exports.postPushLambdaLayerCleanup = exports.prePushLambdaLayerPrompt = void 0;
const constants_1 = require("./constants");
const category = 'function';
const lambdaLayerPrompt = 'lambdaLayerPrompt';
const postPushCleanupFunctionName = 'postPushCleanup';
const migrateLegacyLayerFunctionName = 'migrateLegacyLayer';
async function prePushLambdaLayerPrompt(context, resources) {
    await context.amplify.invokePluginMethod(context, category, constants_1.FunctionServiceNameLambdaLayer, lambdaLayerPrompt, [context, resources]);
}
exports.prePushLambdaLayerPrompt = prePushLambdaLayerPrompt;
async function postPushLambdaLayerCleanup(context, resources, envName) {
    await context.amplify.invokePluginMethod(context, category, constants_1.FunctionServiceNameLambdaLayer, postPushCleanupFunctionName, [
        resources,
        envName,
    ]);
}
exports.postPushLambdaLayerCleanup = postPushLambdaLayerCleanup;
async function legacyLayerMigration(context, layerName) {
    await context.amplify.invokePluginMethod(context, category, constants_1.FunctionServiceNameLambdaLayer, migrateLegacyLayerFunctionName, [
        context,
        layerName,
    ]);
}
exports.legacyLayerMigration = legacyLayerMigration;
//# sourceMappingURL=lambdaLayerInvocations.js.map