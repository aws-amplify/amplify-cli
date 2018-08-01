import { Transformer, TransformerContext, InvalidDirectiveError } from 'graphql-transform'
import GraphQLAPI from 'cloudform/types/appSync/graphQlApi'
import { ResourceFactory } from './resources'
import { ObjectTypeDefinitionNode, DirectiveNode, ArgumentNode } from 'graphql'
import { ResourceConstants } from 'graphql-transformer-common'
import { valueFromASTUntyped } from 'graphql'
import { ResolverResourceIDs } from 'graphql-transformer-common'
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
 * Implements the AppSyncAuthTransformer.
 *
 * Owner Auth Usage:
 *
 * type Post @auth(allow: owner) {
 *   id: ID!
 *   title: String
 *   createdAt: String
 *   updatedAt: String
 * }
 *
 * Impact:
 *
 * getPost - In the response mapping template we check the "owner" field === $ctx.identity.sub.
 * listPost - In the response mapping template we return only items where "owner" === $ctx.identity.sub
 * createPost - We automatically insert a "owner" field to attribute values where "owner" === $ctx.identity.sub.
 * updatePost - Expose "owner" field in input/output and would set conditional update expression to look for owner.
 * deletePost - Conditional expression checking that the owner === $ctx.identity.sub
 *
 * Note: The name of the "owner" field may be configured via the CF paramaters.
 *
 * type Post @auth(allow: groups, groups: ["Admin", "Dev"]) {
 *   id: ID!
 *   title: String
 *   createdAt: String
 *   updatedAt: String
 * }
 *
 * Impact:
 *
 * getPost - Update req template to look for the groups in the identity.
 * listPost - Update req template to look for the groups in the identity.
 * createPost - Update req template to look for the groups in the identity.
 * updatePost - Update req template to look for the groups in the identity.
 * deletePost - Update req template to look for the groups in the identity.
 *
 * TODO: Document support for dynamic group authorization against
 * attributes of the records using conditional expressions. This will likely
 * be via a new argument such as "groupsField".
 */
export class AppSyncAuthTransformer extends Transformer {

    resources: ResourceFactory

