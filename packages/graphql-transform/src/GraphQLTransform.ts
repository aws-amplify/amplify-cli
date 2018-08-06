import Template from 'cloudform/types/template'
import {
    TypeSystemDefinitionNode, DirectiveDefinitionNode,
    Kind, DirectiveNode, TypeDefinitionNode, ObjectTypeDefinitionNode,
    InterfaceTypeDefinitionNode, ScalarTypeDefinitionNode, UnionTypeDefinitionNode,
    EnumTypeDefinitionNode, InputObjectTypeDefinitionNode, FieldDefinitionNode,
    InputValueDefinitionNode, EnumValueDefinitionNode
} from 'graphql'
import TransformerContext from './TransformerContext'
import blankTemplate from './util/blankTemplate'
import Transformer from './Transformer'
import { InvalidTransformerError, UnknownDirectiveError } from './errors'

function isFunction(obj: any) {
    return obj && (typeof obj === 'function')
}

/**
 * If this instance of the directive validates against its definition return true.
 * If the definition does not apply to the instance return false.
 * @param directive The directive definition to validate against.
 * @param nodeKind The kind of the current node where the directive was found.
 */
function matchDirective(definition: DirectiveDefinitionNode, directive: DirectiveNode, node: TypeSystemDefinitionNode) {
    if (definition.name.value !== directive.name.value) {
        // The definition is for the wrong directive. Do not match.
        return false;
    }
    let isValidLocation = false;
    for (const location of definition.locations) {
        switch (location.value) {
            case `SCHEMA`:
                isValidLocation = node.kind === Kind.SCHEMA_DEFINITION || isValidLocation
                break
            case `SCALAR`:
                isValidLocation = node.kind === Kind.SCALAR_TYPE_DEFINITION || isValidLocation
                break
            case `OBJECT`:
                isValidLocation = node.kind === Kind.OBJECT_TYPE_DEFINITION || isValidLocation
                break
            case `FIELD_DEFINITION`:
                isValidLocation = node.kind as string === Kind.FIELD_DEFINITION || isValidLocation
                break
            case `ARGUMENT_DEFINITION`:
                isValidLocation = node.kind as string === Kind.INPUT_VALUE_DEFINITION || isValidLocation
                break
            case `INTERFACE`:
                isValidLocation = node.kind === Kind.INTERFACE_TYPE_DEFINITION || isValidLocation
                break
            case `UNION`:
                isValidLocation = node.kind === Kind.UNION_TYPE_DEFINITION || isValidLocation
                break
            case `ENUM`:
                isValidLocation = node.kind === Kind.ENUM_TYPE_DEFINITION || isValidLocation
                break
            case `ENUM_VALUE`:
                isValidLocation = node.kind as string === Kind.ENUM_VALUE_DEFINITION || isValidLocation
                break
            case `INPUT_OBJECT`:
                isValidLocation = node.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION || isValidLocation
                break
            case `INPUT_FIELD_DEFINITION`:
                isValidLocation = node.kind as string === Kind.INPUT_VALUE_DEFINITION || isValidLocation
                break
        }
    }
    return isValidLocation;
}

function matchFieldDirective(definition: DirectiveDefinitionNode, directive: DirectiveNode, node: FieldDefinitionNode) {
    if (definition.name.value !== directive.name.value) {
        // The definition is for the wrong directive. Do not match.
        return false;
    }
    let isValidLocation = false;
    for (const location of definition.locations) {
        switch (location.value) {
            case `FIELD_DEFINITION`:
                isValidLocation = node.kind === Kind.FIELD_DEFINITION || isValidLocation
                break
        }
    }
    return isValidLocation;
}

function matchInputFieldDirective(definition: DirectiveDefinitionNode, directive: DirectiveNode, node: InputValueDefinitionNode) {
    if (definition.name.value !== directive.name.value) {
        // The definition is for the wrong directive. Do not match.
        return false;
    }
    let isValidLocation = false;
    for (const location of definition.locations) {
        switch (location.value) {
            case `INPUT_FIELD_DEFINITION`:
                isValidLocation = node.kind === Kind.INPUT_VALUE_DEFINITION || isValidLocation
                break
        }
    }
    return isValidLocation;
}

