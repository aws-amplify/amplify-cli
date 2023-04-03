"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUrl = exports.prodUrl = void 0;
const url_1 = __importDefault(require("url"));
const VersionManager_1 = require("./VersionManager");
let parsedUrl;
const version = (0, VersionManager_1.getLatestApiVersion)();
exports.prodUrl = `https://api.cli.amplify.aws/${version}/metrics`;
const getUrl = () => {
    if (!parsedUrl) {
        parsedUrl = getParsedUrl();
    }
    return parsedUrl;
};
exports.getUrl = getUrl;
const getParsedUrl = () => {
    if (isProduction() && !useBetaUrl()) {
        return url_1.default.parse(exports.prodUrl);
    }
    return url_1.default.parse(process.env.AMPLIFY_CLI_BETA_USAGE_TRACKING_URL || '');
};
const isProduction = () => process.env.CLI_ENV === 'production';
const useBetaUrl = () => !!(process.env.AMPLIFY_CLI_BETA_USAGE_TRACKING_URL && typeof process.env.AMPLIFY_CLI_BETA_USAGE_TRACKING_URL === 'string');
//# sourceMappingURL=getUsageDataUrl.js.map