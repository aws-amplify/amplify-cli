import Template from 'cloudform-types/types/template';
import { AppSync, Fn, StringParameter, Refs, NumberParameter, IAM, Value } from 'cloudform-types';
import { AuthRule, AuthProvider } from './AuthRule';
import {
  str,
  ref,
  obj,
  set,
  iff,
  list,
  raw,
  forEach,
  compoundExpression,
  qref,
  equals,
  comment,
  or,
  Expression,
  and,
  not,
  parens,
  toJson,
  block,
  print,
  ifElse,
  newline,
} from 'graphql-mapping-template';
import { ResourceConstants, NONE_VALUE } from 'graphql-transformer-common';
import GraphQLApi, {
  GraphQLApiProperties,
  UserPoolConfig,
  AdditionalAuthenticationProvider,
  OpenIDConnectConfig,
} from 'cloudform-types/types/appSync/graphQlApi';
import * as Transformer from './ModelAuthTransformer';
import { FieldDefinitionNode } from 'graphql';

import { DEFAULT_OWNER_FIELD, DEFAULT_IDENTITY_FIELD, DEFAULT_GROUPS_FIELD, DEFAULT_GROUP_CLAIM } from './constants';
import ManagedPolicy from 'cloudform-types/types/iam/managedPolicy';

function replaceIfUsername(identityClaim: string): string {
  return identityClaim === 'username' ? 'cognito:username' : identityClaim;
}

function isUsername(identityClaim: string): boolean {
  return identityClaim === 'username';
}

export class ResourceFactory {
  public makeParams() {
    return {
      [ResourceConstants.PARAMETERS.AppSyncApiName]: new StringParameter({
        Description: 'The name of the AppSync API',
        Default: 'AppSyncSimpleTransform',
      }),
      [ResourceConstants.PARAMETERS.APIKeyExpirationEpoch]: new NumberParameter({
        Description:
          'The epoch time in seconds when the API Key should expire.' +
          ' Setting this to 0 will default to 7 days from the deployment date.' +
          ' Setting this to -1 will not create an API Key.',
        Default: 0,
        MinValue: -1,
      }),
      [ResourceConstants.PARAMETERS.CreateAPIKey]: new NumberParameter({
        Description:
          'The boolean value to control if an API Key will be created or not.' +
          ' The value of the property is automatically set by the CLI.' +
          ' If the value is set to 0 no API Key will be created.',
        Default: 0,
        MinValue: 0,
        MaxValue: 1,
      }),
      [ResourceConstants.PARAMETERS.AuthCognitoUserPoolId]: new StringParameter({
        Description: 'The id of an existing User Pool to connect. If this is changed, a user pool will not be created for you.',
        Default: ResourceConstants.NONE,
      }),
    };
  }

  /**
   * Creates the barebones template for an application.
   */
  public initTemplate(apiKeyConfig: Transformer.ApiKeyConfig): Template {
    return {
      Parameters: this.makeParams(),
      Resources: {
        [ResourceConstants.RESOURCES.APIKeyLogicalID]: this.makeAppSyncApiKey(apiKeyConfig),
      },
      Outputs: {
        [ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput]: this.makeApiKeyOutput(),
      },
      Conditions: {
        [ResourceConstants.CONDITIONS.ShouldCreateAPIKey]: Fn.Equals(Fn.Ref(ResourceConstants.PARAMETERS.CreateAPIKey), 1),
        [ResourceConstants.CONDITIONS.APIKeyExpirationEpochIsPositive]: Fn.And([
          Fn.Not(Fn.Equals(Fn.Ref(ResourceConstants.PARAMETERS.APIKeyExpirationEpoch), -1)),
          Fn.Not(Fn.Equals(Fn.Ref(ResourceConstants.PARAMETERS.APIKeyExpirationEpoch), 0)),
        ]),
      },
    };
  }

  public makeAppSyncApiKey(apiKeyConfig: Transformer.ApiKeyConfig) {
    let expirationDays = 7;
    if (apiKeyConfig && apiKeyConfig.apiKeyExpirationDays) {
      expirationDays = apiKeyConfig.apiKeyExpirationDays;
    }
    const expirationDateInSeconds = 60 /* s */ * 60 /* m */ * 24 /* h */ * expirationDays; /* d */
    const nowEpochTime = Math.floor(Date.now() / 1000);
    return new AppSync.ApiKey({
      ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
      Description: apiKeyConfig && apiKeyConfig.description ? apiKeyConfig.description : undefined,
      Expires: Fn.If(
        ResourceConstants.CONDITIONS.APIKeyExpirationEpochIsPositive,
        Fn.Ref(ResourceConstants.PARAMETERS.APIKeyExpirationEpoch),
        nowEpochTime + expirationDateInSeconds
      ),
    }).condition(ResourceConstants.CONDITIONS.ShouldCreateAPIKey);
  }

  /**
   * Outputs
   */
  public makeApiKeyOutput(): any {
    return {
      Description: "Your GraphQL API key. Provide via 'x-api-key' header.",
      Value: Fn.GetAtt(ResourceConstants.RESOURCES.APIKeyLogicalID, 'ApiKey'),
      Export: {
        Name: Fn.Join(':', [Refs.StackName, 'GraphQLApiKey']),
      },
      Condition: ResourceConstants.CONDITIONS.ShouldCreateAPIKey,
    };
  }

