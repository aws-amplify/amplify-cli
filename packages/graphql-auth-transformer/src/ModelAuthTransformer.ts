import { Transformer, TransformerContext, InvalidDirectiveError, gql, getDirectiveArguments } from 'graphql-transformer-core'
import GraphQLAPI from 'cloudform-types/types/appSync/graphQlApi'
import { StringParameter } from 'cloudform-types';
import { ResourceFactory } from './resources'
import { AuthRule, ModelQuery, ModelMutation, ModelOperation, AuthProvider } from './AuthRule'
import {
    ObjectTypeDefinitionNode, DirectiveNode, ArgumentNode, Kind,
    FieldDefinitionNode, InterfaceTypeDefinitionNode, valueFromASTUntyped
} from 'graphql'
import { ResourceConstants, ResolverResourceIDs, isListType, getBaseType, makeDirective,
    blankObjectExtension, extensionWithDirectives, extendFieldWithDirectives } from 'graphql-transformer-common'
import {
    Expression, print, raw, iff, equals, forEach, set, ref, list, compoundExpression, or, newline,
    comment
} from 'graphql-mapping-template';
import { ModelDirectiveConfiguration, ModelDirectiveOperationType } from './ModelDirectiveConfiguration';

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
 * createPost - We automatically insert an "owner" field to attribute values where "owner" === $ctx.identity.username.
 * updatePost - Expose "owner" field in input/output and would set conditional update expression to look for owner.
 * deletePost - Conditional expression checking that the owner === $ctx.identity.username
 *
 * Note: The name of the "owner" field may be configured via "ownerField" parameter within the @auth directive.
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
export type AppSyncAuthMode = 'API_KEY' | 'AMAZON_COGNITO_USER_POOLS' | 'AWS_IAM' | 'OPENID_CONNECT';
export type AppSyncAuthConfiguration = {
    defaultAuthentication: AppSyncAuthConfigurationEntry
    additionalAuthenticationProviders: Array<AppSyncAuthConfigurationEntry>
};
export type AppSyncAuthConfigurationEntry = {
    authenticationType: AppSyncAuthMode
    apiKeyConfig?: ApiKeyConfig
    userPoolConfig?: UserPoolConfig
    openIDConnectConfig?: OpenIDConnectConfig
}
export type ApiKeyConfig = {
    description?: string
    apiKeyExpirationDays: number
};
export type UserPoolConfig = {
    userPoolId: string
};
export type OpenIDConnectConfig = {
    name: string
    issuerUrl: string
    clientId?: string
    iatTTL?: number
    authTTL?: number
};

const validateAuthModes = (authConfig: AppSyncAuthConfiguration) => {
    let additionalAuthModes = [];

    if (authConfig.additionalAuthenticationProviders) {
        additionalAuthModes = authConfig.additionalAuthenticationProviders.map(p => p.authenticationType).filter(t => !!t);
    }

    const authModes: AppSyncAuthMode[] = [...additionalAuthModes, authConfig.defaultAuthentication.authenticationType];

    for (let i = 0; i < authModes.length; i++) {
        const mode = authModes[i];

        if (
            mode !== 'API_KEY' &&
            mode !== 'AMAZON_COGNITO_USER_POOLS' &&
            mode !== 'AWS_IAM' &&
            mode !== 'OPENID_CONNECT'
        ) {
            throw new Error(`Invalid auth mode ${mode}`);
        }
    }
}

export type ModelAuthTransformerConfig = {
    authConfig?: AppSyncAuthConfiguration
};

export type ConfiguredAuthProviders = {
    default: AuthProvider,
    onlyDefaultAuthProviderConfigured: boolean,
    hasApiKey: boolean,
    hasUserPools: boolean,
    hasOIDC: boolean,
    hasIAM: boolean
};

export class ModelAuthTransformer extends Transformer {
    resources: ResourceFactory;
    config: ModelAuthTransformerConfig;
    configuredAuthProviders: ConfiguredAuthProviders;
    generateIAMPolicyforUnauthRole: boolean;

