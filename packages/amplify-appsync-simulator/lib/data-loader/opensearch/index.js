"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenSearchDataLoader = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
class OpenSearchDataLoader {
    constructor(_config) {
        this._config = _config;
    }
    async load(payload) {
        var _a;
        try {
            if ((_a = process === null || process === void 0 ? void 0 : process.platform) === null || _a === void 0 ? void 0 : _a.startsWith('win')) {
                return null;
            }
            return await this._config.invoke(payload);
        }
        catch (e) {
            amplify_prompts_1.printer.info('Opensearch Data source failed with the following error:' + (e === null || e === void 0 ? void 0 : e.message));
            throw new amplify_cli_core_1.AmplifyFault('MockProcessFault', {
                message: 'Failed to load data from Opensearch data source',
                link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
            }, e);
        }
    }
}
exports.OpenSearchDataLoader = OpenSearchDataLoader;
//# sourceMappingURL=index.js.map