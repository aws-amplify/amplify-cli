"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.localInvoke = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const get_port_1 = __importDefault(require("get-port"));
const runtime_1 = require("./runtime");
const constants_1 = require("./constants");
const execa_1 = __importDefault(require("execa"));
const UNKNOWN_ERROR = 'Unknown error occurred during the execution of the Lambda function';
const buildLocalInvoker = async (context) => {
    const localInvokerDir = path_1.default.join(amplify_cli_core_1.pathManager.getAmplifyPackageLibDirPath(constants_1.packageName), constants_1.relativeShimSrcPath);
    const isWindows = /^win/.test(process.platform);
    const localInvokeExecutableName = isWindows === true ? constants_1.MAIN_BINARY_WIN : constants_1.MAIN_BINARY;
    const localInvokeExecutablePath = path_1.default.join(localInvokerDir, localInvokeExecutableName);
    if (!fs_extra_1.default.existsSync(localInvokeExecutablePath)) {
        context.print.info('Local invoker binary was not found, building it...');
        (0, runtime_1.executeCommand)(['mod', 'tidy'], true, undefined, localInvokerDir);
        (0, runtime_1.executeCommand)(['build', constants_1.MAIN_SOURCE], true, undefined, localInvokerDir);
    }
    return {
        executable: localInvokeExecutablePath,
    };
};
const startLambda = (request, portNumber, lambda) => {
    const envVars = request.envVars || {};
    envVars['_LAMBDA_SERVER_PORT'] = portNumber.toString();
    const lambdaProcess = execa_1.default.command(lambda.executable, {
        env: envVars,
        extendEnv: false,
        cwd: lambda.cwd,
        stderr: 'inherit',
        stdout: 'inherit',
    });
    return lambdaProcess;
};
const stopLambda = async (lambdaProcess) => {
    try {
        if (lambdaProcess) {
            lambdaProcess.cancel();
            await lambdaProcess;
        }
    }
    catch (error) {
    }
};
const localInvoke = async (request, context) => {
    const localInvoker = await buildLocalInvoker(context);
    const portNumber = await (0, get_port_1.default)({ port: get_port_1.default.makeRange(constants_1.BASE_PORT, constants_1.MAX_PORT) });
    const lambdaExecutableDir = path_1.default.join(request.srcRoot, constants_1.BIN_LOCAL);
    const lambdaExecutablePath = path_1.default.join(lambdaExecutableDir, constants_1.MAIN_BINARY);
    context.print.info(`Launching Lambda process, port: ${portNumber}`);
    const lambdaProcess = startLambda(request, portNumber, { executable: lambdaExecutablePath, cwd: lambdaExecutableDir });
    const envelope = {
        timeoutMilliseconds: 5000,
        port: portNumber,
        payload: request.event,
    };
    let envelopeString = JSON.stringify(envelope, null);
    envelopeString += '\n';
    const processResult = execa_1.default.sync(localInvoker.executable, {
        input: envelopeString,
    });
    await stopLambda(lambdaProcess);
    if (processResult.exitCode === 0) {
        const lambdaResult = JSON.parse(processResult.stdout);
        if (lambdaResult.Response) {
            try {
                return JSON.parse(lambdaResult.Response);
            }
            catch (_a) {
                return lambdaResult.Response;
            }
        }
        else {
            throw new Error(lambdaResult.Error || UNKNOWN_ERROR);
        }
    }
    else {
        const errorMessage = processResult.stderr || UNKNOWN_ERROR;
        throw new Error(`Lambda invoker exit code: ${processResult.exitCode}, message: ${errorMessage}`);
    }
};
exports.localInvoke = localInvoke;
//# sourceMappingURL=localinvoke.js.map