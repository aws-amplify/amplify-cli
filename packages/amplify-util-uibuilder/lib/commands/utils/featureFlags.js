"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransformerVersion = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const useExperimentalPipelinedTransformerFF = () => amplify_cli_core_1.FeatureFlags.getBoolean('graphQLTransformer.useExperimentalPipelinedTransformer');
const transformerVersionFF = () => amplify_cli_core_1.FeatureFlags.getNumber('graphQLTransformer.transformerVersion');
const getTransformerVersion = async () => {
    if (useExperimentalPipelinedTransformerFF() === false) {
        return 1;
    }
    if (isLegacyFeatureFlagConfiguration()) {
        await migrateToTransformerVersionFeatureFlag();
    }
    const transformerVersion = transformerVersionFF();
    if (transformerVersion !== 1 && transformerVersion !== 2) {
        throw new Error(`Invalid value specified for transformerVersion: '${transformerVersion}'`);
    }
    return transformerVersion;
};
exports.getTransformerVersion = getTransformerVersion;
const isLegacyFeatureFlagConfiguration = () => useExperimentalPipelinedTransformerFF() && transformerVersionFF() === 1;
const migrateToTransformerVersionFeatureFlag = async () => {
    var _a;
    const projectPath = (_a = amplify_cli_core_1.pathManager.findProjectRoot()) !== null && _a !== void 0 ? _a : process.cwd();
    const config = amplify_cli_core_1.stateManager.getCLIJSON(projectPath, undefined, {
        throwIfNotExist: false,
        preserveComments: true,
    });
    config.features.graphqltransformer.transformerversion = 2;
    amplify_cli_core_1.stateManager.setCLIJSON(projectPath, config);
    await amplify_cli_core_1.FeatureFlags.reloadValues();
    amplify_prompts_1.printer.warn(`\nThe project is configured with 'transformerVersion': ${transformerVersionFF()}, but 'useExperimentalPipelinedTransformer': ${useExperimentalPipelinedTransformerFF()}. Setting the 'transformerVersion': ${config.features.graphqltransformer.transformerversion}. 'useExperimentalPipelinedTransformer' is deprecated.`);
};
//# sourceMappingURL=featureFlags.js.map