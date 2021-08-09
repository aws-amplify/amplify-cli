import {
  DirectiveWrapper,
  TransformerContractError,
  TransformerAuthBase,
  InvalidDirectiveError,
} from '@aws-amplify/graphql-transformer-core';
import {
  TransformerContextProvider,
  TransformerResolverProvider,
  TransformerSchemaVisitStepContextProvider,
  TransformerTransformSchemaStepContextProvider,
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
} from './utils';
import { DirectiveNode, FieldDefinitionNode, ObjectTypeDefinitionNode, InterfaceTypeDefinitionNode, Kind } from 'graphql';
import { ModelDirectiveConfiguration } from '@aws-amplify/graphql-model-transformer';
import { AccessControlMatrix } from './accesscontrol';

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
  private modelConfig: Map<string, ModelDirectiveConfiguration>;
  private authModelConfig: Map<string, AccessControlMatrix>;
  private roleMap: Map<string, any>;
  private authNonModelTypes: Map<string, AccessControlMatrix>;
  private generateIAMPolicyforUnauthRole: boolean;
  private generateIAMPolicyforAuthRole: boolean;
  private authPolicyResources = new Set<string>();
  private unauthPolicyResources = new Set<string>();

  constructor(config: AuthTransformerConfig) {
    super('amplify-auth-transformer', authDirectiveDefinition);
    this.config = config;
    this.configuredAuthProviders = getConfiguredAuthProviders(this.config.authConfig);
    this.modelConfig = new Map();
    this.authModelConfig = new Map();
    this.roleMap = new Map();
    this.generateIAMPolicyforUnauthRole = false;
    this.generateIAMPolicyforAuthRole = false;
    this.authNonModelTypes = new Map();
  }

  object = (def: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerSchemaVisitStepContextProvider): void => {
    const modelDirective = def.directives?.find(dir => dir.name.value === 'model');
    if (!modelDirective) {
      throw new TransformerContractError('Types annotated with @auth must also be annotated with @model.');
    }
    const typeName = def.name.value;
    const authDir = new DirectiveWrapper(directive);
    const rules: AuthRule[] = this.extendAuthRulesForAdminUI(authDir.getArguments<AuthRule[]>([]));
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
    this.modelConfig.set(typeName, getModelConfig(modelDirective, typeName));
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
      if (!(typeName in this.modelConfig)) {
        this.modelConfig.set(typeName, getModelConfig(modelDirective, typeName));
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
      this.authNonModelTypes.set(typeFieldName, acm);
    }
  };

  transformSchema = (ctx: TransformerTransformSchemaStepContextProvider): void => {
    // generate schema changes & IAM Policy Changes
  };

  generateResolvers = (ctx: TransformerContextProvider): void => {
    // generate auth resolver code
  };

  // Mutations
  protectCreateResolver = <AuthRule, ModelConfiguration>(
    ctx: TransformerContextProvider,
    resolverResourceID: string,
    type: ObjectTypeDefinitionNode,
    authRules: AuthRule[],
    modelConfiguration: ModelConfiguration,
  ): TransformerResolverProvider => {
    const resolver = ctx.resolvers.getResolver('typeName', 'fieldName') as TransformerResolverProvider;
    return resolver;
  };
  protectUpdateResolver = <AuthRule, ModelConfiguration>(
    ctx: TransformerContextProvider,
    resolverResourceID: string,
    type: ObjectTypeDefinitionNode,
    authRules: AuthRule[],
    modelConfiguration: ModelConfiguration,
  ): TransformerResolverProvider => {
    const resolver = ctx.resolvers.getResolver('typeName', 'fieldName') as TransformerResolverProvider;
    return resolver;
  };
  protectDeleteResolver = <AuthRule, ModelConfiguration>(
    ctx: TransformerContextProvider,
    resolverResourceID: string,
    type: ObjectTypeDefinitionNode,
    authRules: AuthRule[],
    modelConfiguration: ModelConfiguration,
  ): TransformerResolverProvider => {
    const resolver = ctx.resolvers.getResolver('typeName', 'fieldName') as TransformerResolverProvider;
    return resolver;
  };
  // Subscriptions
  protectOnCreateResolver = <AuthRule, ModelConfiguration>(
    ctx: TransformerContextProvider,
    resolverResourceID: string,
    type: ObjectTypeDefinitionNode,
    authRules: AuthRule[],
    modelConfiguration: ModelConfiguration,
  ): TransformerResolverProvider => {
    const resolver = ctx.resolvers.getResolver('typeName', 'fieldName') as TransformerResolverProvider;
    return resolver;
  };
  protectOnUpdateResolver = <AuthRule, ModelConfiguration>(
    ctx: TransformerContextProvider,
    resolverResourceID: string,
    type: ObjectTypeDefinitionNode,
    authRules: AuthRule[],
    modelConfiguration: ModelConfiguration,
  ): TransformerResolverProvider => {
    const resolver = ctx.resolvers.getResolver('typeName', 'fieldName') as TransformerResolverProvider;
    return resolver;
  };
  protectOnDeleteResolver = <AuthRule, ModelConfiguration>(
    ctx: TransformerContextProvider,
    resolverResourceID: string,
    type: ObjectTypeDefinitionNode,
    authRules: AuthRule[],
    modelConfiguration: ModelConfiguration,
  ): TransformerResolverProvider => {
    const resolver = ctx.resolvers.getResolver('typeName', 'fieldName') as TransformerResolverProvider;
    return resolver;
  };
  // Queries
  protectGetResolver = <AuthRule, ModelConfiguration>(
    ctx: TransformerContextProvider,
    resolverResourceID: string,
    type: ObjectTypeDefinitionNode,
    authRules: AuthRule[],
    modelConfiguration: ModelConfiguration,
  ): TransformerResolverProvider => {
    const resolver = ctx.resolvers.getResolver('typeName', 'fieldName') as TransformerResolverProvider;
    return resolver;
  };
  protectListResolver = <AuthRule, ModelConfiguration>(
    ctx: TransformerContextProvider,
    resolverResourceID: string,
    type: ObjectTypeDefinitionNode,
    authRules: AuthRule[],
    modelConfiguration: ModelConfiguration,
  ): TransformerResolverProvider => {
    const resolver = ctx.resolvers.getResolver('typeName', 'fieldName') as TransformerResolverProvider;
    return resolver;
  };
  protectSyncResolver = <AuthRule, ModelConfiguration>(
    ctx: TransformerContextProvider,
    resolverResourceID: string,
    type: ObjectTypeDefinitionNode,
    authRules: AuthRule[],
    modelConfiguration: ModelConfiguration,
  ): TransformerResolverProvider => {
    const resolver = ctx.resolvers.getResolver('typeName', 'fieldName') as TransformerResolverProvider;
    return resolver;
  };
  protectFieldResolver = (
    ctx: TransformerContextProvider,
    field: FieldDefinitionNode,
    typeName: string,
    fieldName: string,
  ): TransformerResolverProvider => {
    const resolver = ctx.resolvers.getResolver('typeName', 'fieldName') as TransformerResolverProvider;
    return resolver;
  };

  private convertNonModelRulesToRoles(acm: AccessControlMatrix, authRules: AuthRule[], field?: string) {
    for (let rule of authRules) {
      rule.groups!.forEach(group => {
        let roleName = `${rule.provider}:staticGroup:${group}`;
        if (!(roleName in this.roleMap)) {
          this.roleMap.set(roleName, {
            provider: rule.provider,
            claim: rule.groupClaim || DEFAULT_GROUP_CLAIM,
            value: group,
          });
        }
        acm.setRole({ role: roleName, resource: field, operations: ['read'] });
      });
    }
  }

  private convertModelRulesToRoles(acm: AccessControlMatrix, authRules: AuthRule[], field?: string) {
    for (let rule of authRules) {
      let operations: ModelOperation[] = rule.operations || MODEL_OPERATIONS;
      if (rule.groups) {
        rule.groups.forEach(group => {
          let roleName = `${rule.provider}:staticGroup:${group}`;
          if (!(roleName in this.roleMap)) {
            this.roleMap.set(roleName, {
              provider: rule.provider,
              claim: rule.groupClaim || DEFAULT_GROUP_CLAIM,
              value: group,
            });
          }
          acm.setRole({ role: roleName, resource: field, operations });
        });
      } else {
        let roleName: string;
        let roleDefinition: any;
        switch (rule.provider) {
          case 'apiKey':
            roleName = 'apiKey:public';
            roleDefinition = { provider: rule.provider };
            break;
          case 'iam':
            roleName = `iam:${rule.allow}`;
            roleDefinition = {
              provider: rule.provider,
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
                claim: rule.groupClaim || DEFAULT_GROUP_CLAIM,
                value: groupsField,
              };
            }
            if (rule.allow === 'owner') {
              let ownerField = rule.ownerField || DEFAULT_OWNER_FIELD;
              roleName = `${rule.provider}:owner:${ownerField}`;
              roleDefinition = {
                provider: rule.provider,
                claim: rule.identityClaim || DEFAULT_IDENTITY_CLAIM,
                value: ownerField,
              };
            } else {
              throw new TransformerContractError(`Could not create a role from ${rule}`);
            }
            break;
          default:
            throw new TransformerContractError(`Could not create a role from ${rule}`);
        }
        acm.setRole({ role: roleName, resource: field, operations });
        this.roleMap.set(roleName, roleDefinition);
      }
    }
  }
  private isAdminUIEnabled(): boolean {
    return this.configuredAuthProviders.hasIAM && this.config.addAwsIamAuthInOutputSchema;
  }
  private extendAuthRulesForAdminUI(rules: Readonly<AuthRule[]>): AuthRule[] {
    // Check for Amplify Admin
    if (this.isAdminUIEnabled()) {
      return [...rules, { allow: 'private', provider: 'iam', generateIAMPolicy: false }];
    }
    return [...rules];
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

  private addTypeToResourceReferences(typeName: string, rules: AuthRule[]): void {
    const iamPublicRules = rules.filter(r => r.allow === 'public' && r.provider === 'iam' && r.generateIAMPolicy);
    const iamPrivateRules = rules.filter(r => r.allow === 'private' && r.provider === 'iam' && r.generateIAMPolicy);

    if (iamPublicRules.length > 0) {
      this.unauthPolicyResources.add(`${typeName}/null`);
      this.authPolicyResources.add(`${typeName}/null`);
    }
    if (iamPrivateRules.length > 0) {
      this.authPolicyResources.add(`${typeName}/null`);
    }
  }

  private addFieldToResourceReferences(typeName: string, fieldName: string, rules: AuthRule[]): void {
    const iamPublicRules = rules.filter(r => r.allow === 'public' && r.provider === 'iam' && r.generateIAMPolicy);
    const iamPrivateRules = rules.filter(r => r.allow === 'private' && r.provider === 'iam' && r.generateIAMPolicy);

    if (iamPublicRules.length > 0) {
      this.unauthPolicyResources.add(`${typeName}/${fieldName}`);
      this.authPolicyResources.add(`${typeName}/${fieldName}`);
    }
    if (iamPrivateRules.length > 0) {
      this.authPolicyResources.add(`${typeName}/${fieldName}`);
    }
  }
}
