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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSearchableLambdaTriggerConfig = exports.findSearchableLambdaTriggers = exports.findModelLambdaTriggers = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const path = __importStar(require("path"));
const _ = require("lodash");
const mock_directory_1 = require("../mock-directory");
const findModelLambdaTriggers = async (context, tables) => {
    const lambdaTriggersMap = {};
    if (_.isEmpty(tables)) {
        return lambdaTriggersMap;
    }
    const lambdaNames = getLambdaFunctionNames();
    lambdaNames.forEach((resourceName) => {
        const resourcePath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), 'function', resourceName);
        const { Resources: cfnResources } = amplify_cli_core_1.JSONUtilities.readJson(path.join(resourcePath, `${resourceName}-cloudformation-template.json`));
        const tablesAttached = tables.filter((tableName) => {
            return isDDBStreamAttached(tableName, cfnResources);
        });
        tablesAttached.forEach((attachedTable) => {
            if (lambdaTriggersMap[attachedTable]) {
                lambdaTriggersMap[attachedTable].push({ name: resourceName });
            }
            else {
                lambdaTriggersMap[attachedTable] = [{ name: resourceName }];
            }
        });
    });
    return lambdaTriggersMap;
};
exports.findModelLambdaTriggers = findModelLambdaTriggers;
const findSearchableLambdaTriggers = async (context, tables, opensearchEndpoint) => {
    const lambdaTriggersMap = {};
    if (_.isEmpty(tables) || !opensearchEndpoint) {
        return lambdaTriggersMap;
    }
    tables.forEach((table) => {
        const lambdaTriggerConfig = (0, exports.getSearchableLambdaTriggerConfig)(context, opensearchEndpoint, table);
        lambdaTriggersMap[table] = { config: lambdaTriggerConfig };
    });
    return lambdaTriggersMap;
};
exports.findSearchableLambdaTriggers = findSearchableLambdaTriggers;
const getSearchableLambdaTriggerConfig = (context, opensearchEndpoint, tableName) => {
    const mockSearchableTriggerDirectory = (0, mock_directory_1.getMockSearchableTriggerDirectory)(context);
    return {
        handler: 'index.handler',
        runtimePluginId: 'amplify-python-function-runtime-provider',
        runtime: 'python',
        directory: mockSearchableTriggerDirectory,
        envVars: {
            OPENSEARCH_ENDPOINT: opensearchEndpoint,
            DEBUG: '1',
            OPENSEARCH_USE_EXTERNAL_VERSIONING: 'false',
            TABLE_NAME: (tableName === null || tableName === void 0 ? void 0 : tableName.substring(0, tableName === null || tableName === void 0 ? void 0 : tableName.lastIndexOf('Table'))) || '',
        },
        reBuild: false,
    };
};
exports.getSearchableLambdaTriggerConfig = getSearchableLambdaTriggerConfig;
const isDDBStreamAttached = (tableName, cfnResources) => {
    var _a, _b;
    const eventSourceMappingResourceName = `LambdaEventSourceMapping${tableName.substring(0, tableName.lastIndexOf('Table'))}`;
    return (cfnResources &&
        cfnResources[eventSourceMappingResourceName] &&
        ((_a = cfnResources[eventSourceMappingResourceName]) === null || _a === void 0 ? void 0 : _a.Type) === 'AWS::Lambda::EventSourceMapping' &&
        ((_b = _.get(cfnResources[eventSourceMappingResourceName], 'Properties.EventSourceArn.Fn::ImportValue.Fn::Sub')) === null || _b === void 0 ? void 0 : _b.includes(`:GetAtt:${tableName}:StreamArn`)));
};
const getLambdaFunctionNames = () => {
    const metaInfo = amplify_cli_core_1.stateManager.getMeta();
    return _.entries(_.get(metaInfo, ['function']))
        .filter(([_, funcMeta]) => funcMeta.service === "Lambda")
        .map(([key]) => key);
};
//# sourceMappingURL=find-lambda-triggers.js.map