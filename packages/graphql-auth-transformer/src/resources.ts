import Template from 'cloudform/types/template'
import Cognito from 'cloudform/types/cognito'
import Output from 'cloudform/types/output'
import GraphQLAPI, { UserPoolConfig } from 'cloudform/types/appSync/graphQlApi'
import Resolver from 'cloudform/types/appSync/resolver'
import { Fn, StringParameter, Refs, NumberParameter, Condition } from 'cloudform'
import { AuthRule } from './AuthRule'
import {
    DynamoDBMappingTemplate, ElasticSearchMappingTemplate,
    print, str, ref, obj, set, iff, ifElse, list, raw, printBlock,
    forEach, compoundExpression, qref, toJson, equals, comment,
    IfNode, or, Expression, SetNode, and, not, parens, newline,
    block
} from 'graphql-mapping-template'
import { ResourceConstants } from 'graphql-transformer-common'

import {
    OWNER_AUTH_STRATEGY,
    DEFAULT_OWNER_FIELD,
    DEFAULT_IDENTITY_FIELD,
    GROUPS_AUTH_STRATEGY,
    DEFAULT_GROUPS_FIELD
} from './constants'

const NONE_VALUE = '___xamznone____'

export class ResourceFactory {

    public makeParams() {
        return {
            [ResourceConstants.PARAMETERS.AuthCognitoUserPoolId]: new StringParameter({
                Description: 'The id of an existing User Pool to connect. If this is changed, a user pool will not be created for you.',
                Default: ResourceConstants.NONE
            }),
            [ResourceConstants.PARAMETERS.AuthCognitoUserPoolName]: new StringParameter({
                Description: 'The name of the user pool.',
                Default: 'AppSyncUserPool'
            }),
            [ResourceConstants.PARAMETERS.AuthCognitoUserPoolMobileClientName]: new StringParameter({
                Description: 'The name of the native user pool client.',
                Default: 'CognitoNativeClient'
            }),
            [ResourceConstants.PARAMETERS.AuthCognitoUserPoolJSClientName]: new StringParameter({
                Description: 'The name of the web user pool client.',
                Default: 'CognitoJSClient'
            }),
            [ResourceConstants.PARAMETERS.AuthCognitoUserPoolRefreshTokenValidity]: new NumberParameter({
                Description: 'The time limit, in days, after which the refresh token is no longer valid.',
                Default: 30
            })
        }
    }

    /**
     * Creates the barebones template for an application.
     */
    public initTemplate(): Template {
        return {
            Parameters: this.makeParams(),
            Resources: {
                [ResourceConstants.RESOURCES.AuthCognitoUserPoolLogicalID]: this.makeUserPool(),
                [ResourceConstants.RESOURCES.AuthCognitoUserPoolNativeClientLogicalID]: this.makeUserPoolNativeClient(),
                [ResourceConstants.RESOURCES.AuthCognitoUserPoolJSClientLogicalID]: this.makeUserPoolJSClient(),
            },
            Outputs: {
                [ResourceConstants.OUTPUTS.AuthCognitoUserPoolNativeClientOutput]: this.makeNativeClientOutput(),
                [ResourceConstants.OUTPUTS.AuthCognitoUserPoolJSClientOutput]: this.makeJSClientOutput(),
                [ResourceConstants.OUTPUTS.AuthCognitoUserPoolIdOutput]: this.makeUserPoolOutput()
            },
            Conditions: {
                [ResourceConstants.CONDITIONS.AuthShouldCreateUserPool]: this.makeShouldCreateUserPoolCondition()
            }
        }
    }

    /**
     * Conditions
     */
    public makeShouldCreateUserPoolCondition(): Condition {
        return Fn.Equals(Fn.Ref(ResourceConstants.PARAMETERS.AuthCognitoUserPoolId), ResourceConstants.NONE)
    }

    /**
     * Outputs
     */
    public makeNativeClientOutput(): Output {
        return {
            Description: "Amazon Cognito UserPools native client ID",
            Value: Fn.If(
                ResourceConstants.CONDITIONS.AuthShouldCreateUserPool,
                Fn.Ref(ResourceConstants.RESOURCES.AuthCognitoUserPoolNativeClientLogicalID),
                Fn.Join(" ", ["See UserPool:", Fn.Ref(ResourceConstants.PARAMETERS.AuthCognitoUserPoolId)])
            ),
            Export: {
                Name: Fn.Join(':', [Refs.StackName, "CognitoNativeClient"])
            }
        }
    }

