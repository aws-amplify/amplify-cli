"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const generateComponents_1 = require("../commands/generateComponents");
const run = async (context) => {
    try {
        await (0, generateComponents_1.run)(context, 'PostPull');
    }
    catch (e) {
        amplify_prompts_1.printer.debug(e);
    }
};
exports.run = run;
//# sourceMappingURL=handle-PostPull.js.map