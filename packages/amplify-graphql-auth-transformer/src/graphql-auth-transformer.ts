import {
  DirectiveWrapper,
  TransformerContractError,
  TransformerAuthBase,
  InvalidDirectiveError,
  MappingTemplate,
  IAM_AUTH_ROLE_PARAMETER,
  IAM_UNAUTH_ROLE_PARAMETER,
  TransformerResolver,
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
  AuthRule,
  authDirectiveDefinition,
  ConfiguredAuthProviders,
  getConfiguredAuthProviders,
  AuthTransformerConfig,
  collectFieldNames,
  DEFAULT_GROUP_CLAIM,
  MODEL_OPERATIONS,
  ModelOperation,
  ensureAuthRuleDefaults,
  DEFAULT_IDENTITY_CLAIM,
  DEFAULT_GROUPS_FIELD,
  DEFAULT_OWNER_FIELD,
  getModelConfig,
  validateFieldRules,
  validateRules,
  AuthProvider,
  AUTH_PROVIDER_DIRECTIVE_MAP,
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
} from './utils';
import {
  DirectiveNode,
  FieldDefinitionNode,
  ObjectTypeDefinitionNode,
  InterfaceTypeDefinitionNode,
  Kind,
  TypeDefinitionNode,
} from 'graphql';
import { SubscriptionLevel, ModelDirectiveConfiguration } from '@aws-amplify/graphql-model-transformer';
import { AccessControlMatrix } from './accesscontrol';
import { getBaseType, makeDirective, makeField, makeNamedType, ResourceConstants } from 'graphql-transformer-common';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import {
  generateAuthExpressionForCreate,
  generateAuthExpressionForUpdate,
  generateAuthRequestExpression,
  geneateAuthExpressionForDelete,
  generateAuthExpressionForField,
  generateFieldAuthResponse,
  generateAuthExpressionForQueries,
  generateAuthExpressionForSubscriptions,
} from './resolvers';
import { toUpper } from 'graphql-transformer-common';

// @ auth
// changing the schema
//  - transformSchema
// adding resolver
//  - generateResolver
// editing IAM policy
//  - generateResolver (cdk)
// resolver mapping

// resolver.ts for auth pipeline slots

export class AuthTransformer extends TransformerAuthBase implements TransformerAuthProvider {
  private config: AuthTransformerConfig;
  private configuredAuthProviders: ConfiguredAuthProviders;
  // access control
  private roleMap: Map<string, RoleDefinition>;
  private authModelConfig: Map<string, AccessControlMatrix>;
  private authNonModelConfig: Map<string, AccessControlMatrix>;
  // model config
  private modelDirectiveConfig: Map<string, ModelDirectiveConfiguration>;
  // schema generation
  private seenNonModelTypes: Map<string, Set<string>>;
  // iam policy generation
  private generateIAMPolicyforUnauthRole: boolean;
  private generateIAMPolicyforAuthRole: boolean;
  private authPolicyResources = new Set<string>();
  private unauthPolicyResources = new Set<string>();

  constructor(config: AuthTransformerConfig) {
    super('amplify-auth-transformer', authDirectiveDefinition);
    this.config = config;
    this.modelDirectiveConfig = new Map();
    this.seenNonModelTypes = new Map();
    this.authModelConfig = new Map();
    this.roleMap = new Map();
    this.generateIAMPolicyforUnauthRole = false;
    this.generateIAMPolicyforAuthRole = false;
    this.authNonModelConfig = new Map();
  }

  before = (context: TransformerBeforeStepContextProvider): void => {
    // if there was no auth config in the props we add the authConfig from the context
    this.config.authConfig = this.config.authConfig || context.authConfig;
    this.configuredAuthProviders = getConfiguredAuthProviders(this.config);
  };