    public makeJSClientOutput(): Output {
        return {
            Description: "Amazon Cognito UserPools JS client ID",
            Value: Fn.If(
                ResourceConstants.CONDITIONS.AuthShouldCreateUserPool,
                Fn.Ref(ResourceConstants.RESOURCES.AuthCognitoUserPoolJSClientLogicalID),
                Fn.Join(" ", ["See UserPool:", Fn.Ref(ResourceConstants.PARAMETERS.AuthCognitoUserPoolId)])
            ),
            Export: {
                Name: Fn.Join(':', [Refs.StackName, "CognitoJSClient"])
            }
        }
    }

    public makeUserPoolOutput(): Output {
        return {
            Description: "Amazon Cognito UserPool id",
            Value: Fn.If(
                ResourceConstants.CONDITIONS.AuthShouldCreateUserPool,
                Fn.Ref(ResourceConstants.RESOURCES.AuthCognitoUserPoolLogicalID),
                Fn.Ref(ResourceConstants.PARAMETERS.AuthCognitoUserPoolId)
            ),
            Export: {
                Name: Fn.Join(':', [Refs.StackName, "CognitoUserPoolId"])
            }
        }
    }

    public updateGraphQLAPIWithAuth(apiRecord: GraphQLAPI) {
        return new GraphQLAPI({
            ...apiRecord.Properties,
            Name: apiRecord.Properties.Name,
            AuthenticationType: 'AMAZON_COGNITO_USER_POOLS',
            UserPoolConfig: new UserPoolConfig({
                UserPoolId: Fn.If(
                    ResourceConstants.CONDITIONS.AuthShouldCreateUserPool,
                    Fn.Ref(ResourceConstants.RESOURCES.AuthCognitoUserPoolLogicalID),
                    Fn.Ref(ResourceConstants.PARAMETERS.AuthCognitoUserPoolId)
                ),
                AwsRegion: Refs.Region,
                DefaultAction: 'ALLOW'
            })
        })
    }

    public makeUserPool() {
        return new Cognito.UserPool({
            UserPoolName: Fn.Ref(ResourceConstants.PARAMETERS.AuthCognitoUserPoolName),
            Policies: {
                // TODO: Parameterize these as mappings so you have loose, medium, and strict options.
                PasswordPolicy: {
                    MinimumLength: 8,
                    RequireLowercase: true,
                    RequireNumbers: true,
                    RequireSymbols: true,
                    RequireUppercase: true
                }
            },
            Schema: [
                {
                    Name: 'email',
                    Required: true,
                    Mutable: true
                }
            ],
            AutoVerifiedAttributes: ['email']
        }).condition(ResourceConstants.CONDITIONS.AuthShouldCreateUserPool)
    }

    public makeUserPoolNativeClient() {
        return new Cognito.UserPoolClient({
            ClientName: Fn.Ref(ResourceConstants.PARAMETERS.AuthCognitoUserPoolMobileClientName),
            UserPoolId: Fn.If(
                ResourceConstants.CONDITIONS.AuthShouldCreateUserPool,
                Fn.Ref(ResourceConstants.RESOURCES.AuthCognitoUserPoolLogicalID),
                Fn.Ref(ResourceConstants.PARAMETERS.AuthCognitoUserPoolId)
            ),
            GenerateSecret: true,
            RefreshTokenValidity: Fn.Ref(ResourceConstants.PARAMETERS.AuthCognitoUserPoolRefreshTokenValidity),
            ReadAttributes: [],
            WriteAttributes: []
        }).condition(ResourceConstants.CONDITIONS.AuthShouldCreateUserPool)
    }

