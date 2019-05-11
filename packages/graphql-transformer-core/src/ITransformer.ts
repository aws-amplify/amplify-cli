import {
    DirectiveNode,
    ObjectTypeDefinitionNode,
    InterfaceTypeDefinitionNode,
    FieldDefinitionNode,
    UnionTypeDefinitionNode,
    EnumTypeDefinitionNode,
    ScalarTypeDefinitionNode,
    InputObjectTypeDefinitionNode,
    InputValueDefinitionNode,
    EnumValueDefinitionNode,
    DirectiveDefinitionNode,
    TypeDefinitionNode
} from 'graphql'
import TransformerContext from './TransformerContext'

export default interface ITransformer {

    name: string

    directive: DirectiveDefinitionNode

    typeDefinitions: TypeDefinitionNode[]

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
    interface?: (definition: InterfaceTypeDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void

    /**
     * A transformer implements a single function per location that its directive can be applied.
     * This method handles transforming directives on object for field definitions.
     */
    field?: (
        parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
        definition: FieldDefinitionNode,
        directive: DirectiveNode,
        acc: TransformerContext) => void

    /**
     * A transformer implements a single function per location that its directive can be applied.
     * This method handles transforming directives on object or input argument definitions.
     */
    argument?: (definition: InputValueDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void

    /**
     * A transformer implements a single function per location that its directive can be applied.
     * This method handles transforming directives on union definitions.
     */
    union?: (definition: UnionTypeDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void

    /**
     * A transformer implements a single function per location that its directive can be applied.
     * This method handles transforming directives on enum definitions.
     */
    enum?: (definition: EnumTypeDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void

    /**
     * A transformer implements a single function per location that its directive can be applied.
     * This method handles transforming directives on enum value definitions.
     */
    enumValue?: (definition: EnumValueDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void

    /**
     * A transformer implements a single function per location that its directive can be applied.
     * This method handles transforming directives on scalar definitions.
     */
    scalar?: (definition: ScalarTypeDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void

    /**
     * A transformer implements a single function per location that its directive can be applied.
     * This method handles transforming directives on input definitions.
     */
    input?: (definition: InputObjectTypeDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void

    /**
     * A transformer implements a single function per location that its directive can be applied.
     * This method handles transforming directives on input value definitions.
     */
    inputValue?: (definition: InputValueDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => void
}