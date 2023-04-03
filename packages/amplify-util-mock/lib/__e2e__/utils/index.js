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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSearchableMockResources = exports.logDebug = exports.runAppSyncSimulator = exports.terminateDDB = exports.reDeploy = exports.deploy = exports.launchDDBLocal = void 0;
const amplify_appsync_simulator_1 = require("@aws-amplify/amplify-appsync-simulator");
const dynamoEmulator = __importStar(require("amplify-dynamodb-simulator"));
const openSearchEmulator = __importStar(require("@aws-amplify/amplify-opensearch-simulator"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const lodash_1 = __importDefault(require("lodash"));
const appsync_resource_processor_1 = require("../../CFNParser/appsync-resource-processor");
const dynamo_db_1 = require("../../utils/dynamo-db");
const lambda_helper_1 = require("./lambda-helper");
const amplify_nodejs_function_runtime_provider_1 = require("amplify-nodejs-function-runtime-provider");
const opensearch_1 = require("../../utils/opensearch");
const amplify_cli_core_1 = require("amplify-cli-core");
const invoke = (0, amplify_nodejs_function_runtime_provider_1.functionRuntimeContributorFactory)({}).invoke;
__exportStar(require("./graphql-client"), exports);
jest.mock('amplify-cli-core', () => ({
    ...jest.requireActual('amplify-cli-core'),
    pathManager: {
        getAmplifyPackageLibDirPath: jest.fn().mockReturnValue('../amplify-dynamodb-simulator'),
        getAmplifyLibRoot: jest.fn().mockReturnValue(''),
    },
}));
async function launchDDBLocal() {
    let dbPath;
    while (true) {
        dbPath = path.join('/tmp', `amplify-cli-emulator-dynamodb-${(0, uuid_1.v4)()}`);
        if (!fs.existsSync(dbPath))
            break;
    }
    fs.ensureDirSync(dbPath);
    const emulator = await dynamoEmulator.launch({
        dbPath,
        port: null,
    });
    const client = await dynamoEmulator.getClient(emulator);
    logDebug(dbPath);
    return { emulator, dbPath, client };
}
exports.launchDDBLocal = launchDDBLocal;
async function deploy(transformerOutput, client, opensearchURL) {
    let config = (0, appsync_resource_processor_1.processTransformerStacks)(transformerOutput);
    config.appSync.apiKey = 'da-fake-api-key';
    if (client) {
        await (0, dynamo_db_1.createAndUpdateTable)(client, config);
        config = (0, dynamo_db_1.configureDDBDataSource)(config, client.config);
    }
    await configureLambdaDataSource(config);
    if (opensearchURL) {
        config = await configureOpensearchDataSource(config, opensearchURL);
    }
    const simulator = await runAppSyncSimulator(config);
    return { simulator, config };
}
exports.deploy = deploy;
async function reDeploy(transformerOutput, simulator, client) {
    let config = (0, appsync_resource_processor_1.processTransformerStacks)(transformerOutput);
    config.appSync.apiKey = 'da-fake-api-key';
    if (client) {
        await (0, dynamo_db_1.createAndUpdateTable)(client, config);
        config = (0, dynamo_db_1.configureDDBDataSource)(config, client.config);
    }
    configureLambdaDataSource(config);
    simulator === null || simulator === void 0 ? void 0 : simulator.reload(config);
    return { simulator, config };
}
exports.reDeploy = reDeploy;
async function configureLambdaDataSource(config) {
    config.dataSources
        .filter((d) => d.type === 'AWS_LAMBDA')
        .forEach((d) => {
        const arn = d.LambdaFunctionArn;
        const arnParts = arn.split(':');
        let functionName = arnParts[arnParts.length - 1];
        const lambdaConfig = (0, lambda_helper_1.getFunctionDetails)(functionName);
        d.invoke = (payload) => {
            logDebug('Invoking lambda with config', lambdaConfig);
            return invoke({
                srcRoot: lambdaConfig.packageFolder,
                runtime: 'nodejs',
                handler: `${functionName}.${lambdaConfig.handler}`,
                event: JSON.stringify(payload),
            });
        };
    });
    return config;
}
async function configureOpensearchDataSource(config, opensearchURL) {
    if ((0, amplify_cli_core_1.isWindowsPlatform)()) {
        return config;
    }
    const opensearchDataSourceType = 'AMAZON_ELASTICSEARCH';
    const opensearchDataSources = config.dataSources.filter((d) => d.type === opensearchDataSourceType);
    if (lodash_1.default.isEmpty(opensearchDataSources)) {
        return config;
    }
    return {
        ...config,
        dataSources: await Promise.all(config.dataSources.map(async (d) => {
            if (d.type !== opensearchDataSourceType) {
                return d;
            }
            return {
                ...d,
                invoke: async (payload) => {
                    return await (0, opensearch_1.querySearchable)(opensearchURL, payload);
                },
            };
        })),
    };
}
async function terminateDDB(emulator, dbPath) {
    try {
        if (emulator && emulator.terminate) {
            await emulator.terminate();
        }
    }
    catch (e) {
        logDebug('Failed to terminate the Local DynamoDB Server', e);
    }
    try {
        fs.removeSync(dbPath);
    }
    catch (e) {
        logDebug('Failed delete Local DynamoDB Server Folder', e);
    }
}
exports.terminateDDB = terminateDDB;
async function runAppSyncSimulator(config, port, wsPort) {
    const appsyncSimulator = new amplify_appsync_simulator_1.AmplifyAppSyncSimulator({ port, wsPort });
    await appsyncSimulator.start();
    await appsyncSimulator.init(config);
    return appsyncSimulator;
}
exports.runAppSyncSimulator = runAppSyncSimulator;
function logDebug(...msgs) {
    if (process.env.DEBUG || process.env.CI) {
        console.log(...msgs);
    }
}
exports.logDebug = logDebug;
async function setupSearchableMockResources(pathToSearchableMockResources) {
    const pathToSearchableTrigger = path.join(pathToSearchableMockResources, 'searchable-lambda-trigger');
    fs.ensureDirSync(pathToSearchableTrigger);
    const searchableLambdaResourceDir = path.resolve(__dirname, '..', '..', '..', 'resources', 'mock-searchable-lambda-trigger');
    fs.copySync(searchableLambdaResourceDir, pathToSearchableTrigger, { overwrite: true });
    const pathToOpensearchLocal = path.join(pathToSearchableMockResources, openSearchEmulator.packageName, openSearchEmulator.relativePathToOpensearchLocal);
    fs.ensureDirSync(pathToOpensearchLocal);
    const pathToOpensearchData = path.join(pathToSearchableMockResources, 'searchable-data');
    fs.ensureDirSync(pathToOpensearchData);
    const emulator = await openSearchEmulator.launch(pathToOpensearchData, {
        port: null,
    });
    return { emulator };
}
exports.setupSearchableMockResources = setupSearchableMockResources;
//# sourceMappingURL=index.js.map