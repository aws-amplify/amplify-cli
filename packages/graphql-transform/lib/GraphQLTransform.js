"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
var TransformerContext_1 = require("./TransformerContext");
var blankTemplate_1 = require("./util/blankTemplate");
var errors_1 = require("./errors");
function isFunction(obj) {
    return obj && (typeof obj === 'function');
}
/**
 * If this instance of the directive validates against its definition return true.
 * If the definition does not apply to the instance return false.
 * @param directive The directive definition to validate against.
 * @param nodeKind The kind of the current node where the directive was found.
 */
function matchDirective(definition, directive, node) {
    if (definition.name.value !== directive.name.value) {
        // The definition is for the wrong directive. Do not match.
        return false;
    }
    var isValidLocation = false;
    for (var _i = 0, _a = definition.locations; _i < _a.length; _i++) {
        var location_1 = _a[_i];
        switch (location_1.value) {
            case "SCHEMA":
                isValidLocation = node.kind === graphql_1.Kind.SCHEMA_DEFINITION || isValidLocation;
                break;
            case "SCALAR":
                isValidLocation = node.kind === graphql_1.Kind.SCALAR_TYPE_DEFINITION || isValidLocation;
                break;
            case "OBJECT":
                isValidLocation = node.kind === graphql_1.Kind.OBJECT_TYPE_DEFINITION || isValidLocation;
                break;
            case "FIELD_DEFINITION":
                isValidLocation = node.kind === graphql_1.Kind.FIELD_DEFINITION || isValidLocation;
                break;
            case "ARGUMENT_DEFINITION":
                isValidLocation = node.kind === graphql_1.Kind.INPUT_VALUE_DEFINITION || isValidLocation;
                break;
            case "INTERFACE":
                isValidLocation = node.kind === graphql_1.Kind.INTERFACE_TYPE_DEFINITION || isValidLocation;
                break;
            case "UNION":
                isValidLocation = node.kind === graphql_1.Kind.UNION_TYPE_DEFINITION || isValidLocation;
                break;
            case "ENUM":
                isValidLocation = node.kind === graphql_1.Kind.ENUM_TYPE_DEFINITION || isValidLocation;
                break;
            case "ENUM_VALUE":
                isValidLocation = node.kind === graphql_1.Kind.ENUM_VALUE_DEFINITION || isValidLocation;
                break;
            case "INPUT_OBJECT":
                isValidLocation = node.kind === graphql_1.Kind.INPUT_OBJECT_TYPE_DEFINITION || isValidLocation;
                break;
            case "INPUT_FIELD_DEFINITION":
                isValidLocation = node.kind === graphql_1.Kind.INPUT_VALUE_DEFINITION || isValidLocation;
                break;
        }
    }
    return isValidLocation;
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
        var validDirectiveNameMap = this.transformers.reduce(function (acc, t) {
            return (__assign({}, acc, (_a = {}, _a[t.directive.name.value] = true, _a)));
            var _a;
        }, {});
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
                    if (!validDirectiveNameMap[dir.name.value]) {
                        throw new errors_1.UnknownDirectiveError("Unknown directive '" + dir.name.value + "'. Either remove the directive from the schema or add a transformer to handle it.");
                    }
                    if (matchDirective(transformer.directive, dir, def)) {
                        switch (def.kind) {
                            case 'ObjectTypeDefinition':
                                if (isFunction(transformer.object)) {
                                    transformer.object(def, dir, context);
                                    break;
                                }
                                else {
                                    throw new errors_1.InvalidTransformerError("The transformer '" + transformer.name + "' must implement the 'object()' method");
                                }
                            // Create the supported resolvers.
                            case 'InterfaceTypeDefinition':
                                if (isFunction(transformer.interface)) {
                                    transformer.interface(def, dir, context);
                                    break;
                                }
                                else {
                                    throw new errors_1.InvalidTransformerError("The transformer '" + transformer.name + "' must implement the 'interface()' method");
                                }
                            case 'ScalarTypeDefinition':
                                if (isFunction(transformer.scalar)) {
                                    transformer.scalar(def, dir, context);
                                    break;
                                }
                                else {
                                    throw new errors_1.InvalidTransformerError("The transformer '" + transformer.name + "' must implement the 'scalar()' method");
                                }
                            case 'UnionTypeDefinition':
                                if (isFunction(transformer.union)) {
                                    transformer.union(def, dir, context);
                                    break;
                                }
                                else {
                                    throw new errors_1.InvalidTransformerError("The transformer '" + transformer.name + "' must implement the 'union()' method");
                                }
                            case 'EnumTypeDefinition':
                                if (isFunction(transformer.enum)) {
                                    transformer.enum(def, dir, context);
                                    break;
                                }
                                else {
                                    throw new errors_1.InvalidTransformerError("The transformer '" + transformer.name + "' must implement the 'enum()' method");
                                }
                            case 'InputObjectTypeDefinition':
                                if (isFunction(transformer.input)) {
                                    transformer.input(def, dir, context);
                                    break;
                                }
                                else {
                                    throw new errors_1.InvalidTransformerError("The transformer '" + transformer.name + "' must implement the 'input()' method");
                                }
                            default:
                                continue;
                        }
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