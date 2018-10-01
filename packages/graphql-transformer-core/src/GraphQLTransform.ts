import Template from 'cloudform/types/template'
import {
    TypeSystemDefinitionNode, DirectiveDefinitionNode,
    Kind, DirectiveNode, TypeDefinitionNode, ObjectTypeDefinitionNode,
    InterfaceTypeDefinitionNode, ScalarTypeDefinitionNode, UnionTypeDefinitionNode,
    EnumTypeDefinitionNode, InputObjectTypeDefinitionNode, FieldDefinitionNode,
    InputValueDefinitionNode, EnumValueDefinitionNode, validate
} from 'graphql'
import TransformerContext from './TransformerContext'
import blankTemplate from './util/blankTemplate'
import Transformer from './Transformer'
import { InvalidTransformerError, UnknownDirectiveError, SchemaValidationError } from './errors'
import { validateModelSchema } from './validation'

function isFunction(obj: any) {
    return obj && (typeof obj === 'function')
}

function makeSeenTransformationKey(
    directive: DirectiveNode,
    type: TypeDefinitionNode,
    field?: FieldDefinitionNode | InputValueDefinitionNode | EnumValueDefinitionNode,
    arg?: InputValueDefinitionNode
): string {
    if (directive && type && field && arg) {
        return `${type.name.value}.${field.name.value}.${arg.name.value}@${directive.name.value}`
    } if (directive && type && field) {
        return `${type.name.value}.${field.name.value}@${directive.name.value}`
    } else {
        return `${type.name.value}@${directive.name.value}`
    }
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

    // A map from `${directive}.${typename}.${fieldName?}`: true
    // that specifies we have run already run a directive at a given location.
    // Only run a transformer function once per pair. This is refreshed each call to transform().
    private seenTransformations: { [k: string]: boolean } = {}

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
        this.seenTransformations = {}
        const context = new TransformerContext(schema)
        const validDirectiveNameMap = this.transformers.reduce(
            (acc: any, t: Transformer) => ({ ...acc, [t.directive.name.value]: true }),
            { aws_subscribe: true }
        )
        let allModelDefinitions = [...context.inputDocument.definitions]
        for (const transformer of this.transformers) {
            allModelDefinitions = allModelDefinitions.concat(
                ...transformer.typeDefinitions,
                transformer.directive
            )
        }
        const errors = validateModelSchema({ kind: Kind.DOCUMENT, definitions: allModelDefinitions })
        if (errors && errors.length) {
            throw new SchemaValidationError(errors.slice(0))
        }

        for (const transformer of this.transformers) {
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
                const transformKey = makeSeenTransformationKey(dir, def)
                if (!this.seenTransformations[transformKey]) {
                    transformer.object(def, dir, context)
                    this.seenTransformations[transformKey] = true
                }
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
                const transformKey = makeSeenTransformationKey(dir, parent, def)
                if (!this.seenTransformations[transformKey]) {
                    transformer.field(parent, def, dir, context)
                    this.seenTransformations[transformKey] = true
                }
            } else {
                throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'field()' method`)
            }
        }
        for (const arg of def.arguments) {
            for (const aDir of arg.directives) {
                this.transformArgument(transformer, parent, def, arg, aDir, context)
            }
        }
    }

    private transformArgument(
        transformer: Transformer,
        parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
        field: FieldDefinitionNode,
        arg: InputValueDefinitionNode,
        dir: DirectiveNode,
        context: TransformerContext
    ) {
        if (matchArgumentDirective(transformer.directive, dir, arg)) {
            if (isFunction(transformer.argument)) {
                const transformKey = makeSeenTransformationKey(dir, parent, field, arg)
                if (!this.seenTransformations[transformKey]) {
                    transformer.argument(arg, dir, context)
                    this.seenTransformations[transformKey] = true
                }
            } else {
                throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'argument()' method`)
            }
        }
    }

    private transformInterface(transformer: Transformer, def: InterfaceTypeDefinitionNode, dir: DirectiveNode, context: TransformerContext) {
        if (matchDirective(transformer.directive, dir, def)) {
            if (isFunction(transformer.interface)) {
                const transformKey = makeSeenTransformationKey(dir, def)
                if (!this.seenTransformations[transformKey]) {
                    transformer.interface(def, dir, context)
                    this.seenTransformations[transformKey] = true
                }
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
                const transformKey = makeSeenTransformationKey(dir, def)
                if (!this.seenTransformations[transformKey]) {
                    transformer.scalar(def, dir, context)
                    this.seenTransformations[transformKey] = true
                }
            } else {
                throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'scalar()' method`)
            }
        }
    }

    private transformUnion(transformer: Transformer, def: UnionTypeDefinitionNode, dir: DirectiveNode, context: TransformerContext) {
        if (matchDirective(transformer.directive, dir, def)) {
            if (isFunction(transformer.union)) {
                const transformKey = makeSeenTransformationKey(dir, def)
                if (!this.seenTransformations[transformKey]) {
                    transformer.union(def, dir, context)
                    this.seenTransformations[transformKey] = true
                }
            } else {
                throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'union()' method`)
            }
        }
    }

    private transformEnum(transformer: Transformer, def: EnumTypeDefinitionNode, dir: DirectiveNode, context: TransformerContext) {
        if (matchDirective(transformer.directive, dir, def)) {
            if (isFunction(transformer.enum)) {
                const transformKey = makeSeenTransformationKey(dir, def)
                if (!this.seenTransformations[transformKey]) {
                    transformer.enum(def, dir, context)
                    this.seenTransformations[transformKey] = true
                }
            } else {
                throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'enum()' method`)
            }
        }
        for (const value of def.values) {
            for (const vDir of value.directives) {
                this.transformEnumValue(transformer, def, value, vDir, context)
            }
        }
    }

    private transformEnumValue(
        transformer: Transformer, enm: EnumTypeDefinitionNode, def: EnumValueDefinitionNode, dir: DirectiveNode, context: TransformerContext
    ) {
        if (matchEnumValueDirective(transformer.directive, dir, def)) {
            if (isFunction(transformer.enumValue)) {
                const transformKey = makeSeenTransformationKey(dir, enm, def)
                if (!this.seenTransformations[transformKey]) {
                    transformer.enumValue(def, dir, context)
                    this.seenTransformations[transformKey] = true
                }
            } else {
                throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'enumValue()' method`)
            }
        }
    }

    private transformInputObject(transformer: Transformer, def: InputObjectTypeDefinitionNode, dir: DirectiveNode, context: TransformerContext) {
        if (matchDirective(transformer.directive, dir, def)) {
            if (isFunction(transformer.input)) {
                const transformKey = makeSeenTransformationKey(dir, def)
                if (!this.seenTransformations[transformKey]) {
                    transformer.input(def, dir, context)
                    this.seenTransformations[transformKey] = true
                }
            } else {
                throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'input()' method`)
            }
        }
        for (const field of def.fields) {
            for (const fDir of field.directives) {
                this.transformInputField(transformer, def, field, fDir, context)
            }
        }
    }

    private transformInputField(
        transformer: Transformer, input: InputObjectTypeDefinitionNode, def: InputValueDefinitionNode,
        dir: DirectiveNode, context: TransformerContext
    ) {
        if (matchInputFieldDirective(transformer.directive, dir, def)) {
            if (isFunction(transformer.inputValue)) {
                const transformKey = makeSeenTransformationKey(dir, input, def)
                if (!this.seenTransformations[transformKey]) {
                    transformer.inputValue(def, dir, context)
                    this.seenTransformations[transformKey] = true
                }
            } else {
                throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'inputValue()' method`)
            }
        }
    }
}