  public updateGraphQLAPIWithAuth(apiRecord: GraphQLApi, authConfig: Transformer.AppSyncAuthConfiguration) {
    let properties: GraphQLApiProperties = {
      ...apiRecord.Properties,
      Name: apiRecord.Properties.Name,
      AuthenticationType: authConfig.defaultAuthentication.authenticationType,
      UserPoolConfig: undefined,
      OpenIDConnectConfig: undefined,
    };

    switch (authConfig.defaultAuthentication.authenticationType) {
      case 'AMAZON_COGNITO_USER_POOLS':
        properties.UserPoolConfig = new UserPoolConfig({
          UserPoolId: Fn.Ref(ResourceConstants.PARAMETERS.AuthCognitoUserPoolId),
          AwsRegion: Refs.Region,
          DefaultAction: 'ALLOW',
        });
        break;
      case 'OPENID_CONNECT':
        if (!authConfig.defaultAuthentication.openIDConnectConfig) {
          throw new Error('openIDConnectConfig is not configured for defaultAuthentication');
        }

        properties.OpenIDConnectConfig = this.assignOpenIDConnectConfig(authConfig.defaultAuthentication.openIDConnectConfig);
        break;
    }

    // Configure additional authentication providers
    if (authConfig.additionalAuthenticationProviders && authConfig.additionalAuthenticationProviders.length > 0) {
      const additionalAuthenticationProviders = new Array<AdditionalAuthenticationProvider>();

      for (const sourceProvider of authConfig.additionalAuthenticationProviders) {
        let provider: AdditionalAuthenticationProvider;

        switch (sourceProvider.authenticationType) {
          case 'AMAZON_COGNITO_USER_POOLS':
            provider = {
              AuthenticationType: 'AMAZON_COGNITO_USER_POOLS',
              UserPoolConfig: new UserPoolConfig({
                UserPoolId: Fn.Ref(ResourceConstants.PARAMETERS.AuthCognitoUserPoolId),
                AwsRegion: Refs.Region,
              }),
            };
            break;
          case 'API_KEY':
            provider = {
              AuthenticationType: 'API_KEY',
            };
            break;
          case 'AWS_IAM':
            provider = {
              AuthenticationType: 'AWS_IAM',
            };
            break;
          case 'OPENID_CONNECT':
            if (!sourceProvider.openIDConnectConfig) {
              throw new Error('openIDConnectConfig is not configured for provider');
            }

            provider = {
              AuthenticationType: 'OPENID_CONNECT',
              OpenIDConnectConfig: this.assignOpenIDConnectConfig(sourceProvider.openIDConnectConfig),
            };
            break;
        }

        additionalAuthenticationProviders.push(provider);
      }

      properties.AdditionalAuthenticationProviders = additionalAuthenticationProviders;
    }

    return new GraphQLApi(properties);
  }

  private assignOpenIDConnectConfig(config: Transformer.OpenIDConnectConfig) {
    return new OpenIDConnectConfig({
      Issuer: config.issuerUrl,
      ClientId: config.clientId,
      IatTTL: config.iatTTL,
      AuthTTL: config.authTTL,
    });
  }

  public blankResolver(type: string, field: string) {
    return new AppSync.Resolver({
      ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
      DataSourceName: 'NONE',
      FieldName: field,
      TypeName: type,
      RequestMappingTemplate: print(
        obj({
          version: str('2017-02-28'),
          payload: obj({}),
        })
      ),
      ResponseMappingTemplate: print(ref(`util.toJson($context.source.${field})`)),
    });
  }

  public noneDataSource() {
    return new AppSync.DataSource({
      ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
      Name: 'NONE',
      Type: 'NONE',
    });
  }

  /**
   * Builds a VTL expression that will set the
   * ResourceConstants.SNIPPETS.IsStaticGroupAuthorizedVariable variable to
   * true if the user is static group authorized.
   * @param rules The list of static group authorization rules.
   */
  public staticGroupAuthorizationExpression(rules: AuthRule[], field?: FieldDefinitionNode): Expression {
    if (!rules || rules.length === 0) {
      return comment(`No Static Group Authorization Rules`);
    }
    const variableToSet = this.getStaticAuthorizationVariable(field);
    let groupAuthorizationExpressions = [];
    for (const rule of rules) {
      const groups = rule.groups;
      const groupClaimAttribute = rule.groupClaim || DEFAULT_GROUP_CLAIM;

      if (groups) {
        groupAuthorizationExpressions = groupAuthorizationExpressions.concat(
          comment(`Authorization rule: { allow: groups, groups: ${JSON.stringify(groups)}, groupClaim: "${groupClaimAttribute}" }`),
          this.setUserGroups(rule.groupClaim),
          set(ref('allowedGroups'), list(groups.map(s => str(s)))),
          forEach(ref('userGroup'), ref('userGroups'), [
            iff(raw(`$allowedGroups.contains($userGroup)`), compoundExpression([set(ref(variableToSet), raw('true')), raw('#break')])),
          ])
        );
      }
    }
    const staticGroupAuthorizedVariable = this.getStaticAuthorizationVariable(field);

    // tslint:disable-next-line
    return block('Static Group Authorization Checks', [
      raw(`#set($${staticGroupAuthorizedVariable} = $util.defaultIfNull(
            $${staticGroupAuthorizedVariable}, false))`),
      ...groupAuthorizationExpressions,
    ]);
  }

  /**
   * Given a set of dynamic group authorization rules verifies that input
   * value satisfies at least one dynamic group authorization rule.
   * @param rules The list of authorization rules.
   * @param variableToCheck The name of the value containing the input.
   * @param variableToSet The name of the variable to set when auth is satisfied.
   */
  public dynamicGroupAuthorizationExpressionForCreateOperations(
    rules: AuthRule[],
    variableToCheck: string = 'ctx.args.input',
    variableToSet: string = ResourceConstants.SNIPPETS.IsDynamicGroupAuthorizedVariable
  ): Expression {
    if (!rules || rules.length === 0) {
      return comment(`No Dynamic Group Authorization Rules`);
    }
    return block('Dynamic Group Authorization Checks', [
      this.dynamicAuthorizationExpressionForCreate(rules, variableToCheck, variableToSet),
    ]);
  }

