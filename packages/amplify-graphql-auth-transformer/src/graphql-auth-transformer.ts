import {
  DirectiveWrapper,
  TransformerContractError,
  TransformerAuthBase,
  InvalidDirectiveError,
  MappingTemplate,
  IAM_AUTH_ROLE_PARAMETER,
  IAM_UNAUTH_ROLE_PARAMETER,
  TransformerResolver,
  getTable,
  getKeySchema,
} from '@aws-amplify/graphql-transformer-core';
import {
  DataSourceProvider,
  MutationFieldType,
  QueryFieldType,
  TransformerTransformSchemaStepContextProvider,
  TransformerContextProvider,
  TransformerResolverProvider,
  TransformerSchemaVisitStepContextProvider,
  TransformerAuthProvider,
  TransformerBeforeStepContextProvider,
} from '@aws-amplify/graphql-transformer-interfaces';
import {
  DirectiveNode,
  FieldDefinitionNode,
  ObjectTypeDefinitionNode,
  InterfaceTypeDefinitionNode,
  Kind,
  TypeDefinitionNode,
  ListValueNode,
  StringValueNode,
} from 'graphql';
import { SubscriptionLevel, ModelDirectiveConfiguration } from '@aws-amplify/graphql-model-transformer';
import {
  getBaseType,
  makeDirective,
  makeField,
  makeNamedType,
  ResourceConstants,
  ModelResourceIDs,
  ResolverResourceIDs,
  toUpper,
} from 'graphql-transformer-common';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import { getConnectionAttributeName } from '@aws-amplify/graphql-relational-transformer';
import {
  generateAuthExpressionForCreate,
  generateAuthExpressionForUpdate,
  generateAuthRequestExpression,
  generateAuthExpressionForDelete,
  generateAuthExpressionForField,
  generateFieldAuthResponse,
  generateAuthExpressionForQueries,
  generateAuthExpressionForSearchQueries,
  generateAuthExpressionForSubscriptions,
  setDeniedFieldFlag,
  generateAuthExpressionForRelationQuery,
  generateSandboxExpressionForField,
  generateFieldResolverForOwner,
} from './resolvers';
import { AccessControlMatrix } from './accesscontrol';
import {
  AUTH_PROVIDER_DIRECTIVE_MAP,
  DEFAULT_GROUP_CLAIM,
  DEFAULT_IDENTITY_CLAIM,
  DEFAULT_UNIQUE_IDENTITY_CLAIM,
  DEFAULT_GROUPS_FIELD,
  DEFAULT_OWNER_FIELD,
  MODEL_OPERATIONS,
  SEARCHABLE_AGGREGATE_TYPES,
  AuthRule,
  authDirectiveDefinition,
  ConfiguredAuthProviders,
  getConfiguredAuthProviders,
  AuthTransformerConfig,
  collectFieldNames,
  ModelOperation,
  getModelConfig,
  validateFieldRules,
  validateRules,
  AuthProvider,
  extendTypeWithDirectives,
  RoleDefinition,
  addDirectivesToOperation,
  createPolicyDocumentForManagedPolicy,
  getQueryFieldNames,
  getMutationFieldNames,
  addSubscriptionArguments,
  fieldIsList,
  getSubscriptionFieldNames,
  addDirectivesToField,
  getSearchableConfig,
  getStackForField,
  NONE_DS,
  hasRelationalDirective,
  getPartitionKey,
  getRelationalPrimaryMap,
  getReadRolesForField,
  getAuthDirectiveRules,
} from './utils';
import { showDefaultIdentityClaimWarning } from './utils/warnings';

// @ auth
// changing the schema
//  - transformSchema
// adding resolver
//  - generateResolver
// editing IAM policy
//  - generateResolver (cdk)
// resolver mapping

// resolver.ts for auth pipeline slots

/**
 * The class for running the @auth transformer
 */
export class AuthTransformer extends TransformerAuthBase implements TransformerAuthProvider {
  private config: AuthTransformerConfig;
  private configuredAuthProviders: ConfiguredAuthProviders;
  private useSubForDefaultIdentityClaim: boolean;
  private rules: AuthRule[];
  // access control
  private roleMap: Map<string, RoleDefinition>;
  private authModelConfig: Map<string, AccessControlMatrix>;
  private authNonModelConfig: Map<string, AccessControlMatrix>;
  // model config
  private modelDirectiveConfig: Map<string, ModelDirectiveConfiguration>;
  // schema generation
  private seenNonModelTypes: Map<string, Set<string>>;
  // iam policy generation
  private generateIAMPolicyForUnauthRole: boolean;
  private generateIAMPolicyForAuthRole: boolean;
  private authPolicyResources = new Set<string>();
  private unauthPolicyResources = new Set<string>();

  /**
   * constructor for creating AuthTransformer
   */
  constructor(config: AuthTransformerConfig = {}) {
    super('amplify-auth-transformer', authDirectiveDefinition);
    this.config = config;
    this.modelDirectiveConfig = new Map();
    this.seenNonModelTypes = new Map();
    this.authModelConfig = new Map();
    this.roleMap = new Map();
    this.generateIAMPolicyForUnauthRole = false;
    this.generateIAMPolicyForAuthRole = false;
    this.authNonModelConfig = new Map();
    this.rules = [];
  }

  before = (context: TransformerBeforeStepContextProvider): void => {
    // if there was no auth config in the props we add the authConfig from the context
    this.config.authConfig = this.config.authConfig ?? context.authConfig;
    this.configuredAuthProviders = getConfiguredAuthProviders(this.config);
    this.useSubForDefaultIdentityClaim = context.featureFlags?.getBoolean('useSubUsernameForDefaultIdentityClaim');
  };

  object = (def: ObjectTypeDefinitionNode, directive: DirectiveNode, context: TransformerSchemaVisitStepContextProvider): void => {
    const modelDirective = def.directives?.find(dir => dir.name.value === 'model');
    if (!modelDirective) {
      throw new TransformerContractError('Types annotated with @auth must also be annotated with @model.');
    }
    const typeName = def.name.value;
    let isJoinType = false;
    // check if type is a joinedType
    if (context.metadata.has('joinTypeList')) {
      isJoinType = context.metadata.get<Array<string>>('joinTypeList')!.includes(typeName);
    }
    const rules: AuthRule[] = getAuthDirectiveRules(new DirectiveWrapper(directive));
    this.rules = rules;

    // validate rules
    validateRules(rules, this.configuredAuthProviders, def.name.value);
    // create access control for object
    const acm = new AccessControlMatrix({
      name: def.name.value,
      operations: MODEL_OPERATIONS,
      resources: collectFieldNames(def),
    });
    // Check the rules to see if we should generate Auth/Unauth Policies
    this.setAuthPolicyFlag(rules);
    this.setUnauthPolicyFlag(rules);
    // add object into policy
    this.addTypeToResourceReferences(def.name.value, rules);
    // turn rules into roles and add into acm and roleMap
    this.convertRulesToRoles(acm, rules, isJoinType, undefined, undefined, context);
    this.modelDirectiveConfig.set(typeName, getModelConfig(modelDirective, typeName, context.isProjectUsingDataStore()));
    this.authModelConfig.set(typeName, acm);
  };

  after = (context: TransformerContextProvider): void => {
    showDefaultIdentityClaimWarning(context, this.rules);
  };

