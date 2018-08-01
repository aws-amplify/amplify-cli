"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_transform_1 = require("graphql-transform");
var graphql_1 = require("graphql");
var resources_1 = require("./resources");
var graphql_transformer_common_1 = require("graphql-transformer-common");
var fs = require("fs");
var path_1 = require("path");
var AppSyncTransformer = /** @class */ (function (_super) {
    __extends(AppSyncTransformer, _super);
    function AppSyncTransformer(outputPath) {
        var _this = _super.call(this, 'AppSyncTransformer', 'directive @ignore on OBJECT' // TODO: this not a real directive
        ) || this;
        _this.before = function (ctx) {
            var queryType = graphql_transformer_common_1.blankObject('Query');
            var mutationType = graphql_transformer_common_1.blankObject('Mutation');
            ctx.addObject(mutationType);
            ctx.addObject(queryType);
            var schema = graphql_transformer_common_1.makeSchema([
                graphql_transformer_common_1.makeOperationType('query', 'Query'),
                graphql_transformer_common_1.makeOperationType('mutation', 'Mutation')
            ]);
            ctx.addSchema(schema);
            // Some downstream resources depend on this so put a placeholder in and
            // overwrite it in the after
            var schemaResource = _this.resources.makeAppSyncSchema('placeholder');
            ctx.setResource(graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLSchemaLogicalID, schemaResource);
        };
        _this.after = function (ctx) {
            if (!_this.outputPath) {
                _this.printWithoutFilePath(ctx);
            }
            else {
                _this.printWithFilePath(ctx);
            }
        };
        _this.resources = new resources_1.ResourceFactory();
        if (outputPath) {
            _this.outputPath = path_1.normalize(outputPath);
        }
        return _this;
    }
    AppSyncTransformer.prototype.buildSchema = function (ctx) {
        var built = graphql_1.buildASTSchema({
            kind: 'Document',
            definitions: Object.keys(ctx.nodeMap).map(function (k) { return ctx.nodeMap[k]; })
        });
        var SDL = graphql_1.printSchema(built);
        return SDL;
    };
    AppSyncTransformer.prototype.printWithoutFilePath = function (ctx) {
        var SDL = this.buildSchema(ctx);
        var schemaResource = this.resources.makeAppSyncSchema(SDL);
        ctx.setResource(graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLSchemaLogicalID, schemaResource);
    };
    AppSyncTransformer.prototype.printWithFilePath = function (ctx) {
        if (!fs.existsSync(this.outputPath)) {
            fs.mkdirSync(this.outputPath);
        }
        var templateResources = ctx.template.Resources;
        for (var _i = 0, _a = Object.keys(templateResources); _i < _a.length; _i++) {
            var resourceName = _a[_i];
            var resource = templateResources[resourceName];
            if (resource.Type === 'AWS::AppSync::Resolver') {
                this.writeResolverToFile(resourceName, ctx);
            }
            else if (resource.Type === 'AWS::Lambda::Function') {
                this.writeLamdbaFunctionToFile(resourceName, ctx);
            }
            else if (resource.Type === 'AWS::AppSync::GraphQLSchema') {
                this.writeSchemaToFile(resourceName, ctx);
            }
        }
    };
    AppSyncTransformer.prototype.writeResolverToFile = function (resourceName, ctx) {
        var resolverFilePath = path_1.normalize(this.outputPath + '/resolver');
        if (!fs.existsSync(resolverFilePath)) {
            fs.mkdirSync(resolverFilePath);
        }
        var resolverResource = ctx.template.Resources[resourceName];
        var requestMappingTemplate = resolverResource.Properties.RequestMappingTemplate;
        var reqType = resolverResource.Properties.TypeName;
        var reqFieldName = resolverResource.Properties.FieldName;
        var reqFileName = reqType + "." + reqFieldName + ".request";
        fs.writeFileSync(resolverFilePath + "/" + reqFileName, requestMappingTemplate);
        var reqParam = this.resources.makeResolverParam(reqFileName);
        ctx.mergeParameters(reqParam.Parameters);
        var responseMappingTemplate = resolverResource.Properties.ResponseMappingTemplate;
        var respType = resolverResource.Properties.TypeName;
        var respFieldName = resolverResource.Properties.FieldName;
        var respFileName = respType + "." + respFieldName + ".response";
        fs.writeFileSync(resolverFilePath + "/" + respFileName, responseMappingTemplate);
        var respParam = this.resources.makeResolverParam(respFileName);
        ctx.mergeParameters(respParam.Parameters);
        var updatedResolverResource = this.resources.updateResolverResource(resolverResource, reqFileName, respFileName);
        ctx.setResource(resourceName, updatedResolverResource);
    };
    AppSyncTransformer.prototype.writeSchemaToFile = function (resourceName, ctx) {
        var SDL = this.buildSchema(ctx);
        var schemaPath = path_1.normalize(this.outputPath + '/schema.graphql');
        fs.writeFileSync(schemaPath, SDL);
        var schemaParam = this.resources.makeSchemaParam();
        ctx.mergeParameters(schemaParam.Parameters);
        var schemaResource = this.resources.makeAppSyncSchema();
        ctx.setResource(graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLSchemaLogicalID, schemaResource);
    };
    AppSyncTransformer.prototype.writeLamdbaFunctionToFile = function (resourceName, ctx) {
        var functionPath = path_1.normalize(this.outputPath + '/function');
        if (!fs.existsSync(functionPath)) {
            fs.mkdirSync(functionPath);
        }
        var sourcePath = path_1.normalize(__dirname + "/../node_modules/graphql-elasticsearch-transformer/streaming-lambda/python_streaming_function.py");
        var destPath = path_1.normalize(this.outputPath + "/function/python_streaming_function.py");
        var lambdaCode = fs.readFileSync(sourcePath, 'utf8');
        fs.writeFileSync(destPath, lambdaCode, 'utf8');
    };
    return AppSyncTransformer;
}(graphql_transform_1.Transformer));
exports.AppSyncTransformer = AppSyncTransformer;
//# sourceMappingURL=AppSyncTransformer.js.map