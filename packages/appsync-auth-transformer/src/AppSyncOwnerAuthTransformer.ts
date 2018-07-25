import { Transformer, TransformerContext } from 'graphql-transform'
import { ResourceFactory } from './resources'
import { ObjectTypeDefinitionNode, DirectiveNode } from 'graphql'

/**
 * Implements the AppSyncOwnerAuthTransformer.
 * 
 * Usage:
 * 
 * type Post @ownerAuth {
 *   id: ID!
 *   title: String
 *   createdAt: String
 *   updatedAt: String
 * }
 * 
 * Impact:
 * 
 * getPost - In the response mapping template we check the "owner" field === $ctx.identity.username.
 * createPost - We automatically insert a "owner" field to attribute values where "owner" === $ctx.identity.username.
 * updatePost - Expose "owner" field in input/output and would set conditional update expression to look for owner.
 * deletePost - Conditional expression checking that the owner === $ctx.identity.username
 * 
 * In this example, we would also inject an "owner" field into the type and input type.
 * 
 * Customers may override what operations are protected via the queries & mutations arguments.
 */
export class AppSyncOwnerAuthTransformer extends Transformer {

    resources: ResourceFactory

    constructor() {
        super(
            'AppSyncOwnerAuthTransformer',
            `directive @ownerAuth(field: String = "owner", queries: [TableQuery], mutations: [TableMutation]) on OBJECT`,
            `
                enum TableQuery { get }
                enum TableMutation { create update delete }
            `
        )
        this.resources = new ResourceFactory();
    }

    public before = (ctx: TransformerContext): void => {
        const template = this.resources.initTemplate();
        ctx.mergeResources(template.Resources)
        ctx.mergeParameters(template.Parameters)
        ctx.mergeOutputs(template.Outputs)
    }

    /**
     * Updates the GraphQL API record to use user pool auth.
     */
    private updateAPIForUserPools = (ctx: TransformerContext): void => {

    }

    public object = (def: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext): void => { }

}