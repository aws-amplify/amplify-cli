import { Transformer, TransformerContext } from 'graphql-transform'
import {
    DirectiveDefinitionNode, parse, DirectiveNode, TypeSystemDefinitionNode,
    buildASTSchema, printSchema, ObjectTypeDefinitionNode, FieldDefinitionNode
} from 'graphql'
import { ResourceFactory } from './resources'
import {
    blankObject, makeField, makeArg, makeNamedType,
    makeNonNullType, makeSchema, makeOperationType,
    blankObjectExtension, makeConnection
} from './definitions'
import Template from 'cloudform/types/template'
import { AppSync } from 'cloudform';

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
export class AppSyncSearchTransformer extends Transformer {

    resources: ResourceFactory

    constructor() {
        super(
            'AppSyncSearchTransformer',
            parse(`directive @search on FIELD`).definitions[0]
        )
        this.resources = new ResourceFactory();
    }

    public before(ctx: TransformerContext): void {
        const template = this.resources.initTemplate();
        ctx.mergeResources(template.Resources)
        ctx.mergeParameters(template.Parameters)
    }

    /**
     * Given the initial input and context manipulate the context to handle this object directive.
     * @param initial The input passed to the transform.
     * @param ctx The accumulated context for the transform.
     */
    public object(def: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext): void {

        // Create the connection object type.
        const connection = makeConnection(makeNamedType(def.name.value))
        ctx.addObject(connection)

        const queryType = blankObjectExtension('Query')

        // Todo: The @search directive in the current setup should really be a field transform.
        // This object transform should create the search filter & sort inputs as well as the
        // updated searchX query field and associated resolver
        const isSearchable = (field: FieldDefinitionNode) => field.directives.find(
            (dir: DirectiveNode) => dir.name.value === 'search'
        )
        const pluckName = (field: FieldDefinitionNode) => field.name.value
        const searchableFields = (def.fields || []).filter(isSearchable).map(pluckName)
        const searchResolver = this.resources.makeSearchResolver(
            def.name.value,
            searchableFields
        )
        ctx.setResource(`Search${def.name.value}Resolver`, searchResolver)
        queryType.fields.push(
            makeField(
                searchResolver.Properties.FieldName,
                [
                    makeArg('query', makeNonNullType(makeNamedType('String'))),
                    makeArg('first', makeNamedType('Int')),
                    makeArg('after', makeNamedType('String'))
                ],
                makeNamedType(connection.name.value)
            )
        )
        ctx.addObjectExtension(queryType)
    }
}
