"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TransformerContext_1 = require("./TransformerContext");
var blankTemplate_1 = require("./util/blankTemplate");
function isFunction(obj) {
    return obj && (typeof obj === 'function');
}
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
        if (template === void 0) { template = blankTemplate_1.default(); }
        // TODO: Validate the inputs.
        // TODO: Comb through the schema and validate it only uses directives defined by the transformers.
        // TODO: Have the library handle collecting any types/fields marked with a supported directive. Or have a helper.
        var context = new TransformerContext_1.default(schema);
        for (var _i = 0, _a = this.transformers; _i < _a.length; _i++) {
            var transformer = _a[_i];
            console.log("Transforming with " + transformer.name);
            if (isFunction(transformer.before)) {
                transformer.before(context);
            }
            // Apply each transformer and accumulate the context.
            for (var _b = 0, _c = context.inputDocument.definitions; _b < _c.length; _b++) {
                var def = _c[_b];
                for (var _d = 0, _e = def.directives; _d < _e.length; _d++) {
                    var dir = _e[_d];
                    switch (def.kind) {
                        case 'ObjectTypeDefinition':
                            if (isFunction(transformer.object)) {
                                transformer.object(def, dir, context);
                            }
                            break;
                        // Create the supported resolvers.
                        case 'InterfaceTypeDefinition':
                            if (isFunction(transformer.interface)) {
                                transformer.interface(def, dir, context);
                            }
                            break;
                        case 'ScalarTypeDefinition':
                            if (isFunction(transformer.scalar)) {
                                transformer.scalar(def, dir, context);
                            }
                            break;
                        case 'UnionTypeDefinition':
                            if (isFunction(transformer.union)) {
                                transformer.union(def, dir, context);
                            }
                            break;
                        case 'EnumTypeDefinition':
                            if (isFunction(transformer.enum)) {
                                transformer.enum(def, dir, context);
                            }
                            break;
                        case 'InputObjectTypeDefinition':
                            if (isFunction(transformer.input)) {
                                transformer.input(def, dir, context);
                            }
                            break;
                        default:
                            continue;
                    }
                }
            }
            // TODO: Validate the new context.
            if (1 !== 1) {
                throw new Error("Invalid context after transformer " + transformer.name);
            }
            if (isFunction(transformer.after)) {
                transformer.after(context);
            }
        }
        // Write the schema.
        return context.template;
    };
    return GraphQLTransform;
}());
exports.default = GraphQLTransform;
//# sourceMappingURL=GraphQLTransform.js.map