  /**
   * Given a set of dynamic group authorization rules verifies that input
   * value satisfies at least one dynamic group authorization rule.
   * @param rules The list of authorization rules.
   * @param variableToCheck The name of the value containing the input.
   * @param variableToSet The name of the variable to set when auth is satisfied.
   */
  public dynamicGroupAuthorizationExpressionForCreateOperationsByField(
    rules: AuthRule[],
    fieldToCheck: string,
    variableToCheck: string = 'ctx.args.input',
    variableToSet: string = ResourceConstants.SNIPPETS.IsDynamicGroupAuthorizedVariable
  ): Expression {
    if (!rules || rules.length === 0) {
      return comment(`No dynamic group authorization rules for field "${fieldToCheck}"`);
    }
    let groupAuthorizationExpression: Expression = this.dynamicAuthorizationExpressionForCreate(
      rules,
      variableToCheck,
      variableToSet,
      rule => `Authorization rule on field "${fieldToCheck}": { allow: ${rule.allow}, \
groupsField: "${rule.groupsField || DEFAULT_GROUPS_FIELD}", groupClaim: "${rule.groupClaim || DEFAULT_GROUP_CLAIM}" }`
    );
    return block(`Dynamic group authorization rules for field "${fieldToCheck}"`, [groupAuthorizationExpression]);
  }

  private dynamicAuthorizationExpressionForCreate(
    rules: AuthRule[],
    variableToCheck: string = 'ctx.args.input',
    variableToSet: string = ResourceConstants.SNIPPETS.IsDynamicGroupAuthorizedVariable,
    formatComment?: (rule: AuthRule) => string
  ) {
    let groupAuthorizationExpressions = [];
    for (const rule of rules) {
      // for loop do check of rules here
      const groupsAttribute = rule.groupsField || DEFAULT_GROUPS_FIELD;
      const groupClaimAttribute = rule.groupClaim || DEFAULT_GROUP_CLAIM;
      groupAuthorizationExpressions = groupAuthorizationExpressions.concat(
        formatComment
          ? comment(formatComment(rule))
          : comment(`Authorization rule: { allow: ${rule.allow}, groupsField: "${groupsAttribute}", groupClaim: "${groupClaimAttribute}"`),
        this.setUserGroups(rule.groupClaim),
        set(ref(variableToSet), raw(`$util.defaultIfNull($${variableToSet}, false)`)),
        forEach(ref('userGroup'), ref('userGroups'), [
          iff(
            raw(`$util.isList($ctx.args.input.${groupsAttribute})`),
            iff(ref(`${variableToCheck}.${groupsAttribute}.contains($userGroup)`), set(ref(variableToSet), raw('true')))
          ),
          iff(
            raw(`$util.isString($ctx.args.input.${groupsAttribute})`),
            iff(raw(`$ctx.args.input.${groupsAttribute} == $userGroup`), set(ref(variableToSet), raw('true')))
          ),
        ])
      );
    }

    return compoundExpression(groupAuthorizationExpressions);
  }

  /**
   * Given a set of owner authorization rules verifies that input
   * value satisfies at least one rule.
   * @param rules The list of authorization rules.
   * @param variableToCheck The name of the value containing the input.
   * @param variableToSet The name of the variable to set when auth is satisfied.
   */
  public ownerAuthorizationExpressionForCreateOperations(
    rules: AuthRule[],
    fieldIsList: (fieldName: string) => boolean,
    variableToCheck: string = 'ctx.args.input',
    variableToSet: string = ResourceConstants.SNIPPETS.IsOwnerAuthorizedVariable
  ): Expression {
    if (!rules || rules.length === 0) {
      return comment(`No Owner Authorization Rules`);
    }
    return block('Owner Authorization Checks', [
      this.ownershipAuthorizationExpressionForCreate(rules, fieldIsList, variableToCheck, variableToSet),
    ]);
  }

  public ownerAuthorizationExpressionForSubscriptions(
    rules: AuthRule[],
    variableToCheck: string = 'ctx.args',
    variableToSet: string = ResourceConstants.SNIPPETS.IsOwnerAuthorizedVariable
  ): Expression {
    if (!rules || rules.length === 0) {
      return comment(`No Owner Authorization Rules`);
    }
    return block('Owner Authorization Checks', [
      this.ownershipAuthorizationExpressionForSubscriptions(rules, variableToCheck, variableToSet),
    ]);
  }
  public ownershipAuthorizationExpressionForSubscriptions(
    rules: AuthRule[],
    variableToCheck: string = 'ctx.args',
    variableToSet: string = ResourceConstants.SNIPPETS.IsOwnerAuthorizedVariable,
    formatComment?: (rule: AuthRule) => string
  ) {
    let ownershipAuthorizationExpressions = [];
    let ruleNumber = 0;
    for (const rule of rules) {
      const ownerAttribute = rule.ownerField || DEFAULT_OWNER_FIELD;
      const rawUsername = rule.identityField || rule.identityClaim || DEFAULT_IDENTITY_FIELD;
      const isUser = isUsername(rawUsername);
      const identityAttribute = replaceIfUsername(rawUsername);
      const allowedOwnersVariable = `allowedOwners${ruleNumber}`;
      ownershipAuthorizationExpressions = ownershipAuthorizationExpressions.concat(
        formatComment
          ? comment(formatComment(rule))
          : comment(`Authorization rule: { allow: ${rule.allow}, ownerField: "${ownerAttribute}", identityClaim: "${identityAttribute}" }`),
        set(ref(allowedOwnersVariable), raw(`$util.defaultIfNull($${variableToCheck}.${ownerAttribute}, null)`)),
        isUser
          ? // tslint:disable-next-line
            set(
              ref('identityValue'),
              raw(`$util.defaultIfNull($ctx.identity.claims.get("${rawUsername}"),
                        $util.defaultIfNull($ctx.identity.claims.get("${identityAttribute}"), "${NONE_VALUE}"))`)
            )
          : set(ref('identityValue'), raw(`$util.defaultIfNull($ctx.identity.claims.get("${identityAttribute}"), "${NONE_VALUE}")`)),
        // If a list of owners check for at least one.
        iff(
          raw(`$util.isList($${allowedOwnersVariable})`),
          forEach(ref('allowedOwner'), ref(allowedOwnersVariable), [
            iff(raw(`$allowedOwner == $identityValue`), set(ref(variableToSet), raw('true'))),
          ])
        ),
        // If a single owner check for at least one.
        iff(
          raw(`$util.isString($${allowedOwnersVariable})`),
          iff(raw(`$${allowedOwnersVariable} == $identityValue`), set(ref(variableToSet), raw('true')))
        )
      );
      ruleNumber++;
    }
    return compoundExpression([set(ref(variableToSet), raw(`false`)), ...ownershipAuthorizationExpressions]);
  }

