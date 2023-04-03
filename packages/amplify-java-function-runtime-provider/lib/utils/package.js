"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.packageResource = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
async function packageResource(request, context) {
    if (!request.lastPackageTimeStamp || request.lastBuildTimeStamp > request.lastPackageTimeStamp) {
        const packageHash = (await context.amplify.hashDir(path_1.default.join(request.srcRoot, 'src'), ['build']));
        const output = fs_extra_1.default.createWriteStream(request.dstFilename);
        return new Promise((resolve, reject) => {
            output.on('close', () => {
                resolve({ packageHash });
            });
            output.on('error', (err) => {
                reject(new amplify_cli_core_1.AmplifyError('PackagingLambdaFunctionError', { message: `Failed to copy zip with error: [${err}]` }, err));
            });
            const zipFile = 'latest_build.zip';
            fs_extra_1.default.createReadStream(path_1.default.join(request.srcRoot, 'build', 'distributions', zipFile)).pipe(output);
        });
    }
    return Promise.resolve({});
}
exports.packageResource = packageResource;
//# sourceMappingURL=package.js.map