import { Transformer, TransformerContext, InvalidDirectiveError } from 'graphql-transformer-core'
import GraphQLAPI from 'cloudform/types/appSync/graphQlApi'
import { ResourceFactory } from './resources'
import { ObjectTypeDefinitionNode, DirectiveNode, ArgumentNode } from 'graphql'
import { ResourceConstants, ResolverResourceIDs } from 'graphql-transformer-common'
import { valueFromASTUntyped } from 'graphql'

const OWNER_AUTH_STRATEGY = "owner"
const DEFAULT_OWNER_FIELD = "owner"
const DEFAULT_IDENTITY_FIELD = "username"
const GROUPS_AUTH_STRATEGY = "groups"

type ModelQuery = 'get' | 'list'
type ModelMutation = 'create' | 'update' | 'delete'
export interface AuthRule {
    allow: 'owner' | 'groups';
    ownerField: string;
    identityField: string;
    groupsField: string;
    groups: string[];
    queries: ModelQuery[]
    mutations: ModelMutation[]
}

/**
 * Implements the ModelAuthTransformer.
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
 * getPost - In the response mapping template we check the "owner" field === $ctx.identity.username.
 * listPost - In the response mapping template we return only items where "owner" === $ctx.identity.username
 * createPost - We automatically insert a "owner" field to attribute values where "owner" === $ctx.identity.username.
 * updatePost - Expose "owner" field in input/output and would set conditional update expression to look for owner.
 * deletePost - Conditional expression checking that the owner === $ctx.identity.username
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
export class ModelAuthTransformer extends Transformer {

    resources: ResourceFactory

    constructor() {
        super(
            'ModelAuthTransformer',
            `
            directive @auth(rules: [AuthRule!]!) on OBJECT
            input AuthRule {
                allow: AuthStrategy!
                ownerField: String # defaults to "owner"
                identityField: String # defaults to "username"
                groupsField: String
                groups: [String]
                queries: [ModelQuery]
                mutations: [ModelMutation]
            }
            enum AuthStrategy { owner groups }
            enum ModelQuery { get list }
            enum ModelMutation { create update delete }
            `
        )
        this.resources = new ResourceFactory();
    }

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

        // Get the auth rules.
        const rules = getArg('rules', []) as AuthRule[]

        // Create a reverse index on rules from operation -> rules list.
        const queryRules: { [k in ModelQuery]: AuthRule[] } = {
            get: [],
            list: [],
        }
        const mutationRules: { [k in ModelMutation]: AuthRule[] } = {
            create: [],
            update: [],
            delete: []
        }
        const matchQuery = (op: ModelQuery) => (rule: AuthRule) => {
            if (rule.queries) {
                const matchesOp = rule.queries.find(o => o === op)
                return Boolean(matchesOp)
            } else if (rule.queries === null) {
                return false
            }
            return true
        }
        const matchMutation = (op: ModelMutation) => (rule: AuthRule) => {
            if (rule.mutations) {
                const matchesOp = rule.mutations.find(o => o === op)
                return Boolean(matchesOp)
            } else if (rule.mutations === null) {
                return false
            }
            return true
        }
        for (const rule of rules) {
            if (matchQuery('get')(rule)) {
                queryRules.get.push(rule)
            }
            if (matchQuery('list')(rule)) {
                queryRules.list.push(rule)
            }
            if (matchMutation('create')(rule)) {
                mutationRules.create.push(rule)
            }
            if (matchMutation('update')(rule)) {
                mutationRules.update.push(rule)
            }
            if (matchMutation('delete')(rule)) {
                mutationRules.delete.push(rule)
            }
        }

        // For each operation evaluate the rules and apply the changes to the relevant resolver.
        this.protectCreateMutation(ctx, ResolverResourceIDs.DynamoDBCreateResolverResourceID(def.name.value), mutationRules.create)
        this.protectUpdateMutation(ctx, ResolverResourceIDs.DynamoDBUpdateResolverResourceID(def.name.value), mutationRules.update)
        this.protectDeleteMutation(ctx, ResolverResourceIDs.DynamoDBDeleteResolverResourceID(def.name.value), mutationRules.delete)
        this.protectGetQuery(ctx, ResolverResourceIDs.DynamoDBGetResolverResourceID(def.name.value), queryRules.get)
        this.protectListQuery(ctx, ResolverResourceIDs.DynamoDBListResolverResourceID(def.name.value), queryRules.list)
    }

    /**
     * Get queries are protected by prepending logic to the response mapping template
     * that validates $ctx.result against the specified auth rules.
     * @param ctx The transformer context.
     * @param resolverResourceId The logical id of the get resolver.
     * @param rules The auth rules to apply.
     */
    private protectGetQuery(ctx: TransformerContext, resolverResourceId: string, rules: AuthRule[]) {
        const resolver = ctx.getResource(resolverResourceId)
        if (!rules || rules.length === 0 || !resolver) {
            return
        }
        const beforeResponse = []
        for (const rule of rules) {
            if (rule.allow === OWNER_AUTH_STRATEGY) {
                const ownerField = rule.ownerField || OWNER_AUTH_STRATEGY
                const identityField = rule.identityField || DEFAULT_IDENTITY_FIELD
                const authSnippet = this.resources.ownerGetResolverResponseMappingTemplateSnippet(ownerField, identityField)
                beforeResponse.push(authSnippet)
            } else if (rule.allow === GROUPS_AUTH_STRATEGY) {
                if (rule.groups) {
                    const authSnippet = this.resources.staticGroupAuthorizationResponseMappingTemplate(rule.groups)
                    beforeResponse.push(authSnippet)
                } else if (rule.groupsField) {
                    const authSnippet = this.resources.dynamicGroupGetResolverResponseMappingTemplateSnippet(rule.groupsField)
                    beforeResponse.push(authSnippet)
                } else {
                    throw new InvalidDirectiveError(`@auth(allow: groups ...) must also be passed "groups" or "groupsField".`)
                }
            }
        }
        // Join together the authorization expressions and update the resolver.
        const templateParts = [...beforeResponse, this.resources.throwWhenUnauthorized(), resolver.Properties.ResponseMappingTemplate]
        resolver.Properties.ResponseMappingTemplate = templateParts.join('\n\n')
        ctx.setResource(resolverResourceId, resolver)
    }

    /**
     * List queries are protected by prepending logic to the response mapping template
     * that filters $ctx.result.items for items that satisfy the auth rules.
     * This is semi-involved and the logic depends on what @auth config is being used.
     * @param ctx The transformer context.
     * @param resolverResourceId The logical id of the resolver to be updated in the CF template.
     * @param rules The set of rules that apply to the operation.
     */
    private protectListQuery(ctx: TransformerContext, resolverResourceId: string, rules: AuthRule[]) {
        const resolver = ctx.getResource(resolverResourceId)
        if (!rules || rules.length === 0 || !resolver) {
            return
        }
        const beforeExpressions = []
        const itemEquivalenceExpressions = []
        const beforeItemEquivalenceExpression = []
        for (const rule of rules) {
            if (rule.allow === OWNER_AUTH_STRATEGY) {
                const ownerField = rule.ownerField || OWNER_AUTH_STRATEGY
                const identityField = rule.identityField || DEFAULT_IDENTITY_FIELD
                const authSnippet = this.resources.ownerListResolverItemCheck(ownerField, identityField)
                itemEquivalenceExpressions.push(authSnippet)
            } else if (rule.allow === GROUPS_AUTH_STRATEGY) {
                if (rule.groups) {
                    const authSnippet = this.resources.staticGroupAuthorizationResponseMappingTemplateAST(rule.groups)

                    // At the beginning of the resolver we run the static group check. If isAuthorized is set to true
                    // then allow every item to be appended.
                    beforeExpressions.push(authSnippet)
                    itemEquivalenceExpressions.push(this.resources.isAuthorized())
                } else if (rule.groupsField) {
                    const authSnippet = this.resources.dynamicGroupListBeforeItemEquivalenceExpressionAST(rule.groupsField)

                    // Run some logic within the loop before the item equivalence expression to compare the fetched values
                    // groupsField against the logged in identity and updating $isAuthorized appropriately.
                    beforeItemEquivalenceExpression.push(authSnippet)
                    itemEquivalenceExpressions.push(this.resources.isAuthorizedLocallyOrGlobally())
                } else {
                    throw new InvalidDirectiveError(`@auth(allow: groups ...) must also be passed "groups" or "groupsField".`)
                }
            }
        }
        // Join together the authorization expressions and update the resolver.
        const templateParts = [
            this.resources.loopThroughResultItemsAppendingAuthorized(itemEquivalenceExpressions, beforeExpressions, beforeItemEquivalenceExpression),
            resolver.Properties.ResponseMappingTemplate
        ]
        resolver.Properties.ResponseMappingTemplate = templateParts.join('\n\n')
        ctx.setResource(resolverResourceId, resolver)
    }

    /**
     * In create mutations the $ctx.identity.username is automatically
     * injected into the object.
     * @param ctx
     * @param resolverResourceId
     * @param rules
     */
    private protectCreateMutation(ctx: TransformerContext, resolverResourceId: string, rules: AuthRule[]) {
        const resolver = ctx.getResource(resolverResourceId)
        if (!rules || rules.length === 0 || !resolver) {
            return
        }
        const beforeRequest = []
        for (const rule of rules) {
            if (rule.allow === OWNER_AUTH_STRATEGY) {
                const ownerField = rule.ownerField || DEFAULT_OWNER_FIELD
                const identityField = rule.identityField || DEFAULT_IDENTITY_FIELD
                const authSnippet = this.resources.ownerCreateResolverRequestMappingTemplateSnippet(ownerField, identityField)
                beforeRequest.push(authSnippet)
            } else if (rule.allow === GROUPS_AUTH_STRATEGY) {
                if (rule.groups) {
                    const authSnippet = this.resources.staticGroupAuthorizationResponseMappingTemplate(rule.groups)
                    beforeRequest.push(authSnippet)
                    beforeRequest.push(this.resources.throwWhenUnauthorized())
                } else if (rule.groupsField) {
                    const authSnippet = this.resources.dynamicGroupCreateResolverRequestMappingTemplateSnippet(rule.groupsField)
                    beforeRequest.push(authSnippet)
                    beforeRequest.push(this.resources.throwWhenUnauthorized())
                } else {
                    throw new InvalidDirectiveError(`@auth(allow: groups ...) must also be passed "groups" or "groupsField".`)
                }
            }
        }
        // Join together the authorization expressions and update the resolver.
        const templateParts = [...beforeRequest, resolver.Properties.RequestMappingTemplate]
        resolver.Properties.RequestMappingTemplate = templateParts.join('\n\n')
        ctx.setResource(resolverResourceId, resolver)
    }

    /**
     * Both protect and update mutations operate via an injected condition expression
     * in the DynamoDB request. The DynamoDBTransformer knows to look for a special
     * auth condition in the template and will merge in values accordingly if the user
     * has also supplied their own filter expressions.
     * @param ctx The transformer context.
     * @param resolverResourceId The logical id of the resolver in the template.
     * @param rules The list of rules to apply.
     */
    private protectUpdateOrDeleteMutation(ctx: TransformerContext, resolverResourceId: string, rules: AuthRule[]) {
        const resolver = ctx.getResource(resolverResourceId)
        if (!rules || rules.length === 0 || !resolver) {
            return
        }
        const beforeRequest = []
        for (const rule of rules) {
            if (rule.allow === OWNER_AUTH_STRATEGY) {
                const ownerField = rule.ownerField || DEFAULT_OWNER_FIELD
                const identityField = rule.identityField || DEFAULT_IDENTITY_FIELD
                const authSnippet = this.resources.ownerUpdateAndDeleteResolverRequestMappingTemplateSnippet(ownerField, identityField)
                beforeRequest.push(authSnippet)
            } else if (rule.allow === GROUPS_AUTH_STRATEGY) {
                if (rule.groups) {
                    const authSnippet = this.resources.staticGroupAuthorizationResponseMappingTemplate(rule.groups)
                    beforeRequest.push(authSnippet)
                    beforeRequest.push(this.resources.throwWhenUnauthorized())
                } else if (rule.groupsField) {
                    const authSnippet = this.resources.dynamicGroupUpdateAndDeleteResolverRequestMappingTemplateSnippet(rule.groupsField)
                    beforeRequest.push(authSnippet)
                } else {
                    throw new InvalidDirectiveError(`@auth(allow: groups ...) must also be passed "groups" or "groupsField".`)
                }
            }
        }
        // Join together the authorization expressions and update the resolver.
        const templateParts = [...beforeRequest, resolver.Properties.RequestMappingTemplate]
        resolver.Properties.RequestMappingTemplate = templateParts.join('\n\n')
        ctx.setResource(resolverResourceId, resolver)
    }

    private protectUpdateMutation(ctx: TransformerContext, resolverResourceId: string, rules: AuthRule[]) {
        return this.protectUpdateOrDeleteMutation(ctx, resolverResourceId, rules)
    }

    private protectDeleteMutation(ctx: TransformerContext, resolverResourceId: string, rules: AuthRule[]) {
        return this.protectUpdateOrDeleteMutation(ctx, resolverResourceId, rules)
    }

}
