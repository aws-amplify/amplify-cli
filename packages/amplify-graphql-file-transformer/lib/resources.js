"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var appSync_1 = require("cloudform/types/appSync");
var cloudform_1 = require("cloudform");
var amplify_graphql_transformer_common_1 = require("amplify-graphql-transformer-common");
var ResourceFactory = /** @class */ (function () {
    function ResourceFactory() {
    }
    ResourceFactory.prototype.makeResolverParam = function (name) {
        var _a;
        return {
            Parameters: (_a = {},
                _a[this.removeDotsAndCamelcase(name)] = new cloudform_1.StringParameter({
                    Description: "The S3 location for the Resolver: " + name,
                }),
                _a)
        };
    };
    ResourceFactory.prototype.updateResolverResource = function (resource, requestParamName, responseParamName) {
        return new appSync_1.default.Resolver({
            ApiId: resource.Properties.ApiId,
            DataSourceName: resource.Properties.DataSourceName,
            FieldName: resource.Properties.FieldName,
            TypeName: resource.Properties.TypeName,
            RequestMappingTemplateS3Location: cloudform_1.Fn.Ref(this.removeDotsAndCamelcase(requestParamName)),
            ResponseMappingTemplateS3Location: cloudform_1.Fn.Ref(this.removeDotsAndCamelcase(responseParamName))
        }).dependsOn(amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLSchemaLogicalID);
    };
    ResourceFactory.prototype.makeSchemaParam = function () {
        var _a;
        return {
            Parameters: (_a = {},
                _a[this.removeDotsAndCamelcase('schema.graphql')] = new cloudform_1.StringParameter({
                    Description: "The S3 location for the Schema: schema.graphql",
                }),
                _a)
        };
    };
    ResourceFactory.prototype.makeAppSyncSchema = function (schema) {
        if (schema) {
            return new appSync_1.default.GraphQLSchema({
                ApiId: cloudform_1.Fn.GetAtt(amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
                Definition: schema
            });
        }
        return new appSync_1.default.GraphQLSchema({
            ApiId: cloudform_1.Fn.GetAtt(amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DefinitionS3Location: cloudform_1.Fn.Ref(this.removeDotsAndCamelcase('schema.graphql'))
        });
    };
    ResourceFactory.prototype.removeDotsAndCamelcase = function (name) {
        var nameCopy = name;
        for (var i = 0; i < name.length; i++) {
            if (name[i] == '.') {
                nameCopy = nameCopy.substr(0, i + 1) + nameCopy.charAt(i + 1).toUpperCase() + nameCopy.slice(i + 2);
            }
        }
        return nameCopy.replace(/\./g, '');
    };
    return ResourceFactory;
}());
exports.ResourceFactory = ResourceFactory;
//# sourceMappingURL=resources.js.map