    constructor(config?: ModelAuthTransformerConfig) {
        super(
            'ModelAuthTransformer',
            gql`
            directive @auth(rules: [AuthRule!]!) on OBJECT | FIELD_DEFINITION
            input AuthRule {
                # Specifies the auth rule's strategy. Allowed values are 'owner', 'groups', 'public', 'private'.
                allow: AuthStrategy!

                # Specifies the name of the provider to use for the rule. This overrides the default provider
                # when 'public' and 'private' AuthStrategy is used. Specifying a provider for 'owner' or 'groups'
                # are not allowed.
                provider: AuthProvider

                # Specifies the name of the claim to look for on the request's JWT token
                # from Cognito User Pools (and in the future OIDC) that contains the identity
                # of the user. If 'allow' is 'groups', this value should point to a list of groups
                # in the claims. If 'allow' is 'owner', this value should point to the logged in user identity string.
                # Defaults to "cognito:username" for Cognito User Pools auth.
                identityField: String

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
            enum AuthStrategy { owner groups private public }
            enum AuthProvider { apiKey iam oidc userPools }
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

        if (config && config.authConfig) {
            this.config = config;
        } else {
            this.config = { authConfig: { defaultAuthentication: { authenticationType: 'API_KEY' }, additionalAuthenticationProviders: [] } };
        }
        validateAuthModes(this.config.authConfig);
        this.resources = new ResourceFactory();
        this.configuredAuthProviders = this.getConfiguredAuthProviders();
        this.generateIAMPolicyforUnauthRole = false;
    }

    /**
     * Updates the GraphQL API record with configured authentication providers
     */
    private updateAPIAuthentication = (ctx: TransformerContext): void => {
        const apiRecord = ctx.getResource(ResourceConstants.RESOURCES.GraphQLAPILogicalID) as GraphQLAPI;
        const updated = this.resources.updateGraphQLAPIWithAuth(apiRecord, this.config.authConfig);
        ctx.setResource(ResourceConstants.RESOURCES.GraphQLAPILogicalID, updated);

        // Check if we need to create an API key resource or not.
    }

    public before = (ctx: TransformerContext): void => {
        const template = this.resources.initTemplate(this.getApiKeyConfig());
        ctx.mergeResources(template.Resources)
        ctx.mergeParameters(template.Parameters)
        ctx.mergeOutputs(template.Outputs)
        ctx.mergeConditions(template.Conditions)
        this.updateAPIAuthentication(ctx)
    }

    public after = (ctx: TransformerContext): void => {
        if (this.generateIAMPolicyforUnauthRole === true) {
            ctx.mergeParameters({
                [ResourceConstants.PARAMETERS.UnauthRoleName]: new StringParameter({
                    Description: 'Reference to the name of the Unauth Role created for the project.'
                }),
            });

            ctx.mergeResources(
                {
                    [ResourceConstants.RESOURCES.UnauthRolePolicy]:
                    this.resources.makeIAMPolicyforUnauthRole()
                }
            );
        }
    }

    private getApiKeyConfig(): ApiKeyConfig {
        const authProviders = [];

        if (this.config.authConfig.additionalAuthenticationProviders) {
            authProviders.concat (this.config.authConfig.additionalAuthenticationProviders.filter(p => !!p.authenticationType));
        }

        authProviders.push(this.config.authConfig.defaultAuthentication);

        const apiKeyAuthProvider = authProviders.find(p => p.authenticationType === 'API_KEY');

        // Return the found instance or a default instance with 180 days of API key expiration
        return apiKeyAuthProvider ? apiKeyAuthProvider.apiKeyConfig : { apiKeyExpirationDays: 180 };
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

        // Get and validate the auth rules.
        const rules = getArg('rules', []) as AuthRule[]
        this.ensureDefaultAuthProviderAssigned(rules);
        this.validateRules(rules);
        this.setUnauthPolicyFlag(rules);

        const { operationRules, queryRules } = this.splitRules(rules);

        const modelConfiguration = new ModelDirectiveConfiguration (modelDirective, def);
        // Get the directives we need to add to the GraphQL nodes
        const directives = this.getDirectivesForRules(rules);

        // Add the directives to the Type node itself
        this.extendTypeWithDirectives(ctx, def.name.value, directives);

        // For each operation evaluate the rules and apply the changes to the relevant resolver.
        this.protectCreateMutation(ctx, ResolverResourceIDs.DynamoDBCreateResolverResourceID(def.name.value), operationRules.create, def,
            modelConfiguration);
        this.protectUpdateMutation(ctx, ResolverResourceIDs.DynamoDBUpdateResolverResourceID(def.name.value), operationRules.update, def,
            modelConfiguration);
        this.protectDeleteMutation(ctx, ResolverResourceIDs.DynamoDBDeleteResolverResourceID(def.name.value), operationRules.delete, def,
            modelConfiguration);
        this.protectGetQuery(ctx, ResolverResourceIDs.DynamoDBGetResolverResourceID(def.name.value), queryRules.get, modelConfiguration);
        this.protectListQuery(ctx, ResolverResourceIDs.DynamoDBListResolverResourceID(def.name.value), queryRules.list, modelConfiguration);
        this.protectConnections(ctx, def, operationRules.read, modelConfiguration);
        this.protectQueries(ctx, def, operationRules.read, modelConfiguration);
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
        const modelConfiguration = new ModelDirectiveConfiguration (modelDirective, parent);

        const get = (s: string) => (arg: ArgumentNode) => arg.name.value === s
        const getArg = (arg: string, dflt?: any) => {
            const argument = directive.arguments.find(get(arg))
            return argument ? valueFromASTUntyped(argument.value) : dflt
        }

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
        const rules = getArg('rules', []) as AuthRule[]
        this.ensureDefaultAuthProviderAssigned(rules);
        this.validateFieldRules(rules);
        this.setUnauthPolicyFlag(rules);

        // Add the directives to the parent type as well, but default must be included
        // in propagation
        const typeDirectives = this.getDirectivesForRules(rules);

        if (typeDirectives.length > 0) {
            this.extendTypeWithDirectives(ctx, parent.name.value, typeDirectives);
        }

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
        this.protectReadForField(ctx, parent.name.value, definition.name.value, readRules, modelConfiguration)

        // Protect mutations when objects including this field are trying to be created.
        const createRules = rules.filter((rule: AuthRule) => isCreateRule(rule))
        this.protectCreateForField(ctx, parent, definition, createRules, modelConfiguration)

        // Protect update mutations when objects inluding this field are trying to be updated.
        const updateRules = rules.filter((rule: AuthRule) => isUpdateRule(rule))
        this.protectUpdateForField(ctx, parent, definition, updateRules, modelConfiguration)

        // Delete operations are only protected by @auth directives on objects.
        const deleteRules = rules.filter((rule: AuthRule) => isDeleteRule(rule))
        this.protectDeleteForField(ctx, parent, definition, deleteRules, modelConfiguration)
    }

    private protectReadForField(ctx: TransformerContext, typeName: string, fieldName: string, rules: AuthRule[],
        modelConfiguration: ModelDirectiveConfiguration) {
        if (rules && rules.length) {

            const directives = this.getDirectivesForRules(rules, false);

            if (directives.length > 0) {
                this.addDirectivesToField(ctx, typeName, fieldName, directives);
            }

            if (modelConfiguration.shouldHave('get')) {
                const operationName = modelConfiguration.getName('get');
                const operationDirectives = this.getDirectivesForRules(rules);

                if (operationDirectives.length > 0) {
                    this.addDirectivesToField(ctx, ctx.getQueryTypeName(), operationName, operationDirectives);
                }
            }

            if (modelConfiguration.shouldHave('list')) {
                const operationName = modelConfiguration.getName('list');
                const operationDirectives = this.getDirectivesForRules(rules);

                if (operationDirectives.length > 0) {
                    this.addDirectivesToField(ctx, ctx.getQueryTypeName(), operationName, operationDirectives);
                }
            }

            const resolverResourceId = ResolverResourceIDs.ResolverResourceID(typeName, fieldName);
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
                resolver = this.resources.blankResolver(typeName, fieldName)
            }
            const authExpression = this.authorizationExpressionOnSingleObject(rules, 'ctx.source')
            // If a resolver exists, a @connection for example. Prepend it to the req.
            const templateParts = [
                print(authExpression),
                resolver.Properties.RequestMappingTemplate
            ]
            resolver.Properties.RequestMappingTemplate = templateParts.join('\n\n')
            ctx.setResource(resolverResourceId, resolver)
        }
    }

    private protectUpdateForField(ctx: TransformerContext, parent: ObjectTypeDefinitionNode, field: FieldDefinitionNode, rules: AuthRule[],
        modelConfiguration: ModelDirectiveConfiguration) {
        const resolverResourceId = ResolverResourceIDs.DynamoDBUpdateResolverResourceID(parent.name.value);
        this.protectUpdateMutation(ctx, resolverResourceId, rules, parent, modelConfiguration, field)
    }

    private protectDeleteForField(ctx: TransformerContext, parent: ObjectTypeDefinitionNode, field: FieldDefinitionNode, rules: AuthRule[],
        modelConfiguration: ModelDirectiveConfiguration) {
        const resolverResourceId = ResolverResourceIDs.DynamoDBUpdateResolverResourceID(parent.name.value);
        this.protectDeleteMutation(ctx, resolverResourceId, rules, parent, modelConfiguration, field)
    }

    /**
     * Protects a create mutation based on an @auth rule specified on a @model field.
     * @param ctx The context.
     * @param typeName The parent type name.
     * @param fieldName The name of the field with the @auth directive.
     * @param rules The set of rules that should be applied to create operations.
     */
    private protectCreateForField(ctx: TransformerContext, parent: ObjectTypeDefinitionNode, field: FieldDefinitionNode, rules: AuthRule[],
        modelConfiguration: ModelDirectiveConfiguration) {
        const typeName = parent.name.value;
        const resolverResourceId = ResolverResourceIDs.DynamoDBCreateResolverResourceID(typeName);
        const createResolverResource = ctx.getResource(resolverResourceId);
        if (rules && rules.length && createResolverResource) {

            const directives = this.getDirectivesForRules(rules, false);

            if (directives.length > 0) {
                this.addDirectivesToField(ctx, typeName, field.name.value, directives);

                if (modelConfiguration.shouldHave('create')) {
                    const operationName = modelConfiguration.getName('create');
                    const operationDirectives = this.getDirectivesForRules(rules);

                    if (operationDirectives.length > 0) {
                        this.addDirectivesToField(ctx, ctx.getMutationTypeName(), operationName, operationDirectives);
                    }
                }
            }

            // Break the rules out by strategy.
            const staticGroupAuthorizationRules = this.getStaticGroupRules(rules)
            const dynamicGroupAuthorizationRules = this.getDynamicGroupRules(rules)
            const ownerAuthorizationRules = this.getOwnerRules(rules)

            if (staticGroupAuthorizationRules.length > 0 ||
                dynamicGroupAuthorizationRules.length > 0 ||
                ownerAuthorizationRules.length > 0) {

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

                const authModesToCheck = new Set<AuthProvider>();
                const expressions: Array<Expression> = new Array();

                if (ownerAuthorizationRules.find((r) => r.provider === 'userPools') ||
                    staticGroupAuthorizationRules.length > 0 ||
                    dynamicGroupAuthorizationRules.length > 0) {
                    authModesToCheck.add('userPools');
                }
                if (ownerAuthorizationRules.find((r) => r.provider === 'oidc')) {
                    authModesToCheck.add('oidc');
                }

                if (authModesToCheck.size > 0) {
                    expressions.push (this.resources.getAuthModeDeterminationExpression(authModesToCheck));
                }

                const authCheckExpressions = [
                    staticGroupAuthorizationExpression,
                    newline(),
                    dynamicGroupAuthorizationExpression,
                    newline(),
                    ownerAuthorizationExpression,
                    newline(),
                    throwIfUnauthorizedExpression
                ];

                expressions.push(
                    this.resources.getAuthModeCheckWrappedExpression(
                        authModesToCheck,
                        compoundExpression(authCheckExpressions))
                );

                const templateParts = [
                    print(
                        iff(
                            raw(`$ctx.args.input.containsKey("${field.name.value}")`),
                            compoundExpression(expressions)
                        )
                    ),
                    createResolverResource.Properties.RequestMappingTemplate
                ]
                createResolverResource.Properties.RequestMappingTemplate = templateParts.join('\n\n')
                ctx.setResource(resolverResourceId, createResolverResource)
            }
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

            this.validateRuleAuthStrategy(rule);

            const { queries, mutations, operations } = rule;
            if (mutations && operations) {
                console.warn(
                    `It is not recommended to use 'mutations' and 'operations'. The 'operations' argument will be used.`)
            }
            if (queries && operations) {
                console.warn(
                    `It is not recommended to use 'queries' and 'operations'. The 'operations' argument will be used.`)
            }
        }
    }

    private validateFieldRules(rules: AuthRule[]) {
        for (const rule of rules) {

            this.validateRuleAuthStrategy(rule);

            const { queries, mutations } = rule;
            if (queries || mutations) {
                throw new InvalidDirectiveError(
                    `@auth directives used on field definitions may not specify the 'queries' or 'mutations' arguments. \
All @auth directives used on field definitions are performed when the field is resolved and can be thought of as 'read' operations.`)
            }
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
    private protectGetQuery(ctx: TransformerContext, resolverResourceId: string, rules: AuthRule[],
        modelConfiguration: ModelDirectiveConfiguration) {

        const resolver = ctx.getResource(resolverResourceId)
        if (!rules || rules.length === 0 || !resolver) {
            return
        } else {

            if (modelConfiguration.shouldHave('get')) {
                const operationName = modelConfiguration.getName('get');
                const directives = this.getDirectivesForRules(rules);

                if (directives.length > 0) {
                    this.addDirectivesToField(ctx, ctx.getQueryTypeName(), operationName, directives);
                }
            }

            const authExpression = this.authorizationExpressionOnSingleObject(rules);

            if (authExpression) {
                const templateParts = [
                    print(authExpression),
                    resolver.Properties.ResponseMappingTemplate
                ]
                resolver.Properties.ResponseMappingTemplate = templateParts.join('\n\n')
                ctx.setResource(resolverResourceId, resolver)
            }
        }
    }

    private authorizationExpressionOnSingleObject(rules: AuthRule[], objectPath: string = 'ctx.result') {
        // Break the rules out by strategy.
        const staticGroupAuthorizationRules = this.getStaticGroupRules(rules)
        const dynamicGroupAuthorizationRules = this.getDynamicGroupRules(rules)
        const ownerAuthorizationRules = this.getOwnerRules(rules)

        if (staticGroupAuthorizationRules.length > 0 ||
            dynamicGroupAuthorizationRules.length > 0 ||
            ownerAuthorizationRules.length > 0) {

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

            const authModesToCheck = new Set<AuthProvider>();
            const expressions: Array<Expression> = new Array();

            if (ownerAuthorizationRules.find((r) => r.provider === 'userPools') ||
                staticGroupAuthorizationRules.length > 0 ||
                dynamicGroupAuthorizationRules.length > 0) {
                authModesToCheck.add('userPools');
            }
            if (ownerAuthorizationRules.find((r) => r.provider === 'oidc')) {
                authModesToCheck.add('oidc');
            }

            if (authModesToCheck.size > 0) {
                expressions.push (this.resources.getAuthModeDeterminationExpression(authModesToCheck));
            }

            // Update the existing resolver with the authorization checks.
            const templateExpressions = [
                staticGroupAuthorizationExpression,
                newline(),
                dynamicGroupAuthorizationExpression,
                newline(),
                ownerAuthorizationExpression,
                newline(),
                throwIfUnauthorizedExpression
            ];

            expressions.push(
                this.resources.getAuthModeCheckWrappedExpression(
                    authModesToCheck,
                    compoundExpression(templateExpressions))
            );

            return compoundExpression(expressions);
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
    private protectListQuery(ctx: TransformerContext, resolverResourceId: string, rules: AuthRule[],
        modelConfiguration: ModelDirectiveConfiguration) {

        const resolver = ctx.getResource(resolverResourceId)
        if (!rules || rules.length === 0 || !resolver) {
            return
        } else {

            if (modelConfiguration.shouldHave('list')) {
                const operationName = modelConfiguration.getName('list');
                const directives = this.getDirectivesForRules(rules);

                if (directives.length > 0) {
                    this.addDirectivesToField(ctx, ctx.getQueryTypeName(), operationName, directives);
                }
            }

            const authExpression = this.authorizationExpressionForListResult(rules);

            if (authExpression) {
                const templateParts = [
                    print(authExpression),
                    resolver.Properties.ResponseMappingTemplate
                ]
                resolver.Properties.ResponseMappingTemplate = templateParts.join('\n\n')
                ctx.setResource(resolverResourceId, resolver)
            }
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

        if (staticGroupAuthorizationRules.length > 0 ||
            dynamicGroupAuthorizationRules.length > 0 ||
            ownerAuthorizationRules.length > 0) {

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

            const authModesToCheck = new Set<AuthProvider>();
            const expressions: Array<Expression> = new Array();

            if (ownerAuthorizationRules.find((r) => r.provider === 'userPools') ||
                staticGroupAuthorizationRules.length > 0 ||
                dynamicGroupAuthorizationRules.length > 0) {
                authModesToCheck.add('userPools');
            }
            if (ownerAuthorizationRules.find((r) => r.provider === 'oidc')) {
                authModesToCheck.add('oidc');
            }

            if (authModesToCheck.size > 0) {
                expressions.push (this.resources.getAuthModeDeterminationExpression(authModesToCheck));
            }

            const templateExpressions = [
                staticGroupAuthorizationExpression,
                newline(),
                comment('[Start] If not static group authorized, filter items'),
                ifNotStaticallyAuthedFilterObjects,
                comment('[End] If not static group authorized, filter items')
            ];

            expressions.push(
                this.resources.getAuthModeCheckWrappedExpression(
                    authModesToCheck,
                    compoundExpression(templateExpressions))
            );

            return compoundExpression(expressions);
        }
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
        parent: ObjectTypeDefinitionNode,
        modelConfiguration: ModelDirectiveConfiguration
    ) {
        const resolver = ctx.getResource(resolverResourceId)
        if (!rules || rules.length === 0 || !resolver) {
            return
        } else {

            if (modelConfiguration.shouldHave('create')) {
                const operationName = modelConfiguration.getName('create');
                const directives = this.getDirectivesForRules(rules);

                if (directives.length > 0) {
                    this.addDirectivesToField(ctx, ctx.getMutationTypeName(), operationName, directives);
                }
            }

            // Break the rules out by strategy.
            const staticGroupAuthorizationRules = this.getStaticGroupRules(rules)
            const dynamicGroupAuthorizationRules = this.getDynamicGroupRules(rules)
            const ownerAuthorizationRules = this.getOwnerRules(rules)

            if (staticGroupAuthorizationRules.length > 0 ||
                dynamicGroupAuthorizationRules.length > 0 ||
                ownerAuthorizationRules.length > 0) {

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

                const throwIfUnauthorizedExpression = this.resources.throwIfUnauthorized();

                const authModesToCheck = new Set<AuthProvider>();
                const expressions: Array<Expression> = new Array();

                if (ownerAuthorizationRules.find((r) => r.provider === 'userPools') ||
                    staticGroupAuthorizationRules.length > 0 ||
                    dynamicGroupAuthorizationRules.length > 0) {
                    authModesToCheck.add('userPools');
                }
                if (ownerAuthorizationRules.find((r) => r.provider === 'oidc')) {
                    authModesToCheck.add('oidc');
                }

                if (authModesToCheck.size > 0) {
                    expressions.push (this.resources.getAuthModeDeterminationExpression(authModesToCheck));
                }

                const authCheckExpressions = [
                    staticGroupAuthorizationExpression,
                    newline(),
                    dynamicGroupAuthorizationExpression,
                    newline(),
                    ownerAuthorizationExpression,
                    newline(),
                    throwIfUnauthorizedExpression
                ];

                expressions.push(
                    this.resources.getAuthModeCheckWrappedExpression(
                        authModesToCheck,
                        compoundExpression(authCheckExpressions))
                );

                const templateParts = [
                    print(compoundExpression(expressions)),
                    resolver.Properties.RequestMappingTemplate
                ]
                resolver.Properties.RequestMappingTemplate = templateParts.join('\n\n')
                ctx.setResource(resolverResourceId, resolver)
            }
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
        isUpdate: boolean,
        field?: FieldDefinitionNode,
        ifCondition?: Expression,
    ) {
        const resolver = ctx.getResource(resolverResourceId)
        if (!rules || rules.length === 0 || !resolver) {
            return
        } else {

            if (modelConfiguration.shouldHave(isUpdate ? 'update' : 'delete')) {
                const operationName = modelConfiguration.getName(isUpdate ? 'update' : 'delete');
                const directives = this.getDirectivesForRules(rules);

                if (directives.length > 0) {
                    this.addDirectivesToField(ctx, ctx.getMutationTypeName(), operationName, directives);
                }
            }

            // Break the rules out by strategy.
            const staticGroupAuthorizationRules = this.getStaticGroupRules(rules)
            const dynamicGroupAuthorizationRules = this.getDynamicGroupRules(rules)
            const ownerAuthorizationRules = this.getOwnerRules(rules)

            if (staticGroupAuthorizationRules.length > 0 ||
                dynamicGroupAuthorizationRules.length > 0 ||
                ownerAuthorizationRules.length > 0) {

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

                const authModesToCheck = new Set<AuthProvider>();
                const expressions: Array<Expression> = new Array();

                if (ownerAuthorizationRules.find((r) => r.provider === 'userPools') ||
                    staticGroupAuthorizationRules.length > 0 ||
                    dynamicGroupAuthorizationRules.length > 0) {
                    authModesToCheck.add('userPools');
                }
                if (ownerAuthorizationRules.find((r) => r.provider === 'oidc')) {
                    authModesToCheck.add('oidc');
                }

                if (authModesToCheck.size > 0) {
                    expressions.push (this.resources.getAuthModeDeterminationExpression(authModesToCheck));
                }

                const authorizationLogic = compoundExpression([
                    staticGroupAuthorizationExpression,
                    newline(),
                    ifNotStaticallyAuthedCreateAuthCondition,
                    newline(),
                    throwIfNotStaticGroupAuthorizedOrAuthConditionIsEmpty
                ]);

                expressions.push(
                    this.resources.getAuthModeCheckWrappedExpression(
                        authModesToCheck,
                        authorizationLogic)
                );

                const templateParts = [
                    print(field && ifCondition ?
                        iff(ifCondition, compoundExpression(expressions)) :
                        compoundExpression(expressions)),
                    resolver.Properties.RequestMappingTemplate
                ]
                resolver.Properties.RequestMappingTemplate = templateParts.join('\n\n')
                ctx.setResource(resolverResourceId, resolver)
            }
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
        modelConfiguration: ModelDirectiveConfiguration,
        field?: FieldDefinitionNode
    ) {
        return this.protectUpdateOrDeleteMutation(
            ctx, resolverResourceId, rules, parent, modelConfiguration, true, field,
            field ? raw(`$ctx.args.input.containsKey("${field.name.value}")`) : undefined
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
        modelConfiguration: ModelDirectiveConfiguration,
        field?: FieldDefinitionNode,
    ) {
        return this.protectUpdateOrDeleteMutation(
            ctx, resolverResourceId, rules, parent, modelConfiguration, false, field,
            field ? raw(`$ctx.args.input.containsKey("${field.name.value}") && $util.isNull($ctx.args.input.get("${field.name.value}"))`) : undefined
        )
    }

    /**
     * When read operations are protected via @auth, all @connection resolvers will be protected.
     * Find the directives & update their resolvers with auth logic
     */
    private protectConnections(ctx: TransformerContext, def: ObjectTypeDefinitionNode, rules: AuthRule[],
        modelConfiguration: ModelDirectiveConfiguration) {
        const thisModelName = def.name.value;
        for (const inputDef of ctx.inputDocument.definitions) {
            if (inputDef.kind === Kind.OBJECT_TYPE_DEFINITION) {
                for (const field of inputDef.fields) {
                    const returnTypeName = getBaseType(field.type)
                    if (fieldHasDirective(field, 'connection') && returnTypeName === thisModelName) {
                        const resolverResourceId = ResolverResourceIDs.ResolverResourceID(inputDef.name.value, field.name.value)
                        if (isListType(field.type)) {
                            this.protectListQuery(ctx, resolverResourceId, rules, modelConfiguration)
                        } else {
                            this.protectGetQuery(ctx, resolverResourceId, rules, modelConfiguration)
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
    private protectQueries(ctx: TransformerContext, def: ObjectTypeDefinitionNode, rules: AuthRule[],
        modelConfiguration: ModelDirectiveConfiguration) {
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
            this.protectListQuery(ctx, resolverResourceId, rules, modelConfiguration)
        }
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

    private extendTypeWithDirectives(ctx: TransformerContext, typeName: string, directives: DirectiveNode[]) {
        let objectTypeExtension = blankObjectExtension(typeName);

        objectTypeExtension = extensionWithDirectives(
            objectTypeExtension,
            directives
        );

        ctx.addObjectExtension(objectTypeExtension);
    }

    private addDirectivesToField(ctx: TransformerContext, typeName: string, fieldName: string, directives: DirectiveNode[]) {
        const type = ctx.getType(typeName) as ObjectTypeDefinitionNode;

        if (type) {
            const field = type.fields.find((f) => f.name.value === fieldName);

            if (field) {
                const newFields = [
                    ...type.fields.filter((f) => f.name.value !== field.name.value),
                    extendFieldWithDirectives(field, directives)
                ];

                const newMutation = {
                    ...type,
                    fields: newFields
                };

                ctx.putType(newMutation);
            }
        }
    }

    private getDirectivesForRules(rules: AuthRule[], addDefaultIfNeeded: boolean = true): DirectiveNode[] {
        if (!rules || rules.length === 0) {
            return [];
        }

        const directives: DirectiveNode[] = new Array();

        //
        // We only add a directive if it is not the default auth or
        // if it is the default one, but there are other rules for a
        // different provider.
        // For fields we don't add the default, since it would open up
        // the access rights.
        //

        if ((this.configuredAuthProviders.default !== 'apiKey' &&
            Boolean(rules.find((r) => r.provider === 'apiKey'))) ||
            (this.configuredAuthProviders.default === 'apiKey' &&
            Boolean(rules.find((r) => r.provider !== 'apiKey' &&
            addDefaultIfNeeded === true))
        )) {
            directives.push(makeDirective('aws_api_key', []));
        }

        if ((this.configuredAuthProviders.default !== 'iam' &&
            Boolean(rules.find((r) => r.provider === 'iam'))) ||
            (this.configuredAuthProviders.default === 'iam' &&
            Boolean(rules.find((r) => r.provider !== 'iam' &&
            addDefaultIfNeeded === true))
        )) {
            directives.push(makeDirective('aws_iam', []));
        }

        if ((this.configuredAuthProviders.default !== 'oidc' &&
            Boolean(rules.find((r) => r.provider === 'oidc'))) ||
            (this.configuredAuthProviders.default === 'oidc' &&
            Boolean(rules.find((r) => r.provider !== 'oidc' &&
            addDefaultIfNeeded === true))
        )) {
            directives.push(makeDirective('aws_oidc', []));
        }

        if ((this.configuredAuthProviders.default !== 'userPools' &&
            Boolean(rules.find((r) => r.provider === 'userPools'))) ||
            (this.configuredAuthProviders.default === 'userPools' &&
            Boolean(rules.find((r) => r.provider !== 'userPools' &&
            addDefaultIfNeeded === true))
        )) {
            directives.push(makeDirective('aws_cognito_user_pools', []));
        }

        return directives;
    }

    private ensureDefaultAuthProviderAssigned(rules: AuthRule[]) {
        // We assign the default provider if an override is not present make further handling easier.
        for (const rule of rules) {
            if (!rule.provider) {
                switch (rule.allow) {
                    case 'owner':
                        rule.provider = 'userPools';
                        break;
                    case 'private':
                        rule.provider = 'userPools'
                        break;
                    case 'public':
                        rule.provider = 'apiKey'
                        break;
                    default:
                        rule.provider = null;
                        break;
                }
            }
        }
    }

    private validateRuleAuthStrategy(rule: AuthRule) {
        //
        // Groups
        //

        if (rule.allow === 'groups' && rule.provider !== null) {
            throw new InvalidDirectiveError(
                `@auth directive with 'groups' strategy does not support providers, but found '${rule.provider}' assigned.`);
        }

        //
        // Owner
        //

        if (rule.allow === 'owner') {
            if (rule.provider !== null && rule.provider !== 'userPools' && rule.provider !== 'oidc') {
                throw new InvalidDirectiveError(
                    `@auth directive with 'owner' strategy only supports 'userPools' (default) and 'oidc' providers, but \
found '${rule.provider}' assigned.`);
            }
        }

        //
        // Public
        //

        if (rule.allow === 'public') {
            if (rule.provider !== null && rule.provider !== 'apiKey' && rule.provider !== 'iam') {
                throw new InvalidDirectiveError(
                    `@auth directive with 'public' strategy only supports 'apiKey' (default) and 'iam' providers, but \
found '${rule.provider}' assigned.`);
            }
        }

        //
        // Private
        //

        if (rule.allow === 'private') {
            if (rule.provider !== null && rule.provider !== 'userPools' && rule.provider !== 'iam') {
                throw new InvalidDirectiveError(
                    `@auth directive with 'private' strategy only supports 'apiKey' (default) and 'iam' providers, but \
found '${rule.provider}' assigned.`);
            }
        }

        //
        // Validate provider values against project configuration.
        //

        if (rule.provider === 'apiKey' && this.configuredAuthProviders.hasApiKey === false) {
            throw new InvalidDirectiveError(
                `@auth directive with 'apiKey' provider found, but the project has no API Key authentication provider configured.`);
        } else if (rule.provider === 'oidc' && this.configuredAuthProviders.hasOIDC === false) {
            throw new InvalidDirectiveError(
                `@auth directive with 'oidc' provider found, but the project has no OPENID_CONNECT authentication provider configured.`);
        } else if (rule.provider === 'userPools' && this.configuredAuthProviders.hasUserPools === false) {
            throw new InvalidDirectiveError(
                `@auth directive with 'userPools' provider found, but the project has no Cognito User Pools authentication provider configured.`);
        } else if (rule.provider === 'iam' && this.configuredAuthProviders.hasIAM === false) {
            throw new InvalidDirectiveError(
                `@auth directive with 'iam' provider found, but the project has no IAM authentication provider configured.`);
        }
    }

    private getConfiguredAuthProviders(): ConfiguredAuthProviders {
        const providers = [
            this.config.authConfig.defaultAuthentication.authenticationType,
            ...this.config.authConfig.additionalAuthenticationProviders.map((p) => p.authenticationType)
        ];

        const getAuthProvider = (authType: AppSyncAuthMode): AuthProvider => {
            switch (authType) {
                case "AMAZON_COGNITO_USER_POOLS":
                    return "userPools";
                case "API_KEY":
                    return "apiKey";
                case "AWS_IAM":
                    return "iam";
                case "OPENID_CONNECT":
                    return "oidc";
            }
        };

        return {
            default: getAuthProvider(this.config.authConfig.defaultAuthentication.authenticationType),
            onlyDefaultAuthProviderConfigured: this.config.authConfig.additionalAuthenticationProviders.length === 0,
            hasApiKey: providers.find((p) => p === 'API_KEY') ? true : false,
            hasUserPools: providers.find((p) => p === 'AMAZON_COGNITO_USER_POOLS') ? true : false,
            hasOIDC: providers.find((p) => p === 'OPENID_CONNECT') ? true : false,
            hasIAM: providers.find((p) => p === "AWS_IAM") ? true : false
        };
    }

    private setUnauthPolicyFlag(rules: AuthRule[]): void {
        if (!rules || rules.length === 0 || this.generateIAMPolicyforUnauthRole === true) {
            return;
        }

        for (const rule of rules) {
            if (rule.allow === 'public' && rule.provider === 'iam') {
                this.generateIAMPolicyforUnauthRole = true;
                return;
            }
        }
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
