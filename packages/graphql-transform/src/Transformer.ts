import TransformerContext from './TransformerContext'
import { DirectiveDefinitionNode, parse } from 'graphql'

/**
 * A GraphQLTransformer takes a context object, processes it, and
 * returns a new context. The transformer is responsible for returning
 * a context that fully describes the infrastructure requirements
 * for its stage of the transformation.
 */
export default class Transformer {

    /**
     * Each transformer has a name.
     *
     * Each transformer defines a set of directives that it knows how to translate.
     */
    constructor(
        public name: string,
        public directives: DirectiveDefinitionNode[]
    ) { }

    /**
     * A transformer implements a single function that when given
     * a set of model types and a transformation context is capable of generating
     * a new context that describes the stack necessary to implement the
     * data model defined by the types.
     */
    transform: (initial: TransformerContext, acc: TransformerContext) => TransformerContext

    // collect: (directive: string)

}


function makeDirectiveDefinitions(directiveSpec: string) {
    return parse(directiveSpec).definitions
}