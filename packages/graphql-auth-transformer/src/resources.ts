import Template from 'cloudform/types/template'
import Cognito from 'cloudform/types/cognito'
import Output from 'cloudform/types/output'
import GraphQLAPI, { UserPoolConfig } from 'cloudform/types/appSync/graphQlApi'
import Resolver from 'cloudform/types/appSync/resolver'
import { Fn, StringParameter, Refs, NumberParameter, Condition } from 'cloudform'
import {
    DynamoDBMappingTemplate, ElasticSearchMappingTemplate,
    print, str, ref, obj, set, iff, ifElse, list, raw, printBlock,
    forEach, compoundExpression, qref, toJson, notEquals, comment
} from 'graphql-mapping-template'
import { ResourceConstants } from 'graphql-transformer-common'

/**
 * Owner auth
 * @param ownerAttribute The name of the owner attribute.
 */
const ownerCreateResolverRequestMappingTemplateSnippet = (ownerAttribute: string) => printBlock('Inject Ownership Information')(
    compoundExpression([
        iff(raw('$util.isNullOrBlank($ctx.identity.username)'), raw('$util.unauthorized()')),
        iff(raw('!$input'), set(ref('input'), ref('util.map.copyAndRemoveAllKeys($context.args.input, [])'))),
        comment(`You may change this by changing the "ownerField" passed to the @auth directive.`),
        qref(`$input.put("${ownerAttribute}", $ctx.identity.username)`)
    ])
)
const ownerUpdateResolverRequestMappingTemplateSnippet = (ownerAttribute: string) => printBlock('Prepare Ownership Condition')(
    compoundExpression([
        set(
            ref(ResourceConstants.SNIPPETS.AuthCondition),
            obj({
                expression: str("#owner = :username"),
                expressionNames: obj({
                    "#owner": str(`${ownerAttribute}`)
                }),
                expressionValues: obj({
                    ":username": obj({
                        "S": str("$ctx.identity.username")
                    })
                })
            })
        )
    ])
)
const ownerDeleteResolverRequestMappingTemplateSnippet = (ownerAttribute: string) => printBlock('Prepare Ownership Condition')(
    compoundExpression([
        set(
            ref(ResourceConstants.SNIPPETS.AuthCondition),
            obj({
                expression: str("#owner = :username"),
                expressionNames: obj({
                    "#owner": str(`${ownerAttribute}`)
                }),
                expressionValues: obj({
                    ":username": obj({
                        "S": str("$ctx.identity.username")
                    })
                })
            })
        )
    ])
)

const ownerGetResolverResponseMappingTemplateSnippet = (ownerAttribute: string) => printBlock('Validate Ownership')(
    iff(notEquals(ref(`ctx.result.${ownerAttribute}`), ref('ctx.identity.username')), raw('$util.unauthorized()'))
)
const ownerListResolverResponseMappingTemplateSnippet = (ownerAttribute: string) => printBlock("Filter Owned Items")(
    compoundExpression([
        set(ref('items'), list([])),
        forEach(ref('item'), ref('ctx.result.items'), [
            iff(raw(`$item.${ownerAttribute} == $ctx.identity.username`), qref('$items.add($item)'))
        ]),
        set(ref('ctx.result.items'), ref('items'))
    ])
)
const ownerQueryResolverResponseMappingTemplateSnippet = (ownerAttribute: string) => printBlock('Filter Owned Items')(
    compoundExpression([
        set(ref('items'), list([])),
        forEach(ref('item'), ref('ctx.result.items'), [
            iff(raw(`$item.${ownerAttribute} == $ctx.identity.username`), qref('$items.add($item)'))
        ]),
        set(ref('ctx.result.items'), ref('items'))
    ])
)

/**
 * Static group auth conditions
 */
const staticGroupAuthorizationRequestMappingTemplate = (groups: string[]) => printBlock('Static Group Authorization')(
    compoundExpression([
        set(ref('userGroups'), ref('ctx.identity.claims.get("cognito:groups")')),
        set(ref('allowedGroups'), list(groups.map(s => str(s)))),
        set(ref('isAuthenticated'), raw('false')),
        forEach(ref('userGroup'), ref('userGroups'), [
            forEach(ref('allowedGroup'), ref('allowedGroups'), [
                iff(
                    raw('$allowedGroup == $userGroup'),
                    set(ref('isAuthenticated'), raw('true'))
                )
            ])
        ]),
        iff(raw('!$isAuthenticated'), raw('$util.unauthorized()')),
    ])
)

/**
 * Dynamic Group Auth Conditions.
 */
const dynamicGroupCreateResolverRequestMappingTemplateSnippet = (groupsAttribute: string) => printBlock('Dynamic Group Authorization')(
    compoundExpression([
        set(ref("userGroups"), ref('ctx.identity.claims.get("cognito:groups")')),
        iff(raw('!$userGroups'), raw('$util.unauthorized()')),
        set(ref('isAuthorized'), raw('false')),
        forEach(ref('userGroup'), ref('userGroups'), [
            iff(
                raw(`$util.isList($ctx.args.input.${groupsAttribute})`),
                iff(raw(`$ctx.args.input.${groupsAttribute}.contains($userGroup)`), set(ref('isAuthorized'), raw('true'))),
            ),
            iff(
                raw(`$util.isString($ctx.args.input.${groupsAttribute})`),
                iff(raw(`$ctx.args.input.${groupsAttribute} == $userGroup`), set(ref('isAuthorized'), raw('true'))),
            )
        ]),
        iff(raw('!$isAuthorized'), raw('$util.unauthorized()'))
    ])
)
const dynamicGroupUpdateAndDeleteResolverRequestMappingTemplateSnippet = (groupsAttribute: string) => printBlock('Dynamic Group Authorization')(
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

const dynamicGroupGetResolverResponseMappingTemplateSnippet = (groupsAttribute: string) => printBlock('Dynamic Group Authorization')(
    compoundExpression([
        set(ref('userGroups'), ref('ctx.identity.claims.get("cognito:groups")')),
        set(ref('allowedGroups'), ref(`ctx.result.${groupsAttribute}`)),
        set(ref('isAuthenticated'), raw('false')),
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
        iff(raw('!$isAuthenticated'), raw('$util.unauthorized()')),
    ])
)

const dynamicGroupListResolverResponseMappingTemplateSnippet = (groupsAttribute: string) => printBlock('Dynamic Group Authorization')(
    compoundExpression([
        set(ref('userGroups'), ref('ctx.identity.claims.get("cognito:groups")')),
        set(ref('items'), list([])),
        forEach(ref('item'), ref('ctx.result.items'), [
            set(ref('isAuthenticated'), raw('false')),
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
            iff(raw('$isAuthenticated'), raw('$util.qr($items.add($item))')),
        ])
    ])
)

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
            Value: Fn.Ref(ResourceConstants.RESOURCES.AuthCognitoUserPoolNativeClientLogicalID),
            Export: {
                Name: Fn.Join(':', [Refs.StackName, "CognitoNativeClient"])
            }
        }
    }

    public makeJSClientOutput(): Output {
        return {
            Description: "Amazon Cognito UserPools JS client ID",
            Value: Fn.Ref(ResourceConstants.RESOURCES.AuthCognitoUserPoolJSClientLogicalID),
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
            AutoVerifiedAttributes: ['email', 'phone_number']
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
            RefreshTokenValidity: Fn.Ref(ResourceConstants.PARAMETERS.AuthCognitoUserPoolRefreshTokenValidity)
        })
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
            RefreshTokenValidity: Fn.Ref(ResourceConstants.PARAMETERS.AuthCognitoUserPoolRefreshTokenValidity)
        })
    }

    /**
     * Update a create resolver to inject the $ctx.identity.username as the "_owner"
     * in the dynamodb table.
     */
    public ownerProtectCreateResolver(resource: Resolver, ownerAttribute: string): Resolver {
        let requestMappingTemplate = resource.Properties.RequestMappingTemplate
        if (requestMappingTemplate) {
            requestMappingTemplate = ownerCreateResolverRequestMappingTemplateSnippet(ownerAttribute) + '\n\n' + requestMappingTemplate
        }
        resource.Properties.RequestMappingTemplate = requestMappingTemplate
        return resource
    }

    public ownerProtectUpdateResolver(resource: Resolver, ownerAttribute: string): Resolver {
        let requestMappingTemplate = resource.Properties.RequestMappingTemplate
        if (requestMappingTemplate) {
            requestMappingTemplate = ownerUpdateResolverRequestMappingTemplateSnippet(ownerAttribute) + '\n\n' + requestMappingTemplate
        }
        resource.Properties.RequestMappingTemplate = requestMappingTemplate
        return resource
    }

    public ownerProtectDeleteResolver(resource: Resolver, ownerAttribute: string): Resolver {
        let requestMappingTemplate = resource.Properties.RequestMappingTemplate
        if (requestMappingTemplate) {
            requestMappingTemplate = ownerDeleteResolverRequestMappingTemplateSnippet(ownerAttribute) + '\n\n' + requestMappingTemplate
        }
        resource.Properties.RequestMappingTemplate = requestMappingTemplate
        return resource
    }

    public ownerProtectGetResolver(resource: Resolver, ownerAttribute: string): Resolver {
        let responseMappingTemplate = resource.Properties.ResponseMappingTemplate
        if (responseMappingTemplate) {
            responseMappingTemplate = ownerGetResolverResponseMappingTemplateSnippet(ownerAttribute) + '\n\n' + responseMappingTemplate
        }
        resource.Properties.ResponseMappingTemplate = responseMappingTemplate
        return resource
    }

    public ownerProtectListResolver(resource: Resolver, ownerAttribute: string): Resolver {
        let responseMappingTemplate = resource.Properties.ResponseMappingTemplate
        if (responseMappingTemplate) {
            responseMappingTemplate = ownerListResolverResponseMappingTemplateSnippet(ownerAttribute) + '\n\n' + responseMappingTemplate
        }
        resource.Properties.ResponseMappingTemplate = responseMappingTemplate
        return resource
    }

    public ownerProtectQueryResolver(resource: Resolver, ownerAttribute: string): Resolver {
        let responseMappingTemplate = resource.Properties.ResponseMappingTemplate
        if (responseMappingTemplate) {
            responseMappingTemplate = ownerQueryResolverResponseMappingTemplateSnippet(ownerAttribute) + '\n\n' + responseMappingTemplate
        }
        resource.Properties.ResponseMappingTemplate = responseMappingTemplate
        return resource
    }

    /**
     * Static Group Auth
     */
    public staticGroupProtectResolver(resource: Resolver, allowedGroups: string[]): Resolver {
        let requestMappingTemplate = resource.Properties.RequestMappingTemplate
        if (requestMappingTemplate) {
            requestMappingTemplate = staticGroupAuthorizationRequestMappingTemplate(allowedGroups) + '\n\n' + requestMappingTemplate
        }
        resource.Properties.RequestMappingTemplate = requestMappingTemplate
        return resource
    }

    /**
     * Dynamic Group Auth.
     * @param resource The resolver to update.
     * @param groupsAttribute The name of the group attribute on each record.
     */
    public dynamicGroupProtectCreateResolver(resource: Resolver, groupsAttribute: string): Resolver {
        let requestMappingTemplate = resource.Properties.RequestMappingTemplate
        if (requestMappingTemplate) {
            requestMappingTemplate = dynamicGroupCreateResolverRequestMappingTemplateSnippet(groupsAttribute) + '\n\n' + requestMappingTemplate
        }
        resource.Properties.RequestMappingTemplate = requestMappingTemplate
        return resource
    }

    public dynamicGroupProtectUpdateResolver(resource: Resolver, groupsAttribute: string): Resolver {
        let requestMappingTemplate = resource.Properties.RequestMappingTemplate
        if (requestMappingTemplate) {
            requestMappingTemplate =
                dynamicGroupUpdateAndDeleteResolverRequestMappingTemplateSnippet(groupsAttribute)
                + '\n\n'
                + requestMappingTemplate
        }
        resource.Properties.RequestMappingTemplate = requestMappingTemplate
        return resource
    }

    public dynamicGroupProtectDeleteResolver(resource: Resolver, groupsAttribute: string): Resolver {
        let requestMappingTemplate = resource.Properties.RequestMappingTemplate
        if (requestMappingTemplate) {
            requestMappingTemplate =
                dynamicGroupUpdateAndDeleteResolverRequestMappingTemplateSnippet(groupsAttribute)
                + '\n\n'
                + requestMappingTemplate
        }
        resource.Properties.RequestMappingTemplate = requestMappingTemplate
        return resource
    }

    public dynamicGroupProtectGetResolver(resource: Resolver, groupsAttribute: string): Resolver {
        let requestMappingTemplate = resource.Properties.RequestMappingTemplate
        if (requestMappingTemplate) {
            requestMappingTemplate =
                dynamicGroupGetResolverResponseMappingTemplateSnippet(groupsAttribute)
                + '\n\n'
                + requestMappingTemplate
        }
        resource.Properties.RequestMappingTemplate = requestMappingTemplate
        return resource
    }

    public dynamicGroupProtectListResolver(resource: Resolver, groupsAttribute: string): Resolver {
        let requestMappingTemplate = resource.Properties.RequestMappingTemplate
        if (requestMappingTemplate) {
            requestMappingTemplate =
                dynamicGroupListResolverResponseMappingTemplateSnippet(groupsAttribute)
                + '\n\n'
                + requestMappingTemplate
        }
        resource.Properties.RequestMappingTemplate = requestMappingTemplate
        return resource
    }

}
