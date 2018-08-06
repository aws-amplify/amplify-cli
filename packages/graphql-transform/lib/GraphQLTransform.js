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
function matchFieldDirective(definition, directive, node) {
    if (definition.name.value !== directive.name.value) {
        // The definition is for the wrong directive. Do not match.
        return false;
    }
    var isValidLocation = false;
    for (var _i = 0, _a = definition.locations; _i < _a.length; _i++) {
        var location_2 = _a[_i];
        switch (location_2.value) {
            case "FIELD_DEFINITION":
                isValidLocation = node.kind === graphql_1.Kind.FIELD_DEFINITION || isValidLocation;
                break;
        }
    }
    return isValidLocation;
}
function matchInputFieldDirective(definition, directive, node) {
    if (definition.name.value !== directive.name.value) {
        // The definition is for the wrong directive. Do not match.
        return false;
    }
    var isValidLocation = false;
    for (var _i = 0, _a = definition.locations; _i < _a.length; _i++) {
        var location_3 = _a[_i];
        switch (location_3.value) {
            case "INPUT_FIELD_DEFINITION":
                isValidLocation = node.kind === graphql_1.Kind.INPUT_VALUE_DEFINITION || isValidLocation;
                break;
        }
    }
    return isValidLocation;
}
function matchArgumentDirective(definition, directive, node) {
    if (definition.name.value !== directive.name.value) {
        // The definition is for the wrong directive. Do not match.
        return false;
    }
    var isValidLocation = false;
    for (var _i = 0, _a = definition.locations; _i < _a.length; _i++) {
        var location_4 = _a[_i];
        switch (location_4.value) {
            case "ARGUMENT_DEFINITION":
                isValidLocation = node.kind === graphql_1.Kind.INPUT_VALUE_DEFINITION || isValidLocation;
                break;
        }
    }
    return isValidLocation;
}
function matchEnumValueDirective(definition, directive, node) {
    if (definition.name.value !== directive.name.value) {
        // The definition is for the wrong directive. Do not match.
        return false;
    }
    var isValidLocation = false;
    for (var _i = 0, _a = definition.locations; _i < _a.length; _i++) {
        var location_5 = _a[_i];
        switch (location_5.value) {
            case "ENUM_VALUE":
                isValidLocation = node.kind === graphql_1.Kind.ENUM_VALUE_DEFINITION || isValidLocation;
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
            var _a;
            return (__assign({}, acc, (_a = {}, _a[t.directive.name.value] = true, _a)));
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
                    switch (def.kind) {
                        case 'ObjectTypeDefinition':
                            this.transformObject(transformer, def, dir, context);
                            // Walk the fields and call field transformers.
                            break;
                        case 'InterfaceTypeDefinition':
                            this.transformInterface(transformer, def, dir, context);
                            // Walk the fields and call field transformers.
                            break;
                        case 'ScalarTypeDefinition':
                            this.transformScalar(transformer, def, dir, context);
                            break;
                        case 'UnionTypeDefinition':
                            this.transformUnion(transformer, def, dir, context);
                            break;
                        case 'EnumTypeDefinition':
                            this.transformEnum(transformer, def, dir, context);
                            break;
                        case 'InputObjectTypeDefinition':
                            this.transformInputObject(transformer, def, dir, context);
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
    GraphQLTransform.prototype.transformObject = function (transformer, def, dir, context) {
        if (matchDirective(transformer.directive, dir, def)) {
            if (isFunction(transformer.object)) {
                transformer.object(def, dir, context);
            }
            else {
                throw new errors_1.InvalidTransformerError("The transformer '" + transformer.name + "' must implement the 'object()' method");
            }
        }
        for (var _i = 0, _a = def.fields; _i < _a.length; _i++) {
            var field = _a[_i];
            for (var _b = 0, _c = field.directives; _b < _c.length; _b++) {
                var fDir = _c[_b];
                this.transformField(transformer, field, fDir, context);
            }
        }
    };
    GraphQLTransform.prototype.transformField = function (transformer, def, dir, context) {
        if (matchFieldDirective(transformer.directive, dir, def)) {
            if (isFunction(transformer.field)) {
                transformer.field(def, dir, context);
            }
            else {
                throw new errors_1.InvalidTransformerError("The transformer '" + transformer.name + "' must implement the 'field()' method");
            }
        }
        for (var _i = 0, _a = def.arguments; _i < _a.length; _i++) {
            var arg = _a[_i];
            for (var _b = 0, _c = arg.directives; _b < _c.length; _b++) {
                var aDir = _c[_b];
                this.transformArgument(transformer, arg, aDir, context);
            }
        }
    };
    GraphQLTransform.prototype.transformArgument = function (transformer, def, dir, context) {
        if (matchArgumentDirective(transformer.directive, dir, def)) {
            if (isFunction(transformer.argument)) {
                transformer.argument(def, dir, context);
            }
            else {
                throw new errors_1.InvalidTransformerError("The transformer '" + transformer.name + "' must implement the 'argument()' method");
            }
        }
    };
    GraphQLTransform.prototype.transformInterface = function (transformer, def, dir, context) {
        if (matchDirective(transformer.directive, dir, def)) {
            if (isFunction(transformer.interface)) {
                transformer.interface(def, dir, context);
            }
            else {
                throw new errors_1.InvalidTransformerError("The transformer '" + transformer.name + "' must implement the 'interface()' method");
            }
        }
        for (var _i = 0, _a = def.fields; _i < _a.length; _i++) {
            var field = _a[_i];
            for (var _b = 0, _c = field.directives; _b < _c.length; _b++) {
                var fDir = _c[_b];
                this.transformField(transformer, field, fDir, context);
            }
        }
    };
    GraphQLTransform.prototype.transformScalar = function (transformer, def, dir, context) {
        if (matchDirective(transformer.directive, dir, def)) {
            if (isFunction(transformer.scalar)) {
                transformer.scalar(def, dir, context);
            }
            else {
                throw new errors_1.InvalidTransformerError("The transformer '" + transformer.name + "' must implement the 'scalar()' method");
            }
        }
    };
    GraphQLTransform.prototype.transformUnion = function (transformer, def, dir, context) {
        if (matchDirective(transformer.directive, dir, def)) {
            if (isFunction(transformer.union)) {
                transformer.union(def, dir, context);
            }
            else {
                throw new errors_1.InvalidTransformerError("The transformer '" + transformer.name + "' must implement the 'union()' method");
            }
        }
    };
    GraphQLTransform.prototype.transformEnum = function (transformer, def, dir, context) {
        if (matchDirective(transformer.directive, dir, def)) {
            if (isFunction(transformer.enum)) {
                transformer.enum(def, dir, context);
            }
            else {
                throw new errors_1.InvalidTransformerError("The transformer '" + transformer.name + "' must implement the 'enum()' method");
            }
        }
        for (var _i = 0, _a = def.values; _i < _a.length; _i++) {
            var value = _a[_i];
            for (var _b = 0, _c = value.directives; _b < _c.length; _b++) {
                var vDir = _c[_b];
                this.transformEnumValue(transformer, value, vDir, context);
            }
        }
    };
    GraphQLTransform.prototype.transformEnumValue = function (transformer, def, dir, context) {
        if (matchEnumValueDirective(transformer.directive, dir, def)) {
            if (isFunction(transformer.enumValue)) {
                transformer.enumValue(def, dir, context);
            }
            else {
                throw new errors_1.InvalidTransformerError("The transformer '" + transformer.name + "' must implement the 'enumValue()' method");
            }
        }
    };
    GraphQLTransform.prototype.transformInputObject = function (transformer, def, dir, context) {
        if (matchDirective(transformer.directive, dir, def)) {
            if (isFunction(transformer.input)) {
                transformer.input(def, dir, context);
            }
            else {
                throw new errors_1.InvalidTransformerError("The transformer '" + transformer.name + "' must implement the 'input()' method");
            }
        }
        for (var _i = 0, _a = def.fields; _i < _a.length; _i++) {
            var field = _a[_i];
            for (var _b = 0, _c = field.directives; _b < _c.length; _b++) {
                var fDir = _c[_b];
                this.transformInputField(transformer, field, fDir, context);
            }
        }
    };
    GraphQLTransform.prototype.transformInputField = function (transformer, def, dir, context) {
        if (matchInputFieldDirective(transformer.directive, dir, def)) {
            if (isFunction(transformer.inputValue)) {
                transformer.inputValue(def, dir, context);
            }
            else {
                throw new errors_1.InvalidTransformerError("The transformer '" + transformer.name + "' must implement the 'inputValue()' method");
            }
        }
    };
    return GraphQLTransform;
}());
exports.default = GraphQLTransform;
//# sourceMappingURL=GraphQLTransform.js.map