  field = (
    parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    field: FieldDefinitionNode,
    directive: DirectiveNode,
    context: TransformerSchemaVisitStepContextProvider,
  ): void => {
    if (parent.kind === Kind.INTERFACE_TYPE_DEFINITION) {
      throw new InvalidDirectiveError(
        `The @auth directive cannot be placed on an interface's field. See ${parent.name.value}${field.name.value}`,
      );
    }
    const isParentTypeBuiltinType = parent.name.value === context.output.getQueryTypeName()
      || parent.name.value === context.output.getMutationTypeName()
      || parent.name.value === context.output.getSubscriptionTypeName();

    if (isParentTypeBuiltinType) {
      console.warn(
        'Be careful when using @auth directives on a field in a root type. @auth directives on field definitions use the source '
        + 'object to perform authorization logic and the source will be an empty object for fields on root types. '
        + 'Static group authorization should perform as expected.',
      );
    }
    // context.api.host.resolver
    // context.resolver -> resolver manager -> dynamodb, relation directives, searchable
    // creates field resolver

    const modelDirective = parent.directives?.find(dir => dir.name.value === 'model');
    const typeName = parent.name.value;
    const fieldName = field.name.value;
    const rules: AuthRule[] = getAuthDirectiveRules(new DirectiveWrapper(directive));
    validateFieldRules(new DirectiveWrapper(directive), isParentTypeBuiltinType, modelDirective !== undefined, field.name.value);
    validateRules(rules, this.configuredAuthProviders, field.name.value);

    // regardless if a model directive is used we generate the policy for iam auth
    this.setAuthPolicyFlag(rules);
    this.setUnauthPolicyFlag(rules);
    this.addFieldToResourceReferences(parent.name.value, field.name.value, rules);

    if (modelDirective) {
      // auth on models
      let acm: AccessControlMatrix;
      // check if the parent is already in the model config if not add it
      if (!this.modelDirectiveConfig.has(typeName)) {
        this.modelDirectiveConfig.set(typeName, getModelConfig(modelDirective, typeName, context.isProjectUsingDataStore()));
        acm = new AccessControlMatrix({
          name: parent.name.value,
          operations: MODEL_OPERATIONS,
          resources: collectFieldNames(parent),
        });
      } else {
        acm = this.authModelConfig.get(typeName) as AccessControlMatrix;
        acm.resetAccessForResource(fieldName);
      }
      this.convertRulesToRoles(acm, rules, false, fieldName, undefined, context);
      this.authModelConfig.set(typeName, acm);
    } else {
      // if @auth is used without @model only generate static group rules in the resolver
      // since we only protect the field for non models we store the typeName + fieldName
      // in the authNonModelTypes map
      const staticRules = rules.filter((rule: AuthRule) => rule.allow !== 'owner' && !rule.groupsField);
      const typeFieldName = `${typeName}:${fieldName}`;
      const acm = new AccessControlMatrix({
        name: typeFieldName,
        operations: ['read'],
        resources: [typeFieldName],
      });
      this.convertRulesToRoles(acm, staticRules, false, typeFieldName, ['read']);
      this.authNonModelConfig.set(typeFieldName, acm);
    }
  };

  transformSchema = (context: TransformerTransformSchemaStepContextProvider): void => {
    const searchableAggregateServiceDirectives = new Set<AuthProvider>();
    const getOwnerFields = (acm: AccessControlMatrix): string[] => acm.getRoles().reduce((prev: string[], role: string) => {
      if (this.roleMap.get(role)!.strategy === 'owner') prev.push(this.roleMap.get(role)!.entity!);
      return prev;
    }, []);
    this.authModelConfig.forEach((acm, modelName) => {
      const def = context.output.getObject(modelName)!;
      const modelHasSearchable = def.directives.some(dir => dir.name.value === 'searchable');
      // collect ownerFields and them in the model
      AuthTransformer.addFieldsToObject(context, modelName, getOwnerFields(acm));
      // Get the directives we need to add to the GraphQL nodes
      const providers = this.getAuthProviders(acm.getRoles());
      const directives = this.getServiceDirectives(providers, providers.length === 0 ? this.shouldAddDefaultServiceDirective() : false);
      if (modelHasSearchable) {
        providers.forEach(p => searchableAggregateServiceDirectives.add(p));
      }
      if (directives.length > 0) {
        extendTypeWithDirectives(context, modelName, directives);
      }
      this.protectSchemaOperations(context, def, acm);
      this.propagateAuthDirectivesToNestedTypes(context, context.output.getObject(modelName)!, providers);
    });
    this.authNonModelConfig.forEach((acm, typeFieldName) => {
      // protect the non model field
      const [typeName, fieldName] = typeFieldName.split(':');
      const providers = this.getAuthProviders(acm.getRoles());
      const directives = this.getServiceDirectives(providers, false);
      if (directives.length > 0) {
        addDirectivesToField(context, typeName, fieldName, directives);
      }
    });
    // add the service directives to the searchable aggregate types
    if (searchableAggregateServiceDirectives.size > 0) {
      const serviceDirectives = this.getServiceDirectives(Array.from(searchableAggregateServiceDirectives), false);
      SEARCHABLE_AGGREGATE_TYPES.forEach(aggType => {
        extendTypeWithDirectives(context, aggType, serviceDirectives);
      });
    }
  };

