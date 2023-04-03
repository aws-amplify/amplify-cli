"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchableModelExists = exports.configureSearchEnabledTables = exports.processTransformerStacks = exports.processCloudFormationResults = exports.processApiResources = void 0;
const amplify_appsync_simulator_1 = require("@aws-amplify/amplify-appsync-simulator");
const resource_processors_1 = require("./resource-processors");
const index_1 = require("./stack/index");
const lodash_1 = __importDefault(require("lodash"));
const CFN_DEFAULT_PARAMS = {
    'AWS::Region': 'us-east-1-fake',
    'AWS::AccountId': '12345678910',
    'AWS::StackId': 'fake-stackId',
    'AWS::StackName': 'local-testing',
    'AWS::URLSuffix': 'amazonaws.com',
};
const RESOLVER_TEMPLATE_LOCATION_PREFIX = 's3://${S3DeploymentBucket}/${S3DeploymentRootKey}/';
function processApiResources(resources, transformResult, appSyncConfig) {
    Object.values(resources).forEach((resource) => {
        const { Type: resourceType } = resource;
        const result = resource.result;
        switch (resourceType) {
            case 'AWS::AppSync::DataSource':
                appSyncConfig.dataSources.push(result);
                break;
            case 'AWS::AppSync::Resolver':
                appSyncConfig.resolvers.push({
                    ...result,
                    requestMappingTemplateLocation: result.requestMappingTemplateLocation && result.requestMappingTemplateLocation.replace(RESOLVER_TEMPLATE_LOCATION_PREFIX, ''),
                    responseMappingTemplateLocation: result.responseMappingTemplateLocation && result.responseMappingTemplateLocation.replace(RESOLVER_TEMPLATE_LOCATION_PREFIX, ''),
                });
                break;
            case 'AWS::DynamoDB::Table':
                appSyncConfig.tables.push(result);
                break;
            case 'AWS::AppSync::FunctionConfiguration':
                appSyncConfig.functions.push({
                    ...result,
                    requestMappingTemplateLocation: result.requestMappingTemplateLocation && result.requestMappingTemplateLocation.replace(RESOLVER_TEMPLATE_LOCATION_PREFIX, ''),
                    responseMappingTemplateLocation: result.responseMappingTemplateLocation && result.responseMappingTemplateLocation.replace(RESOLVER_TEMPLATE_LOCATION_PREFIX, ''),
                });
                break;
            case 'AWS::AppSync::GraphQLSchema':
                if (result.definition) {
                    appSyncConfig.schema = { content: result.definition };
                }
                else {
                    appSyncConfig.schema = { path: 'schema.graphql', content: transformResult.schema };
                }
                break;
            case 'AWS::AppSync::GraphQLApi': {
                const resource = result;
                appSyncConfig.appSync.name = resource.name;
                appSyncConfig.appSync.defaultAuthenticationType = resource.defaultAuthenticationType;
                appSyncConfig.appSync.additionalAuthenticationProviders = resource.additionalAuthenticationProviders || [];
                break;
            }
            case 'AWS::AppSync::ApiKey':
                appSyncConfig.appSync.apiKey = result.ApiKey;
                break;
            case 'AWS::CloudFormation::Stack':
                processApiResources(result.resources, transformResult, appSyncConfig);
                break;
        }
    });
}
exports.processApiResources = processApiResources;
function processCloudFormationResults(resources, transformResult) {
    const processedResources = {
        schema: {
            content: '',
        },
        resolvers: [],
        functions: [],
        dataSources: [],
        mappingTemplates: [],
        tables: [],
        appSync: {
            name: '',
            defaultAuthenticationType: {
                authenticationType: amplify_appsync_simulator_1.AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
            },
            apiKey: null,
            additionalAuthenticationProviders: [],
        },
    };
    processApiResources(resources, transformResult, processedResources);
    Object.entries(transformResult.resolvers).forEach(([path, content]) => {
        processedResources.mappingTemplates.push({
            path: `resolvers/${path}`,
            content: content,
        });
    });
    Object.entries(transformResult.pipelineFunctions).forEach(([path, content]) => {
        processedResources.mappingTemplates.push({
            path: `pipelineFunctions/${path}`,
            content: content,
        });
    });
    if (searchableModelExists(transformResult)) {
        return configureSearchEnabledTables(transformResult, processedResources);
    }
    return processedResources;
}
exports.processCloudFormationResults = processCloudFormationResults;
function processTransformerStacks(transformResult, params = {}) {
    (0, resource_processors_1.registerAppSyncResourceProcessor)();
    (0, resource_processors_1.registerIAMResourceProcessor)();
    (0, resource_processors_1.registerLambdaResourceProcessor)();
    (0, resource_processors_1.registerOpenSearchResourceProcessor)();
    const rootStack = JSON.parse(JSON.stringify(transformResult.rootStack));
    const cfnParams = {
        ...CFN_DEFAULT_PARAMS,
        env: '${env}',
        S3DeploymentBucket: '${S3DeploymentBucket}',
        S3DeploymentRootKey: '${S3DeploymentRootKey}',
        CreateAPIKey: 1,
        ...params,
    };
    const cfnTemplateFetcher = {
        getCloudFormationStackTemplate: (templateName) => {
            const templateRegex = new RegExp('^https://s3.(.+\\.)?amazonaws.com/\\${S3DeploymentBucket}/\\${S3DeploymentRootKey}/stacks/');
            const template = templateName.replace(templateRegex, '');
            const stackTemplate = Object.keys(transformResult.stacks).includes(template)
                ? transformResult.stacks[template]
                : transformResult.stacks[template.replace('.json', '')];
            if (stackTemplate && typeof stackTemplate === 'undefined') {
                throw new Error(`Invalid cloud formation template ${templateName}`);
            }
            return stackTemplate;
        },
    };
    const processedStacks = (0, index_1.processCloudFormationStack)(rootStack, { authRoleName: 'authRole', unauthRoleName: 'unAuthRole', ...cfnParams }, {}, cfnTemplateFetcher);
    return processCloudFormationResults(processedStacks.resources, transformResult);
}
exports.processTransformerStacks = processTransformerStacks;
function configureSearchEnabledTables(transformResult, processedResources) {
    var _a, _b, _c;
    const searchableStackResources = Object.keys((_b = (_a = transformResult === null || transformResult === void 0 ? void 0 : transformResult.stacks) === null || _a === void 0 ? void 0 : _a.SearchableStack) === null || _b === void 0 ? void 0 : _b.Resources);
    processedResources.tables = (_c = processedResources === null || processedResources === void 0 ? void 0 : processedResources.tables) === null || _c === void 0 ? void 0 : _c.map((table) => {
        var _a;
        const tableName = (_a = table === null || table === void 0 ? void 0 : table.Properties) === null || _a === void 0 ? void 0 : _a.TableName;
        const eventSourceMappingPrefix = `Searchable${tableName.substring(0, tableName.lastIndexOf('Table'))}LambdaMapping`;
        return {
            ...table,
            isSearchable: (searchableStackResources === null || searchableStackResources === void 0 ? void 0 : searchableStackResources.findIndex((resource) => resource === null || resource === void 0 ? void 0 : resource.startsWith(eventSourceMappingPrefix))) !== -1,
        };
    });
    return processedResources;
}
exports.configureSearchEnabledTables = configureSearchEnabledTables;
function searchableModelExists(transformResult) {
    var _a;
    return !lodash_1.default.isEmpty((_a = transformResult === null || transformResult === void 0 ? void 0 : transformResult.stacks) === null || _a === void 0 ? void 0 : _a.SearchableStack);
}
exports.searchableModelExists = searchableModelExists;
//# sourceMappingURL=appsync-resource-processor.js.map