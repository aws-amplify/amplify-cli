"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reporterEndpoint = exports.getPublicKey = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const node_fetch_1 = __importDefault(require("node-fetch"));
const getPublicKey = async () => {
    let url = 'https://aws-amplify.github.io/amplify-cli/report-public-key.pub';
    if (process.env.AMPLIFY_CLI_BETA_PUBLIC_KEY_URL && typeof process.env.AMPLIFY_CLI_BETA_PUBLIC_KEY_URL === 'string') {
        url = process.env.AMPLIFY_CLI_BETA_USAGE_TRACKING_URL || url;
    }
    const res = await (0, node_fetch_1.default)(url);
    if (!res.ok) {
        throw new amplify_cli_core_1.DiagnoseReportUploadError('Failed to retrieve public key');
    }
    return res.text();
};
exports.getPublicKey = getPublicKey;
const reporterEndpoint = () => {
    const prodUrl = 'https://api.cli.amplify.aws/diagnose/report';
    if (process.env.AMPLIFY_CLI_BETA_REPORT_URL && typeof process.env.AMPLIFY_CLI_BETA_REPORT_URL === 'string') {
        return process.env.AMPLIFY_CLI_BETA_USAGE_TRACKING_URL || prodUrl;
    }
    return prodUrl;
};
exports.reporterEndpoint = reporterEndpoint;
//# sourceMappingURL=reporter-apis.js.map