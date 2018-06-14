import TransformerContext from './TransformerContext'
import {
    DirectiveDefinitionNode,
    parse,
    TypeSystemDefinitionNode,
    DirectiveNode,
    ObjectTypeDefinitionNode,
    InterfaceDefinitionNode,
    FieldDefinitionNode,
    UnionDefinitionNode
} from 'graphql'

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
        public directive: DirectiveDefinitionNode
    ) { }

    /**
     * An initializer that is called once at the beginning of a transformation.
     * Initializers are called in the order they are declared.
     */
    before?: (acc: TransformerContext) => void

    /**
     * An initializer that is called once at the beginning of a transformation.
     * Initializers are called in the order they are declared.
     */
    after?: (acc: TransformerContext) => void

    /**
     * A transformer implements a single function per location that its directive can be applied.
     * This method handles transforming directives on objects type definitions. This includes type
     * extensions.
     */
    object?: (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void

    /**
     * A transformer implements a single function per location that its directive can be applied.
     * This method handles transforming directives on objects type definitions. This includes type
     * extensions.
     */
    interface?: (definition: InterfaceDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void

    /**
     * A transformer implements a single function per location that its directive can be applied.
     * This method handles transforming directives on object or interface field definitions.
     */
    field?: (definition: FieldDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void

    /**
     * A transformer implements a single function per location that its directive can be applied.
     * This method handles transforming directives on union definitions.
     */
    union?: (definition: UnionDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void

    /**
     * A transformer implements a single function per location that its directive can be applied.
     * This method handles transforming directives on enum definitions.
     */
    enum?: (definition: UnionDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void

    /**
     * A transformer implements a single function per location that its directive can be applied.
     * This method handles transforming directives on scalar definitions.
     */
    scalar?: (definition: UnionDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void

    /**
     * A transformer implements a single function per location that its directive can be applied.
     * This method handles transforming directives on input definitions.
     */
    input?: (definition: UnionDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void

}


function makeDirectiveDefinitions(directiveSpec: string) {
    return parse(directiveSpec).definitions
}