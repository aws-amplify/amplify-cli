"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pythonBuild = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const glob_1 = __importDefault(require("glob"));
const execa_1 = __importDefault(require("execa"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
async function pythonBuild(params) {
    if (!params.lastBuildTimeStamp || isBuildStale(params.srcRoot, params.lastBuildTimeStamp)) {
        try {
            await execa_1.default.command('pipenv install', { cwd: params.srcRoot, stdio: 'inherit' });
        }
        catch (err) {
            throw new amplify_cli_core_1.AmplifyError('PackagingLambdaFunctionError', { message: `Failed to install dependencies in ${params.srcRoot}: ${err}` }, err);
        }
        return { rebuilt: true };
    }
    return { rebuilt: false };
}
exports.pythonBuild = pythonBuild;
function isBuildStale(resourceDir, lastBuildTimeStamp) {
    const dirTime = new Date(fs_extra_1.default.statSync(resourceDir).mtime);
    if (dirTime > lastBuildTimeStamp) {
        return true;
    }
    const fileUpdatedAfterLastBuild = glob_1.default
        .sync(`${resourceDir}/**`, { ignore: ['**/dist/**', '**/__pycache__/**'] })
        .find((file) => new Date(fs_extra_1.default.statSync(file).mtime) > lastBuildTimeStamp);
    return !!fileUpdatedAfterLastBuild;
}
//# sourceMappingURL=buildUtils.js.map