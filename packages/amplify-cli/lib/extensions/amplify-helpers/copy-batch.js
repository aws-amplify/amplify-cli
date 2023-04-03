"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyBatch = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
async function copyBatch(context, jobs, props, force, writeParams) {
    const { template, prompt, filesystem } = context;
    const { confirm } = prompt;
    const shouldGenerate = async (target, force) => {
        if (!filesystem.exists(target) || force)
            return true;
        return confirm(`overwrite ${target}`);
    };
    for (const job of jobs) {
        if (!job) {
            continue;
        }
        if (await shouldGenerate(job.target, force)) {
            await template.generate({
                directory: job.dir,
                template: job.template,
                target: job.target,
                props,
            });
            if (writeParams && job.paramsFile) {
                const params = writeParams && Object.keys(writeParams) && Object.keys(writeParams).length > 0 ? writeParams : props;
                amplify_cli_core_1.JSONUtilities.writeJson(job.paramsFile, params);
            }
        }
    }
}
exports.copyBatch = copyBatch;
//# sourceMappingURL=copy-batch.js.map