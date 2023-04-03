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
exports.getPythonBinaryName = exports.execAsStringPromise = exports.majMinPyVersion = exports.getPipenvDir = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const execa_1 = __importDefault(require("execa"));
const which = __importStar(require("which"));
const ini_1 = require("ini");
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
async function getPipenvDir(srcRoot) {
    const pipEnvDir = await execAsStringPromise('pipenv --venv', { cwd: srcRoot });
    const pyBinary = (0, exports.getPythonBinaryName)();
    if (!pyBinary) {
        throw new amplify_cli_core_1.AmplifyError('PackagingLambdaFunctionError', { message: `Could not find 'python3' or 'python' executable in the PATH.` });
    }
    let pipEnvPath = path_1.default.join(pipEnvDir, 'lib', `python${getPipfilePyVersion(path_1.default.join(srcRoot, 'Pipfile'))}`, 'site-packages');
    if (process.platform.startsWith('win')) {
        pipEnvPath = path_1.default.join(pipEnvDir, 'Lib', 'site-packages');
    }
    if (fs_extra_1.default.existsSync(pipEnvPath)) {
        return pipEnvPath;
    }
    throw new amplify_cli_core_1.AmplifyError('PackagingLambdaFunctionError', { message: `Could not find a pipenv site-packages directory at ${pipEnvPath}` });
}
exports.getPipenvDir = getPipenvDir;
function majMinPyVersion(pyVersion) {
    if (!/^Python \d+\.\d+\.\d+$/.test(pyVersion)) {
        throw new amplify_cli_core_1.AmplifyError('PackagingLambdaFunctionError', { message: `Cannot interpret Python version "${pyVersion}"` });
    }
    const versionNum = pyVersion.split(' ')[1];
    return versionNum.split('.').slice(0, 2).join('.');
}
exports.majMinPyVersion = majMinPyVersion;
async function execAsStringPromise(command, opts) {
    try {
        let stdout = (await execa_1.default.command(command, opts)).stdout;
        if (stdout) {
            stdout = stdout.trim();
        }
        return stdout;
    }
    catch (err) {
        throw new amplify_cli_core_1.AmplifyError('PackagingLambdaFunctionError', { message: `Received error [${err}] running command [${command}]` });
    }
}
exports.execAsStringPromise = execAsStringPromise;
const getPythonBinaryName = () => {
    const executables = ['python3', 'python'];
    let executablePath;
    for (const executable of executables) {
        executablePath = which.sync(executable, {
            nothrow: true,
        });
        if (executablePath !== null) {
            return executable;
        }
    }
    return undefined;
};
exports.getPythonBinaryName = getPythonBinaryName;
const getPipfilePyVersion = (pipfilePath) => {
    var _a;
    const pipfile = (0, ini_1.parse)(fs_extra_1.default.readFileSync(pipfilePath, 'utf-8'));
    const version = (_a = pipfile === null || pipfile === void 0 ? void 0 : pipfile.requires) === null || _a === void 0 ? void 0 : _a.python_version;
    if (!version) {
        throw new amplify_cli_core_1.AmplifyError('PackagingLambdaFunctionError', { message: `Did not find Python version specified in ${pipfilePath}` });
    }
    return version;
};
//# sourceMappingURL=pyUtils.js.map