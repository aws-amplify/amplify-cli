import Template from 'cloudform/types/template'
import Cognito from 'cloudform/types/cognito'
import Output from 'cloudform/types/output'
import GraphQLAPI, { UserPoolConfig } from 'cloudform/types/appSync/graphQlApi'
import Resolver from 'cloudform/types/appSync/resolver'
import { Fn, StringParameter, Refs, NumberParameter, Condition } from 'cloudform'
import {
    DynamoDBMappingTemplate, ElasticSearchMappingTemplate,
    print, str, ref, obj, set, iff, ifElse, list, raw, printBlock,
    forEach, compoundExpression, qref, toJson, equals, comment,
    IfNode, or, Expression
} from 'graphql-mapping-template'
import { ResourceConstants } from 'graphql-transformer-common'

export class ResourceFactory {

    public makeParams() {
        return {
            [ResourceConstants.PARAMETERS.AuthCognitoUserPoolId]: new StringParameter({
                Description: 'The id of an existing User Pool to connect. If this is changed, a user pool will not be created for you.',
                Default: ResourceConstants.NONE
            }),
            [ResourceConstants.PARAMETERS.AuthCognitoUserPoolName]: new StringParameter({
                Description: 'The name of the AppSync API',
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
            AliasAttributes: ['email'],
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
                set(ref('isAuthorized'), raw('false')),
                forEach(ref('userGroup'), ref('userGroups'), [
                    iff(
                        raw('$util.isList($allowedGroups)'),
                        iff(raw(`$allowedGroups.contains($userGroup)`), set(ref('isAuthorized'), raw('true'))),
                    ),
                    iff(
                        raw(`$util.isString($allowedGroups)`),
                        iff(raw(`$allowedGroups == $userGroup`), set(ref('isAuthorized'), raw('true'))),
                    )
                ]),
                iff(raw('!$isAuthorized'), raw('$util.unauthorized()')),
            ])
        )
    }

    public dynamicGroupListResolverResponseMappingTemplateSnippet(groupsAttribute: string) {
        return printBlock('Dynamic Group Authorization')(
            compoundExpression([
                set(ref('userGroups'), ref('ctx.identity.claims.get("cognito:groups")')),
                set(ref('items'), list([])),
                forEach(ref('item'), ref('ctx.result.items'), [
                    set(ref('isAuthorized'), raw('false')),
                    set(ref('allowedGroups'), ref(`item.${groupsAttribute}`)),
                    forEach(ref('userGroup'), ref('userGroups'), [
                        iff(
                            raw('$util.isList($allowedGroups)'),
                            iff(raw(`$allowedGroups.contains($userGroup)`), set(ref('isAuthorized'), raw('true'))),
                        ),
                        iff(
                            raw(`$util.isString($allowedGroups)`),
                            iff(raw(`$allowedGroups == $userGroup`), set(ref('isAuthorized'), raw('true'))),
                        )
                    ]),
                    iff(raw('$isAuthorized'), raw('$util.qr($items.add($item))')),
                ])
            ])
        )
    }

    public dynamicGroupListBeforeItemEquivalenceExpression(groupsAttribute: string) {
        return printBlock('Dynamic Group Authorization')(
            this.dynamicGroupListBeforeItemEquivalenceExpressionAST(groupsAttribute)
        )
    }
    public dynamicGroupListBeforeItemEquivalenceExpressionAST(groupsAttribute: string) {
        return compoundExpression([
            set(ref('isAuthorizedLocal'), raw('false')),
            set(ref('allowedGroups'), ref(`item.${groupsAttribute}`)),
            forEach(ref('userGroup'), ref('userGroups'), [
                iff(
                    raw('$util.isList($allowedGroups)'),
                    iff(raw(`$allowedGroups.contains($userGroup)`), set(ref('isAuthorizedLocal'), raw('true'))),
                ),
                iff(
                    raw(`$util.isString($allowedGroups)`),
                    iff(raw(`$allowedGroups == $userGroup`), set(ref('isAuthorizedLocal'), raw('true'))),
                )
            ]),
        ])
    }


    /**
     * Owner auth
     * @param ownerAttribute The name of the owner attribute.
     */
    public ownerCreateResolverRequestMappingTemplateSnippet = (
        ownerAttribute: string, identityField: string) => printBlock('Inject Ownership Information')(
            compoundExpression([
                iff(raw(`$util.isNullOrBlank($ctx.identity.${identityField})`), raw('$util.unauthorized()')),
                qref(`$ctx.args.input.put("${ownerAttribute}", $ctx.identity.${identityField})`)
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
            raw('#set($isAuthorized = true)'))
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
        set(ref('userGroups'), ref('ctx.identity.claims.get("cognito:groups")')),
        set(ref('allowedGroups'), list(groups.map(s => str(s)))),
        raw('#set($isAuthorized = $util.defaultIfNull($isAuthorized, false))'),
        forEach(ref('userGroup'), ref('userGroups'), [
            forEach(ref('allowedGroup'), ref('allowedGroups'), [
                iff(
                    raw('$allowedGroup == $userGroup'),
                    set(ref('isAuthorized'), raw('true'))
                )
            ])
        ])
    ])

    /**
     * Dynamic Group Auth Conditions.
     */
    public dynamicGroupCreateResolverRequestMappingTemplateSnippet = (groupsAttribute: string) => printBlock('Dynamic Group Authorization')(
        compoundExpression([
            set(ref("userGroups"), ref('ctx.identity.claims.get("cognito:groups")')),
            iff(raw('!$userGroups'), raw('$util.unauthorized()')),
            raw('#set($isAuthorized = $util.defaultIfNull($isAuthorized, false))'),
            forEach(ref('userGroup'), ref('userGroups'), [
                iff(
                    raw(`$util.isList($ctx.args.input.${groupsAttribute})`),
                    iff(raw(`$ctx.args.input.${groupsAttribute}.contains($userGroup)`), set(ref('isAuthorized'), raw('true'))),
                ),
                iff(
                    raw(`$util.isString($ctx.args.input.${groupsAttribute})`),
                    iff(raw(`$ctx.args.input.${groupsAttribute} == $userGroup`), set(ref('isAuthorized'), raw('true'))),
                )
            ])
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
                        expressionNames: obj({ groupsAttribute: str(groupsAttribute) }),
                        expressionValues: ref('groupAuthExpressionValues')
                    })
                ),
                compoundExpression([
                    set(
                        ref(`${ResourceConstants.SNIPPETS.AuthCondition}.expression`),
                        raw(`$${ResourceConstants.SNIPPETS.AuthCondition}.expression AND ($groupAuthExpression)`)
                    ),
                    raw(`$util.qr($${ResourceConstants.SNIPPETS.AuthCondition}.expressionNames.put("groupsAttribute", "${groupsAttribute}"))`),
                    raw(`$util.qr($${ResourceConstants.SNIPPETS.AuthCondition}.expressionValues.putAll($groupAuthExpressionValues))`),
                ])
            )
        ])
    )

    public throwWhenUnauthorized(): string {
        return printBlock("Throw if Unauthorized")(iff(raw('!$isAuthorized'), raw('$util.unauthorized()')))
    }

    public isAuthorized(): Expression {
        return raw('$isAuthorized == true')
    }

    public isAuthorizedLocallyOrGlobally(): Expression {
        return raw('$isAuthorized == true or $isAuthorizedLocal == true')
    }
}
