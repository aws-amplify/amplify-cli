import { Transformer, TransformerContext, InvalidDirectiveError } from 'amplify-graphql-transform'
import GraphQLAPI from 'cloudform/types/appSync/graphQlApi'
import { ResourceFactory } from './resources'
import { ObjectTypeDefinitionNode, DirectiveNode, ArgumentNode } from 'graphql'
import { ResourceConstants } from 'amplify-graphql-transformer-common'
import { valueFromASTUntyped } from 'graphql'
import { ResolverResourceIDs } from 'amplify-graphql-transformer-common'
import Resolver from '../node_modules/cloudform/types/appSync/resolver';

const nManyTruthy = (n: number) => (objs: any[]) => {
    let numTruthy = 0
    for (const o of objs) {
        if (o) {
            numTruthy++
        }
    }
    return numTruthy === n
}

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
            `directive @auth(
                allow: AuthStrategy!,
                queries: [TableQuery],
                mutations: [TableMutation]
            ) on OBJECT`,
            `
                enum AuthStrategy { owner group }
                enum TableQuery { get list search }
                enum TableMutation { create update delete }
            `
        )
        this.resources = new ResourceFactory();
    }

    /**
     * Validates the input directive. Throws a transform error if there is an issue.
     * At most one of owner, ownerPath, group, groupPath can be provided.
     * None, either or both of queries/mutations can be specified.
     */
    // private validateDirective = (dir: DirectiveNode): void => {
    //     const get = (s: string) => (arg: ArgumentNode) => arg.name.value === s
    //     const ownerArg = dir.arguments.find(get('owner'))
    //     const ownerPathArg = dir.arguments.find(get('ownerPath'))
    //     const groupArg = dir.arguments.find(get('group'))
    //     const groupPathArg = dir.arguments.find(get('groupPath'))
    //     const oneIsTruthy = nManyTruthy(1)
    //     if (!oneIsTruthy([ownerArg, ownerPathArg, groupArg, groupPathArg])) {
    //         throw new InvalidDirectiveError("@auth expects exactly one of [owner, ownerPath, group, groupPath].")
    //     }
    // }

    /**
     * Updates the GraphQL API record to use user pool auth.
     */
    private updateAPIForUserPools = (ctx: TransformerContext): void => {
        const apiRecord = ctx.getResource(ResourceConstants.RESOURCES.GraphQLAPILogicalID) as GraphQLAPI
        const updated = this.resources.updateGraphQLAPIWithAuth(apiRecord)
        ctx.setResource(ResourceConstants.RESOURCES.GraphQLAPILogicalID, updated)
    }

    public before = (ctx: TransformerContext): void => {
        const template = this.resources.initTemplate();
        ctx.mergeResources(template.Resources)
        ctx.mergeParameters(template.Parameters)
        ctx.mergeOutputs(template.Outputs)
        ctx.mergeConditions(template.Conditions)
        this.updateAPIForUserPools(ctx)
    }

    private getQueryResolverResourceIds = (typeName: string, queryEnums: string[]) => {
        const ids = []
        for (const queryEnum of queryEnums) {
            switch (queryEnum) {
                case 'get':
                    ids.push(ResolverResourceIDs.DynamoDBGetResolverResourceID(typeName))
                    break
                case 'list':
                    ids.push(ResolverResourceIDs.DynamoDBListResolverResourceID(typeName))
                    break
                case 'search':
                    ids.push(ResolverResourceIDs.ElasticsearchSearchResolverResourceID(typeName))
                    break
            }
        }
        return ids
    }

    private getMutationResolverResourceIds = (typeName: string, mutationEnums: string[]) => {
        const ids = []
        for (const mutEnum of mutationEnums) {
            switch (mutEnum) {
                case 'create':
                    ids.push(ResolverResourceIDs.DynamoDBCreateResolverResourceID(typeName))
                    break
                case 'update':
                    ids.push(ResolverResourceIDs.DynamoDBUpdateResolverResourceID(typeName))
                    break
                case 'delete':
                    ids.push(ResolverResourceIDs.DynamoDBDeleteResolverResourceID(typeName))
                    break
            }
        }
        return ids
    }

    private ownerProtectQueryResolvers = (ctx: TransformerContext, queries: string[], ids: string[]): void => {
        for (let i = 0; i < queries.length; i++) {
            const id = ids[i]
            const query = queries[i]
            const resolver = ctx.getResource(id)
            if (resolver) {
                // Update the resolver with the auth check.
                if (query === 'get') {
                    ctx.setResource(id, this.resources.ownerProtectGetResolver(resolver as Resolver))
                } else if (query === 'list') {
                    ctx.setResource(id, this.resources.ownerProtectListResolver(resolver as Resolver))
                }
                // TODO: Renable if query is added back
                // else if (query === 'query') {
                //     ctx.setResource(id, this.resources.ownerProtectQueryResolver(resolver as Resolver))
                // }
            }
        }
    }

    private ownerProtectMutationResolvers = (ctx: TransformerContext, mutations: string[], ids: string[]): void => {
        for (let i = 0; i < mutations.length; i++) {
            const id = ids[i]
            const mutation = mutations[i]
            const resolver = ctx.getResource(id)
            if (resolver) {
                if (mutation === 'create') {
                    ctx.setResource(id, this.resources.ownerProtectCreateResolver(resolver as Resolver))
                } else if (mutation === 'update') {
                    ctx.setResource(id, this.resources.ownerProtectUpdateResolver(resolver as Resolver))
                } else if (mutation === 'delete') {
                    ctx.setResource(id, this.resources.ownerProtectDeleteResolver(resolver as Resolver))
                }
            }
        }
    }

    /**
     * Implement the transform for an object type. Depending on which operations are to be protected
     */
    public object = (def: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext): void => {
        const get = (s: string) => (arg: ArgumentNode) => arg.name.value === s

        // Protect only those specified else all of them.
        const queriesArgument = directive.arguments.find(get('queries'))
        const queriesToProtect = queriesArgument ? valueFromASTUntyped(queriesArgument.value) : ['get', 'list', 'search']

        // Protect only those specified else all of them.
        const mutationsArgument = directive.arguments.find(get('mutations'))
        const mutationsToProtect = mutationsArgument ? valueFromASTUntyped(mutationsArgument.value) : ['create', 'update', 'delete']

        // Map from the enums to the actual resource ids in the context
        const typeName = def.name.value
        const queryResolverResourceIds = this.getQueryResolverResourceIds(typeName, queriesToProtect)
        const mutationResolverResourceIds = this.getMutationResolverResourceIds(typeName, mutationsToProtect)

        // If there exists a resolver that needs to be protected then protect it.
        this.ownerProtectQueryResolvers(ctx, queriesToProtect, queryResolverResourceIds)
        this.ownerProtectMutationResolvers(ctx, mutationsToProtect, mutationResolverResourceIds)
    }

}