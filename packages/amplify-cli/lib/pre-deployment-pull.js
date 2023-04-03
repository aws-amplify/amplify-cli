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
exports.preDeployPullBackend = void 0;
const amplify_app_1 = require("@aws-amplify/amplify-app");
const amplify_cli_core_1 = require("amplify-cli-core");
const fs = __importStar(require("fs-extra"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const path = __importStar(require("path"));
const preDeployPullBackend = async (context, sandboxId) => {
    var _a;
    const providerPlugin = await Promise.resolve().then(() => __importStar(require(context.amplify.getProviderPlugins(context).awscloudformation)));
    const appStateBaseUrl = (_a = process.env.AMPLIFY_CLI_APPSTATE_BASE_URL) !== null && _a !== void 0 ? _a : providerPlugin.adminBackendMap['us-east-1'].appStateUrl;
    const url = `${appStateBaseUrl}/AppState/${sandboxId}`;
    const res = await (0, node_fetch_1.default)(`${url}`);
    const resJson = await res.json();
    if (resJson.message === 'Requested app was not found') {
        throw new amplify_cli_core_1.AmplifyError('ProjectNotFoundError', {
            message: `Requested app: ${sandboxId} was not found`,
            link: `${amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_PROJECT_TROUBLESHOOTING.url}`,
        });
    }
    if (resJson.appId) {
        throw new amplify_cli_core_1.AmplifyError('DeploymentError', {
            message: 'This app is already deployed.',
            resolution: `You can pull it using "amplify pull --appId ${resJson.appId}"`,
        });
    }
    if (!resJson.schema) {
        throw new amplify_cli_core_1.AmplifyError('ApiCategorySchemaNotFoundError', {
            message: 'No GraphQL schema found in the app.',
            link: `${amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url}`,
        });
    }
    const amplifyDirPath = amplify_cli_core_1.pathManager.getBackendDirPath(process.cwd());
    if (!fs.existsSync(amplifyDirPath)) {
        await (0, amplify_app_1.run)({ skipEnvCheck: true });
    }
    replaceSchema(resJson.schema);
    await context.amplify.invokePluginMethod(context, 'codegen', undefined, 'generateModels', [context]);
};
exports.preDeployPullBackend = preDeployPullBackend;
const replaceSchema = (schema) => {
    const schemaFilePath = path.join(process.cwd(), 'amplify', 'backend', 'api', 'amplifyDatasource', 'schema.graphql');
    fs.writeFileSync(schemaFilePath, schema);
};
//# sourceMappingURL=pre-deployment-pull.js.map