    public makeUserPoolJSClient() {
        return new Cognito.UserPoolClient({
            ClientName: Fn.Ref(ResourceConstants.PARAMETERS.AuthCognitoUserPoolJSClientName),
            UserPoolId: Fn.If(
                ResourceConstants.CONDITIONS.AuthShouldCreateUserPool,
                Fn.Ref(ResourceConstants.RESOURCES.AuthCognitoUserPoolLogicalID),
                Fn.Ref(ResourceConstants.PARAMETERS.AuthCognitoUserPoolId)
            ),
            GenerateSecret: false,
            RefreshTokenValidity: Fn.Ref(ResourceConstants.PARAMETERS.AuthCognitoUserPoolRefreshTokenValidity),
            ReadAttributes: [],
            WriteAttributes: []
        }).condition(ResourceConstants.CONDITIONS.AuthShouldCreateUserPool)
    }

    /**
     * Methods that return the static resolver template snipets.
     */
    public dynamicGroupGetResolverResponseMappingTemplateSnippet(groupsAttribute: string) {
        return printBlock('Dynamic Group Authorization')(
            compoundExpression([
                set(ref('userGroups'), ref('ctx.identity.claims.get("cognito:groups")')),
                set(ref('allowedGroups'), ref(`ctx.result.${groupsAttribute}`)),
                set(ref(ResourceConstants.SNIPPETS.IsLocalDynamicGroupAuthorizedVariable), raw('false')),
                forEach(ref('userGroup'), ref('userGroups'), [
                    iff(
                        raw('$util.isList($allowedGroups)'),
                        iff(
                            raw(`$allowedGroups.contains($userGroup)`),
                            set(ref(ResourceConstants.SNIPPETS.IsLocalDynamicGroupAuthorizedVariable), raw('true'))),
                    ),
                    iff(
                        raw(`$util.isString($allowedGroups)`),
                        iff(
                            raw(`$allowedGroups == $userGroup`),
                            set(ref(ResourceConstants.SNIPPETS.IsLocalDynamicGroupAuthorizedVariable), raw('true'))),
                    )
                ]),
                iff(raw(`!$${ResourceConstants.SNIPPETS.IsLocalDynamicGroupAuthorizedVariable}`), raw('$util.unauthorized()')),
            ])
        )
    }

    public dynamicGroupListResolverResponseMappingTemplateSnippet(groupsAttribute: string) {
        return printBlock('Dynamic Group Authorization')(
            compoundExpression([
                set(ref('userGroups'), ref('ctx.identity.claims.get("cognito:groups")')),
                set(ref('items'), list([])),
                forEach(ref('item'), ref('ctx.result.items'), [
                    // tslint:disable
                    set(ref(ResourceConstants.SNIPPETS.IsLocalDynamicGroupAuthorizedVariable), raw('false')),
                    set(ref('allowedGroups'), ref(`item.${groupsAttribute}`)),
                    forEach(ref('userGroup'), ref('userGroups'), [
                        iff(
                            raw('$util.isList($allowedGroups)'),
                            iff(raw(`$allowedGroups.contains($userGroup)`), set(ref(ResourceConstants.SNIPPETS.IsLocalDynamicGroupAuthorizedVariable), raw('true'))),
                        ),
                        iff(
                            raw(`$util.isString($allowedGroups)`),
                            iff(raw(`$allowedGroups == $userGroup`), set(ref(ResourceConstants.SNIPPETS.IsLocalDynamicGroupAuthorizedVariable), raw('true'))),
                        )
                    ]),
                    iff(raw(ResourceConstants.SNIPPETS.IsLocalDynamicGroupAuthorizedVariable), raw('$util.qr($items.add($item))')),
                    // tslint:enable
                ])
            ])
        )
    }

    public dynamicGroupListBeforeItemEquivalenceExpression(groupsAttribute: string) {
        return printBlock('Dynamic Group Authorization')(
            this.dynamicGroupListBeforeItemEquivalenceExpressionAST(groupsAttribute)
        )
    }

    /**
     * Returns an expression that looks as a single $item and determines if the
     * logged in user is dynamic group authorized to access that item. If the
     * user is authorized, set ResourceConstants.SNIPPETS.IsLocalDynamicGroupAuthorizedVariable
     * to true.
     * @param groupsAttribute The name of the groupsAttribute.
     */
    public dynamicGroupListBeforeItemEquivalenceExpressionAST(
        groupsAttribute: string, itemName: string = 'item', variableName: string = ResourceConstants.SNIPPETS.IsLocalDynamicGroupAuthorizedVariable
    ) {
        return compoundExpression([
            set(ref(variableName), raw('false')),
            set(ref('allowedGroups'), ref(`${itemName}.${groupsAttribute}`)),
            forEach(ref('userGroup'), ref('userGroups'), [
                iff(
                    raw('$util.isList($allowedGroups)'),
                    iff(
                        raw(`$allowedGroups.contains($userGroup)`),
                        set(ref(variableName), raw('true'))),
                ),
                iff(
                    raw(`$util.isString($allowedGroups)`),
                    iff(
                        raw(`$allowedGroups == $userGroup`),
                        set(ref(variableName), raw('true'))),
                )
            ]),
        ])
    }

