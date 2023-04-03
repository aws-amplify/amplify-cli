"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerOpenSearchResourceProcessor = exports.registerLambdaResourceProcessor = exports.registerIAMResourceProcessor = exports.registerAppSyncResourceProcessor = exports.registerResourceProcessors = exports.getResourceProcessorFor = void 0;
const lambda_1 = require("./lambda");
const appsync_1 = require("./appsync");
const iam_1 = require("./iam");
const opensearch_1 = require("./opensearch");
const resourceProcessorMapping = {};
function getResourceProcessorFor(resourceType) {
    if (resourceType in resourceProcessorMapping) {
        return resourceProcessorMapping[resourceType];
    }
    throw new Error(`No resource handler found for the CloudFormation resource type ${resourceType}`);
}
exports.getResourceProcessorFor = getResourceProcessorFor;
function registerResourceProcessors(resourceType, resourceProcessor) {
    resourceProcessorMapping[resourceType] = resourceProcessor;
}
exports.registerResourceProcessors = registerResourceProcessors;
function registerAppSyncResourceProcessor() {
    registerResourceProcessors('AWS::AppSync::GraphQLApi', appsync_1.appSyncAPIResourceHandler);
    registerResourceProcessors('AWS::AppSync::ApiKey', appsync_1.appSyncAPIKeyResourceHandler);
    registerResourceProcessors('AWS::AppSync::GraphQLSchema', appsync_1.appSyncSchemaHandler);
    registerResourceProcessors('AWS::DynamoDB::Table', appsync_1.dynamoDBResourceHandler);
    registerResourceProcessors('AWS::AppSync::Resolver', appsync_1.appSyncResolverHandler);
    registerResourceProcessors('AWS::AppSync::DataSource', appsync_1.appSyncDataSourceHandler);
    registerResourceProcessors('AWS::AppSync::FunctionConfiguration', appsync_1.appSyncFunctionHandler);
}
exports.registerAppSyncResourceProcessor = registerAppSyncResourceProcessor;
function registerIAMResourceProcessor() {
    registerResourceProcessors('AWS::IAM::Policy', iam_1.iamPolicyResourceHandler);
    registerResourceProcessors('AWS::IAM::Role', iam_1.iamRoleResourceHandler);
}
exports.registerIAMResourceProcessor = registerIAMResourceProcessor;
function registerLambdaResourceProcessor() {
    registerResourceProcessors('AWS::Lambda::Function', lambda_1.lambdaFunctionHandler);
    registerResourceProcessors('AWS::Lambda::EventSourceMapping', lambda_1.lambdaEventSourceHandler);
}
exports.registerLambdaResourceProcessor = registerLambdaResourceProcessor;
function registerOpenSearchResourceProcessor() {
    registerResourceProcessors('AWS::Elasticsearch::Domain', opensearch_1.openSearchDomainHandler);
}
exports.registerOpenSearchResourceProcessor = registerOpenSearchResourceProcessor;
//# sourceMappingURL=index.js.map