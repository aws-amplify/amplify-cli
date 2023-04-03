"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTypeKeyMap = exports.buildFunction = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_function_plugin_interface_1 = require("@aws-amplify/amplify-function-plugin-interface");
const constants_1 = require("../../../constants");
const amplify_cli_core_2 = require("amplify-cli-core");
const buildFunction = async (context, { resourceName, lastBuildTimestamp, lastBuildType, buildType = amplify_function_plugin_interface_1.BuildType.PROD }) => {
    const breadcrumbs = context.amplify.readBreadcrumbs(constants_1.categoryName, resourceName);
    const runtimePlugin = (await context.amplify.loadRuntimePlugin(context, breadcrumbs.pluginId));
    const depCheck = await runtimePlugin.checkDependencies(breadcrumbs.functionRuntime);
    if (!depCheck.hasRequiredDependencies) {
        context.print.error(depCheck.errorMessage || `You are missing dependencies required to package ${resourceName}`);
        throw new amplify_cli_core_2.AmplifyError('PackagingLambdaFunctionError', { message: `Missing required dependencies to package ${resourceName}` });
    }
    const prevBuildTime = lastBuildTimestamp ? new Date(lastBuildTimestamp) : undefined;
    let rebuilt = false;
    if (breadcrumbs.scripts && breadcrumbs.scripts.build) {
        throw new amplify_cli_core_2.AmplifyError('NotImplementedError', { message: 'Executing custom build scripts is not yet implemented' });
    }
    else {
        const buildRequest = {
            buildType,
            srcRoot: amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, constants_1.categoryName, resourceName),
            runtime: breadcrumbs.functionRuntime,
            legacyBuildHookParams: {
                projectRoot: amplify_cli_core_1.pathManager.findProjectRoot(),
                resourceName,
            },
            lastBuildTimeStamp: prevBuildTime,
            lastBuildType,
        };
        rebuilt = (await runtimePlugin.build(buildRequest)).rebuilt;
    }
    if (rebuilt) {
        context.amplify.updateamplifyMetaAfterBuild({ category: constants_1.categoryName, resourceName }, buildType.toString());
        return new Date().toISOString();
    }
    else {
        return lastBuildTimestamp;
    }
};
exports.buildFunction = buildFunction;
exports.buildTypeKeyMap = {
    [amplify_function_plugin_interface_1.BuildType.PROD]: 'lastBuildTimeStamp',
    [amplify_function_plugin_interface_1.BuildType.DEV]: 'lastDevBuildTimeStamp',
};
//# sourceMappingURL=buildFunction.js.map