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
        return _super.call(this, 'SimpleAppSyncTransformer', "directive @model on OBJECT") || this;
    }
    /**
     * Given the initial input and accumulated context return the new context.
     * @param initial The input passed to the transform.
     * @param ctx The accumulated context for the transform.
     */
    SimpleTransform.prototype.transform = function (definitions, ctx) {
        // Instantiate the resource factory and start building the template.
        var resources = new resources_1.ResourceFactory();
        // First create the API record.
        var template = resources.initTemplate();
        var queryType = definitions_1.blankObject('Query');
        var mutationType = definitions_1.blankObject('Mutation');
        for (var _i = 0, definitions_2 = definitions; _i < definitions_2.length; _i++) {
            var def = definitions_2[_i];
            var directiveMap = makeDirectiveMap(def.directives);
            switch (def.kind) {
                case 'ObjectTypeDefinition':
                    // Create the supported resolvers.
                    // Create the input & object types.
                    ctx.addObject(def);
                    var createInput = definitions_1.makeCreateInputObject(def);
                    var updateInput = definitions_1.makeUpdateInputObject(def);
                    var deleteInput = definitions_1.makeDeleteInputObject(def);
                    ctx.addInput(createInput);
                    ctx.addInput(updateInput);
                    ctx.addInput(deleteInput);
                    if (directiveMap.model && directiveMap.model.length > 0) {
                        // If this type is a model then create put/delete mutations.
                        var createResolver = resources.makeCreateResolver(def.name.value);
                        template.Resources["Create" + def.name.value + "Resolver"] = createResolver;
                        mutationType.fields.push(definitions_1.makeField(createResolver.Properties.FieldName, [definitions_1.makeArg('input', definitions_1.makeNonNullType(definitions_1.makeNamedType(createInput.name.value)))], definitions_1.makeNamedType(def.name.value)));
                        var updateResolver = resources.makeUpdateResolver(def.name.value);
                        template.Resources["Update" + def.name.value + "Resolver"] = updateResolver;
                        mutationType.fields.push(definitions_1.makeField(updateResolver.Properties.FieldName, [definitions_1.makeArg('input', definitions_1.makeNonNullType(definitions_1.makeNamedType(updateInput.name.value)))], definitions_1.makeNamedType(def.name.value)));
                        var deleteResolver = resources.makeDeleteResolver(def.name.value);
                        template.Resources["Delete" + def.name.value + "Resolver"] = deleteResolver;
                        mutationType.fields.push(definitions_1.makeField(deleteResolver.Properties.FieldName, [definitions_1.makeArg('input', definitions_1.makeNonNullType(definitions_1.makeNamedType(deleteInput.name.value)))], definitions_1.makeNamedType(def.name.value)));
                        var getResolver = resources.makeGetResolver(def.name.value);
                        template.Resources["Get" + def.name.value + "Resolver"] = getResolver;
                        queryType.fields.push(definitions_1.makeField(getResolver.Properties.FieldName, [definitions_1.makeArg('id', definitions_1.makeNonNullType(definitions_1.makeNamedType('ID')))], definitions_1.makeNamedType(def.name.value)));
                    }
                case 'InterfaceTypeDefinition':
                // TODO: If an interface has @model on it then create operations
                // for all its descendant types.
                case 'ScalarTypeDefinition':
                case 'UnionTypeDefinition':
                case 'EnumTypeDefinition':
                case 'InputObjectTypeDefinition':
                default:
                    continue;
            }
        }
        ctx.addObject(mutationType);
        ctx.addObject(queryType);
        var schema = definitions_1.makeSchema([
            definitions_1.makeOperationType('query', 'Query'),
            definitions_1.makeOperationType('mutation', 'Mutation')
        ]);
        ctx.addSchema(schema);
        var built = graphql_1.buildASTSchema({
            kind: 'Document',
            definitions: Object.keys(ctx.nodeMap).map(function (k) { return ctx.nodeMap[k]; })
        });
        var SDL = graphql_1.printSchema(built);
        var schemaResource = resources.makeAppSyncSchema(SDL);
        template.Resources[resources_1.ResourceFactory.GraphQLSchemaLogicalID] = schemaResource;
        ctx.mergeResources(template.Resources);
        ctx.mergeParameters(template.Parameters);
    };
    return SimpleTransform;
}(graphql_transform_1.Transformer));
exports.default = SimpleTransform;
//# sourceMappingURL=index.js.map