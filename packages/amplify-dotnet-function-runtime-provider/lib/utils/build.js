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
exports.build = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const glob_1 = __importDefault(require("glob"));
const execa = __importStar(require("execa"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_function_plugin_interface_1 = require("@aws-amplify/amplify-function-plugin-interface");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const constants_1 = require("../constants");
const build = async ({ srcRoot, lastBuildTimeStamp, buildType, runtime }) => {
    if (runtime === constants_1.dotnetcore31) {
        amplify_prompts_1.printer.warn(`.NET Core 3.1 is deprecated. Migrate your function at ${srcRoot} to .NET 6.`);
    }
    const distPath = path_1.default.join(srcRoot, 'dist');
    const sourceFolder = path_1.default.join(srcRoot, 'src');
    if (!lastBuildTimeStamp || !fs_extra_1.default.existsSync(distPath) || isBuildStale(sourceFolder, lastBuildTimeStamp)) {
        if (!fs_extra_1.default.existsSync(distPath)) {
            fs_extra_1.default.mkdirSync(distPath);
        }
        const buildArguments = [];
        switch (buildType) {
            case amplify_function_plugin_interface_1.BuildType.PROD:
                buildArguments.push('publish', '-c', 'Release', '-o', distPath);
                break;
            case amplify_function_plugin_interface_1.BuildType.DEV:
                buildArguments.push('build', '-c', 'Debug', '-p:CopyLocalLockFileAssemblies=true');
                break;
            default:
                throw new amplify_cli_core_1.AmplifyError('PackagingLambdaFunctionError', { message: `Unexpected buildType: [${buildType}]` });
        }
        try {
            const result = execa.sync(constants_1.executableName, buildArguments, {
                cwd: sourceFolder,
            });
            if (result.exitCode !== 0) {
                throw new amplify_cli_core_1.AmplifyError('PackagingLambdaFunctionError', {
                    message: `${constants_1.executableName} build failed, exit code was ${result.exitCode}`,
                });
            }
        }
        catch (err) {
            throw new amplify_cli_core_1.AmplifyError('PackagingLambdaFunctionError', {
                message: `${constants_1.executableName} build failed, error message was ${err.message}`,
            }, err);
        }
        return { rebuilt: true };
    }
    return { rebuilt: false };
};
exports.build = build;
const isBuildStale = (sourceFolder, lastBuildTimeStamp) => {
    if (!(lastBuildTimeStamp instanceof Date && !isNaN(lastBuildTimeStamp))) {
        return true;
    }
    const dirTime = new Date(fs_extra_1.default.statSync(sourceFolder).mtime);
    if (dirTime > lastBuildTimeStamp) {
        return true;
    }
    const fileUpdatedAfterLastBuild = glob_1.default
        .sync('**/*', { cwd: sourceFolder, ignore: ['bin', 'obj', '+(bin|obj)/**/*'] })
        .find((file) => new Date(fs_extra_1.default.statSync(path_1.default.join(sourceFolder, file)).mtime) > lastBuildTimeStamp);
    return !!fileUpdatedAfterLastBuild;
};
//# sourceMappingURL=build.js.map