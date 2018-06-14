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
        const context = new TransformerContext(schema)
        for (const transformer of this.transformers) {
            console.log(`Transforming with ${transformer.name}`)
            if (isFunction(transformer.before)) {
                transformer.before(context)
            }
            // TODO: Validate that the transformer supports all the methods
            // required for the directive definition. Also verify that
            // directives are not used where they are not allowed.

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
