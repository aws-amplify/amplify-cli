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
var amplify_graphql_transform_1 = require("amplify-graphql-transform");
var graphql_1 = require("graphql");
var resources_1 = require("./resources");
var lib_1 = require("../node_modules/amplify-graphql-transformer-common/lib");
var fs = require("fs");
var path_1 = require("path");
var AppSyncFileTransformer = /** @class */ (function (_super) {
    __extends(AppSyncFileTransformer, _super);
    function AppSyncFileTransformer(filePath) {
        var _this = _super.call(this, 'AppSyncFileTransformer', 'directive @file on OBJECT' // TODO: this not a real directive
        ) || this;
        _this.before = function (ctx) {
            if (!_this.filePath) {
                return;
            }
        };
        _this.after = function (ctx) {
            if (!_this.filePath) {
                _this.printWithoutFilePath(ctx);
            }
            else {
                _this.printWithFilePath(ctx);
            }
        };
        _this.resources = new resources_1.ResourceFactory();
        if (filePath) {
            _this.filePath = path_1.normalize(filePath);
        }
        return _this;
    }
    AppSyncFileTransformer.prototype.buildSchema = function (ctx) {
        var built = graphql_1.buildASTSchema({
            kind: 'Document',
            definitions: Object.keys(ctx.nodeMap).map(function (k) { return ctx.nodeMap[k]; })
        });
        var SDL = graphql_1.printSchema(built);
        return SDL;
    };
    AppSyncFileTransformer.prototype.printWithoutFilePath = function (ctx) {
        var SDL = this.buildSchema(ctx);
        var schemaResource = this.resources.makeAppSyncSchema(SDL);
        ctx.setResource(lib_1.ResourceConstants.RESOURCES.GraphQLSchemaLogicalID, schemaResource);
    };
    AppSyncFileTransformer.prototype.printWithFilePath = function (ctx) {
        if (!fs.existsSync(this.filePath)) {
            fs.mkdirSync(this.filePath);
        }
        var templateResources = ctx.template.Resources;
        for (var _i = 0, _a = Object.keys(templateResources); _i < _a.length; _i++) {
            var resourceName = _a[_i];
            var resource = templateResources[resourceName];
            if (resource.Type == 'AWS::AppSync::Resolver') {
                this.writeResolverToFile(resourceName, ctx);
            }
            else if (resource.Type == 'AWS::Lambda::Function') {
                this.writeLamdbaFunctionToFile(resourceName, ctx);
            }
            else if (resource.Type == 'AWS::AppSync::GraphQLSchema') {
                this.writeSchemaToFile(resourceName, ctx);
            }
        }
    };
    AppSyncFileTransformer.prototype.writeResolverToFile = function (resourceName, ctx) {
        var resolverFilePath = path_1.normalize(this.filePath + '/resolver');
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
    AppSyncFileTransformer.prototype.writeSchemaToFile = function (resourceName, ctx) {
        var SDL = this.buildSchema(ctx);
        var schemaPath = path_1.normalize(this.filePath + '/schema.graphql');
        fs.writeFileSync(schemaPath, SDL);
        var schemaParam = this.resources.makeSchemaParam();
        ctx.mergeParameters(schemaParam.Parameters);
        var schemaResource = this.resources.makeAppSyncSchema();
        ctx.setResource(lib_1.ResourceConstants.RESOURCES.GraphQLSchemaLogicalID, schemaResource);
    };
    AppSyncFileTransformer.prototype.writeLamdbaFunctionToFile = function (resourceName, ctx) {
        var functionPath = path_1.normalize(this.filePath + '/function');
        if (!fs.existsSync(functionPath)) {
            fs.mkdirSync(functionPath);
        }
        var sourcePath = path_1.normalize(__dirname + "/../node_modules/amplify-graphql-elasticsearch-transformer/streaming-lambda/python_streaming_function.py");
        var destPath = path_1.normalize(this.filePath + "/function/python_streaming_function.py");
        fs.copyFileSync(sourcePath, destPath);
    };
    return AppSyncFileTransformer;
}(amplify_graphql_transform_1.Transformer));
exports.AppSyncFileTransformer = AppSyncFileTransformer;
//# sourceMappingURL=AppSyncFileTransformer.js.map