    public setUserGroups(): SetNode {
        return set(ref('userGroups'), ref('ctx.identity.claims.get("cognito:groups")'));
    }

    public setUserGroupsString(): string {
        return print(set(ref('userGroups'), ref('ctx.identity.claims.get("cognito:groups")')));
    }


    /**
     * Owner auth
     * @param ownerAttribute The name of the owner attribute.
     */
    public ownerCreateResolverRequestMappingTemplateSnippet = (
        ownerAttribute: string, identityField: string) => printBlock('Inject Ownership Information')(
            compoundExpression([
                iff(
                    raw(`$util.isNullOrBlank($ctx.identity.${identityField})`),
                    raw('$util.unauthorized()')
                ),
                compoundExpression([
                    qref(`$ctx.args.input.put("${ownerAttribute}", $ctx.identity.${identityField})`),
                    set(ref(ResourceConstants.SNIPPETS.IsOwnerAuthorizedVariable), raw('true'))
                ])
            ])
        )

    public ownerUpdateAndDeleteResolverRequestMappingTemplateSnippet =
        (ownerAttribute: string, identityField: string) => printBlock('Prepare Ownership Condition')(
            compoundExpression([
                ifElse(
                    raw(`!$${ResourceConstants.SNIPPETS.AuthCondition}`),
                    set(
                        ref(ResourceConstants.SNIPPETS.AuthCondition),
                        obj({
                            expression: str("#owner = :username"),
                            expressionNames: obj({
                                "#owner": str(`${ownerAttribute}`)
                            }),
                            expressionValues: obj({
                                ":username": obj({
                                    "S": str(`$ctx.identity.${identityField}`)
                                })
                            })
                        })
                    ),
                    compoundExpression([
                        set(
                            ref(`${ResourceConstants.SNIPPETS.AuthCondition}.expression`),
                            str(`($${ResourceConstants.SNIPPETS.AuthCondition}.expression) AND #owner = :username`)
                        ),
                        raw(`$util.qr($${ResourceConstants.SNIPPETS.AuthCondition}.expressionNames.put("#owner", "${ownerAttribute}"))`),
                        // tslint:disable-next-line
                        raw(`$util.qr($${ResourceConstants.SNIPPETS.AuthCondition}.expressionValues.put(":username", { "S": "$ctx.identity.${identityField}"}))`),
                    ])
                )
            ])
        )

    public ownerGetResolverResponseMappingTemplateSnippet = (ownerAttribute: string, identityField: string) => printBlock('Validate Ownership')(
        iff(
            equals(ref(`ctx.result.${ownerAttribute}`), ref(`ctx.identity.${identityField}`)),
            raw(`#set($${ResourceConstants.SNIPPETS.IsOwnerAuthorizedVariable} = true)`))
    )

    public ownerListResolverResponseMappingTemplateSnippet = (ownerAttribute: string, identityField: string) => printBlock("Filter Owned Items")(
        compoundExpression([
            set(ref('items'), list([])),
            forEach(ref('item'), ref('ctx.result.items'), [
                iff(raw(`$item.${ownerAttribute} == $ctx.identity.${identityField}`), qref('$items.add($item)'))
            ]),
            set(ref('ctx.result.items'), ref('items'))
        ])
    )

    public ownerListResolverItemCheck = (ownerAttribute: string, identityField: string) =>
        raw(`$item.${ownerAttribute} == $ctx.identity.${identityField}`)

