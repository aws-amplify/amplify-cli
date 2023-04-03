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
exports.executeHooks = void 0;
const which = __importStar(require("which"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const execa_1 = __importDefault(require("execa"));
const os_1 = require("os");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const index_1 = require("../logger/index");
const skipHooks_1 = require("./skipHooks");
const hooksConstants_1 = require("./hooksConstants");
const state_manager_1 = require("../state-manager");
const logger = (0, index_1.getLogger)('amplify-cli-core', 'hooks/hooksExecutioner.ts');
const executeHooks = async (hooksMetadata) => {
    var _a, _b;
    if ((0, skipHooks_1.skipHooks)()) {
        return;
    }
    const projectPath = (_a = state_manager_1.pathManager.findProjectRoot()) !== null && _a !== void 0 ? _a : process.cwd();
    const hooksDirPath = state_manager_1.pathManager.getHooksDirPath(projectPath);
    if (!fs.existsSync(hooksDirPath)) {
        return;
    }
    const hooksConfig = (_b = state_manager_1.stateManager.getHooksConfigJson(projectPath)) !== null && _b !== void 0 ? _b : {};
    const { commandHookFileMeta, subCommandHookFileMeta } = getHookFileMetadata(hooksDirPath, hooksMetadata.getHookEvent(), hooksConfig);
    const executionQueue = [commandHookFileMeta, subCommandHookFileMeta];
    if (hooksMetadata.getHookEvent().forcePush) {
        hooksMetadata.setEventCommand('push');
        hooksMetadata.setEventSubCommand(undefined);
        const { commandHookFileMeta } = getHookFileMetadata(hooksDirPath, hooksMetadata.getHookEvent(), hooksConfig);
        executionQueue.push(commandHookFileMeta);
    }
    for (const execFileMeta of executionQueue) {
        if (!execFileMeta) {
            continue;
        }
        const hooksRuntime = getRuntime(execFileMeta, hooksConfig);
        if (!(hooksRuntime === null || hooksRuntime === void 0 ? void 0 : hooksRuntime.runtimePath)) {
            continue;
        }
        await execHelper(hooksRuntime, execFileMeta, hooksMetadata.getDataParameter(), hooksMetadata.getErrorParameter());
    }
};
exports.executeHooks = executeHooks;
const execHelper = async (hooksRuntime, execFileMeta, dataParameter, errorParameter) => {
    var _a, _b, _c, _d, _e;
    if (!(execFileMeta === null || execFileMeta === void 0 ? void 0 : execFileMeta.filePath)) {
        return;
    }
    const projectRoot = (_a = state_manager_1.pathManager.findProjectRoot()) !== null && _a !== void 0 ? _a : process.cwd();
    if (!projectRoot) {
        return;
    }
    amplify_prompts_1.printer.blankLine();
    amplify_prompts_1.printer.info(`----- 🪝 ${execFileMeta.baseName} execution start -----`);
    try {
        logger.info(`hooks file: ${execFileMeta.fileName} execution started`);
        const runtimeArgs = ((_b = hooksRuntime.runtimeOptions) !== null && _b !== void 0 ? _b : []).concat([execFileMeta.filePath]);
        const childProcess = (0, execa_1.default)(hooksRuntime.runtimePath, runtimeArgs, {
            cwd: projectRoot,
            env: { PATH: process.env.PATH },
            input: JSON.stringify({
                data: dataParameter,
                error: errorParameter,
            }),
            stripFinalNewline: false,
        });
        (_c = childProcess === null || childProcess === void 0 ? void 0 : childProcess.stdout) === null || _c === void 0 ? void 0 : _c.pipe(process.stdout);
        const childProcessResult = await childProcess;
        if (!((_d = childProcessResult === null || childProcessResult === void 0 ? void 0 : childProcessResult.stdout) === null || _d === void 0 ? void 0 : _d.endsWith(os_1.EOL))) {
            amplify_prompts_1.printer.blankLine();
        }
        logger.info(`hooks file: ${execFileMeta.fileName} execution ended`);
    }
    catch (err) {
        logger.info(`hooks file: ${execFileMeta.fileName} execution error - ${JSON.stringify(err)}`);
        if (((_e = err === null || err === void 0 ? void 0 : err.stderr) === null || _e === void 0 ? void 0 : _e.length) > 0) {
            amplify_prompts_1.printer.error(err.stderr);
        }
        if (err === null || err === void 0 ? void 0 : err.exitCode) {
            amplify_prompts_1.printer.blankLine();
            amplify_prompts_1.printer.error(`${execFileMeta.baseName} hook script exited with exit code ${err.exitCode}`);
        }
        amplify_prompts_1.printer.blankLine();
        amplify_prompts_1.printer.error('exiting Amplify process...');
        amplify_prompts_1.printer.blankLine();
        logger.error('hook script exited with error', err);
        process.exit(76);
    }
    amplify_prompts_1.printer.info(`----- 🪝 ${execFileMeta.baseName} execution end -----`);
    amplify_prompts_1.printer.blankLine();
};
const getHookFileMetadata = (hooksDirPath, hookEvent, hooksConfig) => {
    if (!hookEvent.command) {
        return {};
    }
    const extensionsSupported = getSupportedExtensions(hooksConfig);
    const allFiles = fs
        .readdirSync(hooksDirPath)
        .filter((relFilePath) => fs.lstatSync(path.join(hooksDirPath, relFilePath)).isFile())
        .map((relFilePath) => splitFileName(relFilePath))
        .filter((fileMeta) => fileMeta.extension && Object.prototype.hasOwnProperty.call(extensionsSupported, fileMeta.extension))
        .map((fileMeta) => ({ ...fileMeta, filePath: path.join(hooksDirPath, String(fileMeta.fileName)) }));
    const commandType = hookEvent.eventPrefix ? [hookEvent.eventPrefix, hookEvent.command].join(hooksConstants_1.hookFileSeparator) : hookEvent.command;
    const commandHooksFiles = allFiles.filter((fileMeta) => fileMeta.baseName === commandType);
    const commandHookFileMeta = throwOnDuplicateHooksFiles(commandHooksFiles);
    let subCommandHooksFiles;
    let subCommandHookFileMeta;
    if (hookEvent.subCommand) {
        const subCommandType = hookEvent.eventPrefix
            ? [hookEvent.eventPrefix, hookEvent.command, hookEvent.subCommand].join(hooksConstants_1.hookFileSeparator)
            : [hookEvent.command, hookEvent.subCommand].join(hooksConstants_1.hookFileSeparator);
        subCommandHooksFiles = allFiles.filter((fileMeta) => fileMeta.baseName === subCommandType);
        subCommandHookFileMeta = throwOnDuplicateHooksFiles(subCommandHooksFiles);
    }
    return { commandHookFileMeta, subCommandHookFileMeta };
};
const throwOnDuplicateHooksFiles = (files) => {
    if (files.length > 1) {
        throw new Error(`found duplicate hook scripts: ${files.map((file) => file.fileName).join(', ')}`);
    }
    else if (files.length === 1) {
        return files[0];
    }
    return undefined;
};
const splitFileName = (filename) => {
    const lastDotIndex = filename.lastIndexOf('.');
    const fileMeta = { fileName: filename, baseName: filename };
    if (lastDotIndex !== -1) {
        fileMeta.baseName = filename.substring(0, lastDotIndex);
        fileMeta.extension = filename.substring(lastDotIndex + 1);
    }
    return fileMeta;
};
const getRuntime = (fileMeta, hooksConfig) => {
    var _a, _b, _c, _d;
    const { extension } = fileMeta;
    if (!extension) {
        return undefined;
    }
    const isWin = process.platform === 'win32' || process.env.OSTYPE === 'cygwin' || process.env.OSTYPE === 'msys';
    const extensionObj = getSupportedExtensions(hooksConfig);
    let runtime;
    if (isWin)
        runtime = (_a = extensionObj === null || extensionObj === void 0 ? void 0 : extensionObj[extension]) === null || _a === void 0 ? void 0 : _a.runtime_windows;
    runtime = runtime !== null && runtime !== void 0 ? runtime : (_b = extensionObj === null || extensionObj === void 0 ? void 0 : extensionObj[extension]) === null || _b === void 0 ? void 0 : _b.runtime;
    if (!runtime) {
        return undefined;
    }
    const executablePath = which.sync(runtime, {
        nothrow: true,
    });
    if (!executablePath) {
        throw new Error(String(`hooks runtime not found: ${runtime}`));
    }
    const hooksRuntime = {
        runtimePath: executablePath,
    };
    const runtimeOptions = (_c = extensionObj === null || extensionObj === void 0 ? void 0 : extensionObj[extension]) === null || _c === void 0 ? void 0 : _c.runtime_options;
    if (Array.isArray(runtimeOptions) && runtimeOptions.length > 0) {
        hooksRuntime.runtimeOptions = (_d = extensionObj === null || extensionObj === void 0 ? void 0 : extensionObj[extension]) === null || _d === void 0 ? void 0 : _d.runtime_options;
    }
    return hooksRuntime;
};
const getSupportedExtensions = (hooksConfig) => ({ ...hooksConstants_1.defaultSupportedExt, ...hooksConfig === null || hooksConfig === void 0 ? void 0 : hooksConfig.extensions });
//# sourceMappingURL=hooksExecutor.js.map