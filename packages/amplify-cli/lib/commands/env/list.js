"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const envUtils_1 = require("../helpers/envUtils");
const run = async (context) => {
    const { envName } = context.amplify.getEnvInfo();
    if (context.parameters.options.details) {
        const allEnvs = context.amplify.getEnvDetails();
        if (context.parameters.options.json) {
            amplify_prompts_1.printer.info(amplify_cli_core_1.JSONUtilities.stringify(allEnvs));
            return;
        }
        Object.keys(allEnvs).forEach((env) => {
            amplify_prompts_1.printer.blankLine();
            if (envName === env) {
                amplify_prompts_1.printer.info(`*${env}*`, 'red');
            }
            else {
                amplify_prompts_1.printer.info(env, 'yellow');
            }
            (0, envUtils_1.printEnvInfo)(env, allEnvs);
        });
    }
    else {
        const allEnvs = context.amplify.getAllEnvs();
        if (context.parameters.options.json) {
            amplify_prompts_1.printer.info(amplify_cli_core_1.JSONUtilities.stringify({ envs: allEnvs }));
            return;
        }
        const { table } = context.print;
        const tableOptions = [['Environments']];
        for (let i = 0; i < allEnvs.length; i += 1) {
            if (allEnvs[i] === envName) {
                tableOptions.push([`*${allEnvs[i]}`]);
            }
            else {
                tableOptions.push([allEnvs[i]]);
            }
        }
        amplify_prompts_1.printer.blankLine();
        table(tableOptions, { format: 'markdown' });
        amplify_prompts_1.printer.blankLine();
    }
};
exports.run = run;
//# sourceMappingURL=list.js.map