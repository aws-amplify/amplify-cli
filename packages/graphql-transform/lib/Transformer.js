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
var errors_1 = require("./errors");
function reduceTypeDefinitionNodes(acc, definition) {
    var _a;
    switch (definition.kind) {
        case 'ScalarTypeDefinition':
        case 'ObjectTypeDefinition':
        case 'InterfaceTypeDefinition':
        case 'UnionTypeDefinition':
        case 'EnumTypeDefinition':
        case 'InputObjectTypeDefinition':
            return __assign({}, acc, (_a = {}, _a[definition.name.value] = definition, _a));
        default:
            return acc;
    }
}
/**
 * A GraphQLTransformer takes a context object, processes it, and
 * returns a new context. The transformer is responsible for returning
 * a context that fully describes the infrastructure requirements
 * for its stage of the transformation.
 */
var Transformer = /** @class */ (function () {
    /**
     * Each transformer has a name.
     *
     * Each transformer defines a set of directives that it knows how to translate.
     */
    function Transformer(name, directiveDef, extraDefs) {
        this.name = name;
        var doc = graphql_1.parse(directiveDef);
        if (doc.definitions.length !== 1) {
            throw new errors_1.InvalidDirectiveDefinitionError('Transformers must specify exactly one directive definition.');
        }
        var def = doc.definitions[0];
        if (def.kind !== graphql_1.Kind.DIRECTIVE_DEFINITION) {
            throw new errors_1.InvalidDirectiveDefinitionError("Transformers must specify a directive definition not a definition of kind '" + def.kind + "'.");
        }
        this.directive = def;
        // Transformers can define extra shapes that can be used by the directive
        // and validated. TODO: Validation.
        this.extraDefMap = {};
        if (extraDefs) {
            var otherDoc = graphql_1.parse(extraDefs);
            this.extraDefMap = otherDoc.definitions.reduce(reduceTypeDefinitionNodes, {});
        }
    }
    /**
     * Helper functions
     */
    /**
     * Given a directive returns a plain JS map of its arguments
     * @param arguments The list of argument nodes to reduce.
     */
    Transformer.prototype.getDirectiveArgumentMap = function (directive) {
        return directive.arguments ? directive.arguments.reduce(function (acc, arg) {
            var _a;
            return (__assign({}, arg, (_a = {}, _a[arg.name.value] = graphql_1.valueFromASTUntyped(arg.value), _a)));
        }, {}) : [];
    };
    return Transformer;
}());
exports.default = Transformer;
function makeDirectiveDefinitions(directiveSpec) {
    return graphql_1.parse(directiveSpec).definitions;
}
//# sourceMappingURL=Transformer.js.map