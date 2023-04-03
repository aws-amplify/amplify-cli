"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildResource = void 0;
const path_1 = require("path");
const execa = __importStar(require("execa"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const glob_1 = __importDefault(require("glob"));
const constants_1 = require("./constants");
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const buildResource = async (request) => {
    const resourceDir = (0, path_1.join)(request.srcRoot);
    const projectPath = (0, path_1.join)(resourceDir);
    if (!request.lastBuildTimeStamp || isBuildStale(request.srcRoot, request.lastBuildTimeStamp)) {
        installDependencies(projectPath);
        return { rebuilt: true };
    }
    return { rebuilt: false };
};
exports.buildResource = buildResource;
const installDependencies = (resourceDir) => {
    runPackageManager(resourceDir, 'build');
    const packageLibDir = amplify_cli_core_1.pathManager.getAmplifyPackageLibDirPath(constants_1.packageName);
    if (!fs_extra_1.default.existsSync((0, path_1.join)(packageLibDir, constants_1.relativeShimJarPath))) {
        runPackageManager((0, path_1.join)(packageLibDir, constants_1.relativeShimSrcPath), 'jar');
    }
};
const runPackageManager = (cwd, buildArgs) => {
    const packageManager = 'gradle';
    const args = [buildArgs];
    try {
        const result = execa.sync(packageManager, args, {
            cwd,
        });
        if (result.exitCode !== 0) {
            throw new amplify_cli_core_1.AmplifyError('PackagingLambdaFunctionError', { message: `${packageManager} failed, exit code was ${result.exitCode}` });
        }
    }
    catch (err) {
        throw new amplify_cli_core_1.AmplifyError('PackagingLambdaFunctionError', { message: `${packageManager} failed, error message was ${err.message}` }, err);
    }
};
const isBuildStale = (resourceDir, lastBuildTimeStamp) => {
    const dirTime = new Date(fs_extra_1.default.statSync(resourceDir).mtime);
    if (dirTime > lastBuildTimeStamp) {
        return true;
    }
    const fileUpdatedAfterLastBuild = glob_1.default
        .sync(`${resourceDir}/*/!(build | dist)/**`)
        .find((file) => new Date(fs_extra_1.default.statSync(file).mtime) > lastBuildTimeStamp);
    return !!fileUpdatedAfterLastBuild;
};
//# sourceMappingURL=build.js.map