  object = (def: ObjectTypeDefinitionNode, directive: DirectiveNode, context: TransformerSchemaVisitStepContextProvider): void => {
    const modelDirective = def.directives?.find(dir => dir.name.value === 'model');
    if (!modelDirective) {
      throw new TransformerContractError('Types annotated with @auth must also be annotated with @model.');
    }
    const typeName = def.name.value;
    const authDir = new DirectiveWrapper(directive);
    const rules: AuthRule[] = authDir.getArguments<{ rules: Array<AuthRule> }>({ rules: [] }).rules;
    ensureAuthRuleDefaults(rules);
    // validate rules
    validateRules(rules, this.configuredAuthProviders);
    // create access control for object
    const acm = new AccessControlMatrix({
      operations: MODEL_OPERATIONS,
      resources: collectFieldNames(def),
    });
    // Check the rules to see if we should generate Auth/Unauth Policies
    this.setAuthPolicyFlag(rules);
    this.setUnauthPolicyFlag(rules);
    // add object into policy
    this.addTypeToResourceReferences(def.name.value, rules);
    // turn rules into roles and add into acm and roleMap
    this.convertRulesToRoles(acm, rules);
    this.modelDirectiveConfig.set(typeName, getModelConfig(modelDirective, typeName, context.isProjectUsingDataStore()));
    this.authModelConfig.set(typeName, acm);
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
    const isParentTypeBuiltinType =
      parent.name.value === context.output.getQueryTypeName() ||
      parent.name.value === context.output.getMutationTypeName() ||
      parent.name.value === context.output.getSubscriptionTypeName();

    if (isParentTypeBuiltinType) {
      console.warn(
        `Be careful when using @auth directives on a field in a root type. @auth directives on field definitions use the source \
object to perform authorization logic and the source will be an empty object for fields on root types. \
Static group authorization should perform as expected.`,
      );
    }
    // context.api.host.resolver
    // context.resolver -> resolver manager -> dynamodb, relation directives, searchable
    // creates field resolver

