"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.write = exports.getConfig = exports.init = void 0;
const fs = __importStar(require("fs-extra"));
const uuid_1 = require("uuid");
const lodash_1 = __importDefault(require("lodash"));
const amplify_cli_core_1 = require("amplify-cli-core");
const getPath_1 = require("./getPath");
function init(context) {
    const configPath = (0, getPath_1.getPath)(context);
    if (fs.existsSync(configPath)) {
        try {
            const savedConfig = amplify_cli_core_1.JSONUtilities.readJson(configPath);
            Config.Instance.setValues(savedConfig);
            return getConfig();
        }
        catch (ex) {
            context.print.warning('Corrupted Config generating new config');
        }
    }
    write(context, Config.Instance);
    return getConfig();
}
exports.init = init;
function getConfig() {
    return Config.Instance;
}
exports.getConfig = getConfig;
function write(context, keyValues) {
    Config.Instance.setValues(keyValues);
    amplify_cli_core_1.JSONUtilities.writeJson((0, getPath_1.getPath)(context), Config.Instance);
}
exports.write = write;
class Config {
    constructor() {
        this.usageDataConfig = new UsageDataConfig();
    }
    static get Instance() {
        if (!this.instance) {
            this.instance = new Config();
        }
        return this.instance;
    }
    setValues(keyValues) {
        Config.instance = lodash_1.default.merge(Config.instance, keyValues);
    }
}
class UsageDataConfig {
    constructor() {
        this.installationUuid = (0, uuid_1.v4)();
        this.isUsageTrackingEnabled = true;
    }
}
//# sourceMappingURL=config.js.map