    constructor() {
        super(
            'AppSyncAuthTransformer',
            `directive @auth(
                allow: AuthStrategy!,
                ownerField: String = "owner",
                groupsField: String,
                groups: [String],
                queries: [ModelQuery],
                mutations: [ModelMutation]
            ) on OBJECT`,
            `
                enum AuthStrategy { owner groups }
                enum ModelQuery { get list }
                enum ModelMutation { create update delete }
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

    private ownerProtectQueryResolvers = (
        ctx: TransformerContext,
        queries: string[],
        ids: string[],
        ownerField: string,
    ): void => {
        for (let i = 0; i < queries.length; i++) {
            const id = ids[i]
            const query = queries[i]
            const resolver = ctx.getResource(id)
            if (resolver) {
                // Update the resolver with the auth check.
                if (query === 'get') {
                    ctx.setResource(id, this.resources.ownerProtectGetResolver(resolver as Resolver, ownerField))
                } else if (query === 'list') {
                    ctx.setResource(id, this.resources.ownerProtectListResolver(resolver as Resolver, ownerField))
                }
                // else if (query === 'search') {
                //     ctx.setResource(id, this.resources.ownerProtectQueryResolver(resolver as Resolver))
                // }
            }
        }
    }

    private ownerProtectMutationResolvers = (
        ctx: TransformerContext,
        mutations: string[],
        ids: string[],
        ownerField: string,
    ): void => {
        for (let i = 0; i < mutations.length; i++) {
            const id = ids[i]
            const mutation = mutations[i]
            const resolver = ctx.getResource(id)
            if (resolver) {
                if (mutation === 'create') {
                    ctx.setResource(id, this.resources.ownerProtectCreateResolver(resolver as Resolver, ownerField))
                } else if (mutation === 'update') {
                    ctx.setResource(id, this.resources.ownerProtectUpdateResolver(resolver as Resolver, ownerField))
                } else if (mutation === 'delete') {
                    ctx.setResource(id, this.resources.ownerProtectDeleteResolver(resolver as Resolver, ownerField))
                }
            }
        }
    }

    public staticGroupsProtectQueryResolvers = (
        ctx: TransformerContext,
        queries: string[],
        ids: string[],
        groups: string[],
    ): void => {
        for (let i = 0; i < queries.length; i++) {
            const id = ids[i]
            const query = queries[i]
            const resolver = ctx.getResource(id)
            if (resolver) {
                if (query === 'get') {
                    ctx.setResource(id, this.resources.staticGroupProtectResolver(resolver as Resolver, groups))
                } else if (query === 'list') {
                    ctx.setResource(id, this.resources.staticGroupProtectResolver(resolver as Resolver, groups))
                } else if (query === 'search') {
                    // TODO: Test this when @searchable is ready
                    ctx.setResource(id, this.resources.staticGroupProtectResolver(resolver as Resolver, groups))
                }
            }
        }
    }

    public staticGroupsProtectMutationResolvers = (
        ctx: TransformerContext,
        mutations: string[],
        ids: string[],
        groups: string[],
    ): void => {
        for (let i = 0; i < mutations.length; i++) {
            const id = ids[i]
            const mutation = mutations[i]
            const resolver = ctx.getResource(id)
            if (resolver) {
                if (mutation === 'create') {
                    ctx.setResource(id, this.resources.staticGroupProtectResolver(resolver as Resolver, groups))
                } else if (mutation === 'update') {
                    ctx.setResource(id, this.resources.staticGroupProtectResolver(resolver as Resolver, groups))
                } else if (mutation === 'delete') {
                    ctx.setResource(id, this.resources.staticGroupProtectResolver(resolver as Resolver, groups))
                }
            }
        }
    }

    public dynamicGroupsProtectQueryResolvers = (
        ctx: TransformerContext,
        queries: string[],
        ids: string[],
        groupsField: string,
    ): void => {
        for (let i = 0; i < queries.length; i++) {
            const id = ids[i]
            const query = queries[i]
            const resolver = ctx.getResource(id)
            if (resolver) {
                if (query === 'get') {
                    ctx.setResource(id, this.resources.dynamicGroupProtectGetResolver(resolver as Resolver, groupsField))
                } else if (query === 'list') {
                    ctx.setResource(id, this.resources.dynamicGroupProtectListResolver(resolver as Resolver, groupsField))
                }
                // else if (query === 'search') {
                //     ctx.setResource(id, this.resources.dynamicGroupProtectDeleteResolver(resolver as Resolver, groupsField))
                // }
            }
        }
    }

    public dynamicGroupsProtectMutationResolvers = (
        ctx: TransformerContext,
        mutations: string[],
        ids: string[],
        groupsField: string,
    ): void => {
        for (let i = 0; i < mutations.length; i++) {
            const id = ids[i]
            const mutation = mutations[i]
            const resolver = ctx.getResource(id)
            if (resolver) {
                if (mutation === 'create') {
                    ctx.setResource(id, this.resources.dynamicGroupProtectCreateResolver(resolver as Resolver, groupsField))
                } else if (mutation === 'update') {
                    ctx.setResource(id, this.resources.dynamicGroupProtectUpdateResolver(resolver as Resolver, groupsField))
                } else if (mutation === 'delete') {
                    ctx.setResource(id, this.resources.dynamicGroupProtectDeleteResolver(resolver as Resolver, groupsField))
                }
            }
        }
    }

    /**
     * Implement the transform for an object type. Depending on which operations are to be protected
     */
    public object = (def: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext): void => {
        const get = (s: string) => (arg: ArgumentNode) => arg.name.value === s
        const getArg = (arg: string, dflt?: any) => {
            const argument = directive.arguments.find(get(arg))
            return argument ? valueFromASTUntyped(argument.value) : dflt
        }

        const modelDirective = def.directives.find((dir) => dir.name.value === 'model')
        if (!modelDirective) {
            throw new InvalidDirectiveError('Types annotated with @auth must also be annotated with @model.')
        }

        // Get the auth strategy for this transformer
        const authStrategy = getArg('allow')

        // Protect only those specified else all of them.
        const queriesToProtect = getArg('queries', ['get', 'list', 'search'])

        // Protect only those specified else all of them.
        const mutationsToProtect = getArg('mutations', ['create', 'update', 'delete'])

        // Map from the enums to the actual resource ids in the context
        const typeName = def.name.value
        const queryResolverResourceIds = this.getQueryResolverResourceIds(typeName, queriesToProtect)
        const mutationResolverResourceIds = this.getMutationResolverResourceIds(typeName, mutationsToProtect)

        if (authStrategy === 'owner') {
            // If there exists a resolver that needs to be protected then protect it.
            const ownerField = getArg('ownerField')
            this.ownerProtectQueryResolvers(ctx, queriesToProtect, queryResolverResourceIds, ownerField)
            this.ownerProtectMutationResolvers(ctx, mutationsToProtect, mutationResolverResourceIds, ownerField)
        } else if (authStrategy === 'groups') {
            // If there exists a resolver that needs to be protected then protect it.
            const groupsField = getArg('groupsField')
            const groups = getArg('groups')
            if (
                (groups && groupsField) || (!groups && !groupsField)
            ) {
                throw new InvalidDirectiveError(`The @auth directive takes exactly one of [groups, groupsField]`)
            }
            if (groups) {
                this.staticGroupsProtectQueryResolvers(ctx, queriesToProtect, queryResolverResourceIds, groups)
                this.staticGroupsProtectMutationResolvers(ctx, mutationsToProtect, mutationResolverResourceIds, groups)
            } else {
                this.dynamicGroupsProtectQueryResolvers(ctx, queriesToProtect, queryResolverResourceIds, groupsField)
                this.dynamicGroupsProtectMutationResolvers(ctx, mutationsToProtect, mutationResolverResourceIds, groupsField)
            }
        }
    }

}