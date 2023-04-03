"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invokeResource = void 0;
const execa_1 = __importDefault(require("execa"));
const path_1 = __importDefault(require("path"));
const constants_1 = require("./constants");
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const invokeResource = async (request, context) => {
    var _a, _b;
    const [handlerClassName, handlerMethodName] = request.handler.split('::');
    const childProcess = (0, execa_1.default)('java', [
        '-jar',
        path_1.default.join(amplify_cli_core_1.pathManager.getAmplifyPackageLibDirPath(constants_1.packageName), constants_1.relativeShimJarPath),
        path_1.default.join(request.srcRoot, 'build', 'libs', 'latest_build.jar'),
        handlerClassName,
        handlerMethodName,
    ], {
        input: request.event,
        env: { PATH: process.env.PATH, ...request.envVars },
        extendEnv: false,
    });
    (_a = childProcess.stderr) === null || _a === void 0 ? void 0 : _a.pipe(process.stderr);
    (_b = childProcess.stdout) === null || _b === void 0 ? void 0 : _b.pipe(process.stdout);
    const { stdout, exitCode } = await childProcess;
    if (exitCode !== 0) {
        throw new amplify_cli_core_1.AmplifyError('LambdaFunctionInvokeError', { message: `java failed, exit code was ${exitCode}` });
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
};
exports.invokeResource = invokeResource;
//# sourceMappingURL=invoke.js.map