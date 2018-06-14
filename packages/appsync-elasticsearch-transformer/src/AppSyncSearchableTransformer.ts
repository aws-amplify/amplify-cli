import { Transformer, TransformerContext } from 'graphql-transform'
import { ObjectTypeDefinitionNode, DirectiveNode } from 'graphql'
import { ResourceFactory } from './resources'
import { AppSync } from 'cloudform';

/**
 * Handles the @searchable directive on OBJECT types.
 */
export class AppSyncSearchableTransformer extends Transformer {

    resources: ResourceFactory

    constructor() {
        super(
            'AppSyncSearchableTransformer',
            parse(`directive @searchable on OBJECT`).definitions[0]
        )
        this.resources = new ResourceFactory();
    }

    public before(ctx: TransformerContext): void {
        // Any one time setup   
    }

    /**
     * Given the initial input and context manipulate the context to handle this object directive.
     * @param initial The input passed to the transform.
     * @param ctx The accumulated context for the transform.
     */
    public object(def: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext): void {
        // Transformer code here
    }
}
