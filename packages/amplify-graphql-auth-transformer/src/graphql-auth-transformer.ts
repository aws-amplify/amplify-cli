import {
  DirectiveWrapper,
  TransformerContractError,
  TransformerAuthBase,
  InvalidDirectiveError,
  MappingTemplate,
} from '@aws-amplify/graphql-transformer-core';
import {
  QueryFieldType,
  TransformerContextProvider,
  TransformerResolverProvider,
  TransformerSchemaVisitStepContextProvider,
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
  IAM_AUTH_ROLE_PARAMETER,
  IAM_UNAUTH_ROLE_PARAMETER,
} from './utils';
import { generateAuthExpressionForField, generateAuthExpressionForQueries, generateFieldAuthResponse } from './resolvers';
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
import {
  getBaseType,
  makeDirective,
  makeField,
  makeInputValueDefinition,
  makeNamedType,
  ResourceConstants,
  toCamelCase,
} from 'graphql-transformer-common';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';

// @ auth
// changing the schema
//  - transformSchema
// adding resolver
//  - generateResolver
// editing IAM policy
//  - generateResolver (cdk)
// resolver mapping

// resolver.ts for auth pipeline slots

export class AuthTransformer extends TransformerAuthBase {
  private config: AuthTransformerConfig;
  private configuredAuthProviders: ConfiguredAuthProviders;
  private roleMap: Map<string, RoleDefinition>;
  private authModelConfig: Map<string, AccessControlMatrix>;
  private authNonModelConfig: Map<string, AccessControlMatrix>;
  private modelDirectiveConfig: Map<string, ModelDirectiveConfiguration>;
  private seenNonModelTypes: Map<string, Set<string>>;
  private generateIAMPolicyforUnauthRole: boolean;
  private generateIAMPolicyforAuthRole: boolean;
  private authPolicyResources = new Set<string>();
  private unauthPolicyResources = new Set<string>();

  constructor(config: AuthTransformerConfig) {
    super('amplify-auth-transformer', authDirectiveDefinition);
    this.config = config;
    this.configuredAuthProviders = getConfiguredAuthProviders(this.config.authConfig);
    this.modelDirectiveConfig = new Map();
    this.seenNonModelTypes = new Map();
    this.authModelConfig = new Map();
    this.roleMap = new Map();
    this.generateIAMPolicyforUnauthRole = false;
    this.generateIAMPolicyforAuthRole = false;
    this.authNonModelConfig = new Map();
  }

  object = (def: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerSchemaVisitStepContextProvider): void => {
    const modelDirective = def.directives?.find(dir => dir.name.value === 'model');
    if (!modelDirective) {
      throw new TransformerContractError('Types annotated with @auth must also be annotated with @model.');
    }
    const typeName = def.name.value;
    const authDir = new DirectiveWrapper(directive);
    const rules: AuthRule[] = this.extendAuthRulesForAdminUI(
      authDir.getArguments<{ rules: Array<AuthRule> }>({ rules: [] }).rules,
    );
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
    this.convertModelRulesToRoles(acm, rules);
    this.modelDirectiveConfig.set(typeName, getModelConfig(modelDirective, typeName));
    this.authModelConfig.set(typeName, acm);
  };

