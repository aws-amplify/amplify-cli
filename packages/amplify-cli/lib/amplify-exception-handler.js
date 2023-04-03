"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUnhandledRejection = exports.handleException = exports.init = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_cli_logger_1 = require("@aws-amplify/amplify-cli-logger");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const diagnose_1 = require("./commands/diagnose");
const context_manager_1 = require("./context-manager");
let context;
const init = (_context) => {
    context = _context;
};
exports.init = init;
const handleException = async (exception) => {
    process.exitCode = 1;
    let amplifyException;
    if (exception instanceof amplify_cli_core_1.AmplifyException) {
        amplifyException = exception;
    }
    else if (!(exception instanceof Error)) {
        amplifyException = unknownErrorToAmplifyException(exception);
    }
    else if (isNodeJsError(exception)) {
        amplifyException = nodeErrorToAmplifyException(exception);
    }
    else {
        amplifyException = genericErrorToAmplifyException(exception);
    }
    const deepestException = getDeepestAmplifyException(amplifyException);
    if (context && (0, context_manager_1.isHeadlessCommand)(context)) {
        printHeadlessAmplifyException(deepestException);
    }
    else {
        printAmplifyException(deepestException);
    }
    if (context === null || context === void 0 ? void 0 : context.usageData) {
        await executeSafely(async () => {
            await (context === null || context === void 0 ? void 0 : context.usageData.emitError(deepestException));
            amplify_prompts_1.printer.blankLine();
            amplify_prompts_1.printer.info(`Session Identifier: ${context === null || context === void 0 ? void 0 : context.usageData.getSessionUuid()}`);
        }, 'Failed to emit error to usage data');
    }
    if (context) {
        await executeSafely(() => (0, diagnose_1.reportError)(context, deepestException), 'Failed to report error');
    }
    await executeSafely(() => {
        var _a, _b;
        return (0, amplify_cli_core_1.executeHooks)(amplify_cli_core_1.HooksMeta.getInstance(undefined, 'post', {
            message: (_a = deepestException.message) !== null && _a !== void 0 ? _a : 'undefined error in Amplify process',
            stack: (_b = deepestException.stack) !== null && _b !== void 0 ? _b : 'undefined error stack',
        }));
    }, 'Failed to execute hooks');
    await executeSafely(() => (0, amplify_cli_logger_1.getAmplifyLogger)().logError({
        message: deepestException.message,
        error: deepestException,
    }), 'Failed to log error');
    process.exit(1);
};
exports.handleException = handleException;
const handleUnhandledRejection = (reason) => {
    if (reason instanceof Error) {
        throw reason;
    }
    else if (reason !== null && typeof reason === 'string') {
        throw new Error(reason);
    }
    else if (reason !== null) {
        throw new Error(JSON.stringify(reason));
    }
    else {
        throw new Error('Unhandled promise rejection');
    }
};
exports.handleUnhandledRejection = handleUnhandledRejection;
const getDeepestAmplifyException = (amplifyException) => {
    let deepestAmplifyException = amplifyException;
    while (deepestAmplifyException.downstreamException && deepestAmplifyException.downstreamException instanceof amplify_cli_core_1.AmplifyException) {
        deepestAmplifyException = deepestAmplifyException.downstreamException;
    }
    return deepestAmplifyException;
};
const executeSafely = async (functionToExecute, errorMessagePrefix) => {
    try {
        await functionToExecute();
    }
    catch (e) {
        amplify_prompts_1.printer.error(`${errorMessagePrefix}: ${(e === null || e === void 0 ? void 0 : e.message) || e}`);
    }
};
const printAmplifyException = (amplifyException) => {
    const { message, details, resolution, link, stack } = amplifyException;
    amplify_prompts_1.printer.error(message);
    if (details) {
        amplify_prompts_1.printer.info(details);
    }
    amplify_prompts_1.printer.blankLine();
    if (resolution) {
        amplify_prompts_1.printer.info(`Resolution: ${resolution}`);
    }
    if (link) {
        amplify_prompts_1.printer.info(`Learn more at: ${link}`);
    }
    if (stack) {
        amplify_prompts_1.printer.debug('');
        amplify_prompts_1.printer.debug(stack);
    }
    if (amplifyException.downstreamException) {
        printError(amplifyException.downstreamException);
    }
};
const printError = (err) => {
    amplify_prompts_1.printer.debug('');
    amplify_prompts_1.printer.debug(err.message);
    if (err.stack) {
        amplify_prompts_1.printer.debug(err.stack);
    }
};
const printHeadlessAmplifyException = (amplifyException) => {
    const errorPrinter = new amplify_prompts_1.AmplifyPrinter(process.stderr);
    errorPrinter.error(JSON.stringify(amplifyException.toObject()));
};
const unknownErrorToAmplifyException = (err) => new amplify_cli_core_1.AmplifyFault(unknownErrorTypeToAmplifyExceptionType(), {
    message: typeof err === 'object' && err !== null && 'message' in err ? err.message : 'Unknown error',
    resolution: genericFaultResolution,
});
const genericErrorToAmplifyException = (err) => new amplify_cli_core_1.AmplifyFault(genericErrorTypeToAmplifyExceptionType(), {
    message: err.message,
    resolution: genericFaultResolution,
}, err);
const nodeErrorToAmplifyException = (err) => {
    if (!(0, amplify_cli_core_1.isWindowsPlatform)() && err.code === 'EACCES') {
        let path = err.path;
        if (err.message.includes('/.amplify/')) {
            path = '~/.amplify';
        }
        else if (err.message.includes('/.aws/amplify/')) {
            path = '~/.aws/amplify';
        }
        else if (err.message.includes('/amplify/')) {
            path = '<your amplify app directory>';
        }
        return new amplify_cli_core_1.AmplifyError('FileSystemPermissionsError', { message: err.message, resolution: `Try running 'sudo chown -R $(whoami):$(id -gn) ${path}' to fix this` }, err);
    }
    return new amplify_cli_core_1.AmplifyFault(nodeErrorTypeToAmplifyExceptionType(), {
        message: err.message,
        resolution: genericFaultResolution,
        code: err.code,
    }, err);
};
const nodeErrorTypeToAmplifyExceptionType = () => 'UnknownNodeJSFault';
const genericErrorTypeToAmplifyExceptionType = () => 'UnknownFault';
const unknownErrorTypeToAmplifyExceptionType = () => 'UnknownFault';
const genericFaultResolution = `Please report this issue at https://github.com/aws-amplify/amplify-cli/issues and include the project identifier from: 'amplify diagnose --send-report'`;
const isNodeJsError = (err) => err.code !== undefined;
//# sourceMappingURL=amplify-exception-handler.js.map