    public loopThroughResultItemsAppendingAuthorized(
        ifExprs: Expression[],
        beforeExprs: Expression[] = [],
        beforeItemExprs: Expression[] = []
    ): string {
        return printBlock("Filter Authorized Items")(
            compoundExpression([
                ...beforeExprs,
                set(ref('items'), list([])),
                forEach(ref('item'), ref('ctx.result.items'), [
                    ...beforeItemExprs,
                    iff(or(ifExprs), qref('$items.add($item)'))
                ]),
                set(ref('ctx.result.items'), ref('items'))
            ])
        )
    }


    public ownerQueryResolverResponseMappingTemplateSnippet = (ownerAttribute: string, identityField: string) => printBlock('Filter Owned Items')(
        compoundExpression([
            set(ref('items'), list([])),
            forEach(ref('item'), ref('ctx.result.items'), [
                iff(raw(`$item.${ownerAttribute} == $ctx.identity.${identityField}`), qref('$items.add($item)'))
            ]),
            set(ref('ctx.result.items'), ref('items'))
        ])
    )

    /**
     * Static group auth conditions
     */
    public staticGroupAuthorizationResponseMappingTemplate = (groups: string[]) => printBlock('Static Group Authorization')(
        this.staticGroupAuthorizationResponseMappingTemplateAST(groups)
    )
    public staticGroupAuthorizationResponseMappingTemplateAST = (groups: string[]) => compoundExpression([
        this.setUserGroups(),
        set(ref('allowedGroups'), list(groups.map(s => str(s)))),
        // tslint:disable-next-line
        raw(`#set($${ResourceConstants.SNIPPETS.IsStaticGroupAuthorizedVariable} = $util.defaultIfNull($${ResourceConstants.SNIPPETS.IsStaticGroupAuthorizedVariable}, false))`),
        forEach(ref('userGroup'), ref('userGroups'), [
            forEach(ref('allowedGroup'), ref('allowedGroups'), [
                iff(
                    raw('$allowedGroup == $userGroup'),
                    set(ref(ResourceConstants.SNIPPETS.IsStaticGroupAuthorizedVariable), raw('true'))
                )
            ])
        ])
    ])

    /**
     * Dynamic Group Auth Conditions.
     */
    public dynamicGroupCreateResolverRequestMappingTemplateSnippet = (groupsAttribute: string) => printBlock('Dynamic Group Authorization')(
        compoundExpression([
            this.setUserGroups(),
            iff(raw('!$userGroups'), raw('$util.unauthorized()')),
            // tslint:disable
            raw(`#set($${ResourceConstants.SNIPPETS.IsDynamicGroupAuthorizedVariable} = $util.defaultIfNull($${ResourceConstants.SNIPPETS.IsDynamicGroupAuthorizedVariable}, false))`),
            forEach(ref('userGroup'), ref('userGroups'), [
                iff(
                    raw(`$util.isList($ctx.args.input.${groupsAttribute})`),
                    iff(
                        raw(`$ctx.args.input.${groupsAttribute}.contains($userGroup)`),
                        set(ref(ResourceConstants.SNIPPETS.IsDynamicGroupAuthorizedVariable), raw('true'))
                    ),
                ),
                iff(
                    raw(`$util.isString($ctx.args.input.${groupsAttribute})`),
                    iff(
                        raw(`$ctx.args.input.${groupsAttribute} == $userGroup`),
                        set(ref(ResourceConstants.SNIPPETS.IsDynamicGroupAuthorizedVariable), raw('true'))
                    ),
                )
            ])
            // tslint:enable
        ])
    )