  field = (
    parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    field: FieldDefinitionNode,
    directive: DirectiveNode,
    ctx: TransformerSchemaVisitStepContextProvider,
  ): void => {
    if (parent.kind === Kind.INTERFACE_TYPE_DEFINITION) {
      throw new InvalidDirectiveError(
        `The @auth directive cannot be placed on an interface's field. See ${parent.name.value}${field.name.value}`,
      );
    }
    const isParentTypeBuiltinType =
      parent.name.value === ctx.output.getQueryTypeName() ||
      parent.name.value === ctx.output.getMutationTypeName() ||
      parent.name.value === ctx.output.getSubscriptionTypeName();

    if (isParentTypeBuiltinType) {
      console.warn(
        `Be careful when using @auth directives on a field in a root type. @auth directives on field definitions use the source \
object to perform authorization logic and the source will be an empty object for fields on root types. \
Static group authorization should perform as expected.`,
      );
    }

    const modelDirective = parent.directives?.find(dir => dir.name.value === 'model');
    const typeName = parent.name.value;
    const fieldName = field.name.value;
    const authDir = new DirectiveWrapper(directive);
    const rules: AuthRule[] = authDir.getArguments<AuthRule[]>([]);
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
      if (!(typeName in this.modelDirectiveConfig)) {
        this.modelDirectiveConfig.set(typeName, getModelConfig(modelDirective, typeName));
        acm = new AccessControlMatrix({
          operations: MODEL_OPERATIONS,
          resources: collectFieldNames(parent),
        });
      } else {
        acm = this.authModelConfig.get(typeName) as AccessControlMatrix;
      }
      this.convertModelRulesToRoles(acm, rules, fieldName);
    } else {
      // if @auth is used without @model only generate static group rules in the resolver
      // since we only protect the field for non models we store the typeName + fieldName
      // in the authNonModelTypes map
      const staticGroupRules = rules.filter((rule: AuthRule) => rule.groups);
      const typeFieldName = `${typeName}:${fieldName}`;
      const acm = new AccessControlMatrix({
        operations: ['read'],
        resources: [typeFieldName],
      });
      this.convertNonModelRulesToRoles(acm, staticGroupRules, typeFieldName);
      this.authNonModelConfig.set(typeFieldName, acm);
    }
  };

  transformSchema = (ctx: TransformerContextProvider): void => {
    // generate schema changes
    for (let [modelName, acm] of this.authModelConfig) {
      const modelDirectiveConfig = this.modelDirectiveConfig.get(modelName)!;
      // collect ownerFields
      // add the owner fields for the model
      this.addOwnerFieldsToObject(ctx, modelName, this.getOwnerFields(acm));
      // Get the directives we need to add to the GraphQL nodes
      let providers = this.getAuthProvidersPerModel(modelName);
      let directives = this.getServiceDirectives(providers, providers.length === 0 ? this.shouldAddDefaultServiceDirective() : false);
      if (directives.length > 0) {
        extendTypeWithDirectives(ctx, modelName, directives);
      }
      this.protectSchemaOperations(ctx, acm, providers, modelDirectiveConfig);
      this.propagateAuthDirectivesToNestedTypes(ctx, ctx.output.getObject(modelName)!, providers);
    }
  };

  generateResolvers = (ctx: TransformerContextProvider): void => {
    // generate iam policies
    this.generateIAMPolicies(ctx);
    // generate auth resolver code
    for (let [modelName, acm] of this.authModelConfig) {
      const def = ctx.output.getObject(modelName)!;
      // queries
      const queryFields = this.getQueryFieldNames(ctx, def!);
      const readRoles = acm.getRolesPerOperation('read');
      for (let query of queryFields.values()) {
        switch (query.type) {
          case QueryFieldType.GET:
            this.protectGetResolver(ctx, def, query.typeName, query.fieldName, acm);
            break;
          case QueryFieldType.LIST:
            this.protectListResolver(ctx, def, query.typeName, query.fieldName, acm);
            break;
          default:
            throw new Error('Unkown query field type');
        }
      }
      // get fields specified in the schema
      // if there is a role that does not have read access on the field then we create a field resolver
      const modelFields = def.fields?.filter(f => acm.getResources().includes(f.name.value)) ?? [];
      for (let field of modelFields) {
        const allowedRoles = readRoles.filter(r => acm.isAllowed(r, field.name.value, 'read'));
        if (allowedRoles.length < readRoles.length) {
          if (field.type.kind === Kind.NON_NULL_TYPE) {
            throw new InvalidDirectiveError(`\nPer-field auth on the required field ${field.name.value} is not supported with subscriptions.
  Either make the field optional, set auth on the object and not the field, or disable subscriptions for the object (setting level to off or public)\n`);
          }
          this.protectFieldResolver(ctx, modelName, field.name.value, allowedRoles);
        }
      }
    }
  };

  protectSchemaOperations = (
    ctx: TransformerContextProvider,
    acm: AccessControlMatrix,
    providers: Array<AuthProvider>,
    modelConfig: ModelDirectiveConfiguration,
  ): void => {
    const addServiceDirective = (operation: ModelOperation, operationName: string | null = null) => {
      if (operationName) {
        let includeDefault = this.doesTypeHaveRulesForOperation(acm, operation);
        let operationDirectives = this.getServiceDirectives(providers, includeDefault);
        if (operationDirectives.length > 0) {
          addDirectivesToOperation(ctx, ctx.output.getQueryTypeName()!, operationName, operationDirectives);
        }
        this.addOperationToResourceReferences(ctx.output.getQueryTypeName()!, operationName, acm.getRoles());
      }
    };
    addServiceDirective('read', modelConfig?.queries?.get);
    addServiceDirective('read', modelConfig?.queries?.list);
    addServiceDirective('create', modelConfig?.mutations?.create);
    addServiceDirective('update', modelConfig?.mutations?.update);
    addServiceDirective('delete', modelConfig?.mutations?.delete);
    // TODO: protect sync queries once supported

    // subscriptions
    const subscriptions = modelConfig?.subscriptions;
    if (subscriptions && subscriptions.level === SubscriptionLevel.on) {
      const ownerFields = this.getOwnerFields(acm) ?? [];
      for (let onCreateSub of subscriptions.onCreate ?? []) {
        addServiceDirective('read', onCreateSub);
        this.addSubscriptionOwnerArguments(ctx, onCreateSub, ownerFields);
      }
      for (let onUpdateSub of subscriptions.onUpdate ?? []) {
        addServiceDirective('read', onUpdateSub);
        this.addSubscriptionOwnerArguments(ctx, onUpdateSub, ownerFields);
      }
      for (let onDeleteSub of subscriptions.onDelete ?? []) {
        addServiceDirective('read', onDeleteSub);
        this.addSubscriptionOwnerArguments(ctx, onDeleteSub, ownerFields);
      }
    }
  };

  // Queries
  protectGetResolver = (
    ctx: TransformerContextProvider,
    def: ObjectTypeDefinitionNode,
    typeName: string,
    fieldName: string,
    acm: AccessControlMatrix,
  ): void => {
    const resolver = ctx.resolvers.getResolver(typeName, fieldName) as TransformerResolverProvider;
    const roleDefinitions = acm.getRolesPerOperation('read').map(r => this.roleMap.get(r)!);
    const authExpression = generateAuthExpressionForQueries(roleDefinitions, def.fields ?? []);
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
    const authExpression = generateAuthExpressionForQueries(roleDefinitions, def.fields ?? []);
    resolver.addToSlot(
      'auth',
      MappingTemplate.s3MappingTemplateFromString(authExpression, `${typeName}.${fieldName}.{slotName}.{slotIndex}.req.vtl`),
    );
  };
  protectFieldResolver = (ctx: TransformerContextProvider, typeName: string, fieldName: string, roles: Array<string>): void => {
    const roleDefinitions = roles.map(r => this.roleMap.get(r)!);
    const fieldAuthExpression = generateAuthExpressionForField(roleDefinitions);
    const subsEnabled = this.modelDirectiveConfig.get(typeName)!.subscriptions.level === 'on';
    const fieldResponse = generateFieldAuthResponse(ctx.output.getMutationTypeName()!, fieldName, subsEnabled);
    // TODO: check if a function resolver is created here
    ctx.api.host.addResolver(
      typeName,
      fieldName,
      MappingTemplate.s3MappingTemplateFromString(fieldAuthExpression, `${typeName}.${fieldName}.req.vtl`),
      MappingTemplate.s3MappingTemplateFromString(fieldResponse, `${typeName}.${fieldName}.req.vtl`),
    );
  };

  getQueryFieldNames = (
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
  ): Set<{ fieldName: string; typeName: string; type: QueryFieldType }> => {
    const typeName = type.name.value;
    const fields: Set<{ fieldName: string; typeName: string; type: QueryFieldType }> = new Set();
    const modelDirectiveConfig = this.modelDirectiveConfig.get(type.name.value);
    if (modelDirectiveConfig?.queries?.get) {
      fields.add({
        typeName: 'Query',
        fieldName: modelDirectiveConfig.queries.get || toCamelCase(['get', typeName]),
        type: QueryFieldType.GET,
      });
    }

    if (modelDirectiveConfig?.queries?.list) {
      fields.add({
        typeName: 'Query',
        fieldName: modelDirectiveConfig.queries.list || toCamelCase(['list', typeName]),
        type: QueryFieldType.LIST,
      });
    }
    // check if this API is sync enabled and then if the model is sync enabled
    // fields.add({
    //   typeName: 'Query',
    //   fieldName: camelCase(`sync ${typeName}`),
    //   type: QueryFieldType.SYNC,
    // });
    return fields;
  };

  private convertNonModelRulesToRoles(acm: AccessControlMatrix, authRules: AuthRule[], field?: string) {
    for (let rule of authRules) {
      rule.groups!.forEach(group => {
        let roleName = `${rule.provider}:staticGroup:${group}`;
        if (!(roleName in this.roleMap)) {
          this.roleMap.set(roleName, {
            provider: rule.provider!,
            strategy: rule.allow,
            static: true,
            claim: rule.groupClaim || DEFAULT_GROUP_CLAIM,
            entity: group,
          });
        }
        acm.setRole({ role: roleName, resource: field, operations: ['read'] });
      });
    }
  }

  private convertModelRulesToRoles(acm: AccessControlMatrix, authRules: AuthRule[], field?: string) {
    for (let rule of authRules) {
      let operations: ModelOperation[] = rule.operations || MODEL_OPERATIONS;
      if (rule.groups && !rule.groupsField) {
        rule.groups.forEach(group => {
          let roleName = `${rule.provider}:staticGroup:${group}`;
          if (!(roleName in this.roleMap)) {
            this.roleMap.set(roleName, {
              provider: rule.provider!,
              strategy: rule.allow,
              static: true,
              claim: rule.groupClaim || DEFAULT_GROUP_CLAIM,
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
              claim: rule.allow === 'private' ? 'authenticated' : 'unauthenticated',
            };
            break;
          case 'oidc':
          case 'userPools':
            if (rule.allow === 'groups') {
              let groupsField = rule.groupsField || DEFAULT_GROUPS_FIELD;
              roleName = `${rule.provider}:dynamicGroup:${groupsField}`;
              roleDefinition = {
                provider: rule.provider,
                strategy: rule.allow,
                static: false,
                claim: rule.groupClaim || DEFAULT_GROUP_CLAIM,
                entity: groupsField,
              };
            } else if (rule.allow === 'owner') {
              let ownerField = rule.ownerField || DEFAULT_OWNER_FIELD;
              roleName = `${rule.provider}:owner:${ownerField}`;
              roleDefinition = {
                provider: rule.provider,
                strategy: rule.allow,
                static: false,
                claim: rule.identityClaim || DEFAULT_IDENTITY_CLAIM,
                entity: ownerField,
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
  /*
  Role Helpers
  */
  private doesTypeHaveRulesForOperation(acm: AccessControlMatrix, operation: ModelOperation) {
    const rolesHasDefaultProvider = (roles: Array<string>) => {
      return roles.some(r => this.roleMap.get(r)!.provider! === this.configuredAuthProviders.default);
    };
    const roles = acm.getRolesPerOperation(operation, operation === 'delete');
    return rolesHasDefaultProvider(roles) || (roles.length === 0 && this.shouldAddDefaultServiceDirective());
  }
  private getAuthProvidersPerModel(typeName: string): Array<AuthProvider> {
    const providers: Set<AuthProvider> = new Set();
    // get the roles created for type
    const roles = this.authModelConfig.get(typeName)!.getRoles();
    for (let role of roles) {
      providers.add(this.roleMap.get(role)!.provider);
    }
    return Array.from(providers);
  }
  private getOwnerFields(acm: AccessControlMatrix): Array<string> {
    return acm.getRoles().reduce((prev: string[], role: string) => {
      if (this.roleMap.get(role)!.strategy === 'owner') prev.push(this.roleMap.get(role)!.entity!);
      return prev;
    }, []);
  }
  /*
  Schema Generation Helpers
  */
  private addOwnerFieldsToObject(ctx: TransformerContextProvider, modelName: string, ownerFields: Array<string>) {
    const modelObject = ctx.output.getObject(modelName)!;
    const existingFields = collectFieldNames(modelObject);
    const ownerFieldsToAdd = ownerFields.filter(field => !existingFields.includes(field));
    for (let ownerField of ownerFieldsToAdd) {
      (modelObject as any).fields.push(makeField(ownerField, [], makeNamedType('String')));
    }
    ctx.output.putType(modelObject);
  }
  private addSubscriptionOwnerArguments(ctx: TransformerContextProvider, operationName: string, ownerFields: Array<string>) {
    let subscription = ctx.output.getSubscription()!;
    let createField: FieldDefinitionNode = subscription!.fields!.find(field => field.name.value === operationName) as FieldDefinitionNode;
    const ownerArgumentList = ownerFields.map(role => {
      return makeInputValueDefinition(role, makeNamedType('String'));
    });
    createField = {
      ...createField,
      arguments: ownerArgumentList,
    };
    subscription = {
      ...subscription,
      fields: subscription!.fields!.map(field => (field.name.value === operationName ? createField : field)),
    };
    ctx.output.putType(subscription);
  }
  private propagateAuthDirectivesToNestedTypes(
    ctx: TransformerContextProvider,
    type: ObjectTypeDefinitionNode,
    providers: Array<AuthProvider>,
  ) {
    const getDirectivesToAdd = (nonModelName: string): { current: DirectiveNode[]; old?: Set<string> } => {
      const directives = this.getServiceDirectives(providers, true);
      if (this.seenNonModelTypes.has(nonModelName)) {
        const nonModelDirectives: Set<string> = this.seenNonModelTypes.get(nonModelName)!;
        return { current: directives.filter(directive => !nonModelDirectives.has(directive.name.value)), old: nonModelDirectives };
      }
      return { current: directives };
    };

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
    const nonModelFieldTypes = type
      .fields!.map(f => ctx.output.getType(getBaseType(f.type)) as TypeDefinitionNode)
      .filter(nonModelTypePredicate);
    for (const nonModelFieldType of nonModelFieldTypes) {
      const directives = getDirectivesToAdd(nonModelFieldType.name.value);
      if (directives.current.length > 0) {
        // merge back the newly added auth directives with what already exists in the set
        const totalDirectives = new Set<string>([
          ...directives.current.map(dir => dir.name.value),
          ...(directives.old ? directives.old : []),
        ]);
        this.seenNonModelTypes.set(nonModelFieldType.name.value, totalDirectives);
        extendTypeWithDirectives(ctx, nonModelFieldType.name.value, directives.current);
        const hasIAM =
          directives.current.filter(directive => directive.name.value === 'aws_iam') || this.configuredAuthProviders.default === 'iam';
        if (hasIAM) {
          this.unauthPolicyResources.add(`${nonModelFieldType.name.value}/null`);
          this.authPolicyResources.add(`${nonModelFieldType.name.value}/null`);
        }
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
      Boolean(providers.find(p => p === this.configuredAuthProviders.default)) &&
      Boolean(
        providers.find(p => p !== this.configuredAuthProviders.default) &&
          !Boolean(directives.find(d => d.name.value === AUTH_PROVIDER_DIRECTIVE_MAP.get(this.configuredAuthProviders.default))),
      )
    ) {
      directives.push(makeDirective(AUTH_PROVIDER_DIRECTIVE_MAP.get(this.configuredAuthProviders.default) as string, []));
    }
    return directives;
  }
  /*
  Admin UI Helpers
  */
  private isAdminUIEnabled(): boolean {
    return this.configuredAuthProviders.hasIAM && this.config.addAwsIamAuthInOutputSchema;
  }
  private extendAuthRulesForAdminUI(rules: AuthRule[]): AuthRule[] {
    // Check for Amplify Admin
    if (this.isAdminUIEnabled()) {
      return [...rules, { allow: 'private', provider: 'iam', generateIAMPolicy: false }];
    }
    return rules;
  }
  /**
   * When AdminUI is enabled, all the types and operations get IAM auth. If the default auth mode is
   * not IAM all the fields will need to have the default auth mode directive to ensure both IAM and deault
   * auth modes are allowed to access
   *  default auth provider needs to be added if AdminUI is enabled and default auth type is not IAM
   * @returns boolean
   */
  private shouldAddDefaultServiceDirective(): boolean {
    return this.isAdminUIEnabled() && this.config.authConfig.defaultAuthentication.authenticationType !== 'AWS_IAM';
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
        if (!this.isAdminUIEnabled()) {
          throw new TransformerContractError('AuthRole policies should be generated, but no resources were added.');
        }
      } else {
        const authRoleParameter = ctx.stackManager.addParameter(IAM_AUTH_ROLE_PARAMETER, { type: 'String' });
        const role = iam.Role.fromRoleArn(ctx.stackManager.rootStack, 'auth-role-name', authRoleParameter.valueAsString);
        const authPolicyDocuments = createPolicyDocumentForManagedPolicy(this.authPolicyResources);
        for (let i = 0; i < authPolicyDocuments.length; i++) {
          const paddedIndex = `${i + 1}`.padStart(2, '0');
          const resourceName = `${ResourceConstants.RESOURCES.AuthRolePolicy}${paddedIndex}`;
          role.addManagedPolicy(
            new iam.ManagedPolicy(ctx.stackManager.rootStack, resourceName, {
              document: iam.PolicyDocument.fromJson(authPolicyDocuments[i]),
            }),
          );
        }
      }
    }
    if (this.generateIAMPolicyforUnauthRole) {
      // Sanity check to make sure we're not generating invalid policies, where no resources are defined.
      if (this.unauthPolicyResources.size === 0) {
        throw new TransformerContractError('UnauthRole policies should be generated, but no resources were added');
      }
      const unauthParameter = ctx.stackManager.addParameter(IAM_UNAUTH_ROLE_PARAMETER, { type: 'String' });
      const role = iam.Role.fromRoleArn(ctx.stackManager.rootStack, 'unauth-role-name', unauthParameter.valueAsString);
      const unauthPolicyDocuments = createPolicyDocumentForManagedPolicy(this.unauthPolicyResources);
      for (let i = 0; i < unauthPolicyDocuments.length; i++) {
        const paddedIndex = `${i + 1}`.padStart(2, '0');
        const resourceName = `${ResourceConstants.RESOURCES.UnauthRolePolicy}${paddedIndex}`;
        role.addManagedPolicy(
          new iam.ManagedPolicy(ctx.stackManager.rootStack, resourceName, {
            document: iam.PolicyDocument.fromJson(unauthPolicyDocuments[i]),
          }),
        );
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
   * Currently we need FieldToResourceRef to have deny by default behavior for IAM Policy
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
