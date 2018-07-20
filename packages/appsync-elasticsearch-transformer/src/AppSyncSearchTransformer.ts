import { Transformer, TransformerContext } from 'graphql-transform'
import {
    DirectiveNode, ObjectTypeDefinitionNode, FieldDefinitionNode
} from 'graphql'
import { ResourceFactory } from './resources'
import {
    
} from './definitions'
import {
    makeNamedType, blankObjectExtension, makeArg, makeField, makeNonNullType,
    extensionWithFields
} from 'appsync-transformer-common'

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
            'directive @search on FIELD'
        )
        this.resources = new ResourceFactory();
    }

    public before = (ctx: TransformerContext): void => {
        const template = this.resources.initTemplate();
        ctx.mergeResources(template.Resources)
        ctx.mergeParameters(template.Parameters)
    }

    /**
     * Given the initial input and context manipulate the context to handle this object directive.
     * @param initial The input passed to the transform.
     * @param ctx The accumulated context for the transform.
     */
    public object = (def: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext): void => {

    }
}
