import Template from 'cloudform/types/template'
import AppSync from 'cloudform/types/appSync'
import {
    buildASTSchema, parse, TypeSchemaDefinitionNode, DocumentNode,
    DefinitionNode, TypeSystemDefinitionNode, printSchema
} from 'graphql'
import TransformerContext from './TransformerContext'
import blankTemplate from './util/blankTemplate'
import Transformer from './Transformer'

function isFunction(obj: any) {
    return obj && (typeof obj === 'function')
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
        // TODO: Validate the inputs.
        // TODO: Comb through the schema and validate it only uses directives defined by the transformers.
        // TODO: Have the library handle collecting any types/fields marked with a supported directive. Or have a helper.
        const context = new TransformerContext(schema)
        for (const transformer of this.transformers) {
            console.log(`Transforming with ${transformer.name}`)
            if (isFunction(transformer.before)) {
                transformer.before(context)
            }
            // Apply each transformer and accumulate the context.
            for (const def of context.inputDocument.definitions) {
                for (const dir of def.directives) {
                    switch (def.kind) {
                        case 'ObjectTypeDefinition':
                            if (isFunction(transformer.object)) {
                                transformer.object(def, dir, context)
                            }
                            break
                        // Create the supported resolvers.
                        case 'InterfaceTypeDefinition':
                            if (isFunction(transformer.interface)) {
                                transformer.interface(def, dir, context)
                            }
                            break
                        case 'ScalarTypeDefinition':
                            if (isFunction(transformer.scalar)) {
                                transformer.scalar(def, dir, context)
                            }
                            break
                        case 'UnionTypeDefinition':
                            if (isFunction(transformer.union)) {
                                transformer.union(def, dir, context)
                            }
                            break
                        case 'EnumTypeDefinition':
                            if (isFunction(transformer.enum)) {
                                transformer.enum(def, dir, context)
                            }
                            break
                        case 'InputObjectTypeDefinition':
                            if (isFunction(transformer.input)) {
                                transformer.input(def, dir, context)
                            }
                            break
                        default:
                            continue
                    }
                }
            }
            // TODO: Validate the new context.
            if (1 !== 1) {
                throw new Error(`Invalid context after transformer ${transformer.name}`)
            }
            if (isFunction(transformer.after)) {
                transformer.after(context)
            }
        }
        // Write the schema.
        return context.template
    }
}