    public dynamicGroupUpdateAndDeleteResolverRequestMappingTemplateSnippet = (groupsAttribute: string) => printBlock('Dynamic Group Authorization')(
        compoundExpression([
            set(ref('groupAuthExpression'), str('')),
            set(ref('groupAuthExpressionValues'), obj({})),
            // Add the new auth expression and values
            forEach(ref('userGroup'), ref('userGroups'), [
                set(ref('groupAuthExpression'), str(`$groupAuthExpression contains(#groupsAttribute, :group$foreach.count)`)),
                raw(`$util.qr($groupAuthExpressionValues.put(":group$foreach.count", { "S": $userGroup }))`),
                iff(ref('foreach.hasNext'), set(ref('groupAuthExpression'), str(`$groupAuthExpression OR`)))
            ]),
            // If there is no auth condition, initialize it.
            ifElse(
                raw(`!$${ResourceConstants.SNIPPETS.AuthCondition}`),
                set(
                    ref(ResourceConstants.SNIPPETS.AuthCondition),
                    obj({
                        expression: ref('groupAuthExpression'),
                        expressionNames: obj({ '#groupsAttribute': str(groupsAttribute) }),
                        expressionValues: ref('groupAuthExpressionValues')
                    })
                ),
                compoundExpression([
                    set(
                        ref(`${ResourceConstants.SNIPPETS.AuthCondition}.expression`),
                        str(`$${ResourceConstants.SNIPPETS.AuthCondition}.expression AND ($groupAuthExpression)`)
                    ),
                    raw(`$util.qr($${ResourceConstants.SNIPPETS.AuthCondition}.expressionNames.put("#groupsAttribute", "${groupsAttribute}"))`),
                    raw(`$util.qr($${ResourceConstants.SNIPPETS.AuthCondition}.expressionValues.putAll($groupAuthExpressionValues))`),
                ])
            )
        ])
    )

    public throwWhenUnauthorized(): string {
        return printBlock("Throw if Unauthorized")(iff(raw('!$isAuthorized'), raw('$util.unauthorized()')))
    }

    /**
     * If the resolver is static group authorized then the conditional expression
     * should succeed even if ownership or another condtion based auth flow do not.
     * This will make the condition succeed as long as the object exists.
     * If the user is not authorized by the group and there is no auth condition
     * then fail.
     */
    public handleStaticGroupAuthorizationCheck(): string {
        return printBlock("If authorized via a group then disable any authorization condition expressions.")(
            compoundExpression([
                iff(
                    raw(`$isAuthorized && !$util.isNull(\$${ResourceConstants.SNIPPETS.AuthCondition})`),
                    set(
                        ref(`${ResourceConstants.SNIPPETS.AuthCondition}.expression`),
                        str(`$${ResourceConstants.SNIPPETS.AuthCondition}.expression OR (attribute_exists(#id))`)
                    ),
                ),
                iff(
                    raw(`!$isAuthorized && $util.isNull(\$${ResourceConstants.SNIPPETS.AuthCondition})`),
                    raw('$util.unauthorized()')
                )
            ])
        )
    }

    public isAuthorized(): Expression {
        return raw('$isAuthorized == true')
    }

    public isAuthorizedLocallyOrGlobally(): Expression {
        return raw('$isAuthorized == true or $isAuthorizedLocal == true')
    }

