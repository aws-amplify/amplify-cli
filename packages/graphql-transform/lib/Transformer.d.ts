import TransformerContext from './TransformerContext';
import { DirectiveDefinitionNode, DirectiveNode, ObjectTypeDefinitionNode, InterfaceTypeDefinitionNode, FieldDefinitionNode, UnionTypeDefinitionNode, EnumTypeDefinitionNode, ScalarTypeDefinitionNode, InputObjectTypeDefinitionNode, InputValueDefinitionNode, EnumValueDefinitionNode, TypeDefinitionNode } from 'graphql';
/**
 * A GraphQLTransformer takes a context object, processes it, and
 * returns a new context. The transformer is responsible for returning
 * a context that fully describes the infrastructure requirements
 * for its stage of the transformation.
 */
export default class Transformer {
    name: string;
    directive: DirectiveDefinitionNode;
    extraDefMap: {
        [name: string]: TypeDefinitionNode;
    };
    /**
     * Each transformer has a name.
     *
     * Each transformer defines a set of directives that it knows how to translate.
     */
    constructor(name: string, directiveDef: string, extraDefs?: string);
    /**
     * An initializer that is called once at the beginning of a transformation.
     * Initializers are called in the order they are declared.
     */
    before?: (acc: TransformerContext) => void;
    /**
     * An initializer that is called once at the beginning of a transformation.
     * Initializers are called in the order they are declared.
     */
    after?: (acc: TransformerContext) => void;
    /**
     * A transformer implements a single function per location that its directive can be applied.
     * This method handles transforming directives on objects type definitions. This includes type
     * extensions.
     */
    object?: (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void;
    /**
     * A transformer implements a single function per location that its directive can be applied.
     * This method handles transforming directives on objects type definitions. This includes type
     * extensions.
     */
    interface?: (definition: InterfaceTypeDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void;
    /**
     * A transformer implements a single function per location that its directive can be applied.
     * This method handles transforming directives on object for field definitions.
     */
    field?: (definition: FieldDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void;
    /**
     * A transformer implements a single function per location that its directive can be applied.
     * This method handles transforming directives on object or input argument definitions.
     */
    argument?: (definition: InputValueDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void;
    /**
     * A transformer implements a single function per location that its directive can be applied.
     * This method handles transforming directives on union definitions.
     */
    union?: (definition: UnionTypeDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void;
    /**
     * A transformer implements a single function per location that its directive can be applied.
     * This method handles transforming directives on enum definitions.
     */
    enum?: (definition: EnumTypeDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void;
    /**
     * A transformer implements a single function per location that its directive can be applied.
     * This method handles transforming directives on enum value definitions.
     */
    enumValue?: (definition: EnumValueDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void;
    /**
     * A transformer implements a single function per location that its directive can be applied.
     * This method handles transforming directives on scalar definitions.
     */
    scalar?: (definition: ScalarTypeDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void;
    /**
     * A transformer implements a single function per location that its directive can be applied.
     * This method handles transforming directives on input definitions.
     */
    input?: (definition: InputObjectTypeDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void;
    /**
     * A transformer implements a single function per location that its directive can be applied.
     * This method handles transforming directives on input value definitions.
     */
    inputValue?: (definition: InputValueDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void;
    /**
     * Helper functions
     */
    /**
     * Given a directive returns a plain JS map of its arguments
     * @param arguments The list of argument nodes to reduce.
     */
    getDirectiveArgumentMap(directive: DirectiveNode): {};
}
