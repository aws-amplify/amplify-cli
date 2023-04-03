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
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_function_plugin_interface_1 = require("@aws-amplify/amplify-function-plugin-interface");
const execa_1 = __importDefault(require("execa"));
const fs = __importStar(require("fs-extra"));
const glob_1 = __importDefault(require("glob"));
const path = __importStar(require("path"));
const buildResource = async (request) => {
    const resourceDir = request.service ? request.srcRoot : path.join(request.srcRoot, 'src');
    if (!request.lastBuildTimeStamp || isBuildStale(request.srcRoot, request.lastBuildTimeStamp, request.buildType, request.lastBuildType)) {
        installDependencies(resourceDir, request.buildType);
        if (request.legacyBuildHookParams) {
            runBuildScriptHook(request.legacyBuildHookParams.resourceName, request.legacyBuildHookParams.projectRoot);
        }
        return Promise.resolve({ rebuilt: true });
    }
    return Promise.resolve({ rebuilt: false });
};
exports.buildResource = buildResource;
const runBuildScriptHook = (resourceName, projectRoot) => {
    const scriptName = `amplify:${resourceName}`;
    if (scriptExists(projectRoot, scriptName)) {
        runPackageManager(projectRoot, undefined, scriptName);
    }
};
const scriptExists = (projectRoot, scriptName) => {
    var _a;
    const packageJsonPath = path.normalize(path.join(projectRoot, 'package.json'));
    const rootPackageJsonContents = amplify_cli_core_1.JSONUtilities.readJson(packageJsonPath, { throwIfNotExist: false });
    return !!((_a = rootPackageJsonContents === null || rootPackageJsonContents === void 0 ? void 0 : rootPackageJsonContents.scripts) === null || _a === void 0 ? void 0 : _a[scriptName]);
};
const installDependencies = (resourceDir, buildType) => {
    runPackageManager(resourceDir, buildType);
};
const runPackageManager = (cwd, buildType, scriptName) => {
    var _a;
    const packageManager = (0, amplify_cli_core_1.getPackageManager)(cwd);
    if (packageManager === null) {
        return;
    }
    const useYarn = packageManager.packageManager === 'yarn';
    const args = toPackageManagerArgs(useYarn, buildType, scriptName);
    try {
        execa_1.default.sync(packageManager.executable, args, {
            cwd,
            stdio: 'pipe',
            encoding: 'utf-8',
        });
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            throw new amplify_cli_core_1.AmplifyError('PackagingLambdaFunctionError', {
                message: `Packaging lambda function failed. Could not find ${packageManager.packageManager} executable in the PATH.`,
            }, error);
        }
        else if ((_a = error.stdout) === null || _a === void 0 ? void 0 : _a.includes('YN0050: The --production option is deprecated')) {
            throw new amplify_cli_core_1.AmplifyError('PackagingLambdaFunctionError', {
                message: 'Packaging lambda function failed. Yarn 2 is not supported. Use Yarn 1.x and push again.',
            }, error);
        }
        else {
            throw new amplify_cli_core_1.AmplifyError('PackagingLambdaFunctionError', {
                message: `Packaging lambda function failed with the error \n${error.message}`,
            }, error);
        }
    }
};
const toPackageManagerArgs = (useYarn, buildType, scriptName) => {
    if (scriptName) {
        return useYarn ? [scriptName] : ['run-script', scriptName];
    }
    const args = useYarn ? ['--no-bin-links'] : ['install', '--no-bin-links'];
    if (buildType === amplify_function_plugin_interface_1.BuildType.PROD) {
        args.push('--production');
    }
    return args;
};
const isBuildStale = (resourceDir, lastBuildTimeStamp, buildType, lastBuildType) => {
    const dirTime = new Date(fs.statSync(resourceDir).mtime);
    if (dirTime > lastBuildTimeStamp || buildType !== lastBuildType) {
        return true;
    }
    const fileUpdatedAfterLastBuild = glob_1.default
        .sync(`${resourceDir}/**`)
        .filter((p) => !p.includes('dist'))
        .filter((p) => !p.includes('node_modules'))
        .find((file) => new Date(fs.statSync(file).mtime) > lastBuildTimeStamp);
    return !!fileUpdatedAfterLastBuild;
};
//# sourceMappingURL=legacyBuild.js.map