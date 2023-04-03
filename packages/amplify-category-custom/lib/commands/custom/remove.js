"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
exports.name = 'remove';
async function run(context) {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;
    return amplify.removeResource(context, 'custom', resourceName).catch((err) => {
        amplify_prompts_1.printer.error(err.stack);
        amplify_prompts_1.printer.error('An error occurred when removing the custom resource');
        void context.usageData.emitError(err);
        process.exitCode = 1;
    });
}
exports.run = run;
//# sourceMappingURL=remove.js.map