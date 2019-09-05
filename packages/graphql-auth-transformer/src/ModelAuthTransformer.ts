import { Transformer, TransformerContext, InvalidDirectiveError, gql, getDirectiveArguments, getFieldArguments } from 'graphql-transformer-core'
import GraphQLAPI from 'cloudform-types/types/appSync/graphQlApi'
import Resolver from 'cloudform-types/types/appSync/resolver';
import { ResourceFactory } from './resources'
import { AuthRule, ModelQuery, ModelMutation, ModelOperation } from './AuthRule'
import {
    ObjectTypeDefinitionNode, DirectiveNode, ArgumentNode, TypeDefinitionNode, Kind,
    FieldDefinitionNode, InterfaceTypeDefinitionNode, valueFromASTUntyped,
} from 'graphql'
import { ResourceConstants, ResolverResourceIDs, isListType,
    getBaseType, makeNamedType, makeInputValueDefinition,
    makeNonNullType, makeField } from 'graphql-transformer-common'
import {
    Expression, print, raw, iff, forEach, set, ref, list, compoundExpression, or, newline,
    comment
} from 'graphql-mapping-template';
import { ModelDirectiveConfiguration, ModelDirectiveOperationType, ModelSubscriptionLevel } from './ModelDirectiveConfiguration';

