import { Transformer, TransformerContext } from 'graphql-transform'
import {
    DirectiveDefinitionNode, parse, DirectiveNode, TypeSystemDefinitionNode,
    buildASTSchema, printSchema
} from 'graphql'
import { ResourceFactory } from './resources'
import {
    makeCreateInputObject, blankObject, makeField, makeArg, makeNamedType,
    makeNonNullType, makeSchema, makeOperationType, makeUpdateInputObject,
    makeDeleteInputObject
} from './definitions'
import Template from 'cloudform/types/template'
import { AppSync } from 'cloudform';

/**
 * Create a Map<string, DirectiveNode[]> for each passed in item.
 * @param name 
 */
function makeDirectiveMap(directives: DirectiveNode[]) {
    const directiveMap: { [name: string]: DirectiveNode[] } = {}
    for (const dir of directives) {
        if (!directiveMap[dir.name.value]) {
            directiveMap[dir.name.value] = [dir]
        } else {
            directiveMap[dir.name.value].push(dir)
        }
    }
    return directiveMap;
}

/**
 * The simple transform.
 * 
 * This transform creates a single DynamoDB table for all of your application's
 * data. It uses a standard key structure and nested map to store object values.
 * A relationKey field
 * 
 * { 
 *  type (HASH),
 *  id (SORT),
 *  value (MAP),
 *  createdAt, (LSI w/ type)
 *  updatedAt (LSI w/ type)
 * }
 */
export default class SimpleTransform extends Transformer {

    constructor() {
        super(
            'SimpleAppSyncTransformer',
            `directive @model on OBJECT`
        )
    }

    /**
     * Given the initial input and accumulated context return the new context.
     * @param initial The input passed to the transform.
     * @param ctx The accumulated context for the transform.
     */
    public transform(definitions: TypeSystemDefinitionNode[], ctx: TransformerContext): TransformerContext {
        // Instantiate the resource factory and start building the template.
        const resources = new ResourceFactory();
        // First create the API record.
        const template = resources.initTemplate();
        const queryType = blankObject('Query')
        const mutationType = blankObject('Mutation')
        for (const def of definitions) {
            const directiveMap = makeDirectiveMap(def.directives)
            switch (def.kind) {
                case 'ObjectTypeDefinition':
                    // Create the supported resolvers.
                    // Create the input & object types.
                    ctx.addObject(def)
                    const createInput = makeCreateInputObject(def)
                    const updateInput = makeUpdateInputObject(def)
                    const deleteInput = makeDeleteInputObject(def)
                    ctx.addInput(createInput)
                    ctx.addInput(updateInput)
                    ctx.addInput(deleteInput)
                    if (directiveMap.model && directiveMap.model.length > 0) {
                        // If this type is a model then create put/delete mutations.
                        const createResolver = resources.makeCreateResolver(def.name.value)
                        template.Resources[`Create${def.name.value}Resolver`] = createResolver
                        mutationType.fields.push(
                            makeField(
                                createResolver.Properties.FieldName,
                                [makeArg('input', makeNonNullType(makeNamedType(createInput.name.value)))],
                                makeNamedType(def.name.value)
                            )
                        )
                        const updateResolver = resources.makeUpdateResolver(def.name.value)
                        template.Resources[`Update${def.name.value}Resolver`] = updateResolver
                        mutationType.fields.push(
                            makeField(
                                updateResolver.Properties.FieldName,
                                [makeArg('input', makeNonNullType(makeNamedType(updateInput.name.value)))],
                                makeNamedType(def.name.value)
                            )
                        )
                        const deleteResolver = resources.makeDeleteResolver(def.name.value)
                        template.Resources[`Delete${def.name.value}Resolver`] = deleteResolver
                        mutationType.fields.push(
                            makeField(
                                deleteResolver.Properties.FieldName,
                                [makeArg('input', makeNonNullType(makeNamedType(deleteInput.name.value)))],
                                makeNamedType(def.name.value)
                            )
                        )
                        const getResolver = resources.makeGetResolver(def.name.value)
                        template.Resources[`Get${def.name.value}Resolver`] = getResolver
                        queryType.fields.push(
                            makeField(
                                getResolver.Properties.FieldName,
                                [makeArg('id', makeNonNullType(makeNamedType('ID')))],
                                makeNamedType(def.name.value)
                            )
                        )
                    }
                case 'InterfaceTypeDefinition':
                // TODO: If an interface has @model on it then create operations
                // for all its descendant types.
                case 'ScalarTypeDefinition':
                case 'UnionTypeDefinition':
                case 'EnumTypeDefinition':
                case 'InputObjectTypeDefinition':
                default:
                    continue
            }
        }
        ctx.addObject(mutationType)
        ctx.addObject(queryType)

        const schema = makeSchema([
            makeOperationType('query', 'Query'),
            makeOperationType('mutation', 'Mutation')
        ])
        ctx.addSchema(schema)
        const built = buildASTSchema({
            kind: 'Document',
            definitions: Object.keys(ctx.nodeMap).map((k: string) => ctx.nodeMap[k])
        })
        const SDL = printSchema(built)
        const schemaResource = resources.makeAppSyncSchema(SDL)
        template.Resources[ResourceFactory.GraphQLSchemaLogicalID] = schemaResource
        ctx.mergeResources(template.Resources)
        ctx.mergeParameters(template.Parameters)
    }
}
