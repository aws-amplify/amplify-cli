"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printEnvInfo = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const printEnvInfo = (env, allEnvs) => {
    amplify_prompts_1.printer.info('--------------');
    Object.keys(allEnvs[env])
        .filter((provider) => provider !== 'nonCFNdata')
        .filter((provider) => provider !== 'categories')
        .forEach((provider) => {
        amplify_prompts_1.printer.info(`Provider: ${provider}`);
        Object.keys(allEnvs[env][provider]).forEach((providerAttr) => {
            amplify_prompts_1.printer.info(`${providerAttr}: ${allEnvs[env][provider][providerAttr]}`);
        });
        amplify_prompts_1.printer.info('--------------');
        amplify_prompts_1.printer.blankLine();
    });
    amplify_prompts_1.printer.blankLine();
};
exports.printEnvInfo = printEnvInfo;
//# sourceMappingURL=envUtils.js.map