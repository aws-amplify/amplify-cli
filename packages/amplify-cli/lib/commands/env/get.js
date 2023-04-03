"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const envUtils_1 = require("../helpers/envUtils");
const run = async (context) => {
    var _a, _b;
    const envName = (_a = context.parameters.options) === null || _a === void 0 ? void 0 : _a.name;
    const allEnvs = context.amplify.getEnvDetails();
    if (!envName) {
        throw new amplify_cli_core_1.AmplifyError('EnvironmentNameError', {
            message: 'Environment name was not specified.',
            resolution: 'Pass in the name of the environment using the --name flag.',
        });
    }
    if (!allEnvs[envName]) {
        throw new amplify_cli_core_1.AmplifyError('EnvironmentNameError', {
            message: 'Environment name is invalid.',
            resolution: 'Run amplify env list to get a list of valid environments.',
        });
    }
    if ((_b = context.parameters.options) === null || _b === void 0 ? void 0 : _b.json) {
        amplify_prompts_1.printer.info(amplify_cli_core_1.JSONUtilities.stringify(allEnvs[envName]));
        return;
    }
    amplify_prompts_1.printer.blankLine();
    amplify_prompts_1.printer.info(envName, 'red');
    (0, envUtils_1.printEnvInfo)(envName, allEnvs);
};
exports.run = run;
//# sourceMappingURL=get.js.map