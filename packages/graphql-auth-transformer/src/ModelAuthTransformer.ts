import {
  Transformer,
  TransformerContext,
  InvalidDirectiveError,
  gql,
  getDirectiveArguments,
  getFieldArguments,
} from 'graphql-transformer-core';
import GraphQLAPI from 'cloudform-types/types/appSync/graphQlApi';
import Resolver from 'cloudform-types/types/appSync/resolver';
import { StringParameter } from 'cloudform-types';
import { ResourceFactory } from './resources';
import { AuthRule, ModelQuery, ModelMutation, ModelOperation, AuthProvider } from './AuthRule';
import {
  ObjectTypeDefinitionNode,
  DirectiveNode,
  ArgumentNode,
  Kind,
  FieldDefinitionNode,
  InterfaceTypeDefinitionNode,
  valueFromASTUntyped,
  NamedTypeNode,
  InputObjectTypeDefinitionNode,
} from 'graphql';
import {
  ResourceConstants,
  ResolverResourceIDs,
  isListType,
  getBaseType,
  makeDirective,
  makeNamedType,
  makeInputValueDefinition,
  blankObjectExtension,
  extensionWithDirectives,
  extendFieldWithDirectives,
  makeNonNullType,
  makeField,
  ModelResourceIDs,
} from 'graphql-transformer-common';
import { Expression, print, raw, iff, forEach, set, ref, list, compoundExpression, newline, comment, not } from 'graphql-mapping-template';
import { ModelDirectiveConfiguration, ModelDirectiveOperationType, ModelSubscriptionLevel } from './ModelDirectiveConfiguration';

import { OWNER_AUTH_STRATEGY, GROUPS_AUTH_STRATEGY, DEFAULT_OWNER_FIELD } from './constants';

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
  defaultAuthentication: AppSyncAuthConfigurationEntry;
  additionalAuthenticationProviders: Array<AppSyncAuthConfigurationEntry>;
};
export type AppSyncAuthConfigurationEntry = {
  authenticationType: AppSyncAuthMode;
  apiKeyConfig?: ApiKeyConfig;
  userPoolConfig?: UserPoolConfig;
  openIDConnectConfig?: OpenIDConnectConfig;
};
export type ApiKeyConfig = {
  description?: string;
  apiKeyExpirationDays: number;
};
export type UserPoolConfig = {
  userPoolId: string;
};
export type OpenIDConnectConfig = {
  name: string;
  issuerUrl: string;
  clientId?: string;
  iatTTL?: number;
  authTTL?: number;
};

const validateAuthModes = (authConfig: AppSyncAuthConfiguration) => {
  let additionalAuthModes = [];

  if (authConfig.additionalAuthenticationProviders) {
    additionalAuthModes = authConfig.additionalAuthenticationProviders.map(p => p.authenticationType).filter(t => !!t);
  }

  const authModes: AppSyncAuthMode[] = [...additionalAuthModes, authConfig.defaultAuthentication.authenticationType];

  for (let i = 0; i < authModes.length; i++) {
    const mode = authModes[i];

    if (mode !== 'API_KEY' && mode !== 'AMAZON_COGNITO_USER_POOLS' && mode !== 'AWS_IAM' && mode !== 'OPENID_CONNECT') {
      throw new Error(`Invalid auth mode ${mode}`);
    }
  }
};

export type ModelAuthTransformerConfig = {
  authConfig?: AppSyncAuthConfiguration;
};

export type ConfiguredAuthProviders = {
  default: AuthProvider;
  onlyDefaultAuthProviderConfigured: boolean;
  hasApiKey: boolean;
  hasUserPools: boolean;
  hasOIDC: boolean;
  hasIAM: boolean;
};

export class ModelAuthTransformer extends Transformer {
  resources: ResourceFactory;
  config: ModelAuthTransformerConfig;
  configuredAuthProviders: ConfiguredAuthProviders;
  generateIAMPolicyforUnauthRole: boolean;
  generateIAMPolicyforAuthRole: boolean;
  authPolicyResources: Set<string>;
  unauthPolicyResources: Set<string>;

  constructor(config?: ModelAuthTransformerConfig) {
    super(
      'ModelAuthTransformer',
      gql`
        directive @auth(rules: [AuthRule!]!) on OBJECT | FIELD_DEFINITION
        input AuthRule {
          # Specifies the auth rule's strategy. Allowed values are 'owner', 'groups', 'public', 'private'.
          allow: AuthStrategy!

          # Legacy name for identityClaim
          identityField: String @deprecated(reason: "The 'identityField' argument is replaced by the 'identityClaim'.")

          # Specifies the name of the provider to use for the rule. This overrides the default provider
          # when 'public' and 'private' AuthStrategy is used. Specifying a provider for 'owner' or 'groups'
          # are not allowed.
          provider: AuthProvider

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
        enum AuthStrategy {
          owner
          groups
          private
          public
        }
        enum AuthProvider {
          apiKey
          iam
          oidc
          userPools
        }
        enum ModelOperation {
          create
          update
          delete
          read
        }
        enum ModelQuery @deprecated(reason: "ModelQuery will be replaced by the 'ModelOperation' in a future release.") {
          get
          list
        }
        enum ModelMutation @deprecated(reason: "ModelMutation will be replaced by the 'ModelOperation' in a future release.") {
          create
          update
          delete
        }
      `
    );

    if (config && config.authConfig) {
      this.config = config;
      if (!this.config.authConfig.additionalAuthenticationProviders) {
        this.config.authConfig.additionalAuthenticationProviders = [];
      }
    } else {
      this.config = { authConfig: { defaultAuthentication: { authenticationType: 'API_KEY' }, additionalAuthenticationProviders: [] } };
    }
    validateAuthModes(this.config.authConfig);
    this.resources = new ResourceFactory();
    this.configuredAuthProviders = this.getConfiguredAuthProviders();
    this.generateIAMPolicyforUnauthRole = false;
    this.generateIAMPolicyforAuthRole = false;
    this.authPolicyResources = new Set<string>();
    this.unauthPolicyResources = new Set<string>();
  }

  /**
   * Updates the GraphQL API record with configured authentication providers
   */
  private updateAPIAuthentication = (ctx: TransformerContext): void => {
    const apiRecord = ctx.getResource(ResourceConstants.RESOURCES.GraphQLAPILogicalID) as GraphQLAPI;
    const updated = this.resources.updateGraphQLAPIWithAuth(apiRecord, this.config.authConfig);
    ctx.setResource(ResourceConstants.RESOURCES.GraphQLAPILogicalID, updated);

    // Check if we need to create an API key resource or not.
  };

  public before = (ctx: TransformerContext): void => {
    const template = this.resources.initTemplate(this.getApiKeyConfig());
    ctx.mergeResources(template.Resources);
    ctx.mergeParameters(template.Parameters);
    ctx.mergeOutputs(template.Outputs);
    ctx.mergeConditions(template.Conditions);
    this.updateAPIAuthentication(ctx);
  };

  public after = (ctx: TransformerContext): void => {
    if (this.generateIAMPolicyforAuthRole === true) {
      // Sanity check to make sure we're not generating invalid policies, where no resources are defined.
      if (this.authPolicyResources.size === 0) {
        throw new Error('AuthRole policies should be generated, but no resources were added');
      }

      ctx.mergeParameters({
        [ResourceConstants.PARAMETERS.AuthRoleName]: new StringParameter({
          Description: 'Reference to the name of the Auth Role created for the project.',
        }),
      });

      const authPolicies = this.resources.makeIAMPolicyForRole(true, this.authPolicyResources);

      for (let i = 0; i < authPolicies.length; i++) {
        const paddedIndex = `${i + 1}`.padStart(2, '0');
        const resourceName = `${ResourceConstants.RESOURCES.AuthRolePolicy}${paddedIndex}`;
        ctx.mergeResources({
          [resourceName]: authPolicies[i],
        });
      }
    }

    if (this.generateIAMPolicyforUnauthRole === true) {
      // Sanity check to make sure we're not generating invalid policies, where no resources are defined.
      if (this.unauthPolicyResources.size === 0) {
        throw new Error('UnauthRole policies should be generated, but no resources were added');
      }

      ctx.mergeParameters({
        [ResourceConstants.PARAMETERS.UnauthRoleName]: new StringParameter({
          Description: 'Reference to the name of the Unauth Role created for the project.',
        }),
      });

      const unauthPolicies = this.resources.makeIAMPolicyForRole(false, this.unauthPolicyResources);

      for (let i = 0; i < unauthPolicies.length; i++) {
        const paddedIndex = `${i + 1}`.padStart(2, '0');
        const resourceName = `${ResourceConstants.RESOURCES.UnauthRolePolicy}${paddedIndex}`;
        ctx.mergeResources({
          [resourceName]: unauthPolicies[i],
        });
      }
    }
  };

  private getApiKeyConfig(): ApiKeyConfig {
    let authProviders = [];

    if (this.config.authConfig.additionalAuthenticationProviders) {
      authProviders = authProviders.concat(this.config.authConfig.additionalAuthenticationProviders.filter(p => !!p.authenticationType));
    }

    authProviders.push(this.config.authConfig.defaultAuthentication);

    const apiKeyAuthProvider = authProviders.find(p => p.authenticationType === 'API_KEY');

    // Return the found instance or a default instance with 7 days of API key expiration
    return apiKeyAuthProvider ? apiKeyAuthProvider.apiKeyConfig : { apiKeyExpirationDays: 7 };
  }

  /**
   * Implement the transform for an object type. Depending on which operations are to be protected
   */
  public object = (def: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext): void => {
    const modelDirective = def.directives.find(dir => dir.name.value === 'model');
    if (!modelDirective) {
      throw new InvalidDirectiveError('Types annotated with @auth must also be annotated with @model.');
    }

    // check if searchable is enabled on the type
    const searchableDirective = def.directives.find(dir => dir.name.value === 'searchable');

