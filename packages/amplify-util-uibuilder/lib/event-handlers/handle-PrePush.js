"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const prePushHandler_1 = require("../utils/prePushHandler");
const run = async (context) => {
    try {
        await (0, prePushHandler_1.prePushHandler)(context);
    }
    catch (e) {
        amplify_prompts_1.printer.debug(e);
    }
};
exports.run = run;
//# sourceMappingURL=handle-PrePush.js.map