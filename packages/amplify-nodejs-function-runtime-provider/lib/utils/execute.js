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
const fs_extra_1 = require("fs-extra");
const path_1 = __importDefault(require("path"));
const exit_1 = __importDefault(require("exit"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
process.on('message', (options) => {
    const parentPipe = (0, fs_extra_1.createWriteStream)('', { fd: 3 });
    parentPipe.setDefaultEncoding('utf-8');
    void invokeFunction(options)
        .then((result) => {
        parentPipe.write(JSON.stringify({ result }));
    })
        .catch((error) => {
        let plainError = error;
        if (typeof error === 'object') {
            plainError = Object.getOwnPropertyNames(error).reduce((acc, key) => {
                acc[key] = error[key];
                return acc;
            }, {});
        }
        parentPipe.write(JSON.stringify({ error: plainError }));
    })
        .then(() => {
        (0, exit_1.default)(0);
    });
});
const invokeFunction = async (options) => {
    if (options.packageFolder) {
        const p = path_1.default.resolve(options.packageFolder);
        if (!(0, fs_extra_1.existsSync)(p)) {
            throw new amplify_cli_core_1.AmplifyError('LambdaFunctionInvokeError', { message: `Lambda package folder ${options.packageFolder} does not exist` });
        }
        process.chdir(p);
    }
    else {
        throw new amplify_cli_core_1.AmplifyError('LambdaFunctionInvokeError', { message: `Invalid lambda invoke request. No package folder specified.` });
    }
    if (!options.handler) {
        throw new amplify_cli_core_1.AmplifyError('LambdaFunctionInvokeError', { message: `Invalid lambda invoke request. No handler specified.` });
    }
    const lambdaHandler = await loadHandler(options.packageFolder, options.handler);
    const event = JSON.parse(options.event);
    const lambdaMockContext = {
        functionName: 'mock-function-name',
        functionVersion: '1',
        invokedFunctionArn: 'mock-function-arn',
        memoryLimitInMB: '128',
        awsRequestId: 'LAMBDA_INVOKE',
        logGroupName: 'LAMBDA_INVOKE',
        logStreamName: 'LAMBDA_INVOKE',
        callbackWaitsForEmptyEventLoop: true,
        ...options.context,
    };
    return new Promise((resolve, reject) => {
        const callback = (error, response) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(response);
            }
        };
        try {
            const lambdaPromise = lambdaHandler(event, lambdaMockContext, callback);
            if (typeof lambdaPromise === 'object' && typeof lambdaPromise.then === 'function') {
                resolve(lambdaPromise);
            }
        }
        catch (e) {
            reject(e);
        }
    });
};
const loadHandler = async (root, handler) => {
    var _a;
    const handlerParts = path_1.default.parse(handler);
    try {
        const handler = await (_a = path_1.default.join(root, handlerParts.dir, handlerParts.name), Promise.resolve().then(() => __importStar(require(_a))));
        const handlerFuncName = handlerParts.ext.replace('.', '');
        const handlerFunc = handler === null || handler === void 0 ? void 0 : handler[handlerFuncName];
        if (typeof handlerFunc !== 'function') {
            throw new amplify_cli_core_1.AmplifyError('LambdaFunctionInvokeError', {
                message: `Lambda handler ${handlerParts.name} has no exported function named ${handlerFuncName}`,
            });
        }
        return handlerFunc;
    }
    catch (err) {
        throw new amplify_cli_core_1.AmplifyError('LambdaFunctionInvokeError', { message: `Could not load lambda handler function due to ${err}` }, err);
    }
};
//# sourceMappingURL=execute.js.map