    /**
     * Builds a VTL expression that will set the
     * ResourceConstants.SNIPPETS.IsStaticGroupAuthorizedVariable variable to
     * true if the user is static group authorized.
     * @param rules The list of static group authorization rules.
     */
    public staticGroupAuthorizationExpression(rules: AuthRule[]): Expression {
        if (!rules || rules.length === 0) {
            return comment(`No Static Group Authorization Rules`)
        }
        const allowedGroups: string[] = []
        for (const rule of rules) {
            const groups = rule.groups;
            for (const group of groups) {
                if (group) {
                    allowedGroups.push(group);
                }
            }
        }
        // TODO: Enhance cognito:groups to work with non cognito based auth.
        return block('Static Group Authorization Checks', [
            this.setUserGroups(),
            set(ref('allowedGroups'), list(allowedGroups.map(s => str(s)))),
            // tslint:disable-next-line
            raw(`#set($${ResourceConstants.SNIPPETS.IsStaticGroupAuthorizedVariable} = $util.defaultIfNull($${ResourceConstants.SNIPPETS.IsStaticGroupAuthorizedVariable}, false))`),
            forEach(ref('userGroup'), ref('userGroups'), [
                forEach(ref('allowedGroup'), ref('allowedGroups'), [
                    iff(
                        raw('$allowedGroup == $userGroup'),
                        set(ref(ResourceConstants.SNIPPETS.IsStaticGroupAuthorizedVariable), raw('true'))
                    )
                ])
            ])
        ])
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
        variableToSet: string = ResourceConstants.SNIPPETS.IsDynamicGroupAuthorizedVariable,
    ): Expression {
        if (!rules || rules.length === 0) {
            return comment(`No Dynamic Group Authorization Rules`)
        }
        let groupAuthorizationExpressions = []
        for (const rule of rules) {
            const groupsAttribute = rule.groupsField || DEFAULT_GROUPS_FIELD
            groupAuthorizationExpressions = groupAuthorizationExpressions.concat(
                comment(`Authorization rule: { allow: "${rule.allow}", groupsField: "${groupsAttribute}" }`),
                set(
                    ref(variableToSet),
                    raw(`$util.defaultIfNull($${variableToSet}, false)`)
                ),
                forEach(ref('userGroup'), ref('userGroups'), [
                    iff(
                        ref(`$util.isList($ctx.args.input.${groupsAttribute})`),
                        iff(
                            ref(`${variableToCheck}.${groupsAttribute}.contains($userGroup)`),
                            set(ref(variableToSet), raw('true'))
                        ),
                    ),
                    iff(
                        raw(`$util.isString($ctx.args.input.${groupsAttribute})`),
                        iff(
                            raw(`$ctx.args.input.${groupsAttribute} == $userGroup`),
                            set(ref(variableToSet), raw('true'))
                        ),
                    )
                ])
            )
        }
        return block('Dynamic Group Authorization Checks', [
            this.setUserGroups(),
            ...groupAuthorizationExpressions,
        ])
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
        variableToSet: string = ResourceConstants.SNIPPETS.IsOwnerAuthorizedVariable,
    ): Expression {
        if (!rules || rules.length === 0) {
            return comment(`No Owner Authorization Rules`)
        }
        let groupAuthorizationExpressions = []
        let ruleNumber = 0;
        for (const rule of rules) {
            const ownerAttribute = rule.ownerField || DEFAULT_OWNER_FIELD
            const identityAttribute = rule.identityField || DEFAULT_IDENTITY_FIELD
            const ownerFieldIsList = fieldIsList(ownerAttribute)
            const allowedOwnersVariable = `allowedOwners${ruleNumber}`
            groupAuthorizationExpressions = groupAuthorizationExpressions.concat(
                comment(`Authorization rule: { allow: "${rule.allow}", ownerField: "${ownerAttribute}", identityField: "${identityAttribute}" }`),
                set(ref(allowedOwnersVariable), raw(`$util.defaultIfNull($${variableToCheck}.${ownerAttribute}, null)`)),
                set(ref('identityValue'), raw(`$util.defaultIfNull($ctx.identity.${identityAttribute}, "${NONE_VALUE}")`)),
                // If a list of owners check for at least one.
                iff(
                    raw(`$util.isList($${allowedOwnersVariable})`),
                    forEach(ref('allowedOwner'), ref(allowedOwnersVariable), [
                        iff(
                            raw(`$allowedOwner == $identityValue`),
                            set(ref(variableToSet), raw('true'))),
                    ])
                ),
                // If a single owner check for at least one.
                iff(
                    raw(`$util.isString($${allowedOwnersVariable})`),
                    iff(
                        raw(`$${allowedOwnersVariable} == $identityValue`),
                        set(ref(variableToSet), raw('true'))),
                )
            )
            // If the owner field is not a list and the user does not
            // provide a value for the owner, set the owner automatically.
            if (!ownerFieldIsList) {
                groupAuthorizationExpressions.push(
                    // If the owner is not provided set it automatically.
                    // If the user explicitly provides null this will be false and we leave it null.
                    iff(
                        and([
                            raw(`$util.isNull($${allowedOwnersVariable})`),
                            parens(raw(`! $${variableToCheck}.containsKey("${ownerAttribute}")`)),
                        ]),
                        compoundExpression([
                            qref(`$${variableToCheck}.put("${ownerAttribute}", $identityValue)`),
                            set(ref(variableToSet), raw('true'))
                        ])
                    )
                )
            } else {
                // If the owner field is a list and the user does not
                // provide a list of values for the owner, set the list with
                // the owner as the sole member.
                groupAuthorizationExpressions.push(
                    // If the owner is not provided set it automatically.
                    // If the user explicitly provides null this will be false and we leave it null.
                    iff(
                        and([
                            raw(`$util.isNull($${allowedOwnersVariable})`),
                            parens(raw(`! $${variableToCheck}.containsKey("${ownerAttribute}")`)),
                        ]),
                        compoundExpression([
                            qref(`$${variableToCheck}.put("${ownerAttribute}", ["$identityValue"])`),
                            set(ref(variableToSet), raw('true'))
                        ])
                    )
                )
            }
            ruleNumber++
        }
        return block('Owner Authorization Checks', [
            this.setUserGroups(),
            set(ref(variableToSet), raw(`false`)),
            ...groupAuthorizationExpressions,
        ])
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
            return comment(`No Dynamic Group Authorization Rules`)
        }
        let groupAuthorizationExpressions = [];
        for (const rule of rules) {
            const groupsAttribute = rule.groupsField || DEFAULT_GROUPS_FIELD
            groupAuthorizationExpressions = groupAuthorizationExpressions.concat(
                comment(`Authorization rule: { allow: "${rule.allow}", groupsField: "${groupsAttribute}" }`),
                set(ref('allowedGroups'), ref(`${variableToCheck}.${groupsAttribute}`)),
                forEach(ref('userGroup'), ref('userGroups'), [
                    iff(
                        raw('$util.isList($allowedGroups)'),
                        iff(
                            raw(`$allowedGroups.contains($userGroup)`),
                            set(ref(variableToSet), raw('true'))),
                    ),
                    iff(
                        raw(`$util.isString($allowedGroups)`),
                        iff(
                            raw(`$allowedGroups == $userGroup`),
                            set(ref(variableToSet), raw('true'))),
                    )
                ])
            )
        }
        return block('Dynamic Group Authorization Checks', [
            this.setUserGroups(),
            set(ref(variableToSet), defaultValue),
            ...groupAuthorizationExpressions,
        ])
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
            return comment(`No Owner Authorization Rules`)
        }
        let ownerAuthorizationExpressions = [];
        let ruleNumber = 0;
        for (const rule of rules) {
            const ownerAttribute = rule.ownerField || DEFAULT_OWNER_FIELD
            const identityAttribute = rule.identityField || DEFAULT_IDENTITY_FIELD
            const allowedOwnersVariable = `allowedOwners${ruleNumber}`
            ownerAuthorizationExpressions = ownerAuthorizationExpressions.concat(
                comment(`Authorization rule: { allow: "${rule.allow}", ownerField: "${ownerAttribute}", identityField: "${identityAttribute}" }`),
                set(ref(allowedOwnersVariable), ref(`${variableToCheck}.${ownerAttribute}`)),
                set(ref('identityValue'), raw(`$util.defaultIfNull($ctx.identity.${identityAttribute}, "${NONE_VALUE}")`)),
                iff(
                    raw(`$util.isList($${allowedOwnersVariable})`),
                    forEach(ref('allowedOwner'), ref(allowedOwnersVariable), [
                        iff(
                            raw(`$allowedOwner == $identityValue`),
                            set(ref(variableToSet), raw('true'))),
                    ])
                ),
                iff(
                    raw(`$util.isString($${allowedOwnersVariable})`),
                    iff(
                        raw(`$${allowedOwnersVariable} == $identityValue`),
                        set(ref(variableToSet), raw('true'))),
                )
            )
            ruleNumber++
        }
        return block('Owner Authorization Checks', [
            set(ref(variableToSet), defaultValue),
            ...ownerAuthorizationExpressions
        ])
    }

    public throwIfUnauthorized(): Expression {
        const ifUnauthThrow = iff(
            not(parens(
                or([
                    equals(ref(ResourceConstants.SNIPPETS.IsStaticGroupAuthorizedVariable), raw('true')),
                    equals(ref(ResourceConstants.SNIPPETS.IsDynamicGroupAuthorizedVariable), raw('true')),
                    equals(ref(ResourceConstants.SNIPPETS.IsOwnerAuthorizedVariable), raw('true'))
                ])
            )), raw('$util.unauthorized()')
        )
        return block('Throw if unauthorized', [
            ifUnauthThrow,
        ])
    }

    public appendItemIfLocallyAuthorized(): Expression {
        return iff(
            parens(
                or([
                    equals(ref(ResourceConstants.SNIPPETS.IsLocalDynamicGroupAuthorizedVariable), raw('true')),
                    equals(ref(ResourceConstants.SNIPPETS.IsLocalOwnerAuthorizedVariable), raw('true'))
                ])
            ), qref('$items.add($item)')
        )
    }
}