function matchArgumentDirective(definition: DirectiveDefinitionNode, directive: DirectiveNode, node: InputValueDefinitionNode) {
    if (definition.name.value !== directive.name.value) {
        // The definition is for the wrong directive. Do not match.
        return false;
    }
    let isValidLocation = false;
    for (const location of definition.locations) {
        switch (location.value) {
            case `ARGUMENT_DEFINITION`:
                isValidLocation = node.kind === Kind.INPUT_VALUE_DEFINITION || isValidLocation
                break
        }
    }
    return isValidLocation;
}

function matchEnumValueDirective(definition: DirectiveDefinitionNode, directive: DirectiveNode, node: EnumValueDefinitionNode) {
    if (definition.name.value !== directive.name.value) {
        // The definition is for the wrong directive. Do not match.
        return false;
    }
    let isValidLocation = false;
    for (const location of definition.locations) {
        switch (location.value) {
            case `ENUM_VALUE`:
                isValidLocation = node.kind === Kind.ENUM_VALUE_DEFINITION || isValidLocation
                break
        }
    }
    return isValidLocation;
}

/**
 * A generic transformation library that takes as input a graphql schema
 * written in SDL and a set of transformers that operate on it. At the
 * end of a transformation, a fully specified cloudformation template
 * is emitted.
 */
export interface GraphQLTransformOptions {
    transformers: Transformer[]
}
export default class GraphQLTransform {

    private transformers: Transformer[]

    constructor(options: GraphQLTransformOptions) {
        if (!options.transformers || options.transformers.length === 0) {
            throw new Error('Must provide at least one transformer.')
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
    public transform(schema: string, template: Template = blankTemplate()): Template {
        const context = new TransformerContext(schema)
        const validDirectiveNameMap = this.transformers.reduce(
            (acc: any, t: Transformer) => ({ ...acc, [t.directive.name.value]: true }),
            {}
        )
        for (const transformer of this.transformers) {
            console.log(`Transforming with ${transformer.name}`)
            if (isFunction(transformer.before)) {
                transformer.before(context)
            }
            // TODO: Validate that the transformer supports all the methods
            // required for the directive definition. Also verify that
            // directives are not used where they are not allowed.

            // Apply each transformer and accumulate the context.
            for (const def of context.inputDocument.definitions as TypeDefinitionNode[]) {
                for (const dir of def.directives) {
                    if (!validDirectiveNameMap[dir.name.value]) {
                        throw new UnknownDirectiveError(
                            `Unknown directive '${dir.name.value}'. Either remove the directive from the schema or add a transformer to handle it.`
                        )
                    }
                    switch (def.kind) {
                        case 'ObjectTypeDefinition':
                            this.transformObject(transformer, def, dir, context)
                            // Walk the fields and call field transformers.
                            break
                        case 'InterfaceTypeDefinition':
                            this.transformInterface(transformer, def, dir, context)
                            // Walk the fields and call field transformers.
                            break;
                        case 'ScalarTypeDefinition':
                            this.transformScalar(transformer, def, dir, context)
                            break;
                        case 'UnionTypeDefinition':
                            this.transformUnion(transformer, def, dir, context)
                            break;
                        case 'EnumTypeDefinition':
                            this.transformEnum(transformer, def, dir, context)
                            break;
                        case 'InputObjectTypeDefinition':
                            this.transformInputObject(transformer, def, dir, context)
                            break;
                        default:
                            continue
                    }
                }
            }
        }
        // .transform() is meant to behave like a composition so the
        // after functions are called in the reverse order (as if they were popping off a stack)
        let reverseThroughTransformers = this.transformers.length - 1;
        while (reverseThroughTransformers >= 0) {
            const transformer = this.transformers[reverseThroughTransformers]
            // TODO: Validate the new context.
            if (1 !== 1) {
                throw new Error(`Invalid context after transformer ${transformer.name}`)
            }
            if (isFunction(transformer.after)) {
                transformer.after(context)
            }
            reverseThroughTransformers -= 1
        }
        // Write the schema.
        return context.template
    }

    private transformObject(transformer: Transformer, def: ObjectTypeDefinitionNode, dir: DirectiveNode, context: TransformerContext) {
        if (matchDirective(transformer.directive, dir, def)) {
            if (isFunction(transformer.object)) {
                transformer.object(def, dir, context)
            } else {
                throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'object()' method`)
            }
        }
        for (const field of def.fields) {
            for (const fDir of field.directives) {
                this.transformField(transformer, def, field, fDir, context)
            }
        }
    }

    private transformField(
        transformer: Transformer,
        parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
        def: FieldDefinitionNode,
        dir: DirectiveNode,
        context: TransformerContext
    ) {
        if (matchFieldDirective(transformer.directive, dir, def)) {
            if (isFunction(transformer.field)) {
                transformer.field(parent, def, dir, context)
            } else {
                throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'field()' method`)
            }
        }
        for (const arg of def.arguments) {
            for (const aDir of arg.directives) {
                this.transformArgument(transformer, arg, aDir, context)
            }
        }
    }

    private transformArgument(transformer: Transformer, def: InputValueDefinitionNode, dir: DirectiveNode, context: TransformerContext) {
        if (matchArgumentDirective(transformer.directive, dir, def)) {
            if (isFunction(transformer.argument)) {
                transformer.argument(def, dir, context)
            } else {
                throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'argument()' method`)
            }
        }
    }

    private transformInterface(transformer: Transformer, def: InterfaceTypeDefinitionNode, dir: DirectiveNode, context: TransformerContext) {
        if (matchDirective(transformer.directive, dir, def)) {
            if (isFunction(transformer.interface)) {
                transformer.interface(def, dir, context)
            } else {
                throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'interface()' method`)
            }
        }
        for (const field of def.fields) {
            for (const fDir of field.directives) {
                this.transformField(transformer, def, field, fDir, context)
            }
        }
    }

