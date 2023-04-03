"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoke = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const execa_1 = __importDefault(require("execa"));
const constants_1 = require("../constants");
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const invoke = async (request) => {
    var _a, _b;
    const sourcePath = path_1.default.join(request.srcRoot, 'src');
    let result;
    let tempDir = '';
    let eventFile = '';
    try {
        tempDir = fs_extra_1.default.mkdtempSync(path_1.default.join(request.srcRoot, 'amplify'));
        eventFile = path_1.default.join(tempDir, 'event.json');
        fs_extra_1.default.writeFileSync(eventFile, request.event);
        const lambdaTestTool = request.runtime === constants_1.dotnetcore31 ? 'lambda-test-tool-3.1' : 'lambda-test-tool-6.0';
        const execPromise = (0, execa_1.default)(constants_1.executableName, [lambdaTestTool, '--no-ui', '--function-handler', request.handler, '--payload', eventFile, '--pause-exit', 'false'], {
            cwd: sourcePath,
            env: request.envVars,
        });
        (_a = execPromise.stderr) === null || _a === void 0 ? void 0 : _a.pipe(process.stderr);
        (_b = execPromise.stdout) === null || _b === void 0 ? void 0 : _b.pipe(process.stdout);
        result = await execPromise;
    }
    catch (err) {
        throw new amplify_cli_core_1.AmplifyError('LambdaFunctionInvokeError', { message: `Test failed, error message was ${err.message}` }, err);
    }
    finally {
        if (tempDir && fs_extra_1.default.existsSync(tempDir)) {
            fs_extra_1.default.emptyDirSync(tempDir);
            fs_extra_1.default.removeSync(tempDir);
        }
    }
    if (result.exitCode !== 0) {
        throw new amplify_cli_core_1.AmplifyError('LambdaFunctionInvokeError', { message: `Test failed, exit code was ${result.exitCode}` });
    }
    const { stdout } = result;
    const lines = stdout.split('\n');
    const lastLine = lines[lines.length - 1];
    let output = lastLine;
    try {
        output = JSON.parse(lastLine);
    }
    catch (err) {
    }
    return output;
};
exports.invoke = invoke;
//# sourceMappingURL=invoke.js.map