    const modelDirective = parent.directives?.find(dir => dir.name.value === 'model');
    const typeName = parent.name.value;
    const fieldName = field.name.value;
    const authDir = new DirectiveWrapper(directive);
    const rules: AuthRule[] = authDir.getArguments<{ rules: Array<AuthRule> }>({ rules: [] }).rules;
    ensureAuthRuleDefaults(rules);
    validateFieldRules(rules, isParentTypeBuiltinType, modelDirective !== undefined, this.configuredAuthProviders);

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
          operations: MODEL_OPERATIONS,
          resources: collectFieldNames(parent),
        });
      } else {
        acm = this.authModelConfig.get(typeName) as AccessControlMatrix;
        acm.resetAccessForResource(fieldName);
      }
      this.convertRulesToRoles(acm, rules, fieldName);
      this.authModelConfig.set(typeName, acm);
    } else {
      // if @auth is used without @model only generate static group rules in the resolver
      // since we only protect the field for non models we store the typeName + fieldName
      // in the authNonModelTypes map
      const staticRules = rules.filter((rule: AuthRule) => rule.allow !== 'owner' && !rule.groupsField);
      const typeFieldName = `${typeName}:${fieldName}`;
      const acm = new AccessControlMatrix({
        operations: ['read'],
        resources: [typeFieldName],
      });
      this.convertRulesToRoles(acm, staticRules, typeFieldName, ['read']);
      this.authNonModelConfig.set(typeFieldName, acm);
    }
  };

  transformSchema = (context: TransformerTransformSchemaStepContextProvider): void => {
    const getOwnerFields = (acm: AccessControlMatrix) => {
      return acm.getRoles().reduce((prev: string[], role: string) => {
        if (this.roleMap.get(role)!.strategy === 'owner') prev.push(this.roleMap.get(role)!.entity!);
        return prev;
      }, []);
    };
    for (let [modelName, acm] of this.authModelConfig) {
      const def = context.output.getObject(modelName)!;
      // collect ownerFields and them in the model
      this.addFieldsToObject(context, modelName, getOwnerFields(acm));
      // Get the directives we need to add to the GraphQL nodes
      const providers = this.getAuthProviders(acm.getRoles());
      const directives = this.getServiceDirectives(providers, providers.length === 0 ? this.shouldAddDefaultServiceDirective() : false);
      if (directives.length > 0) {
        extendTypeWithDirectives(context, modelName, directives);
      }
      this.protectSchemaOperations(context, def, acm);
      this.propagateAuthDirectivesToNestedTypes(context, context.output.getObject(modelName)!, providers);
    }
    for (let [typeFieldName, acm] of this.authNonModelConfig) {
      // protect the non model field
      const [typeName, fieldName] = typeFieldName.split(':');
      const providers = this.getAuthProviders(acm.getRoles());
      const directives = this.getServiceDirectives(providers, false);
      if (directives.length > 0) {
        addDirectivesToField(context, typeName, fieldName, directives);
      }
    }
  };

  generateResolvers = (context: TransformerContextProvider): void => {
    // generate iam policies
    this.generateIAMPolicies(context);
    // generate auth resolver code
    for (let [modelName, acm] of this.authModelConfig) {
      const indexKeyName = `${modelName}:indicies`;
      const def = context.output.getObject(modelName)!;
      const searchableDirective = def.directives.find(dir => dir.name.value === 'searchable');
      // queries
      const queryFields = getQueryFieldNames(this.modelDirectiveConfig.get(modelName)!);
      for (let query of queryFields.values()) {
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
            throw new TransformerContractError('Unkown query field type');
        }
      }
      // protect additional query fields if they exist
      if (context.metadata.has(indexKeyName)) {
        for (let index of context.metadata.get<Set<string>>(indexKeyName)!.values()) {
          this.protectListResolver(context, def, def.name.value, index, acm);
        }
      }
      // check if searchable if included in the typeName
      if (searchableDirective) {
        // protect search query
        const config = getSearchableConfig(searchableDirective, modelName);
        this.protectSearchResolver(context, def, context.output.getQueryTypeName()!, config.queries.search, acm);
      }
      // get fields specified in the schema
      // if there is a role that does not have read access on the field then we create a field resolver
      const readRoles = acm.getRolesPerOperation('read');
      const modelFields = def.fields?.filter(f => acm.getResources().includes(f.name.value)) ?? [];
      for (let field of modelFields) {
        const allowedRoles = readRoles.filter(r => acm.isAllowed(r, field.name.value, 'read'));
        if (allowedRoles.length < readRoles.length) {
          if (field.type.kind === Kind.NON_NULL_TYPE) {
            throw new InvalidDirectiveError(`\nPer-field auth on the required field ${field.name.value} is not supported with subscriptions.
  Either make the field optional, set auth on the object and not the field, or disable subscriptions for the object (setting level to off or public)\n`);
          }
          this.protectFieldResolver(context, def, modelName, field.name.value, allowedRoles);
        }
      }
      const mutationFields = getMutationFieldNames(this.modelDirectiveConfig.get(modelName)!);
      for (let mutation of mutationFields.values()) {
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
            throw new TransformerContractError('Unkown Mutation field type');
        }
      }

      const subscriptionFieldNames = getSubscriptionFieldNames(this.modelDirectiveConfig.get(modelName)!);
      const subscriptionRoles = acm
        .getRolesPerOperation('read')
        .map(role => this.roleMap.get(role)!)
        // for subscriptions we only use static rules or owner rule where the field is not a list
        .filter(roleDef => (roleDef.strategy === 'owner' && !fieldIsList(def.fields ?? [], roleDef.entity!)) || roleDef.static);
      for (let subscription of subscriptionFieldNames) {
        this.protectSubscriptionResolver(context, subscription.typeName, subscription.fieldName, subscriptionRoles);
      }
    }

    for (let [typeFieldName, acm] of this.authNonModelConfig) {
      // field resolvers
      const [typeName, fieldName] = typeFieldName.split(':');
      const def = context.output.getObject(typeName);
      this.protectFieldResolver(context, def, typeName, fieldName, acm.getRoles());
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
    const addServiceDirective = (typeName: string, operation: ModelOperation, operationName: string | null = null) => {
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
    // default model operations TODO: protect sync queries once supported
    addServiceDirective(ctx.output.getQueryTypeName()!, 'read', modelConfig?.queries?.get);
    addServiceDirective(ctx.output.getQueryTypeName()!, 'read', modelConfig?.queries?.list);
    addServiceDirective(ctx.output.getMutationTypeName()!, 'create', modelConfig?.mutations?.create);
    addServiceDirective(ctx.output.getMutationTypeName()!, 'update', modelConfig?.mutations?.update);
    addServiceDirective(ctx.output.getMutationTypeName()!, 'delete', modelConfig?.mutations?.delete);
    // @index queries
    if (ctx.metadata.has(indexKeyName)) {
      for (let index of ctx.metadata.get<Set<string>>(indexKeyName)!.values()) {
        addServiceDirective(ctx.output.getQueryTypeName(), 'read', index);
      }
    }
    // @searchable
    if (searchableDirective) {
      const config = getSearchableConfig(searchableDirective, def.name.value);
      addServiceDirective(ctx.output.getQueryTypeName(), 'read', config.queries.search);
    }

    const subscriptions = modelConfig?.subscriptions;
    if (subscriptions.level === SubscriptionLevel.on) {
      const subscriptionArguments = acm
        .getRolesPerOperation('read')
        .map(role => this.roleMap.get(role)!)
        .filter(roleDef => roleDef.strategy === 'owner' && !fieldIsList(def.fields ?? [], roleDef.entity!));
      if (subscriptions.onCreate && modelConfig?.mutations?.create) {
        for (let onCreateSub of subscriptions.onCreate) {
          addServiceDirective(ctx.output.getSubscriptionTypeName()!, 'read', onCreateSub);
          addSubscriptionArguments(ctx, onCreateSub, subscriptionArguments);
        }
      }
      if (subscriptions.onUpdate && modelConfig?.mutations?.update) {
        for (let onUpdateSub of subscriptions.onUpdate) {
          addServiceDirective(ctx.output.getSubscriptionTypeName()!, 'read', onUpdateSub);
          addSubscriptionArguments(ctx, onUpdateSub, subscriptionArguments);
        }
      }
      if (subscriptions.onDelete && modelConfig?.mutations?.delete) {
        for (let onDeleteSub of subscriptions.onDelete) {
          addServiceDirective(ctx.output.getSubscriptionTypeName()!, 'read', onDeleteSub);
          addSubscriptionArguments(ctx, onDeleteSub, subscriptionArguments);
        }
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
    const authExpression = generateAuthExpressionForQueries(this.configuredAuthProviders, roleDefinitions, def.fields ?? []);
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
  ): void => {
    const resolver = ctx.resolvers.getResolver(typeName, fieldName) as TransformerResolverProvider;
    const roleDefinitions = acm.getRolesPerOperation('read').map(r => this.roleMap.get(r)!);
    const authExpression = generateAuthExpressionForQueries(this.configuredAuthProviders, roleDefinitions, def.fields ?? []);
    resolver.addToSlot(
      'auth',
      MappingTemplate.s3MappingTemplateFromString(authExpression, `${typeName}.${fieldName}.{slotName}.{slotIndex}.req.vtl`),
    );
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
      const authExpression = generateAuthExpressionForQueries(this.configuredAuthProviders, roleDefinitions, def.fields ?? []);
      resolver.addToSlot(
        'auth',
        MappingTemplate.s3MappingTemplateFromString(authExpression, `${typeName}.${fieldName}.{slotName}.{slotIndex}.req.vtl`),
      );
    }
  };
  protectSearchResolver = (
    ctx: TransformerContextProvider,
    def: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    acm: AccessControlMatrix,
  ): void => {
    const resolver = ctx.resolvers.getResolver(typeName, fieldName) as TransformerResolverProvider;
    const roleDefinitions = acm.getRolesPerOperation('read').map(r => this.roleMap.get(r)!);
    const authExpression = generateAuthExpressionForQueries(this.configuredAuthProviders, roleDefinitions, def.fields ?? [], 'opensearch');
    resolver.addToSlot(
      'auth',
      MappingTemplate.s3MappingTemplateFromString(authExpression, `${typeName}.${fieldName}.{slotName}.{slotIndex}.req.vtl`),
    );
  };
  /*
  Field Resovler can protect the following
  - model fields
  - relational fields (hasOne, hasMany, belongsTo)
  - fields on an operation (query/mutation)
  - protection on predictions/function/no directive
  Order of precendence
  - resolver in api host (ex. @function, @predictions)
  - resolver in resolver manager (ex. @hasOne, @hasMany @belongsTo)
  - no resolver creates a blank non-pipeline resolver will return the source field
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
      const fieldResolver = ctx.api.host.getResolver(typeName, fieldName) as any;
      const fieldAuthExpression = generateAuthExpressionForField(this.configuredAuthProviders, roleDefinitions, []);
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
    } else if (ctx.resolvers.hasResolver(typeName, fieldName)) {
      // if there a resolver in the resolver manager we can append to the auth slot
      const fieldResolver = ctx.resolvers.getResolver(typeName, fieldName) as TransformerResolverProvider;
      const authExpression = generateAuthExpressionForQueries(this.configuredAuthProviders, roleDefinitions, def.fields ?? []);
      fieldResolver.addToSlot(
        'auth',
        MappingTemplate.s3MappingTemplateFromString(authExpression, `${typeName}.${fieldName}.{slotName}.{slotIndex}.req.vtl`),
      );
    } else {
      const fieldAuthExpression = generateAuthExpressionForField(this.configuredAuthProviders, roleDefinitions, def.fields ?? []);
      const subsEnabled = hasModelDirective ? this.modelDirectiveConfig.get(typeName)!.subscriptions.level === 'on' : false;
      const fieldResponse = generateFieldAuthResponse('Mutation', fieldName, subsEnabled);
      const resolver = ctx.resolvers.addResolver(
        typeName,
        fieldName,
        new TransformerResolver(
          typeName,
          fieldName,
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
      const allowedFields = fields.filter(resource => acm.isAllowed(role, resource, 'create'));
      const roleDefinition = this.roleMap.get(role)!;
      roleDefinition.allowedFields = allowedFields.length === fields.length ? [] : allowedFields;
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
      const nullAllowedFileds = fields.filter(resource => acm.isAllowed(role, resource, 'delete'));
      const roleDefinition = this.roleMap.get(role)!;
      roleDefinition.allowedFields = allowedFields.length === fields.length ? [] : allowedFields;
      roleDefinition.nullAllowedFields = nullAllowedFileds.length === fields.length ? [] : nullAllowedFileds;
      return roleDefinition;
    });
    const datasource = ctx.api.host.getDataSource(`${def.name.value}Table`) as DataSourceProvider;
    const requestExpression = generateAuthRequestExpression();
    const authExpression = generateAuthExpressionForUpdate(this.configuredAuthProviders, totalRoles, def.fields ?? []);
    resolver.addToSlot(
      'auth',
      MappingTemplate.s3MappingTemplateFromString(requestExpression, `${typeName}.${fieldName}.{slotName}.{slotIndex}.req.vtl`),
      MappingTemplate.s3MappingTemplateFromString(authExpression, `${typeName}.${fieldName}.{slotName}.{slotIndex}.res.vtl`),
      datasource,
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
    const datasource = ctx.api.host.getDataSource(`${def.name.value}Table`) as DataSourceProvider;
    const requestExpression = generateAuthRequestExpression();
    const authExpression = geneateAuthExpressionForDelete(this.configuredAuthProviders, deleteRoles, def.fields ?? []);
    resolver.addToSlot(
      'auth',
      MappingTemplate.s3MappingTemplateFromString(requestExpression, `${typeName}.${fieldName}.{slotName}.{slotIndex}.req.vtl`),
      MappingTemplate.s3MappingTemplateFromString(authExpression, `${typeName}.${fieldName}.{slotName}.{slotIndex}.res.vtl`),
      datasource,
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
  private convertRulesToRoles(acm: AccessControlMatrix, authRules: AuthRule[], field?: string, overideOperations?: ModelOperation[]) {
    for (let rule of authRules) {
      let operations: ModelOperation[] = overideOperations ? overideOperations : rule.operations || MODEL_OPERATIONS;
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
          acm.setRole({ role: roleName, resource: field, operations });
        });
      } else {
        let roleName: string;
        let roleDefinition: RoleDefinition;
        switch (rule.provider) {
          case 'apiKey':
            roleName = 'apiKey:public';
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
              const ownerClaim = rule.identityClaim || DEFAULT_IDENTITY_CLAIM;
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
        acm.setRole({ role: roleName, resource: field, operations });
      }
    }
  }

  private doesTypeHaveRulesForOperation(acm: AccessControlMatrix, operation: ModelOperation) {
    const rolesHasDefaultProvider = (roles: Array<string>) => {
      return roles.some(r => this.roleMap.get(r)!.provider! === this.configuredAuthProviders.default);
    };
    const roles = acm.getRolesPerOperation(operation, operation === 'delete');
    return rolesHasDefaultProvider(roles) || (roles.length === 0 && this.shouldAddDefaultServiceDirective());
  }
  private getAuthProviders(roles: Array<string>): Array<AuthProvider> {
    const providers: Set<AuthProvider> = new Set();
    // get the roles created for type
    for (let role of roles) {
      providers.add(this.roleMap.get(role)!.provider);
    }
    if (this.configuredAuthProviders.hasAdminUIEnabled) {
      providers.add('iam');
    }
    return Array.from(providers);
  }

  /*
  Schema Generation Helpers
  */
  private addFieldsToObject(ctx: TransformerTransformSchemaStepContextProvider, modelName: string, ownerFields: Array<string>) {
    const modelObject = ctx.output.getObject(modelName)!;
    const existingFields = collectFieldNames(modelObject);
    const ownerFieldsToAdd = ownerFields.filter(field => !existingFields.includes(field));
    for (let ownerField of ownerFieldsToAdd) {
      (modelObject as any).fields.push(makeField(ownerField, [], makeNamedType('String')));
    }
    ctx.output.putType(modelObject);
  }
  private propagateAuthDirectivesToNestedTypes(
    ctx: TransformerTransformSchemaStepContextProvider,
    def: ObjectTypeDefinitionNode,
    providers: Array<AuthProvider>,
  ) {
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
    for (const nonModelFieldType of nonModelFieldTypes) {
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
    }
  }

  private getServiceDirectives(providers: Readonly<Array<AuthProvider>>, addDefaultIfNeeded: boolean = true): Array<DirectiveNode> {
    if (providers.length === 0) {
      return [];
    }
    const directives: Array<DirectiveNode> = new Array();
    /*
      We only add a service directive if it's not the default or
      it's the default but there are other rules under different providers.
      For fields we don't we don't add the default since it would open up access.
    */
    const addDirectiveIfNeeded = (provider: AuthProvider, directiveName: string): void => {
      if (
        (this.configuredAuthProviders.default !== provider && providers.some(p => p === provider)) ||
        (this.configuredAuthProviders.default === provider && providers.some(p => p !== provider && addDefaultIfNeeded === true))
      ) {
        directives.push(makeDirective(directiveName, []));
      }
    };

    for (let [authProvider, directiveName] of AUTH_PROVIDER_DIRECTIVE_MAP) {
      addDirectiveIfNeeded(authProvider, directiveName);
    }
    /*
      If we have any rules for the default provider AND those with other providers,
      we add the default provider directive, regardless of the addDefaultDirective value

      For example if we have this rule and the default is API_KEY
      @auth(rules: [{ allow: owner }, { allow: public, operations: [read] }])

      Then we need to add @aws_api_key on the queries along with @aws_cognito_user_pools, but we
      cannot add @aws_api_key to other operations since their is no rule granted access to it
    */
    if (
      providers.some(p => p === this.configuredAuthProviders.default) &&
      providers.some(p => p !== this.configuredAuthProviders.default) &&
      !directives.some(d => d.name.value === AUTH_PROVIDER_DIRECTIVE_MAP.get(this.configuredAuthProviders.default))
    ) {
      directives.push(makeDirective(AUTH_PROVIDER_DIRECTIVE_MAP.get(this.configuredAuthProviders.default) as string, []));
    }
    return directives;
  }
  /**
   * When AdminUI is enabled, all the types and operations get IAM auth. If the default auth mode is
   * not IAM all the fields will need to have the default auth mode directive to ensure both IAM and deault
   * auth modes are allowed to access
   *  default auth provider needs to be added if AdminUI is enabled and default auth type is not IAM
   * @returns boolean
   */
  private shouldAddDefaultServiceDirective(): boolean {
    return this.configuredAuthProviders.hasAdminUIEnabled && this.config.authConfig.defaultAuthentication.authenticationType !== 'AWS_IAM';
  }
  /*
  IAM Helpers
   */
  private generateIAMPolicies(ctx: TransformerContextProvider) {
    // iam
    if (this.generateIAMPolicyforAuthRole) {
      // Sanity check to make sure we're not generating invalid policies, where no resources are defined.
      if (this.authPolicyResources.size === 0) {
        // When AdminUI is enabled, IAM auth is added but it does not need any policies to be generated
        if (!this.configuredAuthProviders.hasAdminUIEnabled) {
          throw new TransformerContractError('AuthRole policies should be generated, but no resources were added.');
        }
      } else {
        const authRoleParameter = (ctx.stackManager.getParameter(IAM_AUTH_ROLE_PARAMETER) as cdk.CfnParameter).valueAsString;
        const authPolicyDocuments = createPolicyDocumentForManagedPolicy(this.authPolicyResources);
        const rootStack = ctx.stackManager.rootStack;
        for (let i = 0; i < authPolicyDocuments.length; i++) {
          const paddedIndex = `${i + 1}`.padStart(2, '0');
          const resourceName = `${ResourceConstants.RESOURCES.AuthRolePolicy}${paddedIndex}`;
          new iam.ManagedPolicy(rootStack, resourceName, {
            document: iam.PolicyDocument.fromJson(authPolicyDocuments[i]),
            // we need to add the arn path as this is something cdk is looking for when using imported roles in policies
            roles: [
              iam.Role.fromRoleArn(
                rootStack,
                'auth-role-name',
                `arn:aws:iam::${cdk.Stack.of(rootStack).account}:role/${authRoleParameter}`,
              ),
            ],
          });
        }
      }
    }
    if (this.generateIAMPolicyforUnauthRole) {
      // Sanity check to make sure we're not generating invalid policies, where no resources are defined.
      if (this.unauthPolicyResources.size === 0) {
        throw new TransformerContractError('UnauthRole policies should be generated, but no resources were added');
      }
      const unauthRoleParameter = (ctx.stackManager.getParameter(IAM_UNAUTH_ROLE_PARAMETER) as cdk.CfnParameter).valueAsString;
      const unauthPolicyDocuments = createPolicyDocumentForManagedPolicy(this.unauthPolicyResources);
      const rootStack = ctx.stackManager.rootStack;
      for (let i = 0; i < unauthPolicyDocuments.length; i++) {
        const paddedIndex = `${i + 1}`.padStart(2, '0');
        const resourceName = `${ResourceConstants.RESOURCES.UnauthRolePolicy}${paddedIndex}`;
        new iam.ManagedPolicy(ctx.stackManager.rootStack, resourceName, {
          document: iam.PolicyDocument.fromJson(unauthPolicyDocuments[i]),
          roles: [
            iam.Role.fromRoleArn(
              rootStack,
              'unauth-role-name',
              `arn:aws:iam::${cdk.Stack.of(rootStack).account}:role/${unauthRoleParameter}`,
            ),
          ],
        });
      }
    }
  }
  private setAuthPolicyFlag(rules: AuthRule[]): void {
    if (rules.length === 0 || this.generateIAMPolicyforAuthRole === true) {
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
    if (rules.length === 0 || this.generateIAMPolicyforUnauthRole === true) {
      return;
    }
    for (const rule of rules) {
      if (rule.allow === 'public' && rule.provider === 'iam') {
        this.generateIAMPolicyforUnauthRole = true;
        return;
      }
    }
  }

  private addOperationToResourceReferences(operationName: string, fieldName: string, roles: Array<string>) {
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
}