    // Get and validate the auth rules.
    const rules = this.getAuthRulesFromDirective(directive);
    // Assign default providers to rules where no provider was explicitly defined
    this.ensureDefaultAuthProviderAssigned(rules);
    this.validateRules(rules);
    // Check the rules if we've to generate IAM policies for Unauth role or not
    this.setAuthPolicyFlag(rules);
    this.setUnauthPolicyFlag(rules);

    const { operationRules, queryRules } = this.splitRules(rules);

    // Retrieve the configuration options for the related @model directive
    const modelConfiguration = new ModelDirectiveConfiguration(modelDirective, def);
    // Get the directives we need to add to the GraphQL nodes
    const directives = this.getDirectivesForRules(rules, false);

    // Add the directives to the Type node itself
    if (directives.length > 0) {
      this.extendTypeWithDirectives(ctx, def.name.value, directives);
    }

    this.addTypeToResourceReferences(def.name.value, rules);

    // For each operation evaluate the rules and apply the changes to the relevant resolver.
    this.protectCreateMutation(
      ctx,
      ResolverResourceIDs.DynamoDBCreateResolverResourceID(def.name.value),
      operationRules.create,
      def,
      modelConfiguration
    );
    this.protectUpdateMutation(
      ctx,
      ResolverResourceIDs.DynamoDBUpdateResolverResourceID(def.name.value),
      operationRules.update,
      def,
      modelConfiguration
    );
    this.protectDeleteMutation(
      ctx,
      ResolverResourceIDs.DynamoDBDeleteResolverResourceID(def.name.value),
      operationRules.delete,
      def,
      modelConfiguration
    );
    this.protectGetQuery(ctx, ResolverResourceIDs.DynamoDBGetResolverResourceID(def.name.value), queryRules.get, def, modelConfiguration);
    this.protectListQuery(
      ctx,
      ResolverResourceIDs.DynamoDBListResolverResourceID(def.name.value),
      queryRules.list,
      def,
      modelConfiguration
    );
    this.protectConnections(ctx, def, operationRules.read, modelConfiguration);
    this.protectQueries(ctx, def, operationRules.read, modelConfiguration);

    // protect search query if @searchable is enabled
    if (searchableDirective) {
      this.protectSearchQuery(ctx, def, ResolverResourceIDs.ElasticsearchSearchResolverResourceID(def.name.value), operationRules.read);
    }

    // protect sync query if model is sync enabled
    if (this.isSyncEnabled(ctx, def.name.value)) {
      this.protectSyncQuery(ctx, def, ResolverResourceIDs.SyncResolverResourceID(def.name.value), operationRules.read);
    }

    // Check if subscriptions is enabled
    if (modelConfiguration.getName('level') !== 'off') {
      this.protectOnCreateSubscription(ctx, operationRules.create, def, modelConfiguration);
      this.protectOnUpdateSubscription(ctx, operationRules.update, def, modelConfiguration);
      this.protectOnDeleteSubscription(ctx, operationRules.delete, def, modelConfiguration);
    }

    // Update ModelXConditionInput type
    this.updateMutationConditionInput(ctx, def, rules);
  };

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
    const modelDirective = parent.directives.find(dir => dir.name.value === 'model');
    if (
      parent.name.value === ctx.getQueryTypeName() ||
      parent.name.value === ctx.getMutationTypeName() ||
      parent.name.value === ctx.getSubscriptionTypeName()
    ) {
      console.warn(
        `Be careful when using @auth directives on a field in a root type. @auth directives on field definitions use the source \
object to perform authorization logic and the source will be an empty object for fields on root types. \
Static group authorization should perform as expected.`
      );
    }

    // Get and validate the auth rules.
    const rules = this.getAuthRulesFromDirective(directive);
    // Assign default providers to rules where no provider was explicitly defined
    this.ensureDefaultAuthProviderAssigned(rules);
    this.validateFieldRules(rules);
    // Check the rules if we've to generate IAM policies for Unauth role or not
    this.setAuthPolicyFlag(rules);
    this.setUnauthPolicyFlag(rules);

    this.addFieldToResourceReferences(parent.name.value, definition.name.value, rules);

    // Add the directives to the parent type as well, we've to add the default provider if
    // - The type has no @auth directives, so there are NO restrictions on the type
    // or
    // - The type has @auth rules for the default provider
    const includeDefault = this.isTypeNeedsDefaultProviderAccess(parent);
    const typeDirectives = this.getDirectivesForRules(rules, includeDefault);

    if (typeDirectives.length > 0) {
      this.extendTypeWithDirectives(ctx, parent.name.value, typeDirectives);
    }

    const isOpRule = (op: ModelOperation) => (rule: AuthRule) => {
      if (rule.operations) {
        const matchesOp = rule.operations.find(o => o === op);
        return Boolean(matchesOp);
      }
      if (rule.operations === null) {
        return false;
      }
      return true;
    };

