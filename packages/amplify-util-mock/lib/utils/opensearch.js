"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.querySearchable = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const node_fetch_1 = __importDefault(require("node-fetch"));
const querySearchable = async (endpoint, searchConfig) => {
    if (!endpoint) {
        throw new amplify_cli_core_1.AmplifyFault('MockProcessFault', {
            message: 'The local opensearch endpoint is not found',
            link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
        });
    }
    try {
        searchConfig = searchConfig;
    }
    catch (e) {
        throw new amplify_cli_core_1.AmplifyFault('MockProcessFault', {
            message: 'Given search query configuration is not valid',
            link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
        }, e);
    }
    const url = endpoint.replace(/\/+$/, '') + searchConfig.path;
    const result = await (0, node_fetch_1.default)(url, {
        method: 'POST',
        body: JSON.stringify(searchConfig.params.body),
        headers: {
            'Content-type': 'application/json',
        },
    });
    return result.json();
};
exports.querySearchable = querySearchable;
//# sourceMappingURL=opensearch.js.map