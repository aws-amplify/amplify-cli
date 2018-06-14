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
        var context = new TransformerContext_1.default(schema);
        for (var _i = 0, _a = this.transformers; _i < _a.length; _i++) {
            var transformer = _a[_i];
            console.log("Transforming with " + transformer.name);
            if (isFunction(transformer.before)) {
                transformer.before(context);
            }
            // TODO: Validate that the transformer supports all the methods
            // required for the directive definition. Also verify that
            // directives are not used where they are not allowed.
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
        }
        // .transform() is meant to behave like a composition so the
        // after functions are called in the reverse order (as if they were popping off a stack)
        var reverseThroughTransformers = this.transformers.length - 1;
        while (reverseThroughTransformers >= 0) {
            var transformer = this.transformers[reverseThroughTransformers];
            // TODO: Validate the new context.
            if (1 !== 1) {
                throw new Error("Invalid context after transformer " + transformer.name);
            }
            if (isFunction(transformer.after)) {
                transformer.after(context);
            }
            reverseThroughTransformers -= 1;
        }
        // Write the schema.
        return context.template;
    };
    return GraphQLTransform;
}());
exports.default = GraphQLTransform;
//# sourceMappingURL=GraphQLTransform.js.map