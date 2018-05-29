"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
var TransformerContext_1 = require("./TransformerContext");
var blankTemplate_1 = require("./util/blankTemplate");
var GraphQLTransform = /** @class */ (function () {
    function GraphQLTransform(options) {
        if (!options.transformers || options.transformers.length === 0) {
            throw new Error('Must provide at least one transformer.');
        }
        this.transformers = options.transformers;
    }
    /**
     * Reduces the final context by running the set of transformers on
     * the schema. Each transformer returns a new context that is passed
     * on to the next transformer. At the end of the transformation a
     * cloudformation template is returned.
     * @param schema The model schema.
     * @param references Any cloudformation references.
     */
    GraphQLTransform.prototype.transform = function (schema, template) {
        // TODO: Validate the inputs.
        // TODO: Comb through the schema and validate it only uses directives defined by the transformers.
        // TODO: Have the library handle collecting any types/fields marked with a supported directive. Or have a helper.
        if (template === void 0) { template = blankTemplate_1.default(); }
        var doc = graphql_1.parse(schema);
        // We only accept type system definitions. i.e. everything but fragments and operations.
        var definitions = doc.definitions.filter(function (def) { return def.kind !== 'OperationDefinition' && def.kind !== 'FragmentDefinition'; });
        var context = new TransformerContext_1.default();
        for (var _i = 0, _a = this.transformers; _i < _a.length; _i++) {
            var transformer = _a[_i];
            console.log("Transforming with " + transformer.name);
            // Apply each transformer and accumulate the context.
            transformer.transform(definitions, context);
            // TODO: Validate the new context.
            if (1 !== 1) {
                throw new Error("Invalid context after transformer " + transformer.name);
            }
        }
        // Write the schema.
        return context.template;
    };
    return GraphQLTransform;
}());
exports.default = GraphQLTransform;
//# sourceMappingURL=GraphQLTransform.js.map