  generateResolvers = (context: TransformerContextProvider): void => {
    // generate iam policies
    this.generateIAMPolicies(context);
    // generate auth resolver code
    this.authModelConfig.forEach((acm, modelName) => {
      const indexKeyName = `${modelName}:indicies`;
      const def = context.output.getObject(modelName)!;
      const modelNameConfig = this.modelDirectiveConfig.get(modelName);
      const searchableDirective = def.directives.find(dir => dir.name.value === 'searchable');
      const readRoles = acm.getRolesPerOperation('read');
      const roleDefinitions = readRoles.map(role => this.roleMap.get(role)!);

      const queryFields = getQueryFieldNames(this.modelDirectiveConfig.get(modelName)!);
      queryFields.forEach(query => {
        switch (query.type) {
          case QueryFieldType.GET:
            this.protectGetResolver(context, def, query.typeName, query.fieldName, acm);
            break;
          case QueryFieldType.LIST:
            this.protectListResolver(context, def, query.typeName, query.fieldName, acm);
            break;
          case QueryFieldType.SYNC:
            this.protectSyncResolver(context, def, query.typeName, query.fieldName, acm);
            break;
          default:
            throw new TransformerContractError('Unknown query field type');
        }
      });
      // protect additional query fields if they exist
      if (context.metadata.has(indexKeyName)) {
        context.metadata.get<Set<string>>(indexKeyName)!.forEach(index => {
          const [indexName, indexQueryName] = index.split(':');
          this.protectListResolver(context, def, def.name.value, indexQueryName, acm, indexName);
        });
      }
      // check if searchable if included in the typeName
      if (searchableDirective) {
        // protect search query
        const config = getSearchableConfig(searchableDirective, modelName);
        this.protectSearchResolver(context, def, context.output.getQueryTypeName()!, config.queries.search, acm);
      }
      // get fields specified in the schema
      // if there is a role that does not have read access on the field then we create a field resolver
      // or there is a relational directive on the field then we should protect that as well
      const modelFields = def.fields?.filter(f => acm.hasResource(f.name.value)) ?? [];
      const errorFields = new Array<string>();
      modelFields.forEach(field => {
        const fieldReadRoles = getReadRolesForField(acm, readRoles, field.name.value);
        const allowedRoles = fieldReadRoles.filter(r => acm.isAllowed(r, field.name.value, 'read'));
        const needsFieldResolver = allowedRoles.length < fieldReadRoles.length;
        if (needsFieldResolver && field.type.kind === Kind.NON_NULL_TYPE) {
          errorFields.push(field.name.value);
        }
        if (hasRelationalDirective(field)) {
          this.protectRelationalResolver(context, def, modelName, field, needsFieldResolver ? allowedRoles : null);
        } else if (needsFieldResolver) {
          this.protectFieldResolver(context, def, modelName, field.name.value, allowedRoles);
        }
      });
      if (errorFields.length > 0 && modelNameConfig.subscriptions?.level === SubscriptionLevel.on) {
        throw new InvalidDirectiveError(
          `Because "${def.name.value}" has a field-level authorization rule and subscriptions are enabled,`
            + ` you need to either apply field-level authorization rules to all required fields where all rules have read access ${JSON.stringify(
              errorFields,
            )}, make those fields nullable, or disable subscriptions for "${def.name.value}" (setting level to off or public).`,
        );
      }
      const mutationFields = getMutationFieldNames(this.modelDirectiveConfig.get(modelName)!);
      mutationFields.forEach(mutation => {
        switch (mutation.type) {
          case MutationFieldType.CREATE:
            this.protectCreateResolver(context, def, mutation.typeName, mutation.fieldName, acm);
            break;
          case MutationFieldType.UPDATE:
            this.protectUpdateResolver(context, def, mutation.typeName, mutation.fieldName, acm);
            break;
          case MutationFieldType.DELETE:
            this.protectDeleteResolver(context, def, mutation.typeName, mutation.fieldName, acm);
            break;
          default:
            throw new TransformerContractError('Unknown Mutation field type');
        }
      });

      const subscriptionFieldNames = getSubscriptionFieldNames(this.modelDirectiveConfig.get(modelName)!);
      const subscriptionRoles = roleDefinitions
        // for subscriptions we only use static rules or owner rule where the field is not a list
        .filter(roleDef => (roleDef.strategy === 'owner' && !fieldIsList(def.fields ?? [], roleDef.entity!)) || roleDef.static);
      subscriptionFieldNames.forEach(subscription => {
        this.protectSubscriptionResolver(context, subscription.typeName, subscription.fieldName, subscriptionRoles);
      });

      roleDefinitions.forEach(role => {
        if (role.strategy === 'owner') {
          this.addFieldResolverForDynamicAuth(context, def, modelName, role.entity);
        }
      });
    });

    this.authNonModelConfig.forEach((acm, typeFieldName) => {
      // field resolvers
      const [typeName, fieldName] = typeFieldName.split(':');
      const def = context.output.getObject(typeName);
      this.protectFieldResolver(context, def, typeName, fieldName, acm.getRoles());
    });
  };

  addFieldResolverForDynamicAuth = (
    ctx: TransformerContextProvider,
    def: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
  ): void => {
    let resolver = ctx.resolvers.getResolver(typeName, fieldName);

    if (resolver) {
      resolver.addToSlot(
        'finish',
        undefined,
        MappingTemplate.s3MappingTemplateFromString(
          generateFieldResolverForOwner(fieldName),
          `${typeName}.${fieldName}.{slotName}.{slotIndex}.res.vtl`,
        ),
      );
    } else {
      const hasModelDirective = def.directives.some(dir => dir.name.value === 'model');
      const stack = getStackForField(ctx, def, fieldName, hasModelDirective);

      resolver = ctx.resolvers.addResolver(
        typeName,
        fieldName,
        new TransformerResolver(
          typeName,
          fieldName,
          ResolverResourceIDs.ResolverResourceID(typeName, fieldName),
          MappingTemplate.s3MappingTemplateFromString('$util.toJson({"version":"2018-05-29","payload":{}})', `${typeName}.${fieldName}.req.vtl`),
          MappingTemplate.s3MappingTemplateFromString(generateFieldResolverForOwner(fieldName), `${typeName}.${fieldName}.res.vtl`),
          ['init'],
          ['finish'],
        ),
      );

      resolver.mapToStack(stack);
    }
  };

  protectSchemaOperations = (
    ctx: TransformerTransformSchemaStepContextProvider,
    def: ObjectTypeDefinitionNode,
    acm: AccessControlMatrix,
  ): void => {
    const modelConfig = this.modelDirectiveConfig.get(def.name.value)!;
    const indexKeyName = `${def.name.value}:indicies`;
    const searchableDirective = def.directives.find(dir => dir.name.value === 'searchable');
    const addServiceDirective = (typeName: string, operation: ModelOperation, operationName: string | null = null): void => {
      if (operationName) {
        const includeDefault = this.doesTypeHaveRulesForOperation(acm, operation);
        const providers = this.getAuthProviders(acm.getRolesPerOperation(operation, operation === 'delete'));
        const operationDirectives = this.getServiceDirectives(providers, includeDefault);
        if (operationDirectives.length > 0) {
          addDirectivesToOperation(ctx, typeName, operationName, operationDirectives);
        }
        this.addOperationToResourceReferences(typeName, operationName, acm.getRoles());
      }
    };
    // default model operations
    addServiceDirective(ctx.output.getQueryTypeName()!, 'read', modelConfig?.queries?.get);
    addServiceDirective(ctx.output.getQueryTypeName()!, 'read', modelConfig?.queries?.list);
    addServiceDirective(ctx.output.getQueryTypeName()!, 'read', modelConfig?.queries?.sync);
    addServiceDirective(ctx.output.getMutationTypeName()!, 'create', modelConfig?.mutations?.create);
    addServiceDirective(ctx.output.getMutationTypeName()!, 'update', modelConfig?.mutations?.update);
    addServiceDirective(ctx.output.getMutationTypeName()!, 'delete', modelConfig?.mutations?.delete);
    // @index queries
    if (ctx.metadata.has(indexKeyName)) {
      ctx.metadata.get<Set<string>>(indexKeyName)!.forEach(index => {
        addServiceDirective(ctx.output.getQueryTypeName(), 'read', index.split(':')[1]);
      });
    }
    // @searchable
    if (searchableDirective) {
      const config = getSearchableConfig(searchableDirective, def.name.value);
      addServiceDirective(ctx.output.getQueryTypeName(), 'read', config.queries.search);
    }

    const subscriptions = modelConfig?.subscriptions;
    if (subscriptions?.level === SubscriptionLevel.on) {
      const subscriptionArguments = acm
        .getRolesPerOperation('read')
        .map(role => this.roleMap.get(role)!)
        .filter(roleDef => roleDef.strategy === 'owner' && !fieldIsList(def.fields ?? [], roleDef.entity!));
      if (subscriptions.onCreate && modelConfig?.mutations?.create) {
        subscriptions.onCreate.forEach(onCreateSub => {
          addServiceDirective(ctx.output.getSubscriptionTypeName()!, 'read', onCreateSub);
          addSubscriptionArguments(ctx, onCreateSub, subscriptionArguments);
        });
      }
      if (subscriptions.onUpdate && modelConfig?.mutations?.update) {
        subscriptions.onUpdate.forEach(onUpdateSub => {
          addServiceDirective(ctx.output.getSubscriptionTypeName()!, 'read', onUpdateSub);
          addSubscriptionArguments(ctx, onUpdateSub, subscriptionArguments);
        });
      }
      if (subscriptions.onDelete && modelConfig?.mutations?.delete) {
        subscriptions.onDelete.forEach(onDeleteSub => {
          addServiceDirective(ctx.output.getSubscriptionTypeName()!, 'read', onDeleteSub);
          addSubscriptionArguments(ctx, onDeleteSub, subscriptionArguments);
        });
      }
    }
  };

