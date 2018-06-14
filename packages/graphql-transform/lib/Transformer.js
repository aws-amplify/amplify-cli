"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
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
    function Transformer(name, directive) {
        this.name = name;
        this.directive = directive;
    }
    return Transformer;
}());
exports.default = Transformer;
function makeDirectiveDefinitions(directiveSpec) {
    return graphql_1.parse(directiveSpec).definitions;
}
//# sourceMappingURL=Transformer.js.map