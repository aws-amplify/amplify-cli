"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const cloneComponentsFromEnv_1 = require("../commands/cloneComponentsFromEnv");
const run = async (context) => {
    try {
        await (0, cloneComponentsFromEnv_1.run)(context);
    }
    catch (e) {
        amplify_prompts_1.printer.debug(e);
    }
};
exports.run = run;
//# sourceMappingURL=handle-PostEnvAdd.js.map