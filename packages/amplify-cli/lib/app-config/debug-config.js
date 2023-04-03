"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugConfig = void 0;
const lodash_1 = __importDefault(require("lodash"));
const amplify_cli_core_1 = require("amplify-cli-core");
class DebugConfig {
    constructor() {
        const cliJson = this.getCLIJson(false);
        this.debug = {
            shareProjectConfig: lodash_1.default.get(cliJson, ['debug', 'shareProjectConfig']),
        };
        this.dirty = false;
    }
    static get Instance() {
        if (!this.instance) {
            this.instance = new DebugConfig();
        }
        return this.instance;
    }
    getCLIJson(throwIfNotExist = true) {
        const rootPath = amplify_cli_core_1.pathManager.findProjectRoot();
        if (!rootPath) {
            if (!throwIfNotExist) {
                return {};
            }
            throw (0, amplify_cli_core_1.projectNotInitializedError)();
        }
        return amplify_cli_core_1.stateManager.getCLIJSON(rootPath, undefined, { throwIfNotExist });
    }
    setShareProjectConfig(shareProjectConfig) {
        this.debug = {
            shareProjectConfig,
        };
        this.dirty = true;
    }
    writeShareProjectConfig() {
        const rootPath = amplify_cli_core_1.pathManager.findProjectRoot();
        if (!rootPath) {
            throw (0, amplify_cli_core_1.projectNotInitializedError)();
        }
        const cliJson = this.getCLIJson(false);
        if (!cliJson) {
            return;
        }
        const updatedCliJson = lodash_1.default.setWith(cliJson, [], this.debug);
        amplify_cli_core_1.stateManager.setCLIJSON(rootPath, { ...updatedCliJson, debug: this.debug });
        this.dirty = false;
    }
    getCanSendReport() {
        if (this.dirty) {
            throw new amplify_cli_core_1.DebugConfigValueNotSetError();
        }
        return this.debug.shareProjectConfig === true;
    }
    promptSendReport() {
        if (this.dirty) {
            throw new amplify_cli_core_1.DebugConfigValueNotSetError();
        }
        return this.debug.shareProjectConfig === undefined;
    }
    setAndWriteShareProject(shareProjectConfig) {
        this.setShareProjectConfig(shareProjectConfig);
        this.writeShareProjectConfig();
    }
}
exports.DebugConfig = DebugConfig;
//# sourceMappingURL=debug-config.js.map