  protectGetResolver = (
    ctx: TransformerContextProvider,
    def: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    acm: AccessControlMatrix,
  ): void => {
    const resolver = ctx.resolvers.getResolver(typeName, fieldName) as TransformerResolverProvider;
    const roleDefinitions = acm.getRolesPerOperation('read').map(r => this.roleMap.get(r)!);
    const tableKeySchema = getTable(ctx, def).keySchema;
    const primaryFields = tableKeySchema.map(att => att.attributeName);
    const primaryKey = getPartitionKey(tableKeySchema);
    const authExpression = generateAuthExpressionForQueries(
      this.configuredAuthProviders,
      roleDefinitions,
      def.fields ?? [],
      primaryFields,
      false,
      primaryKey,
    );
    resolver.addToSlot(
      'auth',
      MappingTemplate.s3MappingTemplateFromString(authExpression, `${typeName}.${fieldName}.{slotName}.{slotIndex}.req.vtl`),
    );
  };

  protectListResolver = (
    ctx: TransformerContextProvider,
    def: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    acm: AccessControlMatrix,
    indexName?: string,
  ): void => {
    const resolver = ctx.resolvers.getResolver(typeName, fieldName) as TransformerResolverProvider;
    const roleDefinitions = acm.getRolesPerOperation('read').map(r => this.roleMap.get(r)!);
    let primaryFields: Array<string>;
    let partitionKey: string;
    const table = getTable(ctx, def);
    try {
      if (indexName) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        primaryFields = getKeySchema(table, indexName).map((att: any) => att.attributeName);
        /* eslint-enable */
      } else {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        primaryFields = table.keySchema.map((att: any) => att.attributeName);
        partitionKey = getPartitionKey(table.keySchema);
        /* eslint-enable */
      }
    } catch (err) {
      throw new InvalidDirectiveError(`Could not fetch keySchema for ${def.name.value}.`);
    }
    const authExpression = generateAuthExpressionForQueries(
      this.configuredAuthProviders,
      roleDefinitions,
      def.fields ?? [],
      primaryFields,
      !!indexName,
      partitionKey,
    );
    resolver.addToSlot(
      'auth',
      MappingTemplate.s3MappingTemplateFromString(authExpression, `${typeName}.${fieldName}.{slotName}.{slotIndex}.req.vtl`),
    );
  };

  protectRelationalResolver = (
    ctx: TransformerContextProvider,
    def: ObjectTypeDefinitionNode,
    typeName: string,
    field: FieldDefinitionNode,
    fieldRoles: Array<string> | null,
  ): void => {
    let fieldAuthExpression: string;
    let relatedAuthExpression: string;
    const relatedModelObject = AuthTransformer.getRelatedModelObject(ctx, getBaseType(field.type));
    if (this.authModelConfig.has(relatedModelObject.name.value)) {
      const acm = this.authModelConfig.get(relatedModelObject.name.value);
      const roleDefinitions = acm.getRolesPerOperation('read').map(r => this.roleMap.get(r)!);
      const relationalPrimaryMap = getRelationalPrimaryMap(ctx, def, field, relatedModelObject);
      relatedAuthExpression = generateAuthExpressionForRelationQuery(
        this.configuredAuthProviders,
        roleDefinitions,
        relatedModelObject.fields ?? [],
        relationalPrimaryMap,
      );
    } else {
      // if the related @model does not have auth we need to add a sandbox mode expression
      relatedAuthExpression = generateSandboxExpressionForField(ctx.sandboxModeEnabled);
    }
    // if there is field auth on the relational query then we need to add field auth read rules first
    // in the request we then add the rules of the related type
    if (fieldRoles) {
      const roleDefinitions = fieldRoles.map(r => this.roleMap.get(r)!);
      const hasSubsEnabled = this.modelDirectiveConfig.get(typeName)!.subscriptions?.level === 'on';
      relatedAuthExpression = `${setDeniedFieldFlag('Mutation', hasSubsEnabled)}\n${relatedAuthExpression}`;
      fieldAuthExpression = generateAuthExpressionForField(this.configuredAuthProviders, roleDefinitions, def.fields ?? []);
    }
    const resolver = ctx.resolvers.getResolver(typeName, field.name.value) as TransformerResolverProvider;
    if (fieldAuthExpression) {
      resolver.addToSlot(
        'auth',
        MappingTemplate.s3MappingTemplateFromString(fieldAuthExpression, `${typeName}.${field.name.value}.{slotName}.{slotIndex}.req.vtl`),
        MappingTemplate.s3MappingTemplateFromString(
          relatedAuthExpression,
          `${typeName}.${field.name.value}.{slotName}.{slotIndex}.res.vtl`,
        ),
      );
    } else {
      resolver.addToSlot(
        'auth',
        MappingTemplate.s3MappingTemplateFromString(
          relatedAuthExpression,
          `${typeName}.${field.name.value}.{slotName}.{slotIndex}.req.vtl`,
        ),
      );
    }
  };

  protectSyncResolver = (
    ctx: TransformerContextProvider,
    def: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    acm: AccessControlMatrix,
  ): void => {
    if (ctx.isProjectUsingDataStore()) {
      const resolver = ctx.resolvers.getResolver(typeName, fieldName) as TransformerResolverProvider;
      const roleDefinitions = acm.getRolesPerOperation('read').map(r => this.roleMap.get(r)!);
      const primaryFields = getTable(ctx, def).keySchema.map(att => att.attributeName);
      const authExpression = generateAuthExpressionForQueries(
        this.configuredAuthProviders,
        roleDefinitions,
        def.fields ?? [],
        primaryFields,
      );
      resolver.addToSlot(
        'auth',
        MappingTemplate.s3MappingTemplateFromString(authExpression, `${typeName}.${fieldName}.{slotName}.{slotIndex}.req.vtl`),
      );
    }
  };

  /*
  Searchable Auth
  Protects
    - Search Query
    - Agg Query
  */
  protectSearchResolver = (
    ctx: TransformerContextProvider,
    def: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    acm: AccessControlMatrix,
  ): void => {
    const acmFields = acm.getResources();
    const modelFields = def.fields ?? [];
    // only add readonly fields if they exist
    const allowedAggFields = modelFields.map(f => f.name.value).filter(f => !acmFields.includes(f));
    let leastAllowedFields = acmFields;
    const resolver = ctx.resolvers.getResolver(typeName, fieldName) as TransformerResolverProvider;
    // to protect search and aggregation queries we need to collect all the roles which can query
    // and the allowed fields to run field auth on aggregation queries
    const readRoleDefinitions = acm.getRolesPerOperation('read').map(role => {
      const allowedFields = acmFields.filter(resource => acm.isAllowed(role, resource, 'read'));
      const roleDefinition = this.roleMap.get(role)!;
      // we add the allowed fields if the role does not have full access
      // or if the rule is a dynamic rule (ex. ownerField, groupField)
      if (allowedFields.length !== acmFields.length || !roleDefinition.static) {
        roleDefinition.allowedFields = allowedFields;
        leastAllowedFields = leastAllowedFields.filter(f => allowedFields.includes(f));
      } else {
        roleDefinition.allowedFields = null;
      }
      return roleDefinition;
    });
    // add readonly fields with all the fields every role has access to
    allowedAggFields.push(...leastAllowedFields);
    const authExpression = generateAuthExpressionForSearchQueries(
      this.configuredAuthProviders,
      readRoleDefinitions,
      modelFields,
      allowedAggFields,
    );
    resolver.addToSlot(
      'auth',
      MappingTemplate.s3MappingTemplateFromString(authExpression, `${typeName}.${fieldName}.{slotName}.{slotIndex}.req.vtl`),
    );
  };

  /*
  Field Resovler can protect the following
  - model fields
  - fields on an operation (query/mutation)
  - protection on predictions/function/no directive
  Order of precendence
  - resolver in api host (ex. @function, @predictions)
  - no resolver -> creates a blank resolver will return the source field
  */
  protectFieldResolver = (
    ctx: TransformerContextProvider,
    def: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    roles: Array<string>,
  ): void => {
    const roleDefinitions = roles.map(r => this.roleMap.get(r)!);
    const hasModelDirective = def.directives.some(dir => dir.name.value === 'model');
    const stack = getStackForField(ctx, def, fieldName, hasModelDirective);
    if (ctx.api.host.hasResolver(typeName, fieldName)) {
      // TODO: move pipeline resolvers created in the api host to the resolver manager
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const fieldResolver = ctx.api.host.getResolver(typeName, fieldName) as any;
      /* eslint-enable */
      const fieldAuthExpression = generateAuthExpressionForField(this.configuredAuthProviders, roleDefinitions, [], fieldName);
      if (!ctx.api.host.hasDataSource(NONE_DS)) {
        ctx.api.host.addNoneDataSource(NONE_DS);
      }
      const authFunction = ctx.api.host.addAppSyncFunction(
        `${toUpper(typeName)}${toUpper(fieldName)}AuthFN`,
        MappingTemplate.s3MappingTemplateFromString(fieldAuthExpression, `${typeName}.${fieldName}.auth.req.vtl`),
        MappingTemplate.inlineTemplateFromString('$util.toJson({})'),
        NONE_DS,
        stack,
      );
      (fieldResolver.pipelineConfig.functions as string[]).unshift(authFunction.functionId);
    } else {
      const fieldAuthExpression = generateAuthExpressionForField(
        this.configuredAuthProviders,
        roleDefinitions,
        def.fields ?? [],
        fieldName,
      );
      const subsEnabled = hasModelDirective ? this.modelDirectiveConfig.get(typeName)!.subscriptions?.level === 'on' : false;
      const fieldResponse = generateFieldAuthResponse('Mutation', fieldName, subsEnabled);
      const resolver = ctx.resolvers.addResolver(
        typeName,
        fieldName,
        new TransformerResolver(
          typeName,
          fieldName,
          ResolverResourceIDs.ResolverResourceID(typeName, fieldName),
          MappingTemplate.s3MappingTemplateFromString(fieldAuthExpression, `${typeName}.${fieldName}.req.vtl`),
          MappingTemplate.s3MappingTemplateFromString(fieldResponse, `${typeName}.${fieldName}.res.vtl`),
          ['init'],
          ['finish'],
        ),
      );
      resolver.mapToStack(stack);
    }
  };

  protectCreateResolver = (
    ctx: TransformerContextProvider,
    def: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    acm: AccessControlMatrix,
  ): void => {
    const resolver = ctx.resolvers.getResolver(typeName, fieldName) as TransformerResolverProvider;
    const fields = acm.getResources();
    const createRoles = acm.getRolesPerOperation('create').map(role => {
      const roleDefinition = this.roleMap.get(role)!;
      const allowedFields = fields.filter(resource => acm.isAllowed(role, resource, 'create'));
      roleDefinition.areAllFieldsAllowed = allowedFields.length === fields.length;
      roleDefinition.allowedFields = this.addAutoGeneratedFields(ctx, def, allowedFields, fields);
      return roleDefinition;
    });
    const authExpression = generateAuthExpressionForCreate(this.configuredAuthProviders, createRoles, def.fields ?? []);
    resolver.addToSlot(
      'auth',
      MappingTemplate.s3MappingTemplateFromString(authExpression, `${typeName}.${fieldName}.{slotName}.{slotIndex}.req.vtl`),
    );
  };

  protectUpdateResolver = (
    ctx: TransformerContextProvider,
    def: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    acm: AccessControlMatrix,
  ): void => {
    const resolver = ctx.resolvers.getResolver(typeName, fieldName) as TransformerResolverProvider;
    const fields = acm.getResources();
    const updateDeleteRoles = [...new Set([...acm.getRolesPerOperation('update'), ...acm.getRolesPerOperation('delete')])];
    // protect fields to be updated and fields that can't be set to null (partial delete on fields)
    const totalRoles = updateDeleteRoles.map(role => {
      const allowedFields = fields.filter(resource => acm.isAllowed(role, resource, 'update'));
      const nullAllowedFields = fields.filter(resource => acm.isAllowed(role, resource, 'delete'));
      const roleDefinition = this.roleMap.get(role)!;
      roleDefinition.areAllFieldsAllowed = allowedFields.length === fields.length;
      roleDefinition.areAllFieldsNullAllowed = nullAllowedFields.length === fields.length;
      roleDefinition.allowedFields = this.addAutoGeneratedFields(ctx, def, allowedFields, fields);
      roleDefinition.nullAllowedFields = nullAllowedFields;

      return roleDefinition;
    });
    const dataSource = ctx.api.host.getDataSource(`${def.name.value}Table`) as DataSourceProvider;
    const requestExpression = generateAuthRequestExpression();
    const authExpression = generateAuthExpressionForUpdate(this.configuredAuthProviders, totalRoles, def.fields ?? []);
    resolver.addToSlot(
      'auth',
      MappingTemplate.s3MappingTemplateFromString(requestExpression, `${typeName}.${fieldName}.{slotName}.{slotIndex}.req.vtl`),
      MappingTemplate.s3MappingTemplateFromString(authExpression, `${typeName}.${fieldName}.{slotName}.{slotIndex}.res.vtl`),
      dataSource,
    );
  };

  protectDeleteResolver = (
    ctx: TransformerContextProvider,
    def: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    acm: AccessControlMatrix,
  ): void => {
    const resolver = ctx.resolvers.getResolver(typeName, fieldName) as TransformerResolverProvider;
    // only roles with full delete on every field can delete
    const deleteRoles = acm.getRolesPerOperation('delete', true).map(role => this.roleMap.get(role)!);
    const dataSource = ctx.api.host.getDataSource(`${def.name.value}Table`) as DataSourceProvider;
    const requestExpression = generateAuthRequestExpression();
    const authExpression = generateAuthExpressionForDelete(this.configuredAuthProviders, deleteRoles, def.fields ?? []);
    resolver.addToSlot(
      'auth',
      MappingTemplate.s3MappingTemplateFromString(requestExpression, `${typeName}.${fieldName}.{slotName}.{slotIndex}.req.vtl`),
      MappingTemplate.s3MappingTemplateFromString(authExpression, `${typeName}.${fieldName}.{slotName}.{slotIndex}.res.vtl`),
      dataSource,
    );
  };

  protectSubscriptionResolver = (
    ctx: TransformerContextProvider,
    typeName: string,
    fieldName: string,
    subscriptionRoles: Array<RoleDefinition>,
  ): void => {
    const resolver = ctx.resolvers.getResolver(typeName, fieldName) as TransformerResolverProvider;
    const authExpression = generateAuthExpressionForSubscriptions(this.configuredAuthProviders, subscriptionRoles);
    resolver.addToSlot(
      'auth',
      MappingTemplate.s3MappingTemplateFromString(authExpression, `${typeName}.${fieldName}.{slotName}.{slotIndex}.req.vtl`),
    );
  };

  /*
  Role Helpers
  */
  private convertRulesToRoles(
    acm: AccessControlMatrix,
    authRules: AuthRule[],
    allowRoleOverwrite: boolean,
    field?: string,
    overrideOperations?: ModelOperation[],
    context?: TransformerSchemaVisitStepContextProvider,
  ): void {
    authRules.forEach(rule => {
      const operations: ModelOperation[] = overrideOperations || rule.operations || MODEL_OPERATIONS;
      if (rule.groups && !rule.groupsField) {
        rule.groups.forEach(group => {
          const groupClaim = rule.groupClaim || DEFAULT_GROUP_CLAIM;
          const roleName = `${rule.provider}:staticGroup:${group}:${groupClaim}`;
          if (!(roleName in this.roleMap)) {
            this.roleMap.set(roleName, {
              provider: rule.provider!,
              strategy: rule.allow,
              static: true,
              claim: groupClaim,
              entity: group,
            });
          }
          acm.setRole({
            role: roleName, resource: field, operations, allowRoleOverwrite,
          });
        });
      } else {
        let roleName: string;
        let roleDefinition: RoleDefinition;
        switch (rule.provider) {
          case 'apiKey':
            roleName = 'apiKey:public';
            roleDefinition = { provider: rule.provider, strategy: rule.allow, static: true };
            break;
          case 'function':
            roleName = 'function:custom';
            roleDefinition = { provider: rule.provider, strategy: rule.allow, static: true };
            break;
          case 'iam':
            roleName = `iam:${rule.allow}`;
            roleDefinition = {
              provider: rule.provider,
              strategy: rule.allow,
              static: true,
              claim: rule.allow === 'private' ? 'authRole' : 'unauthRole',
            };
            break;
          case 'oidc':
          case 'userPools':
            if (rule.allow === 'groups') {
              const groupClaim = rule.groupClaim || DEFAULT_GROUP_CLAIM;
              const groupsField = rule.groupsField || DEFAULT_GROUPS_FIELD;
              roleName = `${rule.provider}:dynamicGroup:${groupsField}:${groupClaim}`;
              roleDefinition = {
                provider: rule.provider,
                strategy: rule.allow,
                static: false,
                claim: groupClaim,
                entity: groupsField,
              };
            } else if (rule.allow === 'owner') {
              const ownerField = rule.ownerField || DEFAULT_OWNER_FIELD;
              const useSub = context.featureFlags.getBoolean('useSubUsernameForDefaultIdentityClaim');
              const ownerClaim = rule.identityClaim || (useSub ? DEFAULT_UNIQUE_IDENTITY_CLAIM : DEFAULT_IDENTITY_CLAIM);
              roleName = `${rule.provider}:owner:${ownerField}:${ownerClaim}`;
              roleDefinition = {
                provider: rule.provider,
                strategy: rule.allow,
                static: false,
                claim: ownerClaim,
                entity: ownerField,
              };
            } else if (rule.allow === 'private') {
              roleName = `${rule.provider}:${rule.allow}`;
              roleDefinition = {
                provider: rule.provider,
                strategy: rule.allow,
                static: true,
              };
            } else {
              throw new TransformerContractError(`Could not create a role from ${JSON.stringify(rule)}`);
            }
            break;
          default:
            throw new TransformerContractError(`Could not create a role from ${JSON.stringify(rule)}`);
        }
        if (!(roleName in this.roleMap)) {
          this.roleMap.set(roleName, roleDefinition);
        }
        acm.setRole({
          role: roleName, resource: field, operations, allowRoleOverwrite,
        });
      }
    });
  }

  private doesTypeHaveRulesForOperation(acm: AccessControlMatrix, operation: ModelOperation): boolean {
    const rolesHasDefaultProvider = (
      roles: Array<string>,
    ): boolean => roles.some(r => this.roleMap.get(r)!.provider! === this.configuredAuthProviders.default);
    const roles = acm.getRolesPerOperation(operation, operation === 'delete');
    return rolesHasDefaultProvider(roles) || (roles.length === 0 && this.shouldAddDefaultServiceDirective());
  }

  private getAuthProviders(roles: Array<string>): Array<AuthProvider> {
    const providers: Set<AuthProvider> = new Set();
    // get the roles created for type
    roles.forEach(role => providers.add(this.roleMap.get(role)!.provider));
    if (this.configuredAuthProviders.hasAdminRolesEnabled) {
      providers.add('iam');
    }
    return Array.from(providers);
  }

  /**
   * Helper method to get related model object
   */
  static getRelatedModelObject(ctx: TransformerContextProvider, typeName: string): ObjectTypeDefinitionNode | undefined {
    const modelObjectName: string = ModelResourceIDs.IsModelConnectionType(typeName)
      ? ModelResourceIDs.GetModelFromConnectionType(typeName)
      : typeName;
    if (!ctx.output.hasType(modelObjectName)) {
      throw new TransformerContractError(`Could not find type: ${modelObjectName}`);
    } else {
      return ctx.output.getObject(modelObjectName);
    }
  }

  /**
   * Helper method to add fields to object
   */
  static addFieldsToObject(ctx: TransformerTransformSchemaStepContextProvider, modelName: string, ownerFields: string[]): void {
    const modelObject = ctx.output.getObject(modelName)!;
    const existingFields = collectFieldNames(modelObject);
    const ownerFieldsToAdd = ownerFields.filter(field => !existingFields.includes(field));
    ownerFieldsToAdd.forEach(ownerField => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      (modelObject as any).fields.push(makeField(ownerField, [], makeNamedType('String')));
      /* eslint-enable */
    });
    ctx.output.putType(modelObject);
  }

  private propagateAuthDirectivesToNestedTypes(
    ctx: TransformerTransformSchemaStepContextProvider,
    def: ObjectTypeDefinitionNode,
    providers: Array<AuthProvider>,
  ): void {
    const nonModelTypePredicate = (fieldType: TypeDefinitionNode): TypeDefinitionNode | undefined => {
      if (fieldType) {
        if (fieldType.kind !== 'ObjectTypeDefinition') {
          return undefined;
        }
        const typeModel = fieldType.directives!.find(dir => dir.name.value === 'model');
        return typeModel !== undefined ? undefined : fieldType;
      }
      return fieldType;
    };
    const nonModelFieldTypes = def
      .fields!.map(f => ctx.output.getType(getBaseType(f.type)) as TypeDefinitionNode)
      .filter(nonModelTypePredicate);

    nonModelFieldTypes.forEach(nonModelFieldType => {
      const nonModelName = nonModelFieldType.name.value;
      const hasSeenType = this.seenNonModelTypes.has(nonModelFieldType.name.value);
      let directives = this.getServiceDirectives(providers, hasSeenType);
      if (!hasSeenType) {
        this.seenNonModelTypes.set(nonModelName, new Set<string>([...directives.map(dir => dir.name.value)]));
        // since we haven't seen this type before we add it to the iam policy resource sets
        const hasIAM = directives.some(dir => dir.name.value === 'aws_iam') || this.configuredAuthProviders.default === 'iam';
        if (hasIAM) {
          this.unauthPolicyResources.add(`${nonModelFieldType.name.value}/null`);
          this.authPolicyResources.add(`${nonModelFieldType.name.value}/null`);
        }
      } else {
        const currentDirectives = this.seenNonModelTypes.get(nonModelName)!;
        directives = directives.filter(dir => !currentDirectives.has(dir.name.value));
        this.seenNonModelTypes.set(nonModelName, new Set<string>([...directives.map(dir => dir.name.value), ...currentDirectives]));
      }
      // we continue to check the nested types if we find that directives list is not empty or if haven't seen the type before
      if (directives.length > 0 || !hasSeenType) {
        extendTypeWithDirectives(ctx, nonModelFieldType.name.value, directives);
        this.propagateAuthDirectivesToNestedTypes(ctx, <ObjectTypeDefinitionNode>nonModelFieldType, providers);
      }
    });
  }

  private getServiceDirectives(providers: Readonly<Array<AuthProvider>>, addDefaultIfNeeded = true): Array<DirectiveNode> {
    if (providers.length === 0) {
      return [];
    }
    const directives: Array<DirectiveNode> = [];
    /*
      We only add a service directive if it's not the default or
      it's the default but there are other rules under different providers.
      For fields we don't we don't add the default since it would open up access.
    */
    const addDirectiveIfNeeded = (provider: AuthProvider, directiveName: string): void => {
      if (
        (this.configuredAuthProviders.default !== provider && providers.some(p => p === provider))
        || (this.configuredAuthProviders.default === provider && providers.some(p => p !== provider && addDefaultIfNeeded === true))
      ) {
        directives.push(makeDirective(directiveName, []));
      }
    };

    AUTH_PROVIDER_DIRECTIVE_MAP.forEach((directiveName, authProvider) => {
      addDirectiveIfNeeded(authProvider, directiveName);
    });
    /*
      If we have any rules for the default provider AND those with other providers,
      we add the default provider directive, regardless of the addDefaultDirective value

      For example if we have this rule and the default is API_KEY
      @auth(rules: [{ allow: owner }, { allow: public, operations: [read] }])

      Then we need to add @aws_api_key on the queries along with @aws_cognito_user_pools, but we
      cannot add @aws_api_key to other operations since their is no rule granted access to it
    */
    if (
      providers.some(p => p === this.configuredAuthProviders.default)
      && providers.some(p => p !== this.configuredAuthProviders.default)
      && !directives.some(d => d.name.value === AUTH_PROVIDER_DIRECTIVE_MAP.get(this.configuredAuthProviders.default))
    ) {
      directives.push(makeDirective(AUTH_PROVIDER_DIRECTIVE_MAP.get(this.configuredAuthProviders.default) as string, []));
    }
    return directives;
  }

  /**
   * When AdminUI is enabled, all the types and operations get IAM auth. If the default auth mode is
   * not IAM all the fields will need to have the default auth mode directive to ensure both IAM and default
   * auth modes are allowed to access
   * default auth provider needs to be added if AdminUI is enabled and default auth type is not IAM
   */
  private shouldAddDefaultServiceDirective(): boolean {
    return (
      this.configuredAuthProviders.hasAdminRolesEnabled && this.config.authConfig.defaultAuthentication.authenticationType !== 'AWS_IAM'
    );
  }

  /*
  IAM Helpers
   */
  private generateIAMPolicies(ctx: TransformerContextProvider): void {
    // iam
    if (this.generateIAMPolicyForAuthRole) {
      // Sanity check to make sure we're not generating invalid policies, where no resources are defined.
      if (this.authPolicyResources.size === 0) {
        // When AdminUI is enabled, IAM auth is added but it does not need any policies to be generated
        if (!this.configuredAuthProviders.hasAdminRolesEnabled) {
          throw new TransformerContractError('AuthRole policies should be generated, but no resources were added.');
        }
      } else {
        const authRoleParameter = (ctx.stackManager.getParameter(IAM_AUTH_ROLE_PARAMETER) as cdk.CfnParameter).valueAsString;
        const authPolicyDocuments = createPolicyDocumentForManagedPolicy(this.authPolicyResources);
        const { rootStack } = ctx.stackManager;
        // we need to add the arn path as this is something cdk is looking for when using imported roles in policies
        const iamAuthRoleArn = iam.Role.fromRoleArn(
          rootStack,
          'auth-role-name',
          `arn:aws:iam::${cdk.Stack.of(rootStack).account}:role/${authRoleParameter}`,
        );
        for (let i = 0; i < authPolicyDocuments.length; i += 1) {
          const paddedIndex = `${i + 1}`.padStart(2, '0');
          const resourceName = `${ResourceConstants.RESOURCES.AuthRolePolicy}${paddedIndex}`;
          /* eslint-disable no-new */
          new iam.ManagedPolicy(rootStack, resourceName, {
            document: iam.PolicyDocument.fromJson(authPolicyDocuments[i]),
            roles: [iamAuthRoleArn],
          });
          /* eslint-enable */
        }
      }
    }
    if (this.generateIAMPolicyForUnauthRole) {
      // Sanity check to make sure we're not generating invalid policies, where no resources are defined.
      if (this.unauthPolicyResources.size === 0) {
        throw new TransformerContractError('UnauthRole policies should be generated, but no resources were added');
      }
      const unauthRoleParameter = (ctx.stackManager.getParameter(IAM_UNAUTH_ROLE_PARAMETER) as cdk.CfnParameter).valueAsString;
      const unauthPolicyDocuments = createPolicyDocumentForManagedPolicy(this.unauthPolicyResources);
      const { rootStack } = ctx.stackManager;
      const iamUnauthRoleArn = iam.Role.fromRoleArn(
        rootStack,
        'unauth-role-name',
        `arn:aws:iam::${cdk.Stack.of(rootStack).account}:role/${unauthRoleParameter}`,
      );
      for (let i = 0; i < unauthPolicyDocuments.length; i += 1) {
        const paddedIndex = `${i + 1}`.padStart(2, '0');
        const resourceName = `${ResourceConstants.RESOURCES.UnauthRolePolicy}${paddedIndex}`;
        /* eslint-disable no-new */
        new iam.ManagedPolicy(ctx.stackManager.rootStack, resourceName, {
          document: iam.PolicyDocument.fromJson(unauthPolicyDocuments[i]),
          roles: [iamUnauthRoleArn],
        });
        /* eslint-enable */
      }
    }
  }

  private setAuthPolicyFlag(rules: AuthRule[]): void {
    if (rules.length === 0 || this.generateIAMPolicyForAuthRole === true) {
      return;
    }
    rules.forEach(rule => {
      if ((rule.allow === 'private' || rule.allow === 'public') && rule.provider === 'iam') {
        this.generateIAMPolicyForAuthRole = true;
      }
    });
  }

  private setUnauthPolicyFlag(rules: AuthRule[]): void {
    if (rules.length === 0 || this.generateIAMPolicyForUnauthRole === true) {
      return;
    }
    rules.forEach(rule => {
      if (rule.allow === 'public' && rule.provider === 'iam') {
        this.generateIAMPolicyForUnauthRole = true;
      }
    });
  }

  private addOperationToResourceReferences(operationName: string, fieldName: string, roles: Array<string>): void {
    const iamPublicRolesExist = roles.some(r => this.roleMap.get(r)!.provider === 'iam' && this.roleMap.get(r)!.strategy === 'public');
    const iamPrivateRolesExist = roles.some(r => this.roleMap.get(r)!.provider === 'iam' && this.roleMap.get(r)!.strategy === 'private');

    if (iamPublicRolesExist) {
      this.unauthPolicyResources.add(`${operationName}/${fieldName}`);
      this.authPolicyResources.add(`${operationName}/${fieldName}`);
    }
    if (iamPrivateRolesExist) {
      this.authPolicyResources.add(`${operationName}/${fieldName}`);
    }
  }

  /**
   * TODO: Change Resource Ref Object/Field Functions to work with roles
   */
  private addTypeToResourceReferences(typeName: string, rules: AuthRule[]): void {
    const iamPublicRulesExist = rules.some(r => r.allow === 'public' && r.provider === 'iam' && r.generateIAMPolicy);
    const iamPrivateRulesExist = rules.some(r => r.allow === 'private' && r.provider === 'iam' && r.generateIAMPolicy);

    if (iamPublicRulesExist) {
      this.unauthPolicyResources.add(`${typeName}/null`);
      this.authPolicyResources.add(`${typeName}/null`);
    }
    if (iamPrivateRulesExist) {
      this.authPolicyResources.add(`${typeName}/null`);
    }
  }

  private addFieldToResourceReferences(typeName: string, fieldName: string, rules: AuthRule[]): void {
    const iamPublicRulesExist = rules.some(r => r.allow === 'public' && r.provider === 'iam' && r.generateIAMPolicy);
    const iamPrivateRulesExist = rules.some(r => r.allow === 'private' && r.provider === 'iam' && r.generateIAMPolicy);

    if (iamPublicRulesExist) {
      this.unauthPolicyResources.add(`${typeName}/${fieldName}`);
      this.authPolicyResources.add(`${typeName}/${fieldName}`);
    }
    if (iamPrivateRulesExist) {
      this.authPolicyResources.add(`${typeName}/${fieldName}`);
    }
  }

  /*
  Resolver Helpers
  */
  addAutoGeneratedFields = (
    ctx: TransformerContextProvider,
    def: ObjectTypeDefinitionNode,
    allowedFields: string[],
    fields: readonly string[],
  ): string[] => {
    const allowedFieldsSet = new Set(allowedFields);

    this.addAutoGeneratedRelationalFields(ctx, def, allowedFieldsSet, fields);
    this.addAutoGeneratedIndexFields(def, allowedFieldsSet);
    this.addAutoGeneratedDataStoreFields(ctx, allowedFieldsSet);

    return Array.from(allowedFieldsSet);
  };

  addAutoGeneratedRelationalFields = (
    ctx: TransformerContextProvider,
    def: ObjectTypeDefinitionNode,
    allowedFields: Set<string>,
    fields: readonly string[],
  ): void => {
    const typeDefinitions = ctx.inputDocument.definitions.filter(it => it.kind === 'ObjectTypeDefinition') as ObjectTypeDefinitionNode[];

    this.addAutoGeneratedHasManyFields(typeDefinitions, def, allowedFields);
    AuthTransformer.addAutoGeneratedHasOneFields(typeDefinitions, fields, def, allowedFields);
  };

  addAutoGeneratedIndexFields = (definition: ObjectTypeDefinitionNode, allowedFields: Set<string>): void => {
    const sortKeyFieldValues: ListValueNode[] = definition.fields
      ?.map(it => it.directives)
      .flat()
      .filter(it => it.name.value === 'primaryKey' || it.name.value === 'index')
      .map(it => it.arguments)
      .flat()
      .filter(it => it.name.value === 'sortKeyFields' && it.value.kind === 'ListValue' && it.value.values.length > 1)
      .map(it => it.value)
      .flat() as ListValueNode[];

    sortKeyFieldValues.forEach(sortKeyFieldValue => {
      const accessOnAllKeys = !sortKeyFieldValue.values.some(it => it.kind !== 'StringValue' || !allowedFields.has(it.value));
      if (accessOnAllKeys) {
        const keyName = sortKeyFieldValue.values
          .map(it => (it as StringValueNode).value)
          .join(ModelResourceIDs.ModelCompositeKeySeparator());
        allowedFields.add(keyName);
      }
    });
  };

  addAutoGeneratedHasManyFields = (
    typeDefinitions: ObjectTypeDefinitionNode[],
    def: ObjectTypeDefinitionNode,
    allowedFields: Set<string>,
  ): void => {
    const hasManyRelatedFields = typeDefinitions
      .map(it => it.fields.map(field => ({ ...field, relatedType: it.name.value })))
      .flat()
      .filter(it => getBaseType(it.type) === def.name.value && it.directives?.some(d => d.name.value === 'hasMany'));

    hasManyRelatedFields.forEach(relatedField => {
      allowedFields.add(getConnectionAttributeName(relatedField.relatedType, relatedField.name.value));
    });
  };

  /**
   * Helper to add auto generated @hasOne fields
   */
  static addAutoGeneratedHasOneFields(
    typeDefinitions: ObjectTypeDefinitionNode[],
    fields: readonly string[],
    def: ObjectTypeDefinitionNode,
    allowedFields: Set<string>,
  ): void {
    fields.forEach(field => {
      const modelField = def.fields.find(it => it.name.value === field);

      const directives = modelField.directives?.filter(
        dir => !dir.arguments?.some(it => it.name.value === 'fields') && (dir.name.value === 'hasOne' || dir.name.value === 'belongsTo'),
      );
      directives.forEach(directive => {
        if (directive.name.value === 'hasOne') {
          allowedFields.add(getConnectionAttributeName(def.name.value, field));
        } else if (directive.name.value === 'belongsTo') {
          const relatedType = typeDefinitions.find(
            it => it.name.value === getBaseType(modelField.type)
              && it.fields?.some(f => getBaseType(f.type) === def.name.value && f.directives?.some(d => d.name.value === 'hasOne')),
          );
          if (relatedType) {
            allowedFields.add(getConnectionAttributeName(def.name.value, field));
          }
        }
      });
    });
  }

  addAutoGeneratedDataStoreFields = (ctx: TransformerContextProvider, allowedFields: Set<string>): void => {
    const dataStoreFields = ctx.isProjectUsingDataStore() ? ['_version', '_deleted', '_lastChangedAt'] : [];
    dataStoreFields.forEach(item => allowedFields.add(item));
  };
}
