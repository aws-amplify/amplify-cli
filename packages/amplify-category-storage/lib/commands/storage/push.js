"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const constants_1 = require("../../constants");
exports.name = 'push';
async function run(context) {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;
    context.amplify.constructExeInfo(context);
    return amplify.pushResources(context, constants_1.categoryName, resourceName).catch(async (err) => {
        amplify_prompts_1.printer.error(`An error occurred when pushing the storage resource: ${(err === null || err === void 0 ? void 0 : err.message) || err}`);
        await context.usageData.emitError(err);
        process.exitCode = 1;
    });
}
exports.run = run;
//# sourceMappingURL=push.js.map