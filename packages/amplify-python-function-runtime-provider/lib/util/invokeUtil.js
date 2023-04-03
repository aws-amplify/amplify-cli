"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pythonInvoke = void 0;
const execa_1 = __importDefault(require("execa"));
const path_1 = __importDefault(require("path"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const constants_1 = require("../constants");
const pyUtils_1 = require("./pyUtils");
const shimPath = path_1.default.join(amplify_cli_core_1.pathManager.getAmplifyPackageLibDirPath(constants_1.packageName), constants_1.relativeShimPath);
async function pythonInvoke(context, request) {
    var _a, _b;
    const handlerParts = path_1.default.parse(request.handler);
    const handlerFile = path_1.default.join(request.srcRoot, 'src', handlerParts.dir, handlerParts.name);
    const handlerName = handlerParts.ext.replace('.', '');
    const pyBinary = (0, pyUtils_1.getPythonBinaryName)();
    if (!pyBinary) {
        throw new amplify_cli_core_1.AmplifyError('LambdaFunctionInvokeError', { message: `Could not find 'python3' or 'python' executable in the PATH.` });
    }
    const childProcess = (0, execa_1.default)('pipenv', ['run', pyBinary, shimPath, handlerFile + '.py', handlerName], {
        cwd: request.srcRoot,
        env: { PATH: process.env.PATH, ...request.envVars },
        extendEnv: false,
        input: JSON.stringify({ event: request.event, context: {} }) + '\n',
    });
    (_a = childProcess.stderr) === null || _a === void 0 ? void 0 : _a.pipe(process.stderr);
    (_b = childProcess.stdout) === null || _b === void 0 ? void 0 : _b.pipe(process.stdout);
    let stdout;
    try {
        stdout = (await childProcess).stdout;
    }
    catch (err) {
        throw new amplify_cli_core_1.AmplifyError('LambdaFunctionInvokeError', { message: err.message }, err);
    }
    const lines = stdout.split('\n');
    const lastLine = lines[lines.length - 1];
    let result = lastLine;
    try {
        result = JSON.parse(lastLine);
    }
    catch (err) {
        context.print.warning('Could not parse function output as JSON. Using raw output.');
    }
    return result;
}
exports.pythonInvoke = pythonInvoke;
//# sourceMappingURL=invokeUtil.js.map