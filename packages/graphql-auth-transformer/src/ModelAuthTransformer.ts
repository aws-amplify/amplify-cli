import { Transformer, TransformerContext, InvalidDirectiveError } from 'graphql-transformer-core'
import GraphQLAPI from 'cloudform/types/appSync/graphQlApi'
import { ResourceFactory } from './resources'
import { AuthRule, ModelQuery, ModelMutation } from './AuthRule'
import { ObjectTypeDefinitionNode, DirectiveNode, ArgumentNode } from 'graphql'
import { ResourceConstants, ResolverResourceIDs } from 'graphql-transformer-common'
import {
    Expression, print, raw, iff, equals, forEach, set, ref, list, compoundExpression
} from 'graphql-mapping-template';
import { valueFromASTUntyped } from 'graphql'

import {
    OWNER_AUTH_STRATEGY,
    DEFAULT_OWNER_FIELD,
    DEFAULT_IDENTITY_FIELD,
    GROUPS_AUTH_STRATEGY,
    DEFAULT_GROUPS_FIELD
} from './constants'

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
        // this.protectCreateMutation(ctx, ResolverResourceIDs.DynamoDBCreateResolverResourceID(def.name.value), mutationRules.create)
        // this.protectUpdateMutation(ctx, ResolverResourceIDs.DynamoDBUpdateResolverResourceID(def.name.value), mutationRules.update)
        // this.protectDeleteMutation(ctx, ResolverResourceIDs.DynamoDBDeleteResolverResourceID(def.name.value), mutationRules.delete)
        this.protectGetQuery(ctx, ResolverResourceIDs.DynamoDBGetResolverResourceID(def.name.value), queryRules.get)
        this.protectListQuery(ctx, ResolverResourceIDs.DynamoDBListResolverResourceID(def.name.value), queryRules.list)
    }

    /**
     * Protect get queries.
     * If static group:
     *  If statically authorized then allow the operation. Stop.
     * If owner and/or dynamic group:
     *  If the result item satisfies the owner/group authorization condition
     *  then allow it.
     * @param ctx The transformer context.
     * @param resolverResourceId The logical id of the get resolver.
     * @param rules The auth rules to apply.
     */
    private protectGetQuery(ctx: TransformerContext, resolverResourceId: string, rules: AuthRule[]) {
        const resolver = ctx.getResource(resolverResourceId)
        if (!rules || rules.length === 0 || !resolver) {
            return
        } else {

            // Break the rules out by strategy.
            const staticGroupAuthorizationRules = this.getStaticGroupRules(rules)
            const dynamicGroupAuthorizationRules = this.getDynamicGroupRules(rules)
            const ownerAuthorizationRules = this.getOwnerRules(rules)

            // Generate the expressions to validate each strategy.
            const staticGroupAuthorizationExpression = this.resources.staticGroupAuthorizationExpression(staticGroupAuthorizationRules)
            const dynamicGroupAuthorizationExpression = this.resources.dynamicGroupAuthorizationExpressionForReadOperations(
                dynamicGroupAuthorizationRules
            )
            const ownerAuthorizationExpression = this.resources.ownerAuthorizationExpressionForReadOperations(
                ownerAuthorizationRules
            )
            const throwIfUnauthorizedExpression = this.resources.throwIfUnauthorizedForReadOperations()

            // Update the existing resolver with the authorization checks.
            const responseMappingTemplatePrefixExpressions = [
                staticGroupAuthorizationExpression,
                dynamicGroupAuthorizationExpression,
                ownerAuthorizationExpression,
                throwIfUnauthorizedExpression
            ]
            const templateParts = [
                print(compoundExpression(responseMappingTemplatePrefixExpressions)),
                resolver.Properties.ResponseMappingTemplate
            ]
            resolver.Properties.ResponseMappingTemplate = templateParts.join('\n\n')
            ctx.setResource(resolverResourceId, resolver)
        }
    }

    /**
     * Protect list queries.
     * If static group:
     *  If the user is statically authorized then return items and stop.
     * If dynamic group and/or owner:
     *  Loop through all items and find items that satisfy any of the group or
     *  owner conditions.
     * @param ctx The transformer context.
     * @param resolverResourceId The logical id of the resolver to be updated in the CF template.
     * @param rules The set of rules that apply to the operation.
     */
    private protectListQuery(ctx: TransformerContext, resolverResourceId: string, rules: AuthRule[]) {
        const resolver = ctx.getResource(resolverResourceId)
        if (!rules || rules.length === 0 || !resolver) {
            return
        } else {
            // Break the rules out by strategy.
            const staticGroupAuthorizationRules = this.getStaticGroupRules(rules)
            const dynamicGroupAuthorizationRules = this.getDynamicGroupRules(rules)
            const ownerAuthorizationRules = this.getOwnerRules(rules)

            // Generate the expressions to validate each strategy.
            const staticGroupAuthorizationExpression = this.resources.staticGroupAuthorizationExpression(staticGroupAuthorizationRules)

            // In list queries, the dynamic group and ownership authorization checks
            // occur on a per item basis. The helpers take the variable names
            // as parameters to allow for this use case.
            const dynamicGroupAuthorizationExpression = this.resources.dynamicGroupAuthorizationExpressionForReadOperations(
                dynamicGroupAuthorizationRules,
                'item',
                ResourceConstants.SNIPPETS.IsLocalDynamicGroupAuthorizedVariable,
                raw(`false`)
            )
            const ownerAuthorizationExpression = this.resources.ownerAuthorizationExpressionForReadOperations(
                ownerAuthorizationRules,
                'item',
                ResourceConstants.SNIPPETS.IsLocalOwnerAuthorizedVariable,
                raw(`false`)
            )
            const appendIfLocallyAuthorized = this.resources.appendItemIfLocallyAuthorized()

            const ifNotStaticallyAuthedFilterObjects = iff(
                equals(ref(ResourceConstants.SNIPPETS.IsStaticGroupAuthorizedVariable), raw('false')),
                compoundExpression([
                    set(ref('items'), list([])),
                    forEach(
                        ref('item'),
                        ref('ctx.result.items'),
                        [
                            dynamicGroupAuthorizationExpression,
                            ownerAuthorizationExpression,
                            appendIfLocallyAuthorized
                        ]
                    ),
                    set(ref('ctx.result.items'), ref('items'))
                ])
            )
            const templateParts = [
                print(
                    compoundExpression([
                        staticGroupAuthorizationExpression,
                        ifNotStaticallyAuthedFilterObjects
                    ])
                ),
                resolver.Properties.ResponseMappingTemplate
            ]
            resolver.Properties.ResponseMappingTemplate = templateParts.join('\n\n')
            ctx.setResource(resolverResourceId, resolver)
        }
    }

    /**
     * Inject auth rules for create mutations.
     * If owner auth:
     *  The $ctx.identity.username is automatically injected into the object
     *  if it was not provided by the user. If it was provided check it is the same
     *  as the logged in user or that the operation is authorized some other way.
     * If group:
     *  If the user is group authorized allow no matter what.
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
     * Protect update and delete mutations.
     * If Owner:
     *  Update the conditional expression such that the update only works if
     *  the user is the owner.
     * If dynamic group:
     *  Update the conditional expression such that it succeeds if the user is
     *  dynamic group authorized. If the operation is also owner authorized this
     *  should be joined with an OR expression.
     * If static group:
     *  If the user is statically authorized then allow no matter what. This can
     *  be done by removing the conditional expression as long as static group
     *  auth is always checked last.
     * @param ctx The transformer context.
     * @param resolverResourceId The logical id of the resolver in the template.
     * @param rules The list of rules to apply.
     */
    private protectUpdateOrDeleteMutation(ctx: TransformerContext, resolverResourceId: string, rules: AuthRule[]) {
        const resolver = ctx.getResource(resolverResourceId)
        if (!rules || rules.length === 0 || !resolver) {
            return
        }
        const beforeRequest: string[] = [this.resources.setUserGroupsString()]
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
                    beforeRequest.push(this.resources.handleStaticGroupAuthorizationCheck())
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

    private getOwnerRules(rules: AuthRule[]): AuthRule[] {
        return rules.filter(rule => rule.allow === 'owner');
    }

    private getStaticGroupRules(rules: AuthRule[]): AuthRule[] {
        return rules.filter(rule => rule.allow === 'groups' && Boolean(rule.groups));
    }

    private getDynamicGroupRules(rules: AuthRule[]): AuthRule[] {
        return rules.filter(rule => rule.allow === 'groups' && !Boolean(rule.groups));
    }

}
