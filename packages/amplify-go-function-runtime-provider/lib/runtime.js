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
exports.packageResource = exports.checkDependencies = exports.getGoVersion = exports.buildResource = exports.executeCommand = void 0;
const amplify_function_plugin_interface_1 = require("@aws-amplify/amplify-function-plugin-interface");
const which = __importStar(require("which"));
const execa_1 = __importDefault(require("execa"));
const archiver_1 = __importDefault(require("archiver"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const glob_1 = __importDefault(require("glob"));
const path_1 = __importDefault(require("path"));
const semver_1 = require("semver");
const constants_1 = require("./constants");
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const executableName = 'go';
const minimumVersion = (0, semver_1.coerce)('1.0');
const maximumVersion = (0, semver_1.coerce)('2.0');
let executablePath;
const executeCommand = (args, streamStdio, env = {}, cwd = undefined, stdioInput = undefined) => {
    try {
        const output = execa_1.default.sync(executableName, args, {
            stdio: streamStdio === true ? 'inherit' : 'pipe',
            env,
            cwd,
            input: stdioInput,
        });
        if (output.exitCode !== 0) {
            throw new amplify_cli_core_1.AmplifyError('PackagingLambdaFunctionError', { message: `${executableName} failed, exit code was ${output.exitCode}` });
        }
        return output.stdout;
    }
    catch (err) {
        throw new amplify_cli_core_1.AmplifyError('PackagingLambdaFunctionError', { message: `${executableName} failed, error message was ${err.message}` }, err);
    }
};
exports.executeCommand = executeCommand;
const isBuildStale = (resourceDir, lastBuildTimeStamp, outDir) => {
    if (!fs_extra_1.default.existsSync(outDir) || glob_1.default.sync(`${outDir}/**`).length == 0) {
        return true;
    }
    const srcDir = path_1.default.join(resourceDir, constants_1.SRC);
    const dirTime = new Date(fs_extra_1.default.statSync(srcDir).mtime);
    if (dirTime > lastBuildTimeStamp) {
        return true;
    }
    const fileUpdatedAfterLastBuild = glob_1.default
        .sync(`${resourceDir}/${constants_1.SRC}/**`)
        .find((file) => new Date(fs_extra_1.default.statSync(file).mtime) > lastBuildTimeStamp);
    return !!fileUpdatedAfterLastBuild;
};
const buildResource = async ({ buildType, srcRoot, lastBuildTimeStamp }) => {
    let rebuilt = false;
    const buildDir = buildType === amplify_function_plugin_interface_1.BuildType.DEV ? constants_1.BIN_LOCAL : constants_1.BIN;
    const outDir = path_1.default.join(srcRoot, buildDir);
    const isWindows = process.platform.startsWith('win');
    const executableName = isWindows && buildType === amplify_function_plugin_interface_1.BuildType.DEV ? constants_1.MAIN_BINARY_WIN : constants_1.MAIN_BINARY;
    const executablePath = path_1.default.join(outDir, executableName);
    if (!lastBuildTimeStamp || isBuildStale(srcRoot, lastBuildTimeStamp, outDir)) {
        const srcDir = path_1.default.join(srcRoot, constants_1.SRC);
        if (fs_extra_1.default.existsSync(outDir)) {
            fs_extra_1.default.emptyDirSync(outDir);
        }
        else {
            fs_extra_1.default.mkdirSync(outDir);
        }
        const envVars = {};
        if (buildType === amplify_function_plugin_interface_1.BuildType.PROD) {
            envVars.GOOS = 'linux';
            envVars.GOARCH = 'amd64';
        }
        if (isWindows) {
            envVars.CGO_ENABLED = 0;
        }
        (0, exports.executeCommand)(['mod', 'tidy', '-v'], true, envVars, srcDir);
        (0, exports.executeCommand)(['build', '-o', executablePath, '.'], true, envVars, srcDir);
        rebuilt = true;
    }
    return {
        rebuilt,
    };
};
exports.buildResource = buildResource;
const getGoVersion = () => {
    const versionOutput = (0, exports.executeCommand)(['version'], false);
    if (versionOutput) {
        const parts = versionOutput.split(' ');
        if (parts.length !== 4 || !parts[2].startsWith('go') || (0, semver_1.coerce)(parts[2].slice(2)) === null) {
            throw new Error(`Invalid version string: ${versionOutput}`);
        }
        const goVersion = (0, semver_1.coerce)(parts[2].slice(2));
        return goVersion;
    }
    throw new Error(`Invalid version string: ${versionOutput}`);
};
exports.getGoVersion = getGoVersion;
const checkDependencies = async () => {
    executablePath = which.sync(executableName, {
        nothrow: true,
    });
    if (executablePath === null) {
        return {
            hasRequiredDependencies: false,
            errorMessage: `${executableName} executable was not found in PATH, make sure it's available. It can be installed from https://golang.org/doc/install`,
        };
    }
    const version = (0, exports.getGoVersion)();
    if ((0, semver_1.lt)(version, minimumVersion) || (0, semver_1.gte)(version, maximumVersion)) {
        return {
            hasRequiredDependencies: false,
            errorMessage: `${executableName} version found was: ${version.format()}, but must be between ${minimumVersion.format()} and ${maximumVersion.format()}`,
        };
    }
    return {
        hasRequiredDependencies: true,
    };
};
exports.checkDependencies = checkDependencies;
const packageResource = async (request, context) => {
    if (!request.lastPackageTimeStamp || request.lastBuildTimeStamp > request.lastPackageTimeStamp) {
        const packageHash = await context.amplify.hashDir(request.srcRoot, [constants_1.DIST]);
        const zipFn = process.platform.startsWith('win') ? winZip : nixZip;
        try {
            await zipFn(request.srcRoot, request.dstFilename, context.print);
        }
        catch (err) {
            throw new amplify_cli_core_1.AmplifyError('PackagingLambdaFunctionError', { message: `Packaging go function failed, error message was ${err.message}` }, err);
        }
        return { packageHash };
    }
    return {};
};
exports.packageResource = packageResource;
const winZip = async (src, dest, print) => {
    const version = (0, exports.getGoVersion)();
    try {
        if ((0, semver_1.gte)(version, (0, semver_1.coerce)('1.17'))) {
            await (0, execa_1.default)(executableName, ['install', 'github.com/aws/aws-lambda-go/cmd/build-lambda-zip@latest']);
        }
        else {
            await (0, execa_1.default)(executableName, ['get', '-u', 'github.com/aws/aws-lambda-go/cmd/build-lambda-zip']);
        }
    }
    catch (error) {
        throw new Error(`Error installing build-lambda-zip: ${error}`);
    }
    const goPath = process.env.GOPATH;
    if (!goPath) {
        throw new Error('Could not determine GOPATH. Make sure it is set.');
    }
    await (0, execa_1.default)(path_1.default.join(goPath, 'bin', 'build-lambda-zip.exe'), ['-o', dest, path_1.default.join(src, constants_1.BIN, constants_1.MAIN_BINARY)]);
    const resourceName = src.split(path_1.default.sep).pop();
    print.warning(`If the function ${resourceName} depends on assets outside of the go binary, you'll need to manually zip the binary along with the assets using WSL or another shell that generates a *nix-like zip file.`);
    print.warning('See https://github.com/aws/aws-lambda-go/issues/13#issuecomment-358729411.');
};
const nixZip = async (src, dest) => {
    const outDir = path_1.default.join(src, constants_1.BIN);
    const mainFile = path_1.default.join(outDir, constants_1.MAIN_BINARY);
    const file = fs_extra_1.default.createWriteStream(dest);
    return new Promise((resolve, reject) => {
        file.on('close', () => {
            resolve();
        });
        file.on('error', (err) => {
            reject(new Error(`Failed to zip with error: [${err}]`));
        });
        const zip = archiver_1.default.create('zip', {});
        zip.pipe(file);
        zip.file(mainFile, {
            name: constants_1.MAIN_BINARY,
            mode: 755,
        });
        zip.glob('**/*', {
            cwd: outDir,
            ignore: [mainFile],
        });
        void zip.finalize();
    });
};
//# sourceMappingURL=runtime.js.map