import Template from 'cloudform/types/template'
import Cognito from 'cloudform/types/cognito'
import Output from 'cloudform/types/output'
import GraphQLAPI, { UserPoolConfig } from 'cloudform/types/appSync/graphQlApi'
import Resolver from 'cloudform/types/appSync/resolver'
import { Fn, StringParameter, Refs, NumberParameter, Condition } from 'cloudform'
import {
    DynamoDBMappingTemplate, ElasticSearchMappingTemplate,
    print, str, ref, obj, set, iff, ifElse, list, raw,
    forEach, compoundExpression, qref, toJson, notEquals, comment
} from 'amplify-graphql-mapping-template'
import { ResourceConstants } from 'amplify-graphql-transformer-common'

const ownerCreateResolverRequestMappingTemplateSnippet = print(
    compoundExpression([
        comment('If there is no subject, throw an unauthorized exception.'),
        iff(raw('$util.isNullOrBlank($ctx.identity.sub)'), raw('$util.unauthorized()')),
        iff(raw('!$input'), set(ref('input'), ref('util.map.copyAndRemoveAllKeys($context.args.input, [])'))),
        comment(`Automatically inject the ownership attribute.`),
        comment(`Change the name of this attribute by updating in the ${
            ResourceConstants.PARAMETERS.AuthOwnerAttributeName} CloudFormation parameter.`),
        qref(`$input.put("\${ownerAttribute}", $ctx.identity.sub)`)
    ])
)
const ownerUpdateResolverRequestMappingTemplateSnippet = print(
    compoundExpression([
        comment('Create the ownership condition for the DynamoDB update request.'),
        set(
            ref(ResourceConstants.SNIPPETS.AuthCondition),
            obj({
                expression: str("#owner = :sub"),
                expressionNames: obj({
                    "#owner": str("${ownerAttribute}")
                }),
                expressionValues: obj({
                    ":sub": obj({
                        "S": str("$ctx.identity.sub")
                    })
                })
            })
        )
    ])
)
const ownerDeleteResolverRequestMappingTemplateSnippet = print(
    compoundExpression([
        comment('Create the ownership condition for the DynamoDB delete request.'),
        set(
            ref(ResourceConstants.SNIPPETS.AuthCondition),
            obj({
                expression: str("#owner = :sub"),
                expressionNames: obj({
                    "#owner": str("${ownerAttribute}")
                }),
                expressionValues: obj({
                    ":sub": obj({
                        "S": str("$ctx.identity.sub")
                    })
                })
            })
        )
    ])
)

const ownerGetResolverResponseMappingTemplateSnippet = print(
    iff(notEquals(ref(`ctx.result.\${ownerAttribute}`), ref('ctx.identity.sub')), raw('$util.unauthorized()'))
)
const ownerListResolverResponseMappingTemplateSnippet = print(
    compoundExpression([
        set(ref('items'), list([])),
        forEach(ref('item'), ref('ctx.result.items'), [
            iff(raw(`$item.\${ownerAttribute} == $ctx.identity.sub`), qref('$items.add($item)'))
        ]),
        set(ref('ctx.result.items'), ref('items'))
    ])
)
const ownerQueryResolverResponseMappingTemplateSnippet = print(
    compoundExpression([
        set(ref('items'), list([])),
        forEach(ref('item'), ref('ctx.result.items'), [
            iff(raw(`$item.\${ownerAttribute} == $ctx.identity.sub`), qref('$items.add($item)'))
        ]),
        set(ref('ctx.result.items'), ref('items'))
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
            }),
            [ResourceConstants.PARAMETERS.AuthOwnerAttributeName]: new StringParameter({
                Description: 'The name of the attribute that will be injected for ownership authorization checks.',
                Default: 'owner'
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
     * Update a create resolver to inject the $ctx.identity.sub as the "_owner"
     * in the dynamodb table.
     */
    public ownerProtectCreateResolver(resource: Resolver): Resolver {
        let requestMappingTemplate = resource.Properties.RequestMappingTemplate
        if (requestMappingTemplate) {
            requestMappingTemplate = Fn.Sub(
                ownerCreateResolverRequestMappingTemplateSnippet + '\n' + requestMappingTemplate,
                {
                    ownerAttribute: Fn.Ref(ResourceConstants.PARAMETERS.AuthOwnerAttributeName)
                }
            )
        }
        resource.Properties.RequestMappingTemplate = requestMappingTemplate
        return resource
    }

    public ownerProtectUpdateResolver(resource: Resolver): Resolver {
        let requestMappingTemplate = resource.Properties.RequestMappingTemplate
        if (requestMappingTemplate) {
            requestMappingTemplate = Fn.Sub(
                ownerUpdateResolverRequestMappingTemplateSnippet + '\n' + requestMappingTemplate,
                {
                    ownerAttribute: Fn.Ref(ResourceConstants.PARAMETERS.AuthOwnerAttributeName)
                }
            )
        }
        resource.Properties.RequestMappingTemplate = requestMappingTemplate
        return resource
    }

    public ownerProtectDeleteResolver(resource: Resolver): Resolver {
        let requestMappingTemplate = resource.Properties.RequestMappingTemplate
        if (requestMappingTemplate) {
            requestMappingTemplate = Fn.Sub(
                ownerDeleteResolverRequestMappingTemplateSnippet + '\n' + requestMappingTemplate,
                {
                    ownerAttribute: Fn.Ref(ResourceConstants.PARAMETERS.AuthOwnerAttributeName)
                }
            )
        }
        resource.Properties.RequestMappingTemplate = requestMappingTemplate
        return resource
    }

    public ownerProtectGetResolver(resource: Resolver): Resolver {
        let responseMappingTemplate = resource.Properties.ResponseMappingTemplate
        if (responseMappingTemplate) {
            responseMappingTemplate = Fn.Sub(
                ownerGetResolverResponseMappingTemplateSnippet + '\n' + responseMappingTemplate,
                {
                    ownerAttribute: Fn.Ref(ResourceConstants.PARAMETERS.AuthOwnerAttributeName)
                }
            )
        }
        resource.Properties.ResponseMappingTemplate = responseMappingTemplate
        return resource
    }

    public ownerProtectListResolver(resource: Resolver): Resolver {
        let responseMappingTemplate = resource.Properties.ResponseMappingTemplate
        if (responseMappingTemplate) {
            responseMappingTemplate = Fn.Sub(
                ownerListResolverResponseMappingTemplateSnippet + '\n' + responseMappingTemplate,
                {
                    ownerAttribute: Fn.Ref(ResourceConstants.PARAMETERS.AuthOwnerAttributeName)
                }
            )
        }
        resource.Properties.ResponseMappingTemplate = responseMappingTemplate
        return resource
    }

    public ownerProtectQueryResolver(resource: Resolver): Resolver {
        let responseMappingTemplate = resource.Properties.ResponseMappingTemplate
        if (responseMappingTemplate) {
            responseMappingTemplate = Fn.Sub(
                ownerQueryResolverResponseMappingTemplateSnippet + '\n' + responseMappingTemplate,
                {
                    ownerAttribute: Fn.Ref(ResourceConstants.PARAMETERS.AuthOwnerAttributeName)
                }
            )
        }
        resource.Properties.ResponseMappingTemplate = responseMappingTemplate
        return resource
    }

}
