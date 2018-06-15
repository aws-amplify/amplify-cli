import Template from 'cloudform/types/template'
import AppSync from 'cloudform/types/appSync'
import {
    buildASTSchema, parse, DocumentNode,
    DefinitionNode, TypeSystemDefinitionNode, printSchema, DirectiveDefinitionNode,
    Kind, DirectiveNode, TypeDefinitionNode
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

/**
 * A generic transformation library that takes as input a graphql schema
 * written in SDL and a set of transformers that operate on it. At the
 * end of a transformation, a fully specified cloudformation template
 * is emitted.
 */
interface GraphQLTransformOptions {
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
                    if (matchDirective(transformer.directive, dir, def)) {
                        switch (def.kind) {
                            case 'ObjectTypeDefinition':
                                if (isFunction(transformer.object)) {
                                    transformer.object(def, dir, context)
                                    break
                                } else {
                                    throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'object()' method`)
                                }
                            // Create the supported resolvers.
                            case 'InterfaceTypeDefinition':
                                if (isFunction(transformer.interface)) {
                                    transformer.interface(def, dir, context)
                                    break
                                } else {
                                    throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'interface()' method`)
                                }
                            case 'ScalarTypeDefinition':
                                if (isFunction(transformer.scalar)) {
                                    transformer.scalar(def, dir, context)
                                    break
                                } else {
                                    throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'scalar()' method`)
                                }
                            case 'UnionTypeDefinition':
                                if (isFunction(transformer.union)) {
                                    transformer.union(def, dir, context)
                                    break
                                } else {
                                    throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'union()' method`)
                                }
                            case 'EnumTypeDefinition':
                                if (isFunction(transformer.enum)) {
                                    transformer.enum(def, dir, context)
                                    break
                                } else {
                                    throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'enum()' method`)
                                }
                            case 'InputObjectTypeDefinition':
                                if (isFunction(transformer.input)) {
                                    transformer.input(def, dir, context)
                                    break
                                } else {
                                    throw new InvalidTransformerError(`The transformer '${transformer.name}' must implement the 'input()' method`)
                                }
                            default:
                                continue
                        }
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
}
