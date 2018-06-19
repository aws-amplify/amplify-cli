import { Transformer, TransformerContext } from 'graphql-transform'
import {
    DirectiveDefinitionNode, parse, DirectiveNode, TypeSystemDefinitionNode,
    buildASTSchema, printSchema, ObjectTypeDefinitionNode, FieldDefinitionNode
} from 'graphql'
import { ResourceFactory } from './resources'
import {
    makeCreateInputObject, blankObject, makeField, makeArg, makeNamedType,
    makeNonNullType, makeSchema, makeOperationType, makeUpdateInputObject,
    makeDeleteInputObject, blankObjectExtension
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
export class AppSyncDynamoDBTransformer extends Transformer {

    resources: ResourceFactory

    constructor() {
        super(
            'AppSyncDynamoDBTransformer',
            `directive @model on OBJECT`
        )
        this.resources = new ResourceFactory();
    }

    public before(ctx: TransformerContext): void {
        const template = this.resources.initTemplate();
        ctx.mergeResources(template.Resources)
        ctx.mergeParameters(template.Parameters)
        const queryType = blankObject('Query')
        const mutationType = blankObject('Mutation')
        ctx.addObject(mutationType)
        ctx.addObject(queryType)
        const schema = makeSchema([
            makeOperationType('query', 'Query'),
            makeOperationType('mutation', 'Mutation')
        ])
        ctx.addSchema(schema)

        // Some downstream resources depend on this so put a placeholder in and
        // overwrite it in the after
        const schemaResource = this.resources.makeAppSyncSchema('placeholder')
        ctx.setResource(ResourceFactory.GraphQLSchemaLogicalID, schemaResource)
    }

    public after(ctx: TransformerContext): void {
        const built = buildASTSchema({
            kind: 'Document',
            definitions: Object.keys(ctx.nodeMap).map((k: string) => ctx.nodeMap[k])
        })
        const SDL = printSchema(built)
        const schemaResource = this.resources.makeAppSyncSchema(SDL)
        ctx.setResource(ResourceFactory.GraphQLSchemaLogicalID, schemaResource)
    }

    /**
     * Given the initial input and context manipulate the context to handle this object directive.
     * @param initial The input passed to the transform.
     * @param ctx The accumulated context for the transform.
     */
    public object(def: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext): void {
        // Create the object type.
        ctx.addObject(def)

        // Create the input types.
        const createInput = makeCreateInputObject(def)
        const updateInput = makeUpdateInputObject(def)
        const deleteInput = makeDeleteInputObject(def)
        ctx.addInput(createInput)
        ctx.addInput(updateInput)
        ctx.addInput(deleteInput)

        // Create the mutation & query extension
        const mutationType = blankObjectExtension('Mutation')
        const queryType = blankObjectExtension('Query')

        // Create the mutations.
        const createResolver = this.resources.makeCreateResolver(def.name.value)
        ctx.setResource(`Create${def.name.value}Resolver`, createResolver)
        mutationType.fields.push(
            makeField(
                createResolver.Properties.FieldName,
                [makeArg('input', makeNonNullType(makeNamedType(createInput.name.value)))],
                makeNamedType(def.name.value)
            )
        )
        const updateResolver = this.resources.makeUpdateResolver(def.name.value)
        ctx.setResource(`Update${def.name.value}Resolver`, updateResolver)
        mutationType.fields.push(
            makeField(
                updateResolver.Properties.FieldName,
                [makeArg('input', makeNonNullType(makeNamedType(updateInput.name.value)))],
                makeNamedType(def.name.value)
            )
        )
        const deleteResolver = this.resources.makeDeleteResolver(def.name.value)
        ctx.setResource(`Delete${def.name.value}Resolver`, deleteResolver)
        mutationType.fields.push(
            makeField(
                deleteResolver.Properties.FieldName,
                [makeArg('input', makeNonNullType(makeNamedType(deleteInput.name.value)))],
                makeNamedType(def.name.value)
            )
        )
        ctx.addObjectExtension(mutationType)

        // Create the queries
        const getResolver = this.resources.makeGetResolver(def.name.value)
        ctx.setResource(`Get${def.name.value}Resolver`, getResolver)
        queryType.fields.push(
            makeField(
                getResolver.Properties.FieldName,
                [makeArg('id', makeNonNullType(makeNamedType('ID')))],
                makeNamedType(def.name.value)
            )
        )
        ctx.addObjectExtension(queryType)
    }
}