  /**
   * Given a set of owner authorization rules verifies that if the input
   * specifies the given input field, the value satisfies at least one rule.
   * @param rules The list of authorization rules.
   * @param variableToCheck The name of the value containing the input.
   * @param variableToSet The name of the variable to set when auth is satisfied.
   */
  public ownerAuthorizationExpressionForCreateOperationsByField(
    rules: AuthRule[],
    fieldToCheck: string,
    fieldIsList: (fieldName: string) => boolean,
    variableToCheck: string = 'ctx.args.input',
    variableToSet: string = ResourceConstants.SNIPPETS.IsOwnerAuthorizedVariable
  ): Expression {
    if (!rules || rules.length === 0) {
      return comment(`No Owner Authorization Rules`);
    }
    return block(`Owner authorization rules for field "${fieldToCheck}"`, [
      this.ownershipAuthorizationExpressionForCreate(
        rules,
        fieldIsList,
        variableToCheck,
        variableToSet,
        rule => `Authorization rule: { allow: ${rule.allow}, \
ownerField: "${rule.ownerField || DEFAULT_OWNER_FIELD}", \
identityClaim: "${rule.identityField || rule.identityClaim || DEFAULT_IDENTITY_FIELD}" }`
      ),
    ]);
  }

  public ownershipAuthorizationExpressionForCreate(
    rules: AuthRule[],
    fieldIsList: (fieldName: string) => boolean,
    variableToCheck: string = 'ctx.args.input',
    variableToSet: string = ResourceConstants.SNIPPETS.IsOwnerAuthorizedVariable,
    formatComment?: (rule: AuthRule) => string
  ) {
    let ownershipAuthorizationExpressions = [];
    let ruleNumber = 0;
    for (const rule of rules) {
      const ownerAttribute = rule.ownerField || DEFAULT_OWNER_FIELD;
      const rawUsername = rule.identityField || rule.identityClaim || DEFAULT_IDENTITY_FIELD;
      const isUser = isUsername(rawUsername);
      const identityAttribute = replaceIfUsername(rawUsername);
      const ownerFieldIsList = fieldIsList(ownerAttribute);
      const allowedOwnersVariable = `allowedOwners${ruleNumber}`;
      ownershipAuthorizationExpressions = ownershipAuthorizationExpressions.concat(
        formatComment
          ? comment(formatComment(rule))
          : comment(`Authorization rule: { allow: ${rule.allow}, ownerField: "${ownerAttribute}", identityClaim: "${identityAttribute}" }`),
        set(ref(allowedOwnersVariable), raw(`$util.defaultIfNull($${variableToCheck}.${ownerAttribute}, null)`)),
        isUser
          ? // tslint:disable-next-line
            set(
              ref('identityValue'),
              raw(
                `$util.defaultIfNull($ctx.identity.claims.get("${rawUsername}"), $util.defaultIfNull($ctx.identity.claims.get("${identityAttribute}"), "${NONE_VALUE}"))`
              )
            )
          : set(ref('identityValue'), raw(`$util.defaultIfNull($ctx.identity.claims.get("${identityAttribute}"), "${NONE_VALUE}")`)),
        // If a list of owners check for at least one.
        iff(
          raw(`$util.isList($${allowedOwnersVariable})`),
          forEach(ref('allowedOwner'), ref(allowedOwnersVariable), [
            iff(raw(`$allowedOwner == $identityValue`), set(ref(variableToSet), raw('true'))),
          ])
        ),
        // If a single owner check for at least one.
        iff(
          raw(`$util.isString($${allowedOwnersVariable})`),
          iff(raw(`$${allowedOwnersVariable} == $identityValue`), set(ref(variableToSet), raw('true')))
        )
      );
      // If the owner field is not a list and the user does not
      // provide a value for the owner, set the owner automatically.
      if (!ownerFieldIsList) {
        ownershipAuthorizationExpressions.push(
          // If the owner is not provided set it automatically.
          // If the user explicitly provides null this will be false and we leave it null.
          iff(
            and([raw(`$util.isNull($${allowedOwnersVariable})`), parens(raw(`! $${variableToCheck}.containsKey("${ownerAttribute}")`))]),
            compoundExpression([qref(`$${variableToCheck}.put("${ownerAttribute}", $identityValue)`), set(ref(variableToSet), raw('true'))])
          )
        );
      } else {
        // If the owner field is a list and the user does not
        // provide a list of values for the owner, set the list with
        // the owner as the sole member.
        ownershipAuthorizationExpressions.push(
          // If the owner is not provided set it automatically.
          // If the user explicitly provides null this will be false and we leave it null.
          iff(
            and([raw(`$util.isNull($${allowedOwnersVariable})`), parens(raw(`! $${variableToCheck}.containsKey("${ownerAttribute}")`))]),
            compoundExpression([
              qref(`$${variableToCheck}.put("${ownerAttribute}", ["$identityValue"])`),
              set(ref(variableToSet), raw('true')),
            ])
          )
        );
      }
      ruleNumber++;
    }
    return compoundExpression([set(ref(variableToSet), raw(`false`)), ...ownershipAuthorizationExpressions]);
  }

