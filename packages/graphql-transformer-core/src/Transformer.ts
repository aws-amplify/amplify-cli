import TransformerContext from './TransformerContext'
import ITransformer from './ITransformer'
import {
    DirectiveDefinitionNode,
    parse,
    DirectiveNode,
    ObjectTypeDefinitionNode,
    InterfaceTypeDefinitionNode,
    FieldDefinitionNode,
    UnionTypeDefinitionNode,
    Kind,
    EnumTypeDefinitionNode,
    ScalarTypeDefinitionNode,
    InputObjectTypeDefinitionNode,
    InputValueDefinitionNode,
    EnumValueDefinitionNode,
    TypeDefinitionNode,
    DefinitionNode,
    DocumentNode
} from 'graphql'
import { InvalidTransformerError } from './errors'

/**
 * A GraphQLTransformer takes a context object, processes it, and
 * returns a new context. The transformer is responsible for returning
 * a context that fully describes the infrastructure requirements
 * for its stage of the transformation.
 */
export default class Transformer implements ITransformer {

    public name: string

    public directive: DirectiveDefinitionNode

    public typeDefinitions: TypeDefinitionNode[]

    /**
     * Each transformer has a name.
     *
     * Each transformer defines a set of directives that it knows how to translate.
     */
    constructor(
        name: string,
        document: DocumentNode | string
    ) {
        const doc = typeof document === 'string' ? parse(document) : document;
        this.name = name
        const directives = doc.definitions.filter(d => d.kind === Kind.DIRECTIVE_DEFINITION) as DirectiveDefinitionNode[]
        const extraDefs = doc.definitions.filter(d => d.kind !== Kind.DIRECTIVE_DEFINITION) as TypeDefinitionNode[]
        if (directives.length !== 1) {
            throw new InvalidTransformerError('Transformers must specify exactly one directive definition.')
        }
        this.directive = directives[0]

        // Transformers can define extra shapes that can be used by the directive
        // and validated. TODO: Validation.
        this.typeDefinitions = extraDefs
    }

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
