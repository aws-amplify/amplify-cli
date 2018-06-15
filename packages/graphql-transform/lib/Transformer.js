"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
var errors_1 = require("./errors");
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
    function Transformer(name, directiveDef) {
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
    }
    return Transformer;
}());
exports.default = Transformer;
function makeDirectiveDefinitions(directiveSpec) {
    return graphql_1.parse(directiveSpec).definitions;
}
//# sourceMappingURL=Transformer.js.map