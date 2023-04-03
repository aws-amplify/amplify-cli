"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const get_amplify_version_1 = require("../extensions/amplify-helpers/get-amplify-version");
const run = () => {
    amplify_prompts_1.printer.info((0, get_amplify_version_1.getAmplifyVersion)());
};
exports.run = run;
//# sourceMappingURL=version.js.map