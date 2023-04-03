"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTransformer = void 0;
async function runTransformer(context) {
    const transformerOutput = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', {
        noConfig: true,
        forceCompile: true,
        dryRun: true,
        disableResolverOverrides: true,
        disableFunctionOverrides: true,
        disablePipelineFunctionOverrides: true,
    });
    return { transformerOutput };
}
exports.runTransformer = runTransformer;
//# sourceMappingURL=run-graphql-transformer.js.map