    // add rules if per field @auth is used with @model
    if (modelDirective) {
      const isReadRule = isOpRule('read');
      const isCreateRule = isOpRule('create');
      const isUpdateRule = isOpRule('update');
      const isDeleteRule = isOpRule('delete');

      // Retrieve the configuration options for the related @model directive
      const modelConfiguration = new ModelDirectiveConfiguration(modelDirective, parent);
      // The field handler adds the read rule on the object
      const readRules = rules.filter((rule: AuthRule) => isReadRule(rule));
      this.protectReadForField(ctx, parent, definition, readRules, modelConfiguration);

      // Protect mutations when objects including this field are trying to be created.
      const createRules = rules.filter((rule: AuthRule) => isCreateRule(rule));
      this.protectCreateForField(ctx, parent, definition, createRules, modelConfiguration);

      // Protect update mutations when objects inluding this field are trying to be updated.
      const updateRules = rules.filter((rule: AuthRule) => isUpdateRule(rule));
      this.protectUpdateForField(ctx, parent, definition, updateRules, modelConfiguration);

      // Delete operations are only protected by @auth directives on objects.
      const deleteRules = rules.filter((rule: AuthRule) => isDeleteRule(rule));
      this.protectDeleteForField(ctx, parent, definition, deleteRules, modelConfiguration);
    } else {
      // if @auth is used without @model only generate static group rules
      const staticGroupRules = rules.filter((rule: AuthRule) => rule.groups);
      this.protectField(ctx, parent, definition, staticGroupRules);
    }
  };

  private protectField(
    ctx: TransformerContext,
    parent: ObjectTypeDefinitionNode,
    field: FieldDefinitionNode,
    staticGroupRules: AuthRule[]
  ) {
    const typeName = parent.name.value;
    const fieldName = field.name.value;
    const resolverResourceId = ResolverResourceIDs.ResolverResourceID(typeName, fieldName);
    let fieldResolverResource = ctx.getResource(resolverResourceId);
    // add logic here to only use static group rules
    const staticGroupAuthorizationRules = this.getStaticGroupRules(staticGroupRules);
    const staticGroupAuthorizationExpression = this.resources.staticGroupAuthorizationExpression(staticGroupAuthorizationRules, field);
    const throwIfUnauthorizedExpression = this.resources.throwIfUnauthorized(field);
    const authCheckExpressions = [staticGroupAuthorizationExpression, newline(), throwIfUnauthorizedExpression];
    const templateParts = [print(compoundExpression(authCheckExpressions))];
    // if the field resolver does not exist create it
    if (!fieldResolverResource) {
      fieldResolverResource = this.resources.blankResolver(typeName, fieldName);
      ctx.setResource(resolverResourceId, fieldResolverResource);
      // add none ds if that does not exist
      const noneDS = ctx.getResource(ResourceConstants.RESOURCES.NoneDataSource);
      if (!noneDS) {
        ctx.setResource(ResourceConstants.RESOURCES.NoneDataSource, this.resources.noneDataSource());
      }
    } else {
      templateParts.push(fieldResolverResource.Properties.RequestMappingTemplate);
    }
    fieldResolverResource.Properties.RequestMappingTemplate = templateParts.join('\n\n');
    ctx.setResource(resolverResourceId, fieldResolverResource);
  }

  private protectReadForField(
    ctx: TransformerContext,
    parent: ObjectTypeDefinitionNode,
    field: FieldDefinitionNode,
    rules: AuthRule[],
    modelConfiguration: ModelDirectiveConfiguration
  ) {
    if (rules && rules.length) {
      // Get the directives we need to add to the GraphQL nodes
      const directives = this.getDirectivesForRules(rules, false);

      if (directives.length > 0) {
        this.addDirectivesToField(ctx, parent.name.value, field.name.value, directives);

        const addDirectivesForOperation = (operationType: ModelDirectiveOperationType) => {
          if (modelConfiguration.shouldHave(operationType)) {
            const operationName = modelConfiguration.getName(operationType);
            // If the parent type has any rules for this operation AND
            // the default provider we've to get directives including the default
            // as well.
            const includeDefault = this.isTypeHasRulesForOperation(parent, operationType);
            const operationDirectives = this.getDirectivesForRules(rules, includeDefault);

            this.addDirectivesToOperation(ctx, ctx.getQueryTypeName(), operationName, operationDirectives);
          }
        };

        addDirectivesForOperation('get');
        addDirectivesForOperation('list');
      }

      const addResourceReference = (operationType: ModelDirectiveOperationType) => {
        if (modelConfiguration.shouldHave(operationType)) {
          const operationName = modelConfiguration.getName(operationType);
          this.addFieldToResourceReferences(ctx.getQueryTypeName(), operationName, rules);
        }
      };

      addResourceReference('get');
      addResourceReference('list');

      const resolverResourceId = ResolverResourceIDs.ResolverResourceID(parent.name.value, field.name.value);
      // If the resolver exists (e.g. @connection use it else make a blank one against None)
      let resolver = ctx.getResource(resolverResourceId);
      if (!resolver) {
        // If we need a none data source for the blank resolver, add it.
        const noneDS = ctx.getResource(ResourceConstants.RESOURCES.NoneDataSource);
        if (!noneDS) {
          ctx.setResource(ResourceConstants.RESOURCES.NoneDataSource, this.resources.noneDataSource());
        }
        // We also need to add a stack mapping so that this resolver is added to the model stack.
        ctx.mapResourceToStack(parent.name.value, resolverResourceId);
        resolver = this.resources.blankResolver(parent.name.value, field.name.value);
      }
      const authExpression = this.authorizationExpressionOnSingleObject(rules, 'ctx.source');
      // if subscriptions auth is enabled protect this field by checking for the operation
      // if the operation is a mutation then we deny the a read operation on the field
      if (modelConfiguration.getName('level') === 'on') {
        if (field.type.kind === Kind.NON_NULL_TYPE) {
          throw new InvalidDirectiveError(`\nPer-field auth on the required field ${field.name.value} is not supported with subscriptions.
Either make the field optional, set auth on the object and not the field, or disable subscriptions for the object (setting level to off or public)\n`);
        }
        // operation check in the protected field
        resolver.Properties.ResponseMappingTemplate = print(
          this.resources.operationCheckExpression(ctx.getMutationTypeName(), field.name.value)
        );
      }
      // If a resolver exists, a @connection for example. Prepend it to the req.
      const templateParts = [print(authExpression), resolver.Properties.RequestMappingTemplate];
      resolver.Properties.RequestMappingTemplate = templateParts.join('\n\n');
      ctx.setResource(resolverResourceId, resolver);
    }
  }

  private protectUpdateForField(
    ctx: TransformerContext,
    parent: ObjectTypeDefinitionNode,
    field: FieldDefinitionNode,
    rules: AuthRule[],
    modelConfiguration: ModelDirectiveConfiguration
  ) {
    const resolverResourceId = ResolverResourceIDs.DynamoDBUpdateResolverResourceID(parent.name.value);
    const subscriptionOperation: ModelDirectiveOperationType = 'onUpdate';
    this.protectUpdateMutation(ctx, resolverResourceId, rules, parent, modelConfiguration, field, subscriptionOperation);
  }

  private protectDeleteForField(
    ctx: TransformerContext,
    parent: ObjectTypeDefinitionNode,
    field: FieldDefinitionNode,
    rules: AuthRule[],
    modelConfiguration: ModelDirectiveConfiguration
  ) {
    const resolverResourceId = ResolverResourceIDs.DynamoDBUpdateResolverResourceID(parent.name.value);
    const subscriptionOperation: ModelDirectiveOperationType = 'onDelete';
    this.protectDeleteMutation(ctx, resolverResourceId, rules, parent, modelConfiguration, field, subscriptionOperation);
  }

  /**
   * Protects a create mutation based on an @auth rule specified on a @model field.
   * @param ctx The context.
   * @param typeName The parent type name.
   * @param fieldName The name of the field with the @auth directive.
   * @param rules The set of rules that should be applied to create operations.
   */
  private protectCreateForField(
    ctx: TransformerContext,
    parent: ObjectTypeDefinitionNode,
    field: FieldDefinitionNode,
    rules: AuthRule[],
    modelConfiguration: ModelDirectiveConfiguration
  ) {
    const typeName = parent.name.value;
    const resolverResourceId = ResolverResourceIDs.DynamoDBCreateResolverResourceID(typeName);
    const createResolverResource = ctx.getResource(resolverResourceId);
    const mutationTypeName = ctx.getMutationTypeName();
    if (rules && rules.length && createResolverResource) {
      // Get the directives we need to add to the GraphQL nodes
      const directives = this.getDirectivesForRules(rules, false);
      let operationName: string = undefined;

      if (directives.length > 0) {
        this.addDirectivesToField(ctx, typeName, field.name.value, directives);

        if (modelConfiguration.shouldHave('create')) {
          // If the parent type has any rules for this operation AND
          // the default provider we've to get directives including the default
          // as well.
          const includeDefault = this.isTypeHasRulesForOperation(parent, 'create');
          const operationDirectives = this.getDirectivesForRules(rules, includeDefault);

          operationName = modelConfiguration.getName('create');

          this.addDirectivesToOperation(ctx, mutationTypeName, operationName, operationDirectives);
        }
      }

      if (operationName) {
        this.addFieldToResourceReferences(mutationTypeName, operationName, rules);
      }

      // Break the rules out by strategy.
      const staticGroupAuthorizationRules = this.getStaticGroupRules(rules);
      const dynamicGroupAuthorizationRules = this.getDynamicGroupRules(rules);
      const ownerAuthorizationRules = this.getOwnerRules(rules);
      const providerAuthorization = this.hasProviderAuthRules(rules);

      if (
        (staticGroupAuthorizationRules.length > 0 || dynamicGroupAuthorizationRules.length > 0 || ownerAuthorizationRules.length > 0) &&
        providerAuthorization === false
      ) {
        // Generate the expressions to validate each strategy.
        const staticGroupAuthorizationExpression = this.resources.staticGroupAuthorizationExpression(staticGroupAuthorizationRules, field);

        // In create mutations, the dynamic group and ownership authorization checks
        // are done before calling PutItem.
        const dynamicGroupAuthorizationExpression = this.resources.dynamicGroupAuthorizationExpressionForCreateOperationsByField(
          dynamicGroupAuthorizationRules,
          field.name.value
        );
        const fieldIsList = (fieldName: string) => {
          const field = parent.fields.find(field => field.name.value === fieldName);
          if (field) {
            return isListType(field.type);
          }
          return false;
        };
        const ownerAuthorizationExpression = this.resources.ownerAuthorizationExpressionForCreateOperationsByField(
          ownerAuthorizationRules,
          field.name.value,
          fieldIsList
        );

        const throwIfUnauthorizedExpression = this.resources.throwIfUnauthorized(field);

        // Populate a list of configured authentication providers based on the rules
        const authModesToCheck = new Set<AuthProvider>();
        const expressions: Array<Expression> = new Array();

        if (
          ownerAuthorizationRules.find(r => r.provider === 'userPools') ||
          staticGroupAuthorizationRules.length > 0 ||
          dynamicGroupAuthorizationRules.length > 0
        ) {
          authModesToCheck.add('userPools');
        }
        if (ownerAuthorizationRules.find(r => r.provider === 'oidc')) {
          authModesToCheck.add('oidc');
        }

        // If we've any modes to check, then add the authMode check code block
        // to the start of the resolver.
        if (authModesToCheck.size > 0) {
          const isUserPoolTheDefault = this.configuredAuthProviders.default === 'userPools';
          expressions.push(this.resources.getAuthModeDeterminationExpression(authModesToCheck, isUserPoolTheDefault));
        }

        // These statements will be wrapped into an authMode check if statement
        const authCheckExpressions = [
          staticGroupAuthorizationExpression,
          newline(),
          dynamicGroupAuthorizationExpression,
          newline(),
          ownerAuthorizationExpression,
          newline(),
          throwIfUnauthorizedExpression,
        ];

        // Create the authMode if block and add it to the resolver
        expressions.push(this.resources.getAuthModeCheckWrappedExpression(authModesToCheck, compoundExpression(authCheckExpressions)));

        const templateParts = [
          print(iff(raw(`$ctx.args.input.containsKey("${field.name.value}")`), compoundExpression(expressions))),
          createResolverResource.Properties.RequestMappingTemplate,
        ];
        createResolverResource.Properties.RequestMappingTemplate = templateParts.join('\n\n');
        ctx.setResource(resolverResourceId, createResolverResource);
      }

      // if subscriptions is enabled the operation is specified in the mutation response resolver
      if (modelConfiguration.shouldHave('onCreate') && (modelConfiguration.getName('level') as ModelSubscriptionLevel) === 'on') {
        const getTemplateParts = [createResolverResource.Properties.ResponseMappingTemplate];

        if (!this.isOperationExpressionSet(mutationTypeName, createResolverResource.Properties.ResponseMappingTemplate)) {
          getTemplateParts.unshift(this.resources.setOperationExpression(mutationTypeName));
        }
        createResolverResource.Properties.ResponseMappingTemplate = getTemplateParts.join('\n\n');
        ctx.setResource(resolverResourceId, createResolverResource);
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
    };
    const operationRules: { [k in ModelOperation]: AuthRule[] } = {
      create: [],
      update: [],
      delete: [],
      read: [],
    };
    const matchQuery = (op: ModelQuery) => (rule: AuthRule) => {
      if (rule.queries) {
        const matchesOp = rule.queries.find(o => o === op);
        return Boolean(matchesOp);
      } else if (rule.queries === null) {
        return false;
      }
      return true;
    };
    const matchMutation = (op: ModelMutation) => (rule: AuthRule) => {
      if (rule.mutations) {
        const matchesOp = rule.mutations.find(o => o === op);
        return Boolean(matchesOp);
      } else if (rule.mutations === null) {
        return false;
      }
      return true;
    };
    const matchOperation = (op: ModelOperation) => (rule: AuthRule) => {
      if (rule.operations) {
        const matchesOp = rule.operations.find(o => o === op);
        return Boolean(matchesOp);
      } else if (rule.operations === null) {
        return false;
      }
      return true;
    };
    for (const rule of rules) {
      // If operations is provided, then it takes precendence.
      if (isTruthyOrNull(rule.operations)) {
        // If operations is given use it.
        if (matchOperation('read')(rule)) {
          queryRules.get.push(rule);
          queryRules.list.push(rule);
          operationRules.read.push(rule);
        }
        if (matchOperation('create')(rule)) {
          operationRules.create.push(rule);
        }
        if (matchOperation('update')(rule)) {
          operationRules.update.push(rule);
        }
        if (matchOperation('delete')(rule)) {
          operationRules.delete.push(rule);
        }
      } else {
        // If operations is not provided, either use the default behavior or deprecated
        // behavior from the queries/mutations arguments for backwards compatibility.

        // Handle default or deprecated query use case
        if (isUndefined(rule.queries)) {
          // If both operations and queries are undefined, default to read operation protection.
          // This is the default behavior. E.G. @auth(rules: [{ allow: owner }])
          queryRules.get.push(rule);
          queryRules.list.push(rule);
          operationRules.read.push(rule);
        } else {
          // If operations is undefined & queries is defined, use queries.
          // This is the old behavior for backwards compatibility.
          if (matchQuery('get')(rule)) {
            queryRules.get.push(rule);
          }
          if (matchQuery('list')(rule)) {
            queryRules.list.push(rule);
          }
        }

        // Handle default or deprecated mutation use case
        if (isUndefined(rule.mutations)) {
          // If both operations and mutations are undefined, default to create, update, delete
          // operation protection. This is the default behavior. E.G. @auth(rules: [{ allow: owner }])
          operationRules.create.push(rule);
          operationRules.update.push(rule);
          operationRules.delete.push(rule);
        } else {
          // If operations is undefined & mutations is defined, use mutations.
          // This is the old behavior for backwards compatibility.
          if (matchMutation('create')(rule)) {
            operationRules.create.push(rule);
          }
          if (matchMutation('update')(rule)) {
            operationRules.update.push(rule);
          }
          if (matchMutation('delete')(rule)) {
            operationRules.delete.push(rule);
          }
        }
      }
    }
    return {
      operationRules,
      queryRules,
    };
  }

  private validateRules(rules: AuthRule[]) {
    for (const rule of rules) {
      this.validateRuleAuthStrategy(rule);

      const { queries, mutations, operations } = rule;
      if (mutations && operations) {
        console.warn(`It is not recommended to use 'mutations' and 'operations'. The 'operations' argument will be used.`);
      }
      if (queries && operations) {
        console.warn(`It is not recommended to use 'queries' and 'operations'. The 'operations' argument will be used.`);
      }
      this.commonRuleValidation(rule);
    }
  }

  private validateFieldRules(rules: AuthRule[]) {
    for (const rule of rules) {
      this.validateRuleAuthStrategy(rule);

      const { queries, mutations } = rule;
      if (queries || mutations) {
        throw new InvalidDirectiveError(
          `@auth directives used on field definitions may not specify the 'queries' or 'mutations' arguments. \
All @auth directives used on field definitions are performed when the field is resolved and can be thought of as 'read' operations.`
        );
      }
      this.commonRuleValidation(rule);
    }
  }

  // commmon rule validation between obj and field
  private commonRuleValidation(rule: AuthRule) {
    const { identityField, identityClaim, allow, groups, groupsField, groupClaim } = rule;
    if (allow === 'groups' && (identityClaim || identityField)) {
      throw new InvalidDirectiveError(`
            @auth identityField/Claim can only be used for 'allow: owner'`);
    }
    if (allow === 'owner' && groupClaim) {
      throw new InvalidDirectiveError(`
            @auth groupClaim can only be used 'allow: groups'`);
    }
    if (groupsField && groups) {
      throw new InvalidDirectiveError('This rule has groupsField and groups, please use one or the other');
    }
    if (identityField && identityClaim) {
      throw new InvalidDirectiveError('Please use consider IdentifyClaim over IdentityField as it is deprecated.');
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
  private protectGetQuery(
    ctx: TransformerContext,
    resolverResourceId: string,
    rules: AuthRule[],
    parent: ObjectTypeDefinitionNode | null,
    modelConfiguration: ModelDirectiveConfiguration
  ) {
    const resolver = ctx.getResource(resolverResourceId);
    if (!rules || rules.length === 0 || !resolver) {
      return;
    } else {
      let operationName: string = undefined;

      if (modelConfiguration.shouldHave('get')) {
        operationName = modelConfiguration.getName('get');
        // If the parent type has any rules for this operation AND
        // the default provider we've to get directives including the default
        // as well.
        const includeDefault = parent !== null ? this.isTypeHasRulesForOperation(parent, 'get') : false;
        const operationDirectives = this.getDirectivesForRules(rules, includeDefault);

        if (operationDirectives.length > 0) {
          this.addDirectivesToOperation(ctx, ctx.getQueryTypeName(), operationName, operationDirectives);
        }
      }

      if (operationName) {
        this.addFieldToResourceReferences(ctx.getQueryTypeName(), operationName, rules);
      }

      const authExpression = this.authorizationExpressionOnSingleObject(rules);

      if (authExpression) {
        const templateParts = [print(authExpression), resolver.Properties.ResponseMappingTemplate];
        resolver.Properties.ResponseMappingTemplate = templateParts.join('\n\n');
        ctx.setResource(resolverResourceId, resolver);
      }
    }
  }

  private authorizationExpressionOnSingleObject(rules: AuthRule[], objectPath: string = 'ctx.result') {
    // Break the rules out by strategy.
    const staticGroupAuthorizationRules = this.getStaticGroupRules(rules);
    const dynamicGroupAuthorizationRules = this.getDynamicGroupRules(rules);
    const ownerAuthorizationRules = this.getOwnerRules(rules);
    const providerAuthorization = this.hasProviderAuthRules(rules);

    if (
      (staticGroupAuthorizationRules.length > 0 || dynamicGroupAuthorizationRules.length > 0 || ownerAuthorizationRules.length > 0) &&
      providerAuthorization === false
    ) {
      // Generate the expressions to validate each strategy.
      const staticGroupAuthorizationExpression = this.resources.staticGroupAuthorizationExpression(staticGroupAuthorizationRules);
      const dynamicGroupAuthorizationExpression = this.resources.dynamicGroupAuthorizationExpressionForReadOperations(
        dynamicGroupAuthorizationRules,
        objectPath
      );
      const ownerAuthorizationExpression = this.resources.ownerAuthorizationExpressionForReadOperations(
        ownerAuthorizationRules,
        objectPath
      );
      const throwIfUnauthorizedExpression = this.resources.throwIfUnauthorized();

      // If we've any modes to check, then add the authMode check code block
      // to the start of the resolver.
      const authModesToCheck = new Set<AuthProvider>();
      const expressions: Array<Expression> = new Array();

      if (
        ownerAuthorizationRules.find(r => r.provider === 'userPools') ||
        staticGroupAuthorizationRules.length > 0 ||
        dynamicGroupAuthorizationRules.length > 0
      ) {
        authModesToCheck.add('userPools');
      }
      if (ownerAuthorizationRules.find(r => r.provider === 'oidc')) {
        authModesToCheck.add('oidc');
      }

      if (authModesToCheck.size > 0) {
        const isUserPoolTheDefault = this.configuredAuthProviders.default === 'userPools';
        expressions.push(this.resources.getAuthModeDeterminationExpression(authModesToCheck, isUserPoolTheDefault));
      }

      // Update the existing resolver with the authorization checks.
      // These statements will be wrapped into an authMode check if statement
      const templateExpressions = [
        staticGroupAuthorizationExpression,
        newline(),
        dynamicGroupAuthorizationExpression,
        newline(),
        ownerAuthorizationExpression,
        newline(),
        throwIfUnauthorizedExpression,
      ];

      // These statements will be wrapped into an authMode check if statement
      expressions.push(this.resources.getAuthModeCheckWrappedExpression(authModesToCheck, compoundExpression(templateExpressions)));

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
  private protectListQuery(
    ctx: TransformerContext,
    resolverResourceId: string,
    rules: AuthRule[],
    parent: ObjectTypeDefinitionNode | null,
    modelConfiguration: ModelDirectiveConfiguration,
    explicitOperationName: string = undefined
  ) {
    const resolver = ctx.getResource(resolverResourceId);
    if (!rules || rules.length === 0 || !resolver) {
      return;
    }

    if (modelConfiguration.shouldHave('list')) {
      const operationName = explicitOperationName ? explicitOperationName : modelConfiguration.getName('list');
      // If the parent type has any rules for this operation AND
      // the default provider we've to get directives including the default
      // as well.
      const includeDefault = parent !== null ? this.isTypeHasRulesForOperation(parent, 'list') : false;
      const operationDirectives = this.getDirectivesForRules(rules, includeDefault);

      if (operationDirectives.length > 0) {
        this.addDirectivesToOperation(ctx, ctx.getQueryTypeName(), operationName, operationDirectives);
      }

      this.addFieldToResourceReferences(ctx.getQueryTypeName(), operationName, rules);
    }

    const authExpression = this.authorizationExpressionForListResult(rules);

    if (authExpression) {
      const templateParts = [print(authExpression), resolver.Properties.ResponseMappingTemplate];
      resolver.Properties.ResponseMappingTemplate = templateParts.join('\n\n');
      ctx.setResource(resolverResourceId, resolver);
    }
  }

  /**
   * Returns a VTL expression that will authorize a list of results based on a set of auth rules.
   * @param rules The auth rules.
   *
   * If an itemList is specifed in @param itemList it will use this ref to filter out items in this list that are not authorized
   */
  private authorizationExpressionForListResult(rules: AuthRule[], itemList: string = 'ctx.result.items') {
    // Break the rules out by strategy.
    const staticGroupAuthorizationRules = this.getStaticGroupRules(rules);
    const dynamicGroupAuthorizationRules = this.getDynamicGroupRules(rules);
    const ownerAuthorizationRules = this.getOwnerRules(rules);
    const providerAuthorization = this.hasProviderAuthRules(rules);

    // if there is a rule combination of owner or group and private, public for userpools then we don't need to emit any of the access check
    // logic since it is not needed. For example we don't emit any of this logic for rules like this:
    // { allow: groups, groups: ["Admin"]},
    // { allow: private }

    if (
      (staticGroupAuthorizationRules.length > 0 || dynamicGroupAuthorizationRules.length > 0 || ownerAuthorizationRules.length > 0) &&
      providerAuthorization === false
    ) {
      // Generate the expressions to validate each strategy.
      const staticGroupAuthorizationExpression = this.resources.staticGroupAuthorizationExpression(staticGroupAuthorizationRules);

      // In list queries, the dynamic group and ownership authorization checks
      // occur on a per item basis. The helpers take the variable names
      // as parameters to allow for this use case.
      const dynamicGroupAuthorizationExpression = this.resources.dynamicGroupAuthorizationExpressionForReadOperations(
        dynamicGroupAuthorizationRules,
        'item',
        ResourceConstants.SNIPPETS.IsLocalDynamicGroupAuthorizedVariable,
        raw(`false`)
      );
      const ownerAuthorizationExpression = this.resources.ownerAuthorizationExpressionForReadOperations(
        ownerAuthorizationRules,
        'item',
        ResourceConstants.SNIPPETS.IsLocalOwnerAuthorizedVariable,
        raw(`false`)
      );
      const appendIfLocallyAuthorized = this.resources.appendItemIfLocallyAuthorized();

      const ifNotStaticallyAuthedFilterObjects = iff(
        not(ref(ResourceConstants.SNIPPETS.IsStaticGroupAuthorizedVariable)),
        compoundExpression([
          set(ref('items'), list([])),
          forEach(ref('item'), ref(itemList), [
            dynamicGroupAuthorizationExpression,
            newline(),
            ownerAuthorizationExpression,
            newline(),
            appendIfLocallyAuthorized,
          ]),
          set(ref(itemList), ref('items')),
        ])
      );

      // If we've any modes to check, then add the authMode check code block
      // to the start of the resolver.
      const authModesToCheck = new Set<AuthProvider>();
      const expressions: Array<Expression> = new Array();

      if (
        ownerAuthorizationRules.find(r => r.provider === 'userPools') ||
        staticGroupAuthorizationRules.length > 0 ||
        dynamicGroupAuthorizationRules.length > 0
      ) {
        authModesToCheck.add('userPools');
      }
      if (ownerAuthorizationRules.find(r => r.provider === 'oidc')) {
        authModesToCheck.add('oidc');
      }

      if (authModesToCheck.size > 0) {
        const isUserPoolTheDefault = this.configuredAuthProviders.default === 'userPools';
        expressions.push(this.resources.getAuthModeDeterminationExpression(authModesToCheck, isUserPoolTheDefault));
      }

      // These statements will be wrapped into an authMode check if statement
      const templateExpressions = [
        staticGroupAuthorizationExpression,
        newline(),
        comment('[Start] If not static group authorized, filter items'),
        ifNotStaticallyAuthedFilterObjects,
        comment('[End] If not static group authorized, filter items'),
      ];

      // Create the authMode if block and add it to the resolver
      expressions.push(this.resources.getAuthModeCheckWrappedExpression(authModesToCheck, compoundExpression(templateExpressions)));

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
    const resolver = ctx.getResource(resolverResourceId);
    if (!rules || rules.length === 0 || !resolver) {
      return;
    } else {
      const mutationTypeName = ctx.getMutationTypeName();

      if (modelConfiguration.shouldHave('create')) {
        const operationName = modelConfiguration.getName('create');
        // If the parent type has any rules for this operation AND
        // the default provider we've to get directives including the default
        // as well.
        const includeDefault = this.isTypeHasRulesForOperation(parent, 'create');
        const operationDirectives = this.getDirectivesForRules(rules, includeDefault);

        if (operationDirectives.length > 0) {
          this.addDirectivesToOperation(ctx, mutationTypeName, operationName, operationDirectives);
        }

        this.addFieldToResourceReferences(mutationTypeName, operationName, rules);
      }

      // Break the rules out by strategy.
      const staticGroupAuthorizationRules = this.getStaticGroupRules(rules);
      const dynamicGroupAuthorizationRules = this.getDynamicGroupRules(rules);
      const ownerAuthorizationRules = this.getOwnerRules(rules);
      const providerAuthorization = this.hasProviderAuthRules(rules);

      if (
        (staticGroupAuthorizationRules.length > 0 || dynamicGroupAuthorizationRules.length > 0 || ownerAuthorizationRules.length > 0) &&
        providerAuthorization === false
      ) {
        // Generate the expressions to validate each strategy.
        const staticGroupAuthorizationExpression = this.resources.staticGroupAuthorizationExpression(staticGroupAuthorizationRules);

        // In create mutations, the dynamic group and ownership authorization checks
        // are done before calling PutItem.
        const dynamicGroupAuthorizationExpression = this.resources.dynamicGroupAuthorizationExpressionForCreateOperations(
          dynamicGroupAuthorizationRules
        );
        const fieldIsList = (fieldName: string) => {
          const field = parent.fields.find(field => field.name.value === fieldName);
          if (field) {
            return isListType(field.type);
          }
          return false;
        };
        const ownerAuthorizationExpression = this.resources.ownerAuthorizationExpressionForCreateOperations(
          ownerAuthorizationRules,
          fieldIsList
        );

        const throwIfUnauthorizedExpression = this.resources.throwIfUnauthorized();

        // If we've any modes to check, then add the authMode check code block
        // to the start of the resolver.
        const authModesToCheck = new Set<AuthProvider>();
        const expressions: Array<Expression> = new Array();

        if (
          ownerAuthorizationRules.find(r => r.provider === 'userPools') ||
          staticGroupAuthorizationRules.length > 0 ||
          dynamicGroupAuthorizationRules.length > 0
        ) {
          authModesToCheck.add('userPools');
        }
        if (ownerAuthorizationRules.find(r => r.provider === 'oidc')) {
          authModesToCheck.add('oidc');
        }

        if (authModesToCheck.size > 0) {
          const isUserPoolTheDefault = this.configuredAuthProviders.default === 'userPools';
          expressions.push(this.resources.getAuthModeDeterminationExpression(authModesToCheck, isUserPoolTheDefault));
        }

        // These statements will be wrapped into an authMode check if statement
        const authCheckExpressions = [
          staticGroupAuthorizationExpression,
          newline(),
          dynamicGroupAuthorizationExpression,
          newline(),
          ownerAuthorizationExpression,
          newline(),
          throwIfUnauthorizedExpression,
        ];

        // Create the authMode if block and add it to the resolver
        expressions.push(this.resources.getAuthModeCheckWrappedExpression(authModesToCheck, compoundExpression(authCheckExpressions)));

        const templateParts = [print(compoundExpression(expressions)), resolver.Properties.RequestMappingTemplate];
        resolver.Properties.RequestMappingTemplate = templateParts.join('\n\n');
        ctx.setResource(resolverResourceId, resolver);
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
    subscriptionOperation?: ModelDirectiveOperationType
  ) {
    const resolver = ctx.getResource(resolverResourceId);
    if (!rules || rules.length === 0 || !resolver) {
      return;
    } else {
      const mutationTypeName = ctx.getMutationTypeName();

      if (modelConfiguration.shouldHave(isUpdate ? 'update' : 'delete')) {
        const operationName = modelConfiguration.getName(isUpdate ? 'update' : 'delete');
        // If the parent type has any rules for this operation AND
        // the default provider we've to get directives including the default
        // as well.
        const includeDefault = Boolean(!field && this.isTypeHasRulesForOperation(parent, isUpdate ? 'update' : 'delete'));
        const operationDirectives = this.getDirectivesForRules(rules, includeDefault);

        if (operationDirectives.length > 0) {
          this.addDirectivesToOperation(ctx, mutationTypeName, operationName, operationDirectives);
        }

        this.addFieldToResourceReferences(mutationTypeName, operationName, rules);
      }

      // Break the rules out by strategy.
      const staticGroupAuthorizationRules = this.getStaticGroupRules(rules);
      const dynamicGroupAuthorizationRules = this.getDynamicGroupRules(rules);
      const ownerAuthorizationRules = this.getOwnerRules(rules);
      const providerAuthorization = this.hasProviderAuthRules(rules);

      if (
        (staticGroupAuthorizationRules.length > 0 || dynamicGroupAuthorizationRules.length > 0 || ownerAuthorizationRules.length > 0) &&
        providerAuthorization === false
      ) {
        // Generate the expressions to validate each strategy.
        const staticGroupAuthorizationExpression = this.resources.staticGroupAuthorizationExpression(staticGroupAuthorizationRules, field);

        // In create mutations, the dynamic group and ownership authorization checks
        // are done before calling PutItem.
        const dynamicGroupAuthorizationExpression = this.resources.dynamicGroupAuthorizationExpressionForUpdateOrDeleteOperations(
          dynamicGroupAuthorizationRules,
          field ? field.name.value : undefined
        );

        const fieldIsList = (fieldName: string) => {
          const field = parent.fields.find(field => field.name.value === fieldName);
          if (field) {
            return isListType(field.type);
          }
          return false;
        };
        const ownerAuthorizationExpression = this.resources.ownerAuthorizationExpressionForUpdateOrDeleteOperations(
          ownerAuthorizationRules,
          fieldIsList,
          field ? field.name.value : undefined
        );

        const collectAuthCondition = this.resources.collectAuthCondition();
        const staticGroupAuthorizedVariable = this.resources.getStaticAuthorizationVariable(field);
        const ifNotStaticallyAuthedCreateAuthCondition = iff(
          raw(`! $${staticGroupAuthorizedVariable}`),
          compoundExpression([
            dynamicGroupAuthorizationExpression,
            newline(),
            ownerAuthorizationExpression,
            newline(),
            collectAuthCondition,
          ])
        );

        const throwIfNotStaticGroupAuthorizedOrAuthConditionIsEmpty = this.resources.throwIfNotStaticGroupAuthorizedOrAuthConditionIsEmpty(
          field
        );

        // If we've any modes to check, then add the authMode check code block
        // to the start of the resolver.
        const authModesToCheck = new Set<AuthProvider>();
        const expressions: Array<Expression> = new Array();

        if (
          ownerAuthorizationRules.find(r => r.provider === 'userPools') ||
          staticGroupAuthorizationRules.length > 0 ||
          dynamicGroupAuthorizationRules.length > 0
        ) {
          authModesToCheck.add('userPools');
        }
        if (ownerAuthorizationRules.find(r => r.provider === 'oidc')) {
          authModesToCheck.add('oidc');
        }

        if (authModesToCheck.size > 0) {
          const isUserPoolTheDefault = this.configuredAuthProviders.default === 'userPools';
          expressions.push(this.resources.getAuthModeDeterminationExpression(authModesToCheck, isUserPoolTheDefault));
        }

        // These statements will be wrapped into an authMode check if statement
        const authorizationLogic = compoundExpression([
          staticGroupAuthorizationExpression,
          newline(),
          ifNotStaticallyAuthedCreateAuthCondition,
          newline(),
          throwIfNotStaticGroupAuthorizedOrAuthConditionIsEmpty,
        ]);

        // Create the authMode if block and add it to the resolver
        expressions.push(this.resources.getAuthModeCheckWrappedExpression(authModesToCheck, authorizationLogic));

        const templateParts = [
          print(field && ifCondition ? iff(ifCondition, compoundExpression(expressions)) : compoundExpression(expressions)),
          resolver.Properties.RequestMappingTemplate,
        ];
        resolver.Properties.RequestMappingTemplate = templateParts.join('\n\n');
        ctx.setResource(resolverResourceId, resolver);
      }

      // if protect is for field and there is a subscription for update / delete then protect the field in that operation
      if (
        field &&
        subscriptionOperation &&
        modelConfiguration.shouldHave(subscriptionOperation) &&
        (modelConfiguration.getName('level') as ModelSubscriptionLevel) === 'on'
      ) {
        let mutationResolver = resolver;
        let mutationResolverResourceID = resolverResourceId;
        // if we are protecting delete then we need to get the delete resolver
        if (subscriptionOperation === 'onDelete') {
          mutationResolverResourceID = ResolverResourceIDs.DynamoDBDeleteResolverResourceID(parent.name.value);
          mutationResolver = ctx.getResource(mutationResolverResourceID);
        }
        const getTemplateParts = [mutationResolver.Properties.ResponseMappingTemplate];
        if (!this.isOperationExpressionSet(mutationTypeName, mutationResolver.Properties.ResponseMappingTemplate)) {
          getTemplateParts.unshift(this.resources.setOperationExpression(mutationTypeName));
        }
        mutationResolver.Properties.ResponseMappingTemplate = getTemplateParts.join('\n\n');
        ctx.setResource(mutationResolverResourceID, mutationResolver);
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
    ctx: TransformerContext,
    resolverResourceId: string,
    rules: AuthRule[],
    parent: ObjectTypeDefinitionNode,
    modelConfiguration: ModelDirectiveConfiguration,
    field?: FieldDefinitionNode,
    subscriptionOperation?: ModelDirectiveOperationType
  ) {
    return this.protectUpdateOrDeleteMutation(
      ctx,
      resolverResourceId,
      rules,
      parent,
      modelConfiguration,
      true,
      field,
      field ? raw(`$ctx.args.input.containsKey("${field.name.value}")`) : undefined,
      subscriptionOperation
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
    ctx: TransformerContext,
    resolverResourceId: string,
    rules: AuthRule[],
    parent: ObjectTypeDefinitionNode,
    modelConfiguration: ModelDirectiveConfiguration,
    field?: FieldDefinitionNode,
    subscriptionOperation?: ModelDirectiveOperationType
  ) {
    return this.protectUpdateOrDeleteMutation(
      ctx,
      resolverResourceId,
      rules,
      parent,
      modelConfiguration,
      false,
      field,
      field
        ? raw(`$ctx.args.input.containsKey("${field.name.value}") && $util.isNull($ctx.args.input.get("${field.name.value}"))`)
        : undefined,
      subscriptionOperation
    );
  }

  /**
   * When read operations are protected via @auth, all @connection resolvers will be protected.
   * Find the directives & update their resolvers with auth logic
   */
  private protectConnections(
    ctx: TransformerContext,
    def: ObjectTypeDefinitionNode,
    rules: AuthRule[],
    modelConfiguration: ModelDirectiveConfiguration
  ) {
    const thisModelName = def.name.value;
    for (const inputDef of ctx.inputDocument.definitions) {
      if (inputDef.kind === Kind.OBJECT_TYPE_DEFINITION) {
        for (const field of inputDef.fields) {
          const returnTypeName = getBaseType(field.type);
          if (fieldHasDirective(field, 'connection') && returnTypeName === thisModelName) {
            const resolverResourceId = ResolverResourceIDs.ResolverResourceID(inputDef.name.value, field.name.value);

            // Add the auth directives to the connection to make sure the
            // member is accessible.
            const directives = this.getDirectivesForRules(rules, false);
            if (directives.length > 0) {
              this.addDirectivesToField(ctx, inputDef.name.value, field.name.value, directives);
            }

            if (isListType(field.type)) {
              this.protectListQuery(ctx, resolverResourceId, rules, null, modelConfiguration);
            } else {
              this.protectGetQuery(ctx, resolverResourceId, rules, null, modelConfiguration);
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
  private protectQueries(
    ctx: TransformerContext,
    def: ObjectTypeDefinitionNode,
    rules: AuthRule[],
    modelConfiguration: ModelDirectiveConfiguration
  ) {
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
      this.protectListQuery(ctx, resolverResourceId, rules, null, modelConfiguration, args.queryField);
    }
  }

  private protectSearchQuery(ctx: TransformerContext, def: ObjectTypeDefinitionNode, resolverResourceId: string, rules: AuthRule[]) {
    const resolver = ctx.getResource(resolverResourceId);
    if (!rules || rules.length === 0 || !resolver) {
      return;
    } else {
      const operationName = resolver.Properties.FieldName;
      const includeDefault = def !== null ? this.isTypeHasRulesForOperation(def, 'list') : false;
      const operationDirectives = this.getDirectivesForRules(rules, includeDefault);
      if (operationDirectives.length > 0) {
        this.addDirectivesToOperation(ctx, ctx.getQueryTypeName(), operationName, operationDirectives);
      }
      this.addFieldToResourceReferences(ctx.getQueryTypeName(), operationName, rules);
      // create auth expression
      const authExpression = this.authorizationExpressionForListResult(rules, 'es_items');
      if (authExpression) {
        const templateParts = [
          print(this.resources.makeESItemsExpression()),
          print(authExpression),
          print(this.resources.makeESToGQLExpression()),
        ];
        resolver.Properties.ResponseMappingTemplate = templateParts.join('\n\n');
        ctx.setResource(resolverResourceId, resolver);
      }
    }
  }

  protectSyncQuery(ctx: TransformerContext, def: ObjectTypeDefinitionNode, resolverResourceID: string, rules: AuthRule[]) {
    const resolver = ctx.getResource(resolverResourceID);
    if (!rules || rules.length === 0 || !resolver) {
      return;
    }
    const operationName = resolver.Properties.FieldName;
    const includeDefault = def !== null ? this.isTypeHasRulesForOperation(def, 'list') : false;
    const operationDirectives = this.getDirectivesForRules(rules, includeDefault);
    if (operationDirectives.length > 0) {
      this.addDirectivesToOperation(ctx, ctx.getQueryTypeName(), operationName, operationDirectives);
    }
    this.addFieldToResourceReferences(ctx.getQueryTypeName(), operationName, rules);
    // create auth expression
    const authExpression = this.authorizationExpressionForListResult(rules);
    if (authExpression) {
      const templateParts = [print(authExpression), resolver.Properties.ResponseMappingTemplate];
      resolver.Properties.ResponseMappingTemplate = templateParts.join('\n\n');
      ctx.setResource(resolverResourceID, resolver);
    }
  }

  // OnCreate Subscription
  private protectOnCreateSubscription(
    ctx: TransformerContext,
    rules: AuthRule[],
    parent: ObjectTypeDefinitionNode,
    modelConfiguration: ModelDirectiveConfiguration
  ) {
    const names = modelConfiguration.getNames('onCreate');
    const level = modelConfiguration.getName('level') as ModelSubscriptionLevel;
    if (names) {
      names.forEach(name => {
        this.addSubscriptionResolvers(ctx, rules, parent, level, name, 'create');
      });
    }
  }

  // OnUpdate Subscription
  private protectOnUpdateSubscription(
    ctx: TransformerContext,
    rules: AuthRule[],
    parent: ObjectTypeDefinitionNode,
    modelConfiguration: ModelDirectiveConfiguration
  ) {
    const names = modelConfiguration.getNames('onUpdate');
    const level = modelConfiguration.getName('level') as ModelSubscriptionLevel;
    if (names) {
      names.forEach(name => {
        this.addSubscriptionResolvers(ctx, rules, parent, level, name, 'update');
      });
    }
  }

  // OnDelete Subscription
  private protectOnDeleteSubscription(
    ctx: TransformerContext,
    rules: AuthRule[],
    parent: ObjectTypeDefinitionNode,
    modelConfiguration: ModelDirectiveConfiguration
  ) {
    const names = modelConfiguration.getNames('onDelete');
    const level = modelConfiguration.getName('level') as ModelSubscriptionLevel;
    if (names) {
      names.forEach(name => {
        this.addSubscriptionResolvers(ctx, rules, parent, level, name, 'delete');
      });
    }
  }

  // adds subscription resolvers (request / response) based on the operation provided
  private addSubscriptionResolvers(
    ctx: TransformerContext,
    rules: AuthRule[],
    parent: ObjectTypeDefinitionNode,
    level: ModelSubscriptionLevel,
    fieldName: string,
    mutationOperation: ModelDirectiveOperationType
  ) {
    const resolverResourceId = ResolverResourceIDs.ResolverResourceID('Subscription', fieldName);
    const resolver = this.resources.generateSubscriptionResolver(fieldName);
    // If the data source does not exist it is created and added as a resource for public && on levels
    const noneDS = ctx.getResource(ResourceConstants.RESOURCES.NoneDataSource);

    // add the rules in the subscription resolver
    if (!rules || rules.length === 0) {
      return;
    } else if (level === 'public') {
      // set the resource with no auth logic
      ctx.setResource(resolverResourceId, resolver);
    } else {
      // Get the directives we need to add to the GraphQL nodes
      const includeDefault = parent !== null ? this.isTypeHasRulesForOperation(parent, mutationOperation) : false;
      const directives = this.getDirectivesForRules(rules, includeDefault);

      if (directives.length > 0) {
        this.addDirectivesToField(ctx, ctx.getSubscriptionTypeName(), fieldName, directives);
      }

      this.addFieldToResourceReferences(ctx.getSubscriptionTypeName(), fieldName, rules);

      // Break the rules out by strategy.
      const staticGroupAuthorizationRules = this.getStaticGroupRules(rules);
      const ownerAuthorizationRules = this.getOwnerRules(rules);
      const providerAuthorization = this.hasProviderAuthRules(rules);

      if ((staticGroupAuthorizationRules.length > 0 || ownerAuthorizationRules.length > 0) && providerAuthorization === false) {
        const staticGroupAuthorizationExpression = this.resources.staticGroupAuthorizationExpression(staticGroupAuthorizationRules);
        const ownerAuthorizationExpression = this.resources.ownerAuthorizationExpressionForSubscriptions(ownerAuthorizationRules);

        const throwIfUnauthorizedExpression = this.resources.throwIfSubscriptionUnauthorized();

        // Populate a list of configured authentication providers based on the rules
        const authModesToCheck = new Set<AuthProvider>();
        const expressions: Array<Expression> = new Array();

        if (ownerAuthorizationRules.find(r => r.provider === 'userPools') || staticGroupAuthorizationRules.length > 0) {
          authModesToCheck.add('userPools');
        }
        if (ownerAuthorizationRules.find(r => r.provider === 'oidc')) {
          authModesToCheck.add('oidc');
        }

        // If we've any modes to check, then add the authMode check code block
        // to the start of the resolver.
        if (authModesToCheck.size > 0) {
          const isUserPoolTheDefault = this.configuredAuthProviders.default === 'userPools';
          expressions.push(this.resources.getAuthModeDeterminationExpression(authModesToCheck, isUserPoolTheDefault));
        }

        const authCheckExpressions = [
          staticGroupAuthorizationExpression,
          newline(),
          ownerAuthorizationExpression,
          newline(),
          throwIfUnauthorizedExpression,
        ];

        // Create the authMode if block and add it to the resolver
        expressions.push(this.resources.getAuthModeCheckWrappedExpression(authModesToCheck, compoundExpression(authCheckExpressions)));

        const templateParts = [print(compoundExpression(expressions)), resolver.Properties.ResponseMappingTemplate];

        resolver.Properties.ResponseMappingTemplate = templateParts.join('\n\n');
        ctx.setResource(resolverResourceId, resolver);

        // check if owner is enabled in auth
        const ownerRules = rules.filter(rule => rule.allow === OWNER_AUTH_STRATEGY);
        const needsDefaultOwnerField = ownerRules.find(rule => !rule.ownerField);
        const hasStaticGroupAuth = rules.find(rule => rule.allow === GROUPS_AUTH_STRATEGY && !rule.groupsField);
        if (ownerRules) {
          // if there is an owner rule without ownerField add the owner field in the type
          if (needsDefaultOwnerField) {
            this.addOwner(ctx, parent.name.value);
          }
          // If static group is specified in any of the rules then it would specify the owner arg(s) as optional
          const makeNonNull = hasStaticGroupAuth ? false : true;
          this.addSubscriptionOwnerArgument(ctx, resolver, ownerRules, makeNonNull);
        }
      }
    }
    // If the subscription level is set to public it adds the subscription resolver with no auth logic
    if (!noneDS) {
      ctx.setResource(ResourceConstants.RESOURCES.NoneDataSource, this.resources.noneDataSource());
    }
    // finally map the resource to the stack
    ctx.mapResourceToStack(parent.name.value, resolverResourceId);
  }

  private addSubscriptionOwnerArgument(ctx: TransformerContext, resolver: Resolver, ownerRules: AuthRule[], makeNonNull: boolean = false) {
    let subscription = ctx.getSubscription();
    let createField: FieldDefinitionNode = subscription.fields.find(
      field => field.name.value === resolver.Properties.FieldName
    ) as FieldDefinitionNode;
    const nameNode: any = makeNonNull ? makeNonNullType(makeNamedType('String')) : makeNamedType('String');
    // const createArguments = [makeInputValueDefinition(DEFAULT_OWNER_FIELD, nameNode)];
    const ownerArgumentList = ownerRules.map(rule => {
      return makeInputValueDefinition(rule.ownerField || DEFAULT_OWNER_FIELD, nameNode);
    });
    createField = {
      ...createField,
      arguments: ownerArgumentList,
    };
    subscription = {
      ...subscription,
      fields: subscription.fields.map(field => (field.name.value === resolver.Properties.FieldName ? createField : field)),
    };
    ctx.putType(subscription);
  }

  private addOwner(ctx: TransformerContext, parent: string) {
    const modelType: any = ctx.getType(parent);
    const fields = getFieldArguments(modelType);
    if (!('owner' in fields)) {
      modelType.fields.push(makeField(DEFAULT_OWNER_FIELD, [], makeNamedType('String')));
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

  public hasProviderAuthRules(rules: AuthRule[]): Boolean {
    return rules.filter(rule => rule.provider === 'userPools' && (rule.allow === 'public' || rule.allow === 'private')).length > 0;
  }

  private extendTypeWithDirectives(ctx: TransformerContext, typeName: string, directives: DirectiveNode[]) {
    let objectTypeExtension = blankObjectExtension(typeName);

    objectTypeExtension = extensionWithDirectives(objectTypeExtension, directives);

    ctx.addObjectExtension(objectTypeExtension);
  }

  private addDirectivesToOperation(ctx: TransformerContext, typeName: string, operationName: string, directives: DirectiveNode[]) {
    // Add the directives to the given operation
    this.addDirectivesToField(ctx, typeName, operationName, directives);

    // Add the directives to the result type of the operation;
    const type = ctx.getType(typeName) as ObjectTypeDefinitionNode;

    if (type) {
      const field = type.fields.find(f => f.name.value === operationName);

      if (field) {
        const returnFieldType = field.type as NamedTypeNode;

        if (returnFieldType.name) {
          const returnTypeName = returnFieldType.name.value;

          this.extendTypeWithDirectives(ctx, returnTypeName, directives);
        }
      }
    }
  }

  private addDirectivesToField(ctx: TransformerContext, typeName: string, fieldName: string, directives: DirectiveNode[]) {
    const type = ctx.getType(typeName) as ObjectTypeDefinitionNode;

    if (type) {
      const field = type.fields.find(f => f.name.value === fieldName);

      if (field) {
        const newFields = [...type.fields.filter(f => f.name.value !== field.name.value), extendFieldWithDirectives(field, directives)];

        const newMutation = {
          ...type,
          fields: newFields,
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

    const addDirectiveIfNeeded = (provider: AuthProvider, directiveName: string) => {
      if (
        (this.configuredAuthProviders.default !== provider && Boolean(rules.find(r => r.provider === provider))) ||
        (this.configuredAuthProviders.default === provider &&
          Boolean(rules.find(r => r.provider !== provider && addDefaultIfNeeded === true)))
      ) {
        directives.push(makeDirective(directiveName, []));
      }
    };

    const authProviderDirectiveMap = new Map<AuthProvider, string>([
      ['apiKey', 'aws_api_key'],
      ['iam', 'aws_iam'],
      ['oidc', 'aws_oidc'],
      ['userPools', 'aws_cognito_user_pools'],
    ]);

    for (const entry of authProviderDirectiveMap.entries()) {
      addDirectiveIfNeeded(entry[0], entry[1]);
    }

    //
    // If we've any rules for other than the default provider AND
    // we've rules for the default provider as well add the default provider's
    // directive, regardless of the addDefaultIfNeeded flag.
    //
    // For example if we've this rule and the default is API_KEY:
    //
    // @auth(rules: [{allow: owner},{allow: public, operations: [read]}])
    //
    // Then we need to add @aws_api_key on the create mutation together with the
    // @aws_cognito_useR_pools, but we cannot add @was_api_key to other operations
    // since that is not allowed by the rule.
    //

    if (
      Boolean(rules.find(r => r.provider === this.configuredAuthProviders.default)) &&
      Boolean(
        rules.find(r => r.provider !== this.configuredAuthProviders.default) &&
          !Boolean(directives.find(d => d.name.value === authProviderDirectiveMap.get(this.configuredAuthProviders.default)))
      )
    ) {
      directives.push(makeDirective(authProviderDirectiveMap.get(this.configuredAuthProviders.default), []));
    }

    return directives;
  }

  private ensureDefaultAuthProviderAssigned(rules: AuthRule[]) {
    // We assign the default provider if an override is not present make further handling easier.
    for (const rule of rules) {
      if (!rule.provider) {
        switch (rule.allow) {
          case 'owner':
          case 'groups':
            rule.provider = 'userPools';
            break;
          case 'private':
            rule.provider = 'userPools';
            break;
          case 'public':
            rule.provider = 'apiKey';
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

    if (rule.allow === 'groups' && rule.provider !== 'userPools') {
      throw new InvalidDirectiveError(
        `@auth directive with 'groups' strategy only supports 'userPools' provider, but found '${rule.provider}' assigned.`
      );
    }

    //
    // Owner
    //

    if (rule.allow === 'owner') {
      if (rule.provider !== null && rule.provider !== 'userPools' && rule.provider !== 'oidc') {
        throw new InvalidDirectiveError(
          `@auth directive with 'owner' strategy only supports 'userPools' (default) and 'oidc' providers, but \
found '${rule.provider}' assigned.`
        );
      }
    }

    //
    // Public
    //

    if (rule.allow === 'public') {
      if (rule.provider !== null && rule.provider !== 'apiKey' && rule.provider !== 'iam') {
        throw new InvalidDirectiveError(
          `@auth directive with 'public' strategy only supports 'apiKey' (default) and 'iam' providers, but \
found '${rule.provider}' assigned.`
        );
      }
    }

    //
    // Private
    //

    if (rule.allow === 'private') {
      if (rule.provider !== null && rule.provider !== 'userPools' && rule.provider !== 'iam') {
        throw new InvalidDirectiveError(
          `@auth directive with 'private' strategy only supports 'userPools' (default) and 'iam' providers, but \
found '${rule.provider}' assigned.`
        );
      }
    }

    //
    // Validate provider values against project configuration.
    //

    if (rule.provider === 'apiKey' && this.configuredAuthProviders.hasApiKey === false) {
      throw new InvalidDirectiveError(
        `@auth directive with 'apiKey' provider found, but the project has no API Key authentication provider configured.`
      );
    } else if (rule.provider === 'oidc' && this.configuredAuthProviders.hasOIDC === false) {
      throw new InvalidDirectiveError(
        `@auth directive with 'oidc' provider found, but the project has no OPENID_CONNECT authentication provider configured.`
      );
    } else if (rule.provider === 'userPools' && this.configuredAuthProviders.hasUserPools === false) {
      throw new InvalidDirectiveError(
        `@auth directive with 'userPools' provider found, but the project has no Cognito User Pools authentication provider configured.`
      );
    } else if (rule.provider === 'iam' && this.configuredAuthProviders.hasIAM === false) {
      throw new InvalidDirectiveError(
        `@auth directive with 'iam' provider found, but the project has no IAM authentication provider configured.`
      );
    }
  }

  private getConfiguredAuthProviders(): ConfiguredAuthProviders {
    const providers = [
      this.config.authConfig.defaultAuthentication.authenticationType,
      ...this.config.authConfig.additionalAuthenticationProviders.map(p => p.authenticationType),
    ];

    const getAuthProvider = (authType: AppSyncAuthMode): AuthProvider => {
      switch (authType) {
        case 'AMAZON_COGNITO_USER_POOLS':
          return 'userPools';
        case 'API_KEY':
          return 'apiKey';
        case 'AWS_IAM':
          return 'iam';
        case 'OPENID_CONNECT':
          return 'oidc';
      }
    };

    return {
      default: getAuthProvider(this.config.authConfig.defaultAuthentication.authenticationType),
      onlyDefaultAuthProviderConfigured: this.config.authConfig.additionalAuthenticationProviders.length === 0,
      hasApiKey: providers.find(p => p === 'API_KEY') ? true : false,
      hasUserPools: providers.find(p => p === 'AMAZON_COGNITO_USER_POOLS') ? true : false,
      hasOIDC: providers.find(p => p === 'OPENID_CONNECT') ? true : false,
      hasIAM: providers.find(p => p === 'AWS_IAM') ? true : false,
    };
  }

  private setAuthPolicyFlag(rules: AuthRule[]): void {
    if (!rules || rules.length === 0 || this.generateIAMPolicyforAuthRole === true) {
      return;
    }

    for (const rule of rules) {
      if ((rule.allow === 'private' || rule.allow === 'public') && rule.provider === 'iam') {
        this.generateIAMPolicyforAuthRole = true;
        return;
      }
    }
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

  private getAuthRulesFromDirective(directive: DirectiveNode): AuthRule[] {
    const get = (s: string) => (arg: ArgumentNode) => arg.name.value === s;
    const getArg = (arg: string, dflt?: any) => {
      const argument = directive.arguments.find(get(arg));
      return argument ? valueFromASTUntyped(argument.value) : dflt;
    };

    // Get and validate the auth rules.
    return getArg('rules', []) as AuthRule[];
  }

  private isTypeNeedsDefaultProviderAccess(def: ObjectTypeDefinitionNode): boolean {
    const authDirective = def.directives.find(dir => dir.name.value === 'auth');
    if (!authDirective) {
      return true;
    }

    // Get and validate the auth rules.
    const rules = this.getAuthRulesFromDirective(authDirective);
    // Assign default providers to rules where no provider was explicitly defined
    this.ensureDefaultAuthProviderAssigned(rules);

    return Boolean(rules.find(r => r.provider === this.configuredAuthProviders.default));
  }

  private isTypeHasRulesForOperation(def: ObjectTypeDefinitionNode, operation: ModelDirectiveOperationType): boolean {
    const authDirective = def.directives.find(dir => dir.name.value === 'auth');
    if (!authDirective) {
      return false;
    }

    // Get and validate the auth rules.
    const rules = this.getAuthRulesFromDirective(authDirective);
    // Assign default providers to rules where no provider was explicitly defined
    this.ensureDefaultAuthProviderAssigned(rules);

    const { operationRules, queryRules } = this.splitRules(rules);

    const hasRulesForDefaultProvider = (operationRules: AuthRule[]) => {
      return Boolean(operationRules.find(r => r.provider === this.configuredAuthProviders.default));
    };

    switch (operation) {
      case 'create':
        return hasRulesForDefaultProvider(operationRules.create);
      case 'update':
        return hasRulesForDefaultProvider(operationRules.update);
      case 'delete':
        return hasRulesForDefaultProvider(operationRules.delete);
      case 'get':
        return hasRulesForDefaultProvider(operationRules.read) || hasRulesForDefaultProvider(queryRules.get);
      case 'list':
        return hasRulesForDefaultProvider(operationRules.read) || hasRulesForDefaultProvider(queryRules.list);
    }

    return false;
  }

  private addTypeToResourceReferences(typeName: string, rules: AuthRule[]): void {
    const iamPublicRules = rules.filter(r => r.allow === 'public' && r.provider === 'iam');
    const iamPrivateRules = rules.filter(r => r.allow === 'private' && r.provider === 'iam');

    if (iamPublicRules.length > 0) {
      this.unauthPolicyResources.add(`${typeName}/null`);
      this.authPolicyResources.add(`${typeName}/null`);
    }
    if (iamPrivateRules.length > 0) {
      this.authPolicyResources.add(`${typeName}/null`);
    }
  }

  private addFieldToResourceReferences(typeName: string, fieldName: string, rules: AuthRule[]): void {
    const iamPublicRules = rules.filter(r => r.allow === 'public' && r.provider === 'iam');
    const iamPrivateRules = rules.filter(r => r.allow === 'private' && r.provider === 'iam');

    if (iamPublicRules.length > 0) {
      this.unauthPolicyResources.add(`${typeName}/${fieldName}`);
      this.authPolicyResources.add(`${typeName}/${fieldName}`);
    }
    if (iamPrivateRules.length > 0) {
      this.authPolicyResources.add(`${typeName}/${fieldName}`);
    }
  }

  private isOperationExpressionSet(operationTypeName: string, template: string): boolean {
    return template.includes(`$context.result.operation = "${operationTypeName}"`);
  }

  private updateMutationConditionInput(ctx: TransformerContext, type: ObjectTypeDefinitionNode, rules: Array<AuthRule>): void {
    // Get the existing ModelXConditionInput
    const tableXMutationConditionInputName = ModelResourceIDs.ModelConditionInputTypeName(type.name.value);

    if (this.typeExist(tableXMutationConditionInputName, ctx)) {
      const tableXMutationConditionInput = <InputObjectTypeDefinitionNode>ctx.getType(tableXMutationConditionInputName);

      const fieldNames = new Set<String>();

      // Get auth related field names from @auth directive rules
      const getAuthFieldNames = (): void => {
        if (rules.length > 0) {
          // Process owner rules
          const ownerRules = this.getOwnerRules(rules);
          const ownerFieldNameArgs = ownerRules.filter(rule => !!rule.ownerField).map(rule => rule.ownerField);

          ownerFieldNameArgs.forEach((f: string) => fieldNames.add(f));

          // Add 'owner' to field list if we've owner rules without ownerField argument
          if (ownerRules.find(rule => !rule.ownerField)) {
            fieldNames.add('owner');
          }

          // Process owner rules
          const groupsRules = rules.filter(rule => rule.allow === 'groups');
          const groupFieldNameArgs = groupsRules.filter(rule => !!rule.groupsField).map(rule => rule.groupsField);

          groupFieldNameArgs.forEach((f: string) => fieldNames.add(f));

          // Add 'groups' to field list if we've groups rules without groupsField argument
          if (groupsRules.find(rule => !rule.groupsField)) {
            fieldNames.add('groups');
          }
        }
      };

      getAuthFieldNames();

      if (fieldNames.size > 0) {
        const reducedFields = tableXMutationConditionInput.fields.filter(field => !fieldNames.has(field.name.value));

        const updatedInput = {
          ...tableXMutationConditionInput,
          fields: reducedFields,
        };

        ctx.putType(updatedInput);
      }
    }
  }

  private typeExist(type: string, ctx: TransformerContext): boolean {
    return Boolean(type in ctx.nodeMap);
  }

  private isSyncEnabled(ctx: TransformerContext, typeName: string): boolean {
    const resolverConfig = ctx.getResolverConfig();
    if (resolverConfig && resolverConfig.project) {
      return true;
    }
    if (resolverConfig && resolverConfig.models && resolverConfig.models[typeName]) {
      return true;
    }
    return false;
  }
}

function fieldHasDirective(field: FieldDefinitionNode, directiveName: string): boolean {
  return (
    field.directives && field.directives.length && Boolean(field.directives.find((d: DirectiveNode) => d.name.value === directiveName))
  );
}

function isTruthyOrNull(obj: any): boolean {
  return obj || obj === null;
}

function isUndefined(obj: any): boolean {
  return obj === undefined;
}