import {
    OWNER_AUTH_STRATEGY,
    GROUPS_AUTH_STRATEGY,
    DEFAULT_OWNER_FIELD,
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

export type AppSyncAuthModeModes = 'API_KEY' | 'AMAZON_COGNITO_USER_POOLS'; // Introduce later: | 'AWS_IAM' | 'OPENID_CONNECT';
const validateAuthMode = (mode: string) => {
    if (
        mode !== 'API_KEY' &&
        mode !== 'AMAZON_COGNITO_USER_POOLS'
    ) {
        throw new Error(`Invalid auth mode ${mode}`);
    }
}
export interface ModelAuthTransformerConfig {
    authMode: AppSyncAuthModeModes
}
export class ModelAuthTransformer extends Transformer {

    resources: ResourceFactory;
    config: ModelAuthTransformerConfig;

    constructor(config?: ModelAuthTransformerConfig) {
        super(
            'ModelAuthTransformer',
            gql`
            directive @auth(rules: [AuthRule!]!) on OBJECT | FIELD_DEFINITION
            input AuthRule {
                # Specifies the auth rule's strategy. Allowed values are 'owner' and 'groups'.
                allow: AuthStrategy!

                # Legacy name for identityClaim
                identityField: String
                    @deprecated(reason: "The 'identityField' argument is replaced by the 'identityClaim'.")

                # Specifies the name of the claim to look for on the request's JWT token
                # from Cognito User Pools (and in the future OIDC) that contains the identity
                # of the user. If 'allow' is 'groups', this value should point to a list of groups
                # in the claims. If 'allow' is 'owner', this value should point to the logged in user identity string.
                # Defaults to "cognito:username" for Cognito User Pools auth.
                identityClaim: String

                # Allows for custom config of 'groups' which is validated against the JWT
                # Specifies a static list of groups that should have access to the object
                groupClaim: String

                # Allowed when the 'allow' argument is 'owner'.
                # Specifies the field of type String or [String] that contains owner(s) that can access the object.
                ownerField: String # defaults to "owner"

                # Allowed when the 'allow' argument is 'groups'.
                # Specifies the field of type String or [String] that contains group(s) that can access the object.
                groupsField: String

                # Allowed when the 'allow' argument is 'groups'.
                # Specifies a static list of groups that should have access to the object.
                groups: [String]

                # Specifies operations to which this auth rule should be applied.
                operations: [ModelOperation]

                # Deprecated. It is recommended to use the 'operations' arguments.
                queries: [ModelQuery]
                    @deprecated(reason: "The 'queries' argument will be replaced by the 'operations' argument in a future release.")

                # Deprecated. It is recommended to use the 'operations' arguments.
                mutations: [ModelMutation]
                    @deprecated(reason: "The 'mutations' argument will be replaced by the 'operations' argument in a future release.")
            }
            enum AuthStrategy { owner groups }
            enum ModelOperation { create update delete read }
            enum ModelQuery
                @deprecated(reason: "ModelQuery will be replaced by the 'ModelOperation' in a future release.")
            {
                get
                list
            }
            enum ModelMutation
                @deprecated(reason: "ModelMutation will be replaced by the 'ModelOperation' in a future release.")
            {
                create
                update
                delete
            }
            `
        )
        this.config = config || { authMode: 'API_KEY' };
        validateAuthMode(this.config.authMode);
        this.resources = new ResourceFactory();
    }

    /**
     * Updates the GraphQL API record to use user pool auth.
     */
    private updateAPIForUserPools = (ctx: TransformerContext): void => {
        const apiRecord = ctx.getResource(ResourceConstants.RESOURCES.GraphQLAPILogicalID) as GraphQLAPI;
        const updated = this.resources.updateGraphQLAPIWithAuth(apiRecord, this.config.authMode);
        ctx.setResource(ResourceConstants.RESOURCES.GraphQLAPILogicalID, updated);
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
        const modelDirective = def.directives.find((dir) => dir.name.value === 'model')
        if (!modelDirective) {
            throw new InvalidDirectiveError('Types annotated with @auth must also be annotated with @model.')
        }

        // Get and validate the auth rules.
        const rules = this.getAuthRulesFromDirective(directive);
        this.validateRules(rules)

        const { operationRules, queryRules } = this.splitRules(rules);

        // Retrieve the configuration options for the related @model directive
        const modelConfiguration = new ModelDirectiveConfiguration(modelDirective, def);

        // For each operation evaluate the rules and apply the changes to the relevant resolver.
        this.protectCreateMutation(ctx, ResolverResourceIDs.DynamoDBCreateResolverResourceID(def.name.value), operationRules.create, def)
        this.protectUpdateMutation(ctx, ResolverResourceIDs.DynamoDBUpdateResolverResourceID(def.name.value),
            operationRules.update, def, modelConfiguration)
        this.protectDeleteMutation(ctx, ResolverResourceIDs.DynamoDBDeleteResolverResourceID(def.name.value),
            operationRules.delete, def, modelConfiguration)
        this.protectGetQuery(ctx, ResolverResourceIDs.DynamoDBGetResolverResourceID(def.name.value), queryRules.get)
        this.protectListQuery(ctx, ResolverResourceIDs.DynamoDBListResolverResourceID(def.name.value), queryRules.list)
        this.protectConnections(ctx, def, operationRules.read)
        this.protectQueries(ctx, def, operationRules.read)

        // Check if subscriptions is enabled
        if (modelConfiguration.getName('level') !== "off") {
            this.protectOnCreateSubscription(ctx, operationRules.create, def,
                modelConfiguration);
            this.protectOnUpdateSubscription(ctx, operationRules.update, def,
                modelConfiguration);
            this.protectOnDeleteSubscription(ctx, operationRules.delete, def,
                modelConfiguration);
        }
    }

    public field = (
        parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
        definition: FieldDefinitionNode,
        directive: DirectiveNode,
        ctx: TransformerContext
    ) => {
        if (parent.kind === Kind.INTERFACE_TYPE_DEFINITION) {
            throw new InvalidDirectiveError(
                `The @auth directive cannot be placed on an interface's field. See ${parent.name.value}${definition.name.value}`
            );
        }
        const modelDirective = parent.directives.find((dir) => dir.name.value === 'model')
        if (!modelDirective) {
            throw new InvalidDirectiveError('Types annotated with @auth must also be annotated with @model.')
        }

        // Retrieve the configuration options for the related @model directive
        const modelConfiguration = new ModelDirectiveConfiguration (modelDirective, parent);
        if (
            parent.name.value === ctx.getQueryTypeName() ||
            parent.name.value === ctx.getMutationTypeName() ||
            parent.name.value === ctx.getSubscriptionTypeName()
        ) {
            console.warn(
                `Be careful when using @auth directives on a field in a root type. @auth directives on field definitions use the source \
object to perform authorization logic and the source will be an empty object for fields on root types. \
Static group authorization should perform as expected.`
            )
        }

        // Get and validate the auth rules.
        const rules = this.getAuthRulesFromDirective(directive);
        this.validateFieldRules(rules)
        const isOpRule = (op: ModelOperation) => (rule: AuthRule) => {
            if (rule.operations) {
                const matchesOp = rule.operations.find(o => o === op)
                return Boolean(matchesOp)
            } else if (rule.operations === null) {
                return false
            }
            return true
        }
        const isReadRule = isOpRule('read');
        const isCreateRule = isOpRule('create');
        const isUpdateRule = isOpRule('update');
        const isDeleteRule = isOpRule('delete');
        // The field handler adds the read rule on the object
        const readRules = rules.filter((rule: AuthRule) => isReadRule(rule))
        this.protectField(ctx, parent.name.value, definition,
            readRules, modelConfiguration)

        // Protect mutations when objects including this field are trying to be created.
        const createRules = rules.filter((rule: AuthRule) => isCreateRule(rule))
        this.protectCreateForField(ctx, parent, definition, createRules, modelConfiguration)

        // Protect update mutations when objects inluding this field are trying to be updated.
        const updateRules = rules.filter((rule: AuthRule) => isUpdateRule(rule))
        this.protectUpdateForField(ctx, parent, definition,
            modelConfiguration, updateRules)

        // Delete operations are only protected by @auth directives on objects.
        const deleteRules = rules.filter((rule: AuthRule) => isDeleteRule(rule))
        this.protectDeleteForField(ctx, parent, definition,
            modelConfiguration, deleteRules)
    }

    private protectField(ctx: TransformerContext, typeName: string,
        field: FieldDefinitionNode, rules: AuthRule[], modelConfiguration: ModelDirectiveConfiguration) {
        if (rules && rules.length) {
            const resolverResourceId = ResolverResourceIDs.ResolverResourceID(typeName, field.name.value);
            // If the resolver exists (e.g. @connection use it else make a blank one against None)
            let resolver = ctx.getResource(resolverResourceId)
            if (!resolver) {
                // If we need a none data source for the blank resolver, add it.
                const noneDS = ctx.getResource(ResourceConstants.RESOURCES.NoneDataSource)
                if (!noneDS) {
                    ctx.setResource(ResourceConstants.RESOURCES.NoneDataSource, this.resources.noneDataSource())
                }
                // We also need to add a stack mapping so that this resolver is added to the model stack.
                ctx.mapResourceToStack(typeName, resolverResourceId)
                resolver = this.resources.blankResolver(typeName, field.name.value)
            }
            const authExpression = this.authorizationExpressionOnSingleObject(rules, 'ctx.source')
            if (modelConfiguration.getName('level') === 'on') {
                if (field.type.kind === Kind.NON_NULL_TYPE) {
                    throw new InvalidDirectiveError(`\nPer-field auth on the required field ${field.name.value} is not supported with subscriptions.
Either make the field optional, set auth on the object and not the field, or disable subscriptions for the object (setting level to off or public)\n`)
                }
                // operation check in the protected field
                resolver.Properties.ResponseMappingTemplate = print(
                    this.resources.operationCheckExpression(ctx.getMutationTypeName(), field.name.value));
            }
            // If a resolver exists, a @connection for example. Prepend it to the req.
            const templateParts = [
                print(authExpression),
                resolver.Properties.RequestMappingTemplate
            ]
            resolver.Properties.RequestMappingTemplate = templateParts.join('\n\n')
            ctx.setResource(resolverResourceId, resolver)
        }
    }

    private protectUpdateForField(ctx: TransformerContext, parent: ObjectTypeDefinitionNode, field: FieldDefinitionNode,
        modelConfiguration: ModelDirectiveConfiguration, rules: AuthRule[]) {
        const resolverResourceId = ResolverResourceIDs.DynamoDBUpdateResolverResourceID(parent.name.value);
        const subscriptionOperation: ModelDirectiveOperationType = "onUpdate";
        this.protectUpdateMutation(ctx, resolverResourceId, rules, parent, modelConfiguration, field, subscriptionOperation)
    }

    private protectDeleteForField(ctx: TransformerContext, parent: ObjectTypeDefinitionNode, field: FieldDefinitionNode,
        modelConfiguration: ModelDirectiveConfiguration, rules: AuthRule[]) {
        const resolverResourceId = ResolverResourceIDs.DynamoDBUpdateResolverResourceID(parent.name.value);
        const subscriptionOpeartion: ModelDirectiveOperationType = "onDelete";
        this.protectDeleteMutation(ctx, resolverResourceId, rules, parent, modelConfiguration, field, subscriptionOpeartion)
    }

    /**
     * Protects a create mutation based on an @auth rule specified on a @model field.
     * @param ctx The context.
     * @param typeName The parent type name.
     * @param fieldName The name of the field with the @auth directive.
     * @param rules The set of rules that should be applied to create operations.
     */
    private protectCreateForField(ctx: TransformerContext, parent: ObjectTypeDefinitionNode,
        field: FieldDefinitionNode, rules: AuthRule[], modelConfiguration: ModelDirectiveConfiguration) {
        const typeName = parent.name.value;
        const resolverResourceId = ResolverResourceIDs.DynamoDBCreateResolverResourceID(typeName);
        const createResolverResource = ctx.getResource(resolverResourceId);
        const operation = ctx.getMutationTypeName();
        const operationExpression = this.resources.setOperationExpression(operation);
        if (rules && rules.length && createResolverResource) {
            // Break the rules out by strategy.
            const staticGroupAuthorizationRules = this.getStaticGroupRules(rules)
            const dynamicGroupAuthorizationRules = this.getDynamicGroupRules(rules)
            const ownerAuthorizationRules = this.getOwnerRules(rules)

            // Generate the expressions to validate each strategy.
            const staticGroupAuthorizationExpression = this.resources.staticGroupAuthorizationExpression(staticGroupAuthorizationRules)

            // In create mutations, the dynamic group and ownership authorization checks
            // are done before calling PutItem.
            const dynamicGroupAuthorizationExpression = this.resources.dynamicGroupAuthorizationExpressionForCreateOperationsByField(
                dynamicGroupAuthorizationRules,
                field.name.value
            )
            const fieldIsList = (fieldName: string) => {
                const field = parent.fields.find(field => field.name.value === fieldName);
                if (field) {
                    return isListType(field.type);
                }
                return false;
            }
            const ownerAuthorizationExpression = this.resources.ownerAuthorizationExpressionForCreateOperationsByField(
                ownerAuthorizationRules,
                field.name.value,
                fieldIsList
            )

            const throwIfUnauthorizedExpression = this.resources.throwIfUnauthorized()
            const templateParts = [
                print(
                    iff(
                        raw(`$ctx.args.input.containsKey("${field.name.value}")`),
                        compoundExpression([
                            staticGroupAuthorizationExpression,
                            newline(),
                            dynamicGroupAuthorizationExpression,
                            newline(),
                            ownerAuthorizationExpression,
                            newline(),
                            throwIfUnauthorizedExpression
                        ])
                    )
                ),
                createResolverResource.Properties.RequestMappingTemplate
            ]
            createResolverResource.Properties.RequestMappingTemplate = templateParts.join('\n\n')
            if (modelConfiguration.shouldHave('onCreate') &&
            modelConfiguration.getName('level') as ModelSubscriptionLevel === 'on') {
                const getTemplateParts = [
                    print(operationExpression),
                    createResolverResource.Properties.ResponseMappingTemplate,
                ];
                createResolverResource.Properties.ResponseMappingTemplate = getTemplateParts.join('\n\n')
            }
            ctx.setResource(resolverResourceId, createResolverResource)
        }
    }

    /**
     * Takes a flat list of rules, each containing their own list of operations (or queries/mutations if an old API).
     * This method splits those rules into buckets keyed by operation and implements some logic for backwards compatibility.
     * @param rules The list of auth rules
     */
    private splitRules(rules: AuthRule[]) {
        // Create a reverse index on rules from operation -> rules list.
        const queryRules: { [k in ModelQuery]: AuthRule[] } = {
            get: [],
            list: [],
        }
        const operationRules: { [k in ModelOperation]: AuthRule[] } = {
            create: [],
            update: [],
            delete: [],
            read: []
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
        const matchOperation = (op: ModelOperation) => (rule: AuthRule) => {
            if (rule.operations) {
                const matchesOp = rule.operations.find(o => o === op)
                return Boolean(matchesOp)
            } else if (rule.operations === null) {
                return false
            }
            return true
        }
        for (const rule of rules) {
            // If operations is provided, then it takes precendence.
            if (
                isTruthyOrNull(rule.operations)
            ) {
                // If operations is given use it.
                if (matchOperation('read')(rule)) {
                    queryRules.get.push(rule)
                    queryRules.list.push(rule)
                    operationRules.read.push(rule)
                }
                if (matchOperation('create')(rule)) {
                    operationRules.create.push(rule)
                }
                if (matchOperation('update')(rule)) {
                    operationRules.update.push(rule)
                }
                if (matchOperation('delete')(rule)) {
                    operationRules.delete.push(rule)
                }
            } else {
                // If operations is not provided, either use the default behavior or deprecated
                // behavior from the queries/mutations arguments for backwards compatibility.

                // Handle default or deprecated query use case
                if (
                    isUndefined(rule.queries)
                ) {
                    // If both operations and queries are undefined, default to read operation protection.
                    // This is the default behavior. E.G. @auth(rules: [{ allow: owner }])
                    queryRules.get.push(rule)
                    queryRules.list.push(rule)
                    operationRules.read.push(rule)
                } else {
                    // If operations is undefined & queries is defined, use queries.
                    // This is the old behavior for backwards compatibility.
                    if (matchQuery('get')(rule)) {
                        queryRules.get.push(rule)
                    }
                    if (matchQuery('list')(rule)) {
                        queryRules.list.push(rule)
                    }
                }

                // Handle default or deprecated mutation use case
                if (
                    isUndefined(rule.mutations)
                ) {
                    // If both operations and mutations are undefined, default to create, update, delete
                    // operation protection. This is the default behavior. E.G. @auth(rules: [{ allow: owner }])
                    operationRules.create.push(rule)
                    operationRules.update.push(rule)
                    operationRules.delete.push(rule)
                } else {
                    // If operations is undefined & mutations is defined, use mutations.
                    // This is the old behavior for backwards compatibility.
                    if (matchMutation('create')(rule)) {
                        operationRules.create.push(rule)
                    }
                    if (matchMutation('update')(rule)) {
                        operationRules.update.push(rule)
                    }
                    if (matchMutation('delete')(rule)) {
                        operationRules.delete.push(rule)
                    }
                }
            }
        }
        return {
            operationRules,
            queryRules
        }
    }

    private validateRules(rules: AuthRule[]) {
        for (const rule of rules) {
            const { queries, mutations, operations } = rule;
            if (mutations && operations) {
                console.warn(
                    `It is not recommended to use 'mutations' and 'operations'. The 'operations' argument will be used.`)
            }
            if (queries && operations) {
                console.warn(
                    `It is not recommended to use 'queries' and 'operations'. The 'operations' argument will be used.`)
            }
            this.commonRuleValidation(rule);
        }
    }

    private validateFieldRules(rules: AuthRule[]) {
        for (const rule of rules) {
            const { queries, mutations } = rule;
            if (queries || mutations) {
                throw new InvalidDirectiveError(
                    `@auth directives used on field definitions may not specify the 'queries' or 'mutations' arguments. \
All @auth directives used on field definitions are performed when the field is resolved and can be thought of as 'read' operations.`)
            }
            this.commonRuleValidation(rule);
        }
    }

    // commmon rule validation between obj and field
    private commonRuleValidation(rule: AuthRule) {
        const { identityField, identityClaim, allow,
           groups, groupsField, groupClaim
        } = rule;
       if ( allow === 'groups' && (identityClaim || identityField)) {
           throw new InvalidDirectiveError(`
           @auth identityField/Claim can only be used for 'allow: owner'`)
       }
       if (allow === 'owner' && groupClaim) {
           throw new InvalidDirectiveError(`
           @auth groupClaim can only be used 'allow: groups'`);
       }
       if ( groupsField && groups) {
           throw new InvalidDirectiveError("This rule has groupsField and groups, please use one or the other")
       }
       if (identityField && identityClaim) {
           throw new InvalidDirectiveError("Please use consider IdentifyClaim over IdentityField as it is deprecated.")
       }
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
            const authExpression = this.authorizationExpressionOnSingleObject(rules)
            const templateParts = [
                print(authExpression),
                resolver.Properties.ResponseMappingTemplate
            ]
            resolver.Properties.ResponseMappingTemplate = templateParts.join('\n\n')
            ctx.setResource(resolverResourceId, resolver)
        }
    }

    private authorizationExpressionOnSingleObject(rules: AuthRule[], objectPath: string = 'ctx.result') {
        // Break the rules out by strategy.
        const staticGroupAuthorizationRules = this.getStaticGroupRules(rules)
        const dynamicGroupAuthorizationRules = this.getDynamicGroupRules(rules)
        const ownerAuthorizationRules = this.getOwnerRules(rules)

        // Generate the expressions to validate each strategy.
        const staticGroupAuthorizationExpression = this.resources.staticGroupAuthorizationExpression(staticGroupAuthorizationRules)
        const dynamicGroupAuthorizationExpression = this.resources.dynamicGroupAuthorizationExpressionForReadOperations(
            dynamicGroupAuthorizationRules,
            objectPath
        )
        const ownerAuthorizationExpression = this.resources.ownerAuthorizationExpressionForReadOperations(
            ownerAuthorizationRules,
            objectPath
        )
        const throwIfUnauthorizedExpression = this.resources.throwIfUnauthorized()

        // Update the existing resolver with the authorization checks.
        return compoundExpression([
            staticGroupAuthorizationExpression,
            newline(),
            dynamicGroupAuthorizationExpression,
            newline(),
            ownerAuthorizationExpression,
            newline(),
            throwIfUnauthorizedExpression
        ]);
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
            const authExpression = this.authorizationExpressionForListResult(rules)
            const templateParts = [
                print(authExpression),
                resolver.Properties.ResponseMappingTemplate
            ]
            resolver.Properties.ResponseMappingTemplate = templateParts.join('\n\n')
            ctx.setResource(resolverResourceId, resolver)
        }
    }

    /**
     * Returns a VTL expression that will authorize a list of results based on a set of auth rules.
     * @param rules The auth rules.
     */
    private authorizationExpressionForListResult(rules: AuthRule[]) {
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
            raw(`! $${ResourceConstants.SNIPPETS.IsStaticGroupAuthorizedVariable}`),
            compoundExpression([
                set(ref('items'), list([])),
                forEach(
                    ref('item'),
                    ref('ctx.result.items'),
                    [
                        dynamicGroupAuthorizationExpression,
                        newline(),
                        ownerAuthorizationExpression,
                        newline(),
                        appendIfLocallyAuthorized
                    ]
                ),
                set(ref('ctx.result.items'), ref('items'))
            ])
        )
        return compoundExpression([
            staticGroupAuthorizationExpression,
            newline(),
            comment('[Start] If not static group authorized, filter items'),
            ifNotStaticallyAuthedFilterObjects,
            comment('[End] If not static group authorized, filter items')
        ])
    }

    /**
     * Inject auth rules for create mutations.
     * If owner auth:
     *  If the owner field exists in the input, validate that it against the identity.
     *  If the owner field dne in the input, insert the identity.
     * If group:
     *  If the user is static group authorized allow operation no matter what.
     *  If dynamic group and the input defines a group(s) validate it against the identity.
     * @param ctx
     * @param resolverResourceId
     * @param rules
     */
    private protectCreateMutation(
        ctx: TransformerContext,
        resolverResourceId: string,
        rules: AuthRule[],
        parent: ObjectTypeDefinitionNode
    ) {
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

            // In create mutations, the dynamic group and ownership authorization checks
            // are done before calling PutItem.
            const dynamicGroupAuthorizationExpression = this.resources.dynamicGroupAuthorizationExpressionForCreateOperations(
                dynamicGroupAuthorizationRules
            )
            const fieldIsList = (fieldName: string) => {
                const field = parent.fields.find(field => field.name.value === fieldName);
                if (field) {
                    return isListType(field.type);
                }
                return false;
            }
            const ownerAuthorizationExpression = this.resources.ownerAuthorizationExpressionForCreateOperations(
                ownerAuthorizationRules,
                fieldIsList
            )

            const throwIfUnauthorizedExpression = this.resources.throwIfUnauthorized()
            const templateParts = [
                print(
                    compoundExpression([
                        staticGroupAuthorizationExpression,
                        newline(),
                        dynamicGroupAuthorizationExpression,
                        newline(),
                        ownerAuthorizationExpression,
                        newline(),
                        throwIfUnauthorizedExpression
                    ])
                ),
                resolver.Properties.RequestMappingTemplate
            ]
            resolver.Properties.RequestMappingTemplate = templateParts.join('\n\n')
            ctx.setResource(resolverResourceId, resolver)
        }
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
    private protectUpdateOrDeleteMutation(
        ctx: TransformerContext,
        resolverResourceId: string,
        rules: AuthRule[],
        parent: ObjectTypeDefinitionNode,
        modelConfiguration: ModelDirectiveConfiguration,
        field?: FieldDefinitionNode,
        ifCondition?: Expression,
        operation?: ModelDirectiveOperationType,
    ) {
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

            // In create mutations, the dynamic group and ownership authorization checks
            // are done before calling PutItem.
            const dynamicGroupAuthorizationExpression = this.resources.dynamicGroupAuthorizationExpressionForUpdateOrDeleteOperations(
                dynamicGroupAuthorizationRules,
                field ? field.name.value : undefined
            )

            const fieldIsList = (fieldName: string) => {
                const field = parent.fields.find(field => field.name.value === fieldName);
                if (field) {
                    return isListType(field.type);
                }
                return false;
            }
            const ownerAuthorizationExpression = this.resources.ownerAuthorizationExpressionForUpdateOrDeleteOperations(
                ownerAuthorizationRules,
                fieldIsList,
                field ? field.name.value : undefined
            )

            const collectAuthCondition = this.resources.collectAuthCondition()
            const ifNotStaticallyAuthedCreateAuthCondition = iff(
                raw(`! $${ResourceConstants.SNIPPETS.IsStaticGroupAuthorizedVariable}`),
                compoundExpression([
                    dynamicGroupAuthorizationExpression,
                    newline(),
                    ownerAuthorizationExpression,
                    newline(),
                    collectAuthCondition
                ])
            )

            const throwIfNotStaticGroupAuthorizedOrAuthConditionIsEmpty = this.resources.throwIfNotStaticGroupAuthorizedOrAuthConditionIsEmpty()

            const authorizationLogic = compoundExpression([
                staticGroupAuthorizationExpression,
                newline(),
                ifNotStaticallyAuthedCreateAuthCondition,
                newline(),
                throwIfNotStaticGroupAuthorizedOrAuthConditionIsEmpty
            ]);

            const templateParts = [
                print(
                    field && ifCondition ?
                        iff(ifCondition, authorizationLogic) :
                        authorizationLogic
                ),
                resolver.Properties.RequestMappingTemplate
            ]
            // if protect is for field and there is a subscription for update / delete then protect the field in that operation
            if (field && operation &&
                modelConfiguration.shouldHave(operation) &&
                modelConfiguration.getName('level') as ModelSubscriptionLevel === 'on') {
                const operationExpression = this.resources.setOperationExpression(operation);
                const getTemplateParts = [
                    print(operationExpression),
                    resolver.Properties.ResponseMappingTemplate,
                ];
                resolver.Properties.ResponseMappingTemplate = getTemplateParts.join('\n\n')
            }
            resolver.Properties.RequestMappingTemplate = templateParts.join('\n\n')
            ctx.setResource(resolverResourceId, resolver)
        }
    }

    /**
     * If we are protecting the mutation for a field level @auth directive, include
     * the necessary if condition.
     * @param ctx The transformer context
     * @param resolverResourceId The resolver resource id
     * @param rules The delete rules
     * @param parent The parent object
     * @param field The optional field
     */
    private protectUpdateMutation(
        ctx: TransformerContext, resolverResourceId: string,
        rules: AuthRule[], parent: ObjectTypeDefinitionNode,
        modelConfiguration: ModelDirectiveConfiguration, field?: FieldDefinitionNode,
        operation?: ModelDirectiveOperationType,
    ) {
        return this.protectUpdateOrDeleteMutation(
            ctx, resolverResourceId, rules, parent, modelConfiguration, field,
            field ? raw(`$ctx.args.input.containsKey("${field.name.value}")`) : undefined, operation
        );
    }

    /**
     * If we are protecting the mutation for a field level @auth directive, include
     * the necessary if condition.
     * @param ctx The transformer context
     * @param resolverResourceId The resolver resource id
     * @param rules The delete rules
     * @param parent The parent object
     * @param field The optional field
     */
    private protectDeleteMutation(
        ctx: TransformerContext, resolverResourceId: string,
        rules: AuthRule[], parent: ObjectTypeDefinitionNode,
        modelConfiguration: ModelDirectiveConfiguration, field?: FieldDefinitionNode,
        operation?: ModelDirectiveOperationType
    ) {
        return this.protectUpdateOrDeleteMutation(
            ctx, resolverResourceId, rules, parent, modelConfiguration, field,
            field ? raw(`$ctx.args.input.containsKey("${field.name.value}") && $util.isNull($ctx.args.input.get("${field.name.value}"))`) : undefined,
            operation
        )
    }

    /**
     * When read operations are protected via @auth, all @connection resolvers will be protected.
     * Find the directives & update their resolvers with auth logic
     */
    private protectConnections(ctx: TransformerContext, def: ObjectTypeDefinitionNode, rules: AuthRule[]) {
        const thisModelName = def.name.value;
        for (const inputDef of ctx.inputDocument.definitions) {
            if (inputDef.kind === Kind.OBJECT_TYPE_DEFINITION) {
                for (const field of inputDef.fields) {
                    const returnTypeName = getBaseType(field.type)
                    if (fieldHasDirective(field, 'connection') && returnTypeName === thisModelName) {
                        const resolverResourceId = ResolverResourceIDs.ResolverResourceID(inputDef.name.value, field.name.value)
                        if (isListType(field.type)) {
                            this.protectListQuery(ctx, resolverResourceId, rules)
                        } else {
                            this.protectGetQuery(ctx, resolverResourceId, rules)
                        }
                    }
                }
            }
        }
    }

    /**
     * When read operations are protected via @auth, all secondary @key query resolvers will be protected.
     * Find the directives & update their resolvers with auth logic
     */
    private protectQueries(ctx: TransformerContext, def: ObjectTypeDefinitionNode, rules: AuthRule[]) {
        const secondaryKeyDirectivesWithQueries = (def.directives || []).filter(d => {
            const isKey = d.name.value === 'key';
            const args = getDirectiveArguments(d);
            // @key with a name is a secondary key.
            const isSecondaryKey = Boolean(args.name);
            const hasQueryField = Boolean(args.queryField);
            return isKey && isSecondaryKey && hasQueryField;
        });
        for (const keyWithQuery of secondaryKeyDirectivesWithQueries) {
            const args = getDirectiveArguments(keyWithQuery);
            const resolverResourceId = ResolverResourceIDs.ResolverResourceID(ctx.getQueryTypeName(), args.queryField);
            this.protectListQuery(ctx, resolverResourceId, rules)
        }
    }

    // OnCreate Subscription
    private protectOnCreateSubscription(ctx: TransformerContext, rules: AuthRule[],
        parent: ObjectTypeDefinitionNode, modelConfiguration: ModelDirectiveConfiguration) {
        const names = modelConfiguration.getNames('onCreate');
        const level = modelConfiguration.getName('level') as ModelSubscriptionLevel;
        if (names) {
            names.forEach( (name) => {
                this.addSubscriptionResolvers(ctx, rules, parent, level, name)
            })
        }
    }

    // OnUpdate Subscription
    private protectOnUpdateSubscription(ctx: TransformerContext, rules: AuthRule[],
        parent: ObjectTypeDefinitionNode, modelConfiguration: ModelDirectiveConfiguration) {
        const names = modelConfiguration.getNames('onUpdate');
        const level = modelConfiguration.getName('level') as ModelSubscriptionLevel;
        if (names) {
            names.forEach( (name) => {
                this.addSubscriptionResolvers(ctx, rules, parent, level, name)
            })
        }
    }

    // OnDelete Subscription
    private protectOnDeleteSubscription(ctx: TransformerContext, rules: AuthRule[],
        parent: ObjectTypeDefinitionNode, modelConfiguration: ModelDirectiveConfiguration) {
        const names = modelConfiguration.getNames('onDelete');
        const level = modelConfiguration.getName('level') as ModelSubscriptionLevel;
        if (names) {
            names.forEach( (name) => {
                this.addSubscriptionResolvers(ctx, rules, parent, level, name)
            })
        }
    }

    // adds subscription resolvers (request / response) based on the operation provided
    private addSubscriptionResolvers(ctx: TransformerContext, rules: AuthRule[],
        parent: ObjectTypeDefinitionNode, level: ModelSubscriptionLevel, fieldName: string) {
        const resolverResourceId = ResolverResourceIDs.ResolverResourceID("Subscription", fieldName);
        const resolver = this.resources.generateSubscriptionResolver(fieldName);
        // If the data source does not exist it is created and added as a resource for public && on levels
        const noneDS = ctx.getResource(ResourceConstants.RESOURCES.NoneDataSource)

        // add the rules in the subscription resolver
        if (!rules || rules.length === 0) {
            return;
        } else if (level === 'public') {
            // set the resource with no auth logic
            ctx.setResource(resolverResourceId, resolver);
        } else {
            // Break the rules out by strategy.
            const staticGroupAuthorizationRules = this.getStaticGroupRules(rules);
            const ownerAuthorizationRules = this.getOwnerRules(rules);

            const staticGroupAuthorizationExpression = this.resources.staticGroupAuthorizationExpression(
                staticGroupAuthorizationRules);
            const ownerAuthorizationExpression = this.resources.ownerAuthorizationExpressionForSubscriptions(
                ownerAuthorizationRules);

            const throwIfUnauthorizedExpression = this.resources.throwIfSubscriptionUnauthorized();
            const templateParts = [
                print(
                    compoundExpression([
                        staticGroupAuthorizationExpression,
                        newline(),
                        ownerAuthorizationExpression,
                        newline(),
                        throwIfUnauthorizedExpression
                    ])
                ),
                resolver.Properties.ResponseMappingTemplate
            ];
            resolver.Properties.ResponseMappingTemplate = templateParts.join('\n\n');
            ctx.setResource(resolverResourceId, resolver);

                // check if owner is enabled in auth
            const hasOwner = rules.find( rule => rule.allow === OWNER_AUTH_STRATEGY && !rule.ownerField);
            const hasStaticGroupAuth = rules.find( rule => rule.allow === GROUPS_AUTH_STRATEGY && !rule.groupsField);
            if (hasOwner) {
                this.addOwner(ctx, parent.name.value);
                // If static group is specified in any of the rules then it would specify the owner arg as optional
                if (hasStaticGroupAuth) {
                    this.addSubscriptionOwnerArgument(ctx, resolver, false)
                } else {
                    this.addSubscriptionOwnerArgument(ctx, resolver, true)
                }
            }
        }
        // If the subscription level is set to public it adds the subscription resolver with no auth logic
        if (!noneDS) {
            ctx.setResource(ResourceConstants.RESOURCES.NoneDataSource, this.resources.noneDataSource())
        }
        // finally map the resource to the stack
        ctx.mapResourceToStack(parent.name.value, resolverResourceId);
    }

    private addSubscriptionOwnerArgument(ctx: TransformerContext, resolver: Resolver, makeNonNull: boolean = false) {
        let subscription = ctx.getSubscription();
        let createField: FieldDefinitionNode = subscription.fields.find(
            field => field.name.value === resolver.Properties.FieldName,
            ) as FieldDefinitionNode;
        const nameNode: any = makeNonNull ? makeNonNullType(makeNamedType('String')) : makeNamedType('String');
        const createArguments = [makeInputValueDefinition(DEFAULT_OWNER_FIELD, nameNode)];
        createField = {
            ...createField,
            arguments: createArguments,
        };
        subscription = {
            ...subscription,
            fields: subscription.fields.map(
                field => field.name.value === resolver.Properties.FieldName ? createField : field,
            ),
        };
        ctx.putType(subscription);
    }

    private addOwner(ctx: TransformerContext, parent: string) {
        const modelType: any = ctx.getType(parent);
        const fields = getFieldArguments(modelType);
        if (!("owner" in fields)) {
            modelType.fields.push(
                makeField(
                    DEFAULT_OWNER_FIELD,
                    [],
                    makeNamedType('String'),
                )
            )
        }
        ctx.putType(modelType);
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

    private getAuthRulesFromDirective(directive: DirectiveNode): AuthRule[] {
        const get = (s: string) => (arg: ArgumentNode) => arg.name.value === s
        const getArg = (arg: string, dflt?: any) => {
            const argument = directive.arguments.find(get(arg))
            return argument ? valueFromASTUntyped(argument.value) : dflt
        }

        // Get and validate the auth rules.
        return getArg('rules', []) as AuthRule[];
    }

}

function fieldHasDirective(field: FieldDefinitionNode, directiveName: string): boolean {
    return field.directives && field.directives.length && Boolean(field.directives.find(
        (d: DirectiveNode) => d.name.value === directiveName
    ))
}

function isTruthyOrNull(obj: any): boolean {
    return obj || obj === null;
}
function isUndefined(obj: any): boolean {
    return obj === undefined;
}