"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const constants_1 = require("../../constants");
const buildFunction_1 = require("../../provider-utils/awscloudformation/utils/buildFunction");
const package_1 = require("../../provider-utils/awscloudformation/utils/package");
const amplify_cli_core_1 = require("amplify-cli-core");
exports.name = 'build';
const run = async (context) => {
    var _a, _b, _c, _d;
    const resourceName = (_b = (_a = context === null || context === void 0 ? void 0 : context.input) === null || _a === void 0 ? void 0 : _a.subCommands) === null || _b === void 0 ? void 0 : _b[0];
    const confirmContinue = !!resourceName ||
        ((_d = (_c = context.input) === null || _c === void 0 ? void 0 : _c.options) === null || _d === void 0 ? void 0 : _d.yes) ||
        (await amplify_prompts_1.prompter.yesOrNo('Are you sure you want to continue building the resources?', false));
    if (!confirmContinue) {
        return;
    }
    try {
        const resourcesToBuild = (await getSelectedResources(context, resourceName))
            .filter((resource) => resource.build)
            .filter((resource) => resource.service === "Lambda");
        for await (const resource of resourcesToBuild) {
            resource.lastBuildTimeStamp = await (0, buildFunction_1.buildFunction)(context, resource);
            await (0, package_1.packageResource)(context, resource);
        }
    }
    catch (err) {
        context.print.info(err.stack);
        context.print.error('There was an error building the function resources');
        const amplifyError = new amplify_cli_core_1.AmplifyError('PackagingLambdaFunctionError', { message: `There was an error building the function resources ${err.message}` }, err);
        void context.usageData.emitError(amplifyError);
        process.exitCode = 1;
    }
};
exports.run = run;
const getSelectedResources = async (context, resourceName) => {
    return (await context.amplify.getResourceStatus(constants_1.categoryName, resourceName)).allResources;
};
//# sourceMappingURL=build.js.map