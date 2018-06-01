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
var definitions_1 = require("./definitions");
/**
 * Create a Map<string, DirectiveNode[]> for each passed in item.
 * @param name
 */
function makeDirectiveMap(directives) {
    var directiveMap = {};
    for (var _i = 0, directives_1 = directives; _i < directives_1.length; _i++) {
        var dir = directives_1[_i];
        if (!directiveMap[dir.name.value]) {
            directiveMap[dir.name.value] = [dir];
        }
        else {
            directiveMap[dir.name.value].push(dir);
        }
    }
    return directiveMap;
}
/**
 * The simple transform.
 *
 * This transform creates a single DynamoDB table for all of your application's
 * data. It uses a standard key structure and nested map to store object values.
 * A relationKey field
 *
 * {
 *  type (HASH),
 *  id (SORT),
 *  value (MAP),
 *  createdAt, (LSI w/ type)
 *  updatedAt (LSI w/ type)
 * }
 */
var SimpleTransform = /** @class */ (function (_super) {
    __extends(SimpleTransform, _super);
    function SimpleTransform() {
        var _this = _super.call(this, 'SimpleAppSyncTransformer', "directive @model on OBJECT") || this;
        _this.resources = new resources_1.ResourceFactory();
        return _this;
    }
    SimpleTransform.prototype.before = function (ctx) {
        var template = this.resources.initTemplate();
        ctx.mergeResources(template.Resources);
        ctx.mergeParameters(template.Parameters);
        var queryType = definitions_1.blankObject('Query');
        var mutationType = definitions_1.blankObject('Mutation');
        ctx.addObject(mutationType);
        ctx.addObject(queryType);
        var schema = definitions_1.makeSchema([
            definitions_1.makeOperationType('query', 'Query'),
            definitions_1.makeOperationType('mutation', 'Mutation')
        ]);
        ctx.addSchema(schema);
    };
    SimpleTransform.prototype.after = function (ctx) {
        var built = graphql_1.buildASTSchema({
            kind: 'Document',
            definitions: Object.keys(ctx.nodeMap).map(function (k) { return ctx.nodeMap[k]; })
        });
        var SDL = graphql_1.printSchema(built);
        var schemaResource = this.resources.makeAppSyncSchema(SDL);
        ctx.setResource(resources_1.ResourceFactory.GraphQLSchemaLogicalID, schemaResource);
    };
    /**
     * Given the initial input and accumulated context return the new context.
     * @param initial The input passed to the transform.
     * @param ctx The accumulated context for the transform.
     */
    SimpleTransform.prototype.object = function (def, directive, ctx) {
        // Create the input & object types.
        ctx.addObject(def);
        var createInput = definitions_1.makeCreateInputObject(def);
        var updateInput = definitions_1.makeUpdateInputObject(def);
        var deleteInput = definitions_1.makeDeleteInputObject(def);
        ctx.addInput(createInput);
        ctx.addInput(updateInput);
        ctx.addInput(deleteInput);
        var mutationType = definitions_1.blankObjectExtension('Mutation');
        var queryType = definitions_1.blankObjectExtension('Query');
        // If this type is a model then create put/delete mutations.
        var createResolver = this.resources.makeCreateResolver(def.name.value);
        ctx.setResource("Create" + def.name.value + "Resolver", createResolver);
        mutationType.fields.push(definitions_1.makeField(createResolver.Properties.FieldName, [definitions_1.makeArg('input', definitions_1.makeNonNullType(definitions_1.makeNamedType(createInput.name.value)))], definitions_1.makeNamedType(def.name.value)));
        var updateResolver = this.resources.makeUpdateResolver(def.name.value);
        ctx.setResource("Update" + def.name.value + "Resolver", updateResolver);
        mutationType.fields.push(definitions_1.makeField(updateResolver.Properties.FieldName, [definitions_1.makeArg('input', definitions_1.makeNonNullType(definitions_1.makeNamedType(updateInput.name.value)))], definitions_1.makeNamedType(def.name.value)));
        var deleteResolver = this.resources.makeDeleteResolver(def.name.value);
        ctx.setResource("Delete" + def.name.value + "Resolver", deleteResolver);
        mutationType.fields.push(definitions_1.makeField(deleteResolver.Properties.FieldName, [definitions_1.makeArg('input', definitions_1.makeNonNullType(definitions_1.makeNamedType(deleteInput.name.value)))], definitions_1.makeNamedType(def.name.value)));
        var getResolver = this.resources.makeGetResolver(def.name.value);
        ctx.setResource("Get" + def.name.value + "Resolver", getResolver);
        queryType.fields.push(definitions_1.makeField(getResolver.Properties.FieldName, [definitions_1.makeArg('id', definitions_1.makeNonNullType(definitions_1.makeNamedType('ID')))], definitions_1.makeNamedType(def.name.value)));
    };
    return SimpleTransform;
}(graphql_transform_1.Transformer));
exports.default = SimpleTransform;
//# sourceMappingURL=index.js.map