  /**
   * Given a set of dynamic group authorization rules verifies w/ a conditional
   * expression that the existing object has the correct group expression.
   * @param rules The list of authorization rules.
   * @param variableToCheck The name of the value containing the input.
   * @param variableToSet The name of the variable to set when auth is satisfied.
   */
  public dynamicGroupAuthorizationExpressionForUpdateOrDeleteOperations(
    rules: AuthRule[],
    fieldBeingProtected?: string,
    variableToCheck: string = 'ctx.args.input',
    variableToSet: string = ResourceConstants.SNIPPETS.IsDynamicGroupAuthorizedVariable
  ): Expression {
    const fieldMention = fieldBeingProtected ? ` for field "${fieldBeingProtected}"` : '';
    if (!rules || rules.length === 0) {
      return comment(`No dynamic group authorization rules${fieldMention}`);
    }

    let groupAuthorizationExpressions = [];
    let ruleNumber = 0;
    for (const rule of rules) {
      const groupsAttribute = rule.groupsField || DEFAULT_GROUPS_FIELD;
      const groupsAttributeName = fieldBeingProtected
        ? `${fieldBeingProtected}_groupsAttribute${ruleNumber}`
        : `groupsAttribute${ruleNumber}`;
      const groupName = fieldBeingProtected ? `${fieldBeingProtected}_group${ruleNumber}` : `group${ruleNumber}`;
      const groupClaimAttribute = rule.groupClaim || DEFAULT_GROUP_CLAIM;
      groupAuthorizationExpressions = groupAuthorizationExpressions.concat(
        comment(
          `Authorization rule${fieldMention}: { allow: ${rule.allow}, groupsField: "${groupsAttribute}", groupClaim: "${groupClaimAttribute}"}`
        ),
        // Add the new auth expression and values
        this.setUserGroups(rule.groupClaim),
        forEach(ref('userGroup'), ref('userGroups'), [
          raw(`$util.qr($groupAuthExpressions.add("contains(#${groupsAttributeName}, :${groupName}$foreach.count)"))`),
          raw(`$util.qr($groupAuthExpressionValues.put(":${groupName}$foreach.count", { "S": $userGroup }))`),
        ]),
        iff(raw('$userGroups.size() > 0'), raw(`$util.qr($groupAuthExpressionNames.put("#${groupsAttributeName}", "${groupsAttribute}"))`))
      );
      ruleNumber++;
    }
    // check for groupclaim here
    return block('Dynamic group authorization checks', [
      set(ref('groupAuthExpressions'), list([])),
      set(ref('groupAuthExpressionValues'), obj({})),
      set(ref('groupAuthExpressionNames'), obj({})),
      ...groupAuthorizationExpressions,
    ]);
  }

  /**
   * Given a set of owner authorization rules verifies with a conditional
   * expression that the existing object is owned.
   * @param rules The list of authorization rules.
   * @param variableToCheck The name of the value containing the input.
   * @param variableToSet The name of the variable to set when auth is satisfied.
   */
  public ownerAuthorizationExpressionForUpdateOrDeleteOperations(
    rules: AuthRule[],
    fieldIsList: (fieldName: string) => boolean,
    fieldBeingProtected?: string,
    variableToCheck: string = 'ctx.args.input',
    variableToSet: string = ResourceConstants.SNIPPETS.IsOwnerAuthorizedVariable
  ): Expression {
    const fieldMention = fieldBeingProtected ? ` for field "${fieldBeingProtected}"` : '';
    if (!rules || rules.length === 0) {
      return comment(`No owner authorization rules${fieldMention}`);
    }
    let ownerAuthorizationExpressions = [];
    let ruleNumber = 0;
    for (const rule of rules) {
      const ownerAttribute = rule.ownerField || DEFAULT_OWNER_FIELD;
      const rawUsername = rule.identityField || rule.identityClaim || DEFAULT_IDENTITY_FIELD;
      const isUser = isUsername(rawUsername);
      const identityAttribute = replaceIfUsername(rawUsername);
      const ownerFieldIsList = fieldIsList(ownerAttribute);
      const ownerName = fieldBeingProtected ? `${fieldBeingProtected}_owner${ruleNumber}` : `owner${ruleNumber}`;
      const identityName = fieldBeingProtected ? `${fieldBeingProtected}_identity${ruleNumber}` : `identity${ruleNumber}`;

      ownerAuthorizationExpressions.push(
        // tslint:disable:max-line-length
        comment(
          `Authorization rule${fieldMention}: { allow: ${rule.allow}, ownerField: "${ownerAttribute}", identityClaim: "${identityAttribute}" }`
        )
      );
      if (ownerFieldIsList) {
        ownerAuthorizationExpressions.push(raw(`$util.qr($ownerAuthExpressions.add("contains(#${ownerName}, :${identityName})"))`));
      } else {
        ownerAuthorizationExpressions.push(raw(`$util.qr($ownerAuthExpressions.add("#${ownerName} = :${identityName}"))`));
      }
      ownerAuthorizationExpressions = ownerAuthorizationExpressions.concat(
        raw(`$util.qr($ownerAuthExpressionNames.put("#${ownerName}", "${ownerAttribute}"))`),
        // tslint:disable
        isUser
          ? raw(
              `$util.qr($ownerAuthExpressionValues.put(":${identityName}", $util.dynamodb.toDynamoDB($util.defaultIfNull($ctx.identity.claims.get("${rawUsername}"), $util.defaultIfNull($ctx.identity.claims.get("${identityAttribute}"), "${NONE_VALUE}")))))`
            )
          : raw(
              `$util.qr($ownerAuthExpressionValues.put(":${identityName}", $util.dynamodb.toDynamoDB($util.defaultIfNull($ctx.identity.claims.get("${identityAttribute}"), "${NONE_VALUE}"))))`
            )
        // tslint:enable
      );
      ruleNumber++;
    }
    return block('Owner Authorization Checks', [
      set(ref('ownerAuthExpressions'), list([])),
      set(ref('ownerAuthExpressionValues'), obj({})),
      set(ref('ownerAuthExpressionNames'), obj({})),
      ...ownerAuthorizationExpressions,
    ]);
  }

  /**
   * Given a list of rules return a VTL expression that checks if the given variableToCheck
   * statisies at least one of the auth rules.
   * @param rules The list of dynamic group authorization rules.
   */
  public dynamicGroupAuthorizationExpressionForReadOperations(
    rules: AuthRule[],
    variableToCheck: string = 'ctx.result',
    variableToSet: string = ResourceConstants.SNIPPETS.IsDynamicGroupAuthorizedVariable,
    defaultValue: Expression = raw(`$util.defaultIfNull($${variableToSet}, false)`)
  ): Expression {
    if (!rules || rules.length === 0) {
      return comment(`No Dynamic Group Authorization Rules`);
    }
    let groupAuthorizationExpressions = [];
    for (const rule of rules) {
      const groupsAttribute = rule.groupsField || DEFAULT_GROUPS_FIELD;
      const groupClaimAttribute = rule.groupClaim || DEFAULT_GROUP_CLAIM;
      groupAuthorizationExpressions = groupAuthorizationExpressions.concat(
        comment(`Authorization rule: { allow: ${rule.allow}, groupsField: "${groupsAttribute}", groupClaim: "${groupClaimAttribute}" }`),
        set(ref('allowedGroups'), ref(`util.defaultIfNull($${variableToCheck}.${groupsAttribute}, [])`)),
        this.setUserGroups(rule.groupClaim),
        forEach(ref('userGroup'), ref('userGroups'), [
          iff(raw('$util.isList($allowedGroups)'), iff(raw(`$allowedGroups.contains($userGroup)`), set(ref(variableToSet), raw('true')))),
          iff(raw(`$util.isString($allowedGroups)`), iff(raw(`$allowedGroups == $userGroup`), set(ref(variableToSet), raw('true')))),
        ])
      );
    }
    // check for group claim here
    return block('Dynamic Group Authorization Checks', [set(ref(variableToSet), defaultValue), ...groupAuthorizationExpressions]);
  }

  /**
   * Given a list of rules return a VTL expression that checks if the given variableToCheck
   * statisies at least one of the auth rules.
   * @param rules The list of dynamic group authorization rules.
   */
  public ownerAuthorizationExpressionForReadOperations(
    rules: AuthRule[],
    variableToCheck: string = 'ctx.result',
    variableToSet: string = ResourceConstants.SNIPPETS.IsOwnerAuthorizedVariable,
    defaultValue: Expression = raw(`$util.defaultIfNull($${variableToSet}, false)`)
  ): Expression {
    if (!rules || rules.length === 0) {
      return comment(`No Owner Authorization Rules`);
    }
    let ownerAuthorizationExpressions = [];
    let ruleNumber = 0;
    for (const rule of rules) {
      const ownerAttribute = rule.ownerField || DEFAULT_OWNER_FIELD;
      const rawUsername = rule.identityField || rule.identityClaim || DEFAULT_IDENTITY_FIELD;
      const isUser = isUsername(rawUsername);
      const identityAttribute = replaceIfUsername(rawUsername);
      const allowedOwnersVariable = `allowedOwners${ruleNumber}`;
      ownerAuthorizationExpressions = ownerAuthorizationExpressions.concat(
        comment(`Authorization rule: { allow: ${rule.allow}, ownerField: "${ownerAttribute}", identityClaim: "${identityAttribute}" }`),
        set(ref(allowedOwnersVariable), ref(`${variableToCheck}.${ownerAttribute}`)),
        isUser
          ? // tslint:disable-next-line
            set(
              ref('identityValue'),
              raw(
                `$util.defaultIfNull($ctx.identity.claims.get("${rawUsername}"), $util.defaultIfNull($ctx.identity.claims.get("${identityAttribute}"), "${NONE_VALUE}"))`
              )
            )
          : set(ref('identityValue'), raw(`$util.defaultIfNull($ctx.identity.claims.get("${identityAttribute}"), "${NONE_VALUE}")`)),
        iff(
          raw(`$util.isList($${allowedOwnersVariable})`),
          forEach(ref('allowedOwner'), ref(allowedOwnersVariable), [
            iff(raw(`$allowedOwner == $identityValue`), set(ref(variableToSet), raw('true'))),
          ])
        ),
        iff(
          raw(`$util.isString($${allowedOwnersVariable})`),
          iff(raw(`$${allowedOwnersVariable} == $identityValue`), set(ref(variableToSet), raw('true')))
        )
      );
      ruleNumber++;
    }
    return block('Owner Authorization Checks', [set(ref(variableToSet), defaultValue), ...ownerAuthorizationExpressions]);
  }

  public throwIfSubscriptionUnauthorized(): Expression {
    const ifUnauthThrow = iff(
      not(
        parens(
          or([
            equals(ref(ResourceConstants.SNIPPETS.IsStaticGroupAuthorizedVariable), raw('true')),
            equals(ref(ResourceConstants.SNIPPETS.IsOwnerAuthorizedVariable), raw('true')),
          ])
        )
      ),
      raw('$util.unauthorized()')
    );
    return block('Throw if unauthorized', [ifUnauthThrow]);
  }

  public throwIfUnauthorized(field?: FieldDefinitionNode): Expression {
    const staticGroupAuthorizedVariable = this.getStaticAuthorizationVariable(field);
    const ifUnauthThrow = iff(
      not(
        parens(
          or([
            equals(ref(staticGroupAuthorizedVariable), raw('true')),
            equals(ref(ResourceConstants.SNIPPETS.IsDynamicGroupAuthorizedVariable), raw('true')),
            equals(ref(ResourceConstants.SNIPPETS.IsOwnerAuthorizedVariable), raw('true')),
          ])
        )
      ),
      raw('$util.unauthorized()')
    );
    return block('Throw if unauthorized', [ifUnauthThrow]);
  }

  // A = IsStaticallyAuthed
  // B = AuthConditionIsNotNull
  // ! (A OR B) == (!A AND !B)
  public throwIfNotStaticGroupAuthorizedOrAuthConditionIsEmpty(field?: FieldDefinitionNode): Expression {
    const staticGroupAuthorizedVariable = this.getStaticAuthorizationVariable(field);
    const ifUnauthThrow = iff(
      not(parens(or([equals(ref(staticGroupAuthorizedVariable), raw('true')), parens(raw('$totalAuthExpression != ""'))]))),
      raw('$util.unauthorized()')
    );
    return block('Throw if unauthorized', [ifUnauthThrow]);
  }

  public collectAuthCondition(): Expression {
    return block('Collect Auth Condition', [
      set(
        ref(ResourceConstants.SNIPPETS.AuthCondition),
        raw(
          `$util.defaultIfNull($authCondition, ${print(
            obj({
              expression: str(''),
              expressionNames: obj({}),
              expressionValues: obj({}),
            })
          )})`
        )
      ),
      set(ref('totalAuthExpression'), str('')),
      comment('Add dynamic group auth conditions if they exist'),
      iff(
        ref('groupAuthExpressions'),
        forEach(ref('authExpr'), ref('groupAuthExpressions'), [
          set(ref('totalAuthExpression'), str(`$totalAuthExpression $authExpr`)),
          iff(ref('foreach.hasNext'), set(ref('totalAuthExpression'), str(`$totalAuthExpression OR`))),
        ])
      ),
      iff(
        ref('groupAuthExpressionNames'),
        raw(`$util.qr($${ResourceConstants.SNIPPETS.AuthCondition}.expressionNames.putAll($groupAuthExpressionNames))`)
      ),
      iff(
        ref('groupAuthExpressionValues'),
        raw(`$util.qr($${ResourceConstants.SNIPPETS.AuthCondition}.expressionValues.putAll($groupAuthExpressionValues))`)
      ),

      comment('Add owner auth conditions if they exist'),
      iff(
        raw(`$totalAuthExpression != "" && $ownerAuthExpressions && $ownerAuthExpressions.size() > 0`),
        set(ref('totalAuthExpression'), str(`$totalAuthExpression OR`))
      ),
      iff(
        ref('ownerAuthExpressions'),
        forEach(ref('authExpr'), ref('ownerAuthExpressions'), [
          set(ref('totalAuthExpression'), str(`$totalAuthExpression $authExpr`)),
          iff(ref('foreach.hasNext'), set(ref('totalAuthExpression'), str(`$totalAuthExpression OR`))),
        ])
      ),
      iff(
        ref('ownerAuthExpressionNames'),
        raw(`$util.qr($${ResourceConstants.SNIPPETS.AuthCondition}.expressionNames.putAll($ownerAuthExpressionNames))`)
      ),

      iff(
        ref('ownerAuthExpressionValues'),
        raw(`$util.qr($${ResourceConstants.SNIPPETS.AuthCondition}.expressionValues.putAll($ownerAuthExpressionValues))`)
      ),

      comment('Set final expression if it has changed.'),
      iff(
        raw(`$totalAuthExpression != ""`),
        ifElse(
          raw(`$util.isNullOrEmpty($${ResourceConstants.SNIPPETS.AuthCondition}.expression)`),
          set(ref(`${ResourceConstants.SNIPPETS.AuthCondition}.expression`), str(`($totalAuthExpression)`)),
          set(
            ref(`${ResourceConstants.SNIPPETS.AuthCondition}.expression`),
            str(`$${ResourceConstants.SNIPPETS.AuthCondition}.expression AND ($totalAuthExpression)`)
          )
        )
      ),
    ]);
  }

  public appendItemIfLocallyAuthorized(): Expression {
    return iff(
      parens(
        or([
          equals(ref(ResourceConstants.SNIPPETS.IsLocalDynamicGroupAuthorizedVariable), raw('true')),
          equals(ref(ResourceConstants.SNIPPETS.IsLocalOwnerAuthorizedVariable), raw('true')),
        ])
      ),
      qref('$items.add($item)')
    );
  }

  public setUserGroups(customGroup?: string): Expression {
    if (customGroup) {
      return compoundExpression([
        set(ref('userGroups'), raw(`$util.defaultIfNull($ctx.identity.claims.get("${customGroup}"), [])`)),
        iff(
          raw('$util.isString($userGroups)'),
          ifElse(
            raw('$util.isList($util.parseJson($userGroups))'),
            set(ref('userGroups'), raw('$util.parseJson($userGroups)')),
            set(ref('userGroups'), raw('[$userGroups]'))
          )
        ),
      ]);
    }
    return set(ref('userGroups'), raw(`$util.defaultIfNull($ctx.identity.claims.get("${DEFAULT_GROUP_CLAIM}"), [])`));
  }

  public generateSubscriptionResolver(fieldName: string, subscriptionTypeName: string = 'Subscription') {
    return new AppSync.Resolver({
      ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
      DataSourceName: 'NONE',
      FieldName: fieldName,
      TypeName: subscriptionTypeName,
      RequestMappingTemplate: print(
        raw(`{
    "version": "2018-05-29",
    "payload": {}
}`)
      ),
      ResponseMappingTemplate: print(raw(`$util.toJson(null)`)),
    });
  }

  public operationCheckExpression(operation: string, field: string) {
    return block('Checking for allowed operations which can return this field', [
      set(ref('operation'), raw('$util.defaultIfNull($context.source.operation, "null")')),
      ifElse(raw(`$operation == "${operation}"`), ref('util.toJson(null)'), ref(`util.toJson($context.source.${field})`)),
    ]);
  }

  public setOperationExpression(operation: string): string {
    return print(block('Setting the operation', [set(ref('context.result.operation'), str(operation))]));
  }

  public getAuthModeCheckWrappedExpression(expectedAuthModes: Set<AuthProvider>, expression: Expression): Expression {
    if (!expectedAuthModes || expectedAuthModes.size === 0) {
      return expression;
    }

    const conditions = [];

    for (const expectedAuthMode of expectedAuthModes) {
      conditions.push(equals(ref(ResourceConstants.SNIPPETS.AuthMode), str(`${expectedAuthMode}`)));
    }

    return block('Check authMode and execute owner/group checks', [
      iff(conditions.length === 1 ? conditions[0] : or(conditions), expression),
    ]);
  }

  public getAuthModeDeterminationExpression(authProviders: Set<AuthProvider>, isUserPoolTheDefault: boolean): Expression {
    if (!authProviders || authProviders.size === 0) {
      return comment(`No authentication mode determination needed`);
    }

    const expressions = [];

    for (const authProvider of authProviders) {
      if (authProvider === 'userPools') {
        const statements = [
          raw(`$util.isNullOrEmpty($${ResourceConstants.SNIPPETS.AuthMode})`),
          not(raw(`$util.isNull($ctx.identity)`)),
          not(raw(`$util.isNull($ctx.identity.sub)`)),
          not(raw(`$util.isNull($ctx.identity.issuer)`)),
          not(raw(`$util.isNull($ctx.identity.username)`)),
          not(raw(`$util.isNull($ctx.identity.claims)`)),
          not(raw(`$util.isNull($ctx.identity.sourceIp)`)),
        ];

        if (isUserPoolTheDefault === true) {
          statements.push(not(raw(`$util.isNull($ctx.identity.defaultAuthStrategy)`)));
        }

        const userPoolsExpression = iff(and(statements), set(ref(ResourceConstants.SNIPPETS.AuthMode), str(`userPools`)));

        expressions.push(userPoolsExpression);
      } else if (authProvider === 'oidc') {
        const oidcExpression = iff(
          and([
            raw(`$util.isNullOrEmpty($${ResourceConstants.SNIPPETS.AuthMode})`),
            not(raw(`$util.isNull($ctx.identity)`)),
            not(raw(`$util.isNull($ctx.identity.sub)`)),
            not(raw(`$util.isNull($ctx.identity.issuer)`)),
            not(raw(`$util.isNull($ctx.identity.claims)`)),
            raw(`$util.isNull($ctx.identity.username)`),
            raw(`$util.isNull($ctx.identity.sourceIp)`),
          ]),
          set(ref(ResourceConstants.SNIPPETS.AuthMode), str(`oidc`))
        );

        if (expressions.length > 0) {
          expressions.push(newline());
        }

        expressions.push(oidcExpression);
      }
    }

    return block('Determine request authentication mode', expressions);
  }

  public getStaticAuthorizationVariable(field: FieldDefinitionNode): string {
    return field
      ? `${field.name.value}_${ResourceConstants.SNIPPETS.IsStaticGroupAuthorizedVariable}`
      : ResourceConstants.SNIPPETS.IsStaticGroupAuthorizedVariable;
  }

  public makeIAMPolicyForRole(isAuthPolicy: Boolean, resources: Set<string>): ManagedPolicy[] {
    const policies = new Array<ManagedPolicy>();
    const authPiece = isAuthPolicy ? 'auth' : 'unauth';
    let policyResources: object[] = [];
    let resourceSize = 0;

    // 6144 bytes is the maximum policy payload size, but there is structural overhead, hence the 6000 bytes
    const MAX_BUILT_SIZE_BYTES = 6000;
    // The overhead is the amount of static policy arn contents like region, accountid, etc.
    // arn:aws:appsync:${AWS::Region}:${AWS::AccountId}:apis/${apiId}/types/${typeName}/fields/${fieldName}
    // 16              15             13                5    27       6     X+1         7      Y
    // 89 + 11 extra = 100
    const RESOURCE_OVERHEAD = 100;

    const createPolicy = newPolicyResources =>
      new IAM.ManagedPolicy({
        Roles: [
          //HACK double casting needed because it cannot except Ref
          ({ Ref: `${authPiece}RoleName` } as unknown) as Value<string>,
        ],
        PolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['appsync:GraphQL'],
              Resource: newPolicyResources,
            },
          ],
        },
      });

    for (const resource of resources) {
      // We always have 2 parts, no need to check
      const resourceParts = resource.split('/');

      if (resourceParts[1] !== 'null') {
        policyResources.push(
          Fn.Sub('arn:aws:appsync:${AWS::Region}:${AWS::AccountId}:apis/${apiId}/types/${typeName}/fields/${fieldName}', {
            apiId: {
              'Fn::GetAtt': ['GraphQLAPI', 'ApiId'],
            },
            typeName: resourceParts[0],
            fieldName: resourceParts[1],
          })
        );

        resourceSize += RESOURCE_OVERHEAD + resourceParts[0].length + resourceParts[1].length;
      } else {
        policyResources.push(
          Fn.Sub('arn:aws:appsync:${AWS::Region}:${AWS::AccountId}:apis/${apiId}/types/${typeName}/*', {
            apiId: {
              'Fn::GetAtt': ['GraphQLAPI', 'ApiId'],
            },
            typeName: resourceParts[0],
          })
        );

        resourceSize += RESOURCE_OVERHEAD + resourceParts[0].length;
      }

      //
      // Check policy size and if needed create a new one and clear the resources, reset
      // accumulated size
      //

      if (resourceSize > MAX_BUILT_SIZE_BYTES) {
        const policy = createPolicy(policyResources.slice(0, policyResources.length - 1));

        policies.push(policy);

        // Remove all but the last item
        policyResources = policyResources.slice(-1);
        resourceSize = 0;
      }
    }

    if (policyResources.length > 0) {
      const policy = createPolicy(policyResources);

      policies.push(policy);
    }

    return policies;
  }

  /**
   * ES EXPRESSIONS
   */

  public makeESItemsExpression() {
    // generate es expresion to appsync
    return compoundExpression([
      set(ref('es_items'), list([])),
      forEach(ref('entry'), ref('context.result.hits.hits'), [
        iff(raw('!$foreach.hasNext'), set(ref('nextToken'), ref('entry.sort.get(0)'))),
        qref('$es_items.add($entry.get("_source"))'),
      ]),
    ]);
  }

  public makeESToGQLExpression() {
    return compoundExpression([
      set(
        ref('es_response'),
        obj({
          items: ref('es_items'),
        })
      ),
      iff(
        raw('$es_items.size() > 0'),
        compoundExpression([qref('$es_response.put("nextToken", $nextToken)'), qref('$es_response.put("total", $es_items.size())')])
      ),
      toJson(ref('es_response')),
    ]);
  }
}