    private transformScalar(transformer: Transformer, def: ScalarTypeDefinitionNode, dir: DirectiveNode, context: TransformerContext) {
        if (matchDirective(transformer.directive, dir, def)) {
            if (isFunction(transformer.scalar)) {
                transformer.scalar(def, dir, context)
            } else {
                throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'scalar()' method`)
            }
        }
    }

    private transformUnion(transformer: Transformer, def: UnionTypeDefinitionNode, dir: DirectiveNode, context: TransformerContext) {
        if (matchDirective(transformer.directive, dir, def)) {
            if (isFunction(transformer.union)) {
                transformer.union(def, dir, context)
            } else {
                throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'union()' method`)
            }
        }
    }

    private transformEnum(transformer: Transformer, def: EnumTypeDefinitionNode, dir: DirectiveNode, context: TransformerContext) {
        if (matchDirective(transformer.directive, dir, def)) {
            if (isFunction(transformer.enum)) {
                transformer.enum(def, dir, context)
            } else {
                throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'enum()' method`)
            }
        }
        for (const value of def.values) {
            for (const vDir of value.directives) {
                this.transformEnumValue(transformer, value, vDir, context)
            }
        }
    }

    private transformEnumValue(transformer: Transformer, def: EnumValueDefinitionNode, dir: DirectiveNode, context: TransformerContext) {
        if (matchEnumValueDirective(transformer.directive, dir, def)) {
            if (isFunction(transformer.enumValue)) {
                transformer.enumValue(def, dir, context)
            } else {
                throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'enumValue()' method`)
            }
        }
    }

    private transformInputObject(transformer: Transformer, def: InputObjectTypeDefinitionNode, dir: DirectiveNode, context: TransformerContext) {
        if (matchDirective(transformer.directive, dir, def)) {
            if (isFunction(transformer.input)) {
                transformer.input(def, dir, context)
            } else {
                throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'input()' method`)
            }
        }
        for (const field of def.fields) {
            for (const fDir of field.directives) {
                this.transformInputField(transformer, field, fDir, context)
            }
        }
    }

    private transformInputField(transformer: Transformer, def: InputValueDefinitionNode, dir: DirectiveNode, context: TransformerContext) {
        if (matchInputFieldDirective(transformer.directive, dir, def)) {
            if (isFunction(transformer.inputValue)) {
                transformer.inputValue(def, dir, context)
            } else {
                throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'inputValue()' method`)
            }
        }
    }
}
