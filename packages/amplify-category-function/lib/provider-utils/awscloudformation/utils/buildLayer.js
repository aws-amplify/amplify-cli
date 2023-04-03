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
exports.buildLayer = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_function_plugin_interface_1 = require("@aws-amplify/amplify-function-plugin-interface");
const path = __importStar(require("path"));
const constants_1 = require("../../../constants");
const layerConfiguration_1 = require("./layerConfiguration");
const buildLayer = async (context, { resourceName, lastBuildTimestamp }) => {
    const layerConfig = (0, layerConfiguration_1.loadLayerConfigurationFile)(resourceName);
    const resourcePath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), constants_1.categoryName, resourceName);
    const { runtimes } = layerConfig;
    let rebuilt = false;
    for (const runtime of runtimes) {
        const layerCodePath = path.join(resourcePath, 'lib', runtime.layerExecutablePath);
        const runtimePlugin = (await context.amplify.loadRuntimePlugin(context, runtime.runtimePluginId));
        const depCheck = await runtimePlugin.checkDependencies(runtime.value);
        if (!depCheck.hasRequiredDependencies) {
            context.print.error(depCheck.errorMessage || `Required dependencies to build ${resourceName} are missing`);
            throw new amplify_cli_core_1.AmplifyError('PackagingLambdaFunctionError', { message: `Required dependencies to build ${resourceName} are missing` });
        }
        const prevBuildTimestamp = lastBuildTimestamp ? new Date(lastBuildTimestamp) : undefined;
        const buildRequest = {
            buildType: amplify_function_plugin_interface_1.BuildType.PROD,
            srcRoot: layerCodePath,
            runtime: runtime.value,
            legacyBuildHookParams: {
                projectRoot: amplify_cli_core_1.pathManager.findProjectRoot(),
                resourceName: resourceName,
            },
            lastBuildTimeStamp: prevBuildTimestamp,
            service: "LambdaLayer",
        };
        ({ rebuilt } = await runtimePlugin.build(buildRequest));
    }
    if (rebuilt) {
        context.amplify.updateamplifyMetaAfterBuild({ category: constants_1.categoryName, resourceName }, amplify_function_plugin_interface_1.BuildType.PROD.toString());
        return new Date();
    }
    else {
        return lastBuildTimestamp;
    }
};
exports.buildLayer = buildLayer;
//# sourceMappingURL=buildLayer.js.map