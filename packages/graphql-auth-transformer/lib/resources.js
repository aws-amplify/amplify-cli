"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var cognito_1 = require("cloudform/types/cognito");
var graphQlApi_1 = require("cloudform/types/appSync/graphQlApi");
var cloudform_1 = require("cloudform");
var graphql_mapping_template_1 = require("graphql-mapping-template");
var graphql_transformer_common_1 = require("graphql-transformer-common");
/**
 * Owner auth
 * @param ownerAttribute The name of the owner attribute.
 */
var ownerCreateResolverRequestMappingTemplateSnippet = function (ownerAttribute) { return graphql_mapping_template_1.printBlock('Inject Ownership Information')(graphql_mapping_template_1.compoundExpression([
    graphql_mapping_template_1.iff(graphql_mapping_template_1.raw('$util.isNullOrBlank($ctx.identity.sub)'), graphql_mapping_template_1.raw('$util.unauthorized()')),
    graphql_mapping_template_1.iff(graphql_mapping_template_1.raw('!$input'), graphql_mapping_template_1.set(graphql_mapping_template_1.ref('input'), graphql_mapping_template_1.ref('util.map.copyAndRemoveAllKeys($context.args.input, [])'))),
    graphql_mapping_template_1.comment("You may change this by changing the \"ownerField\" passed to the @auth directive."),
    graphql_mapping_template_1.qref("$input.put(\"" + ownerAttribute + "\", $ctx.identity.sub)")
])); };
var ownerUpdateResolverRequestMappingTemplateSnippet = function (ownerAttribute) { return graphql_mapping_template_1.printBlock('Prepare Ownership Condition')(graphql_mapping_template_1.compoundExpression([
    graphql_mapping_template_1.set(graphql_mapping_template_1.ref(graphql_transformer_common_1.ResourceConstants.SNIPPETS.AuthCondition), graphql_mapping_template_1.obj({
        expression: graphql_mapping_template_1.str("#owner = :sub"),
        expressionNames: graphql_mapping_template_1.obj({
            "#owner": graphql_mapping_template_1.str("" + ownerAttribute)
        }),
        expressionValues: graphql_mapping_template_1.obj({
            ":sub": graphql_mapping_template_1.obj({
                "S": graphql_mapping_template_1.str("$ctx.identity.sub")
            })
        })
    }))
])); };
var ownerDeleteResolverRequestMappingTemplateSnippet = function (ownerAttribute) { return graphql_mapping_template_1.printBlock('Prepare Ownership Condition')(graphql_mapping_template_1.compoundExpression([
    graphql_mapping_template_1.set(graphql_mapping_template_1.ref(graphql_transformer_common_1.ResourceConstants.SNIPPETS.AuthCondition), graphql_mapping_template_1.obj({
        expression: graphql_mapping_template_1.str("#owner = :sub"),
        expressionNames: graphql_mapping_template_1.obj({
            "#owner": graphql_mapping_template_1.str("" + ownerAttribute)
        }),
        expressionValues: graphql_mapping_template_1.obj({
            ":sub": graphql_mapping_template_1.obj({
                "S": graphql_mapping_template_1.str("$ctx.identity.sub")
            })
        })
    }))
])); };
var ownerGetResolverResponseMappingTemplateSnippet = function (ownerAttribute) { return graphql_mapping_template_1.printBlock('Validate Ownership')(graphql_mapping_template_1.iff(graphql_mapping_template_1.notEquals(graphql_mapping_template_1.ref("ctx.result." + ownerAttribute), graphql_mapping_template_1.ref('ctx.identity.sub')), graphql_mapping_template_1.raw('$util.unauthorized()'))); };
var ownerListResolverResponseMappingTemplateSnippet = function (ownerAttribute) { return graphql_mapping_template_1.printBlock("Filter Owned Items")(graphql_mapping_template_1.compoundExpression([
    graphql_mapping_template_1.set(graphql_mapping_template_1.ref('items'), graphql_mapping_template_1.list([])),
    graphql_mapping_template_1.forEach(graphql_mapping_template_1.ref('item'), graphql_mapping_template_1.ref('ctx.result.items'), [
        graphql_mapping_template_1.iff(graphql_mapping_template_1.raw("$item." + ownerAttribute + " == $ctx.identity.sub"), graphql_mapping_template_1.qref('$items.add($item)'))
    ]),
    graphql_mapping_template_1.set(graphql_mapping_template_1.ref('ctx.result.items'), graphql_mapping_template_1.ref('items'))
])); };
var ownerQueryResolverResponseMappingTemplateSnippet = function (ownerAttribute) { return graphql_mapping_template_1.printBlock('Filter Owned Items')(graphql_mapping_template_1.compoundExpression([
    graphql_mapping_template_1.set(graphql_mapping_template_1.ref('items'), graphql_mapping_template_1.list([])),
    graphql_mapping_template_1.forEach(graphql_mapping_template_1.ref('item'), graphql_mapping_template_1.ref('ctx.result.items'), [
        graphql_mapping_template_1.iff(graphql_mapping_template_1.raw("$item." + ownerAttribute + " == $ctx.identity.sub"), graphql_mapping_template_1.qref('$items.add($item)'))
    ]),
    graphql_mapping_template_1.set(graphql_mapping_template_1.ref('ctx.result.items'), graphql_mapping_template_1.ref('items'))
])); };
/**
 * Static group auth conditions
 */
var staticGroupAuthorizationRequestMappingTemplate = function (groups) { return graphql_mapping_template_1.printBlock('Static Group Authorization')(graphql_mapping_template_1.compoundExpression([
    graphql_mapping_template_1.set(graphql_mapping_template_1.ref('userGroups'), graphql_mapping_template_1.ref('ctx.identity.claims.get("cognito:groups")')),
    graphql_mapping_template_1.set(graphql_mapping_template_1.ref('allowedGroups'), graphql_mapping_template_1.list(groups.map(function (s) { return graphql_mapping_template_1.str(s); }))),
    graphql_mapping_template_1.set(graphql_mapping_template_1.ref('isAuthenticated'), graphql_mapping_template_1.raw('false')),
    graphql_mapping_template_1.forEach(graphql_mapping_template_1.ref('userGroup'), graphql_mapping_template_1.ref('userGroups'), [
        graphql_mapping_template_1.forEach(graphql_mapping_template_1.ref('allowedGroup'), graphql_mapping_template_1.ref('allowedGroups'), [
            graphql_mapping_template_1.iff(graphql_mapping_template_1.raw('$allowedGroup == $userGroup'), graphql_mapping_template_1.set(graphql_mapping_template_1.ref('isAuthenticated'), graphql_mapping_template_1.raw('true')))
        ])
    ]),
    graphql_mapping_template_1.iff(graphql_mapping_template_1.raw('!$isAuthenticated'), graphql_mapping_template_1.raw('$util.unauthorized()')),
])); };
/**
 * Dynamic Group Auth Conditions.
 */
var dynamicGroupCreateResolverRequestMappingTemplateSnippet = function (groupsAttribute) { return graphql_mapping_template_1.printBlock('Dynamic Group Authorization')(graphql_mapping_template_1.compoundExpression([
    graphql_mapping_template_1.set(graphql_mapping_template_1.ref("userGroups"), graphql_mapping_template_1.ref('ctx.identity.claims.get("cognito:groups")')),
    graphql_mapping_template_1.iff(graphql_mapping_template_1.raw('!$userGroups'), graphql_mapping_template_1.raw('$util.unauthorized()')),
    graphql_mapping_template_1.set(graphql_mapping_template_1.ref('isAuthorized'), graphql_mapping_template_1.raw('false')),
    graphql_mapping_template_1.forEach(graphql_mapping_template_1.ref('userGroup'), graphql_mapping_template_1.ref('userGroups'), [
        graphql_mapping_template_1.iff(graphql_mapping_template_1.raw("$util.isList($ctx.args.input." + groupsAttribute + ")"), graphql_mapping_template_1.iff(graphql_mapping_template_1.raw("$ctx.args.input." + groupsAttribute + ".contains($userGroup)"), graphql_mapping_template_1.set(graphql_mapping_template_1.ref('isAuthorized'), graphql_mapping_template_1.raw('true')))),
        graphql_mapping_template_1.iff(graphql_mapping_template_1.raw("$util.isString($ctx.args.input." + groupsAttribute + ")"), graphql_mapping_template_1.iff(graphql_mapping_template_1.raw("$ctx.args.input." + groupsAttribute + " == $userGroup"), graphql_mapping_template_1.set(graphql_mapping_template_1.ref('isAuthorized'), graphql_mapping_template_1.raw('true'))))
    ]),
    graphql_mapping_template_1.iff(graphql_mapping_template_1.raw('!$isAuthorized'), graphql_mapping_template_1.raw('$util.unauthorized()'))
])); };
var dynamicGroupUpdateAndDeleteResolverRequestMappingTemplateSnippet = function (groupsAttribute) { return graphql_mapping_template_1.printBlock('Dynamic Group Authorization')(graphql_mapping_template_1.compoundExpression([
    graphql_mapping_template_1.set(graphql_mapping_template_1.ref('groupAuthExpression'), graphql_mapping_template_1.str('')),
    graphql_mapping_template_1.set(graphql_mapping_template_1.ref('groupAuthExpressionValues'), graphql_mapping_template_1.obj({})),
    // Add the new auth expression and values
    graphql_mapping_template_1.forEach(graphql_mapping_template_1.ref('userGroup'), graphql_mapping_template_1.ref('userGroups'), [
        graphql_mapping_template_1.set(graphql_mapping_template_1.ref('groupAuthExpression'), graphql_mapping_template_1.str("$groupAuthExpression contains(#groupsAttribute, :group$foreach.count)")),
        graphql_mapping_template_1.raw("$util.qr($groupAuthExpressionValues.put(\":group$foreach.count\", { \"S\": $userGroup }))"),
        graphql_mapping_template_1.iff(graphql_mapping_template_1.ref('foreach.hasNext'), graphql_mapping_template_1.set(graphql_mapping_template_1.ref('groupAuthExpression'), graphql_mapping_template_1.str("$groupAuthExpression OR")))
    ]),
    // If there is no auth condition, initialize it.
    graphql_mapping_template_1.ifElse(graphql_mapping_template_1.raw("!$" + graphql_transformer_common_1.ResourceConstants.SNIPPETS.AuthCondition), graphql_mapping_template_1.set(graphql_mapping_template_1.ref(graphql_transformer_common_1.ResourceConstants.SNIPPETS.AuthCondition), graphql_mapping_template_1.obj({
        expression: graphql_mapping_template_1.ref('groupAuthExpression'),
        expressionNames: graphql_mapping_template_1.obj({ groupsAttribute: graphql_mapping_template_1.str(groupsAttribute) }),
        expressionValues: graphql_mapping_template_1.ref('groupAuthExpressionValues')
    })), graphql_mapping_template_1.compoundExpression([
        graphql_mapping_template_1.set(graphql_mapping_template_1.ref(graphql_transformer_common_1.ResourceConstants.SNIPPETS.AuthCondition + ".expression"), graphql_mapping_template_1.raw("$" + graphql_transformer_common_1.ResourceConstants.SNIPPETS.AuthCondition + ".expression AND ($groupAuthExpression)")),
        graphql_mapping_template_1.raw("$util.qr($" + graphql_transformer_common_1.ResourceConstants.SNIPPETS.AuthCondition + ".expressionNames.put(\"groupsAttribute\", \"" + groupsAttribute + "\"))"),
        graphql_mapping_template_1.raw("$util.qr($" + graphql_transformer_common_1.ResourceConstants.SNIPPETS.AuthCondition + ".expressionValues.putAll($groupAuthExpressionValues))"),
    ]))
])); };
var dynamicGroupGetResolverResponseMappingTemplateSnippet = function (groupsAttribute) { return graphql_mapping_template_1.printBlock('Dynamic Group Authorization')(graphql_mapping_template_1.compoundExpression([
    graphql_mapping_template_1.set(graphql_mapping_template_1.ref('userGroups'), graphql_mapping_template_1.ref('ctx.identity.claims.get("cognito:groups")')),
    graphql_mapping_template_1.set(graphql_mapping_template_1.ref('allowedGroups'), graphql_mapping_template_1.ref("ctx.result." + groupsAttribute)),
    graphql_mapping_template_1.set(graphql_mapping_template_1.ref('isAuthenticated'), graphql_mapping_template_1.raw('false')),
    graphql_mapping_template_1.forEach(graphql_mapping_template_1.ref('userGroup'), graphql_mapping_template_1.ref('userGroups'), [
        graphql_mapping_template_1.iff(graphql_mapping_template_1.raw('$util.isList($allowedGroups)'), graphql_mapping_template_1.iff(graphql_mapping_template_1.raw("$allowedGroups.contains($userGroup)"), graphql_mapping_template_1.set(graphql_mapping_template_1.ref('isAuthorized'), graphql_mapping_template_1.raw('true')))),
        graphql_mapping_template_1.iff(graphql_mapping_template_1.raw("$util.isString($allowedGroups)"), graphql_mapping_template_1.iff(graphql_mapping_template_1.raw("$allowedGroups == $userGroup"), graphql_mapping_template_1.set(graphql_mapping_template_1.ref('isAuthorized'), graphql_mapping_template_1.raw('true'))))
    ]),
    graphql_mapping_template_1.iff(graphql_mapping_template_1.raw('!$isAuthenticated'), graphql_mapping_template_1.raw('$util.unauthorized()')),
])); };
var dynamicGroupListResolverResponseMappingTemplateSnippet = function (groupsAttribute) { return graphql_mapping_template_1.printBlock('Dynamic Group Authorization')(graphql_mapping_template_1.compoundExpression([
    graphql_mapping_template_1.set(graphql_mapping_template_1.ref('userGroups'), graphql_mapping_template_1.ref('ctx.identity.claims.get("cognito:groups")')),
    graphql_mapping_template_1.set(graphql_mapping_template_1.ref('items'), graphql_mapping_template_1.list([])),
    graphql_mapping_template_1.forEach(graphql_mapping_template_1.ref('item'), graphql_mapping_template_1.ref('ctx.result.items'), [
        graphql_mapping_template_1.set(graphql_mapping_template_1.ref('isAuthenticated'), graphql_mapping_template_1.raw('false')),
        graphql_mapping_template_1.set(graphql_mapping_template_1.ref('allowedGroups'), graphql_mapping_template_1.ref("item." + groupsAttribute)),
        graphql_mapping_template_1.forEach(graphql_mapping_template_1.ref('userGroup'), graphql_mapping_template_1.ref('userGroups'), [
            graphql_mapping_template_1.iff(graphql_mapping_template_1.raw('$util.isList($allowedGroups)'), graphql_mapping_template_1.iff(graphql_mapping_template_1.raw("$allowedGroups.contains($userGroup)"), graphql_mapping_template_1.set(graphql_mapping_template_1.ref('isAuthorized'), graphql_mapping_template_1.raw('true')))),
            graphql_mapping_template_1.iff(graphql_mapping_template_1.raw("$util.isString($allowedGroups)"), graphql_mapping_template_1.iff(graphql_mapping_template_1.raw("$allowedGroups == $userGroup"), graphql_mapping_template_1.set(graphql_mapping_template_1.ref('isAuthorized'), graphql_mapping_template_1.raw('true'))))
        ]),
        graphql_mapping_template_1.iff(graphql_mapping_template_1.raw('$isAuthenticated'), graphql_mapping_template_1.raw('$util.qr($items.add($item))')),
    ])
])); };
var ResourceFactory = /** @class */ (function () {
    function ResourceFactory() {
    }
    ResourceFactory.prototype.makeParams = function () {
        var _a;
        return _a = {},
            _a[graphql_transformer_common_1.ResourceConstants.PARAMETERS.AuthCognitoUserPoolId] = new cloudform_1.StringParameter({
                Description: 'The id of an existing User Pool to connect. If this is changed, a user pool will not be created for you.',
                Default: graphql_transformer_common_1.ResourceConstants.NONE
            }),
            _a[graphql_transformer_common_1.ResourceConstants.PARAMETERS.AuthCognitoUserPoolName] = new cloudform_1.StringParameter({
                Description: 'The name of the AppSync API',
                Default: 'AppSyncUserPool'
            }),
            _a[graphql_transformer_common_1.ResourceConstants.PARAMETERS.AuthCognitoUserPoolMobileClientName] = new cloudform_1.StringParameter({
                Description: 'The name of the native user pool client.',
                Default: 'CognitoNativeClient'
            }),
            _a[graphql_transformer_common_1.ResourceConstants.PARAMETERS.AuthCognitoUserPoolJSClientName] = new cloudform_1.StringParameter({
                Description: 'The name of the web user pool client.',
                Default: 'CognitoJSClient'
            }),
            _a[graphql_transformer_common_1.ResourceConstants.PARAMETERS.AuthCognitoUserPoolRefreshTokenValidity] = new cloudform_1.NumberParameter({
                Description: 'The time limit, in days, after which the refresh token is no longer valid.',
                Default: 30
            }),
            _a;
    };
    /**
     * Creates the barebones template for an application.
     */
    ResourceFactory.prototype.initTemplate = function () {
        var _a, _b, _c;
        return {
            Parameters: this.makeParams(),
            Resources: (_a = {},
                _a[graphql_transformer_common_1.ResourceConstants.RESOURCES.AuthCognitoUserPoolLogicalID] = this.makeUserPool(),
                _a[graphql_transformer_common_1.ResourceConstants.RESOURCES.AuthCognitoUserPoolNativeClientLogicalID] = this.makeUserPoolNativeClient(),
                _a[graphql_transformer_common_1.ResourceConstants.RESOURCES.AuthCognitoUserPoolJSClientLogicalID] = this.makeUserPoolJSClient(),
                _a),
            Outputs: (_b = {},
                _b[graphql_transformer_common_1.ResourceConstants.OUTPUTS.AuthCognitoUserPoolNativeClientOutput] = this.makeNativeClientOutput(),
                _b[graphql_transformer_common_1.ResourceConstants.OUTPUTS.AuthCognitoUserPoolJSClientOutput] = this.makeJSClientOutput(),
                _b[graphql_transformer_common_1.ResourceConstants.OUTPUTS.AuthCognitoUserPoolIdOutput] = this.makeUserPoolOutput(),
                _b),
            Conditions: (_c = {},
                _c[graphql_transformer_common_1.ResourceConstants.CONDITIONS.AuthShouldCreateUserPool] = this.makeShouldCreateUserPoolCondition(),
                _c)
        };
    };
    /**
     * Conditions
     */
    ResourceFactory.prototype.makeShouldCreateUserPoolCondition = function () {
        return cloudform_1.Fn.Equals(cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.AuthCognitoUserPoolId), graphql_transformer_common_1.ResourceConstants.NONE);
    };
    /**
     * Outputs
     */
    ResourceFactory.prototype.makeNativeClientOutput = function () {
        return {
            Description: "Amazon Cognito UserPools native client ID",
            Value: cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.RESOURCES.AuthCognitoUserPoolNativeClientLogicalID),
            Export: {
                Name: cloudform_1.Fn.Join(':', [cloudform_1.Refs.StackName, "CognitoNativeClient"])
            }
        };
    };
    ResourceFactory.prototype.makeJSClientOutput = function () {
        return {
            Description: "Amazon Cognito UserPools JS client ID",
            Value: cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.RESOURCES.AuthCognitoUserPoolJSClientLogicalID),
            Export: {
                Name: cloudform_1.Fn.Join(':', [cloudform_1.Refs.StackName, "CognitoJSClient"])
            }
        };
    };
    ResourceFactory.prototype.makeUserPoolOutput = function () {
        return {
            Description: "Amazon Cognito UserPool id",
            Value: cloudform_1.Fn.If(graphql_transformer_common_1.ResourceConstants.CONDITIONS.AuthShouldCreateUserPool, cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.RESOURCES.AuthCognitoUserPoolLogicalID), cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.AuthCognitoUserPoolId)),
            Export: {
                Name: cloudform_1.Fn.Join(':', [cloudform_1.Refs.StackName, "CognitoUserPoolId"])
            }
        };
    };
    ResourceFactory.prototype.updateGraphQLAPIWithAuth = function (apiRecord) {
        return new graphQlApi_1.default(__assign({}, apiRecord.Properties, { Name: apiRecord.Properties.Name, AuthenticationType: 'AMAZON_COGNITO_USER_POOLS', UserPoolConfig: new graphQlApi_1.UserPoolConfig({
                UserPoolId: cloudform_1.Fn.If(graphql_transformer_common_1.ResourceConstants.CONDITIONS.AuthShouldCreateUserPool, cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.RESOURCES.AuthCognitoUserPoolLogicalID), cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.AuthCognitoUserPoolId)),
                AwsRegion: cloudform_1.Refs.Region,
                DefaultAction: 'ALLOW'
            }) }));
    };
    ResourceFactory.prototype.makeUserPool = function () {
        return new cognito_1.default.UserPool({
            AliasAttributes: ['email'],
            UserPoolName: cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.AuthCognitoUserPoolName),
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
        }).condition(graphql_transformer_common_1.ResourceConstants.CONDITIONS.AuthShouldCreateUserPool);
    };
    ResourceFactory.prototype.makeUserPoolNativeClient = function () {
        return new cognito_1.default.UserPoolClient({
            ClientName: cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.AuthCognitoUserPoolMobileClientName),
            UserPoolId: cloudform_1.Fn.If(graphql_transformer_common_1.ResourceConstants.CONDITIONS.AuthShouldCreateUserPool, cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.RESOURCES.AuthCognitoUserPoolLogicalID), cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.AuthCognitoUserPoolId)),
            GenerateSecret: true,
            RefreshTokenValidity: cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.AuthCognitoUserPoolRefreshTokenValidity)
        });
    };
    ResourceFactory.prototype.makeUserPoolJSClient = function () {
        return new cognito_1.default.UserPoolClient({
            ClientName: cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.AuthCognitoUserPoolJSClientName),
            UserPoolId: cloudform_1.Fn.If(graphql_transformer_common_1.ResourceConstants.CONDITIONS.AuthShouldCreateUserPool, cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.RESOURCES.AuthCognitoUserPoolLogicalID), cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.AuthCognitoUserPoolId)),
            GenerateSecret: false,
            RefreshTokenValidity: cloudform_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.AuthCognitoUserPoolRefreshTokenValidity)
        });
    };
    /**
     * Update a create resolver to inject the $ctx.identity.sub as the "_owner"
     * in the dynamodb table.
     */
    ResourceFactory.prototype.ownerProtectCreateResolver = function (resource, ownerAttribute) {
        var requestMappingTemplate = resource.Properties.RequestMappingTemplate;
        if (requestMappingTemplate) {
            requestMappingTemplate = ownerCreateResolverRequestMappingTemplateSnippet(ownerAttribute) + '\n\n' + requestMappingTemplate;
        }
        resource.Properties.RequestMappingTemplate = requestMappingTemplate;
        return resource;
    };
    ResourceFactory.prototype.ownerProtectUpdateResolver = function (resource, ownerAttribute) {
        var requestMappingTemplate = resource.Properties.RequestMappingTemplate;
        if (requestMappingTemplate) {
            requestMappingTemplate = ownerUpdateResolverRequestMappingTemplateSnippet(ownerAttribute) + '\n\n' + requestMappingTemplate;
        }
        resource.Properties.RequestMappingTemplate = requestMappingTemplate;
        return resource;
    };
    ResourceFactory.prototype.ownerProtectDeleteResolver = function (resource, ownerAttribute) {
        var requestMappingTemplate = resource.Properties.RequestMappingTemplate;
        if (requestMappingTemplate) {
            requestMappingTemplate = ownerDeleteResolverRequestMappingTemplateSnippet(ownerAttribute) + '\n\n' + requestMappingTemplate;
        }
        resource.Properties.RequestMappingTemplate = requestMappingTemplate;
        return resource;
    };
    ResourceFactory.prototype.ownerProtectGetResolver = function (resource, ownerAttribute) {
        var responseMappingTemplate = resource.Properties.ResponseMappingTemplate;
        if (responseMappingTemplate) {
            responseMappingTemplate = ownerGetResolverResponseMappingTemplateSnippet(ownerAttribute) + '\n\n' + responseMappingTemplate;
        }
        resource.Properties.ResponseMappingTemplate = responseMappingTemplate;
        return resource;
    };
    ResourceFactory.prototype.ownerProtectListResolver = function (resource, ownerAttribute) {
        var responseMappingTemplate = resource.Properties.ResponseMappingTemplate;
        if (responseMappingTemplate) {
            responseMappingTemplate = ownerListResolverResponseMappingTemplateSnippet(ownerAttribute) + '\n\n' + responseMappingTemplate;
        }
        resource.Properties.ResponseMappingTemplate = responseMappingTemplate;
        return resource;
    };
    ResourceFactory.prototype.ownerProtectQueryResolver = function (resource, ownerAttribute) {
        var responseMappingTemplate = resource.Properties.ResponseMappingTemplate;
        if (responseMappingTemplate) {
            responseMappingTemplate = ownerQueryResolverResponseMappingTemplateSnippet(ownerAttribute) + '\n\n' + responseMappingTemplate;
        }
        resource.Properties.ResponseMappingTemplate = responseMappingTemplate;
        return resource;
    };
    /**
     * Static Group Auth
     */
    ResourceFactory.prototype.staticGroupProtectResolver = function (resource, allowedGroups) {
        var requestMappingTemplate = resource.Properties.RequestMappingTemplate;
        if (requestMappingTemplate) {
            requestMappingTemplate = staticGroupAuthorizationRequestMappingTemplate(allowedGroups) + '\n\n' + requestMappingTemplate;
        }
        resource.Properties.RequestMappingTemplate = requestMappingTemplate;
        return resource;
    };
    /**
     * Dynamic Group Auth.
     * @param resource The resolver to update.
     * @param groupsAttribute The name of the group attribute on each record.
     */
    ResourceFactory.prototype.dynamicGroupProtectCreateResolver = function (resource, groupsAttribute) {
        var requestMappingTemplate = resource.Properties.RequestMappingTemplate;
        if (requestMappingTemplate) {
            requestMappingTemplate = dynamicGroupCreateResolverRequestMappingTemplateSnippet(groupsAttribute) + '\n\n' + requestMappingTemplate;
        }
        resource.Properties.RequestMappingTemplate = requestMappingTemplate;
        return resource;
    };
    ResourceFactory.prototype.dynamicGroupProtectUpdateResolver = function (resource, groupsAttribute) {
        var requestMappingTemplate = resource.Properties.RequestMappingTemplate;
        if (requestMappingTemplate) {
            requestMappingTemplate =
                dynamicGroupUpdateAndDeleteResolverRequestMappingTemplateSnippet(groupsAttribute)
                    + '\n\n'
                    + requestMappingTemplate;
        }
        resource.Properties.RequestMappingTemplate = requestMappingTemplate;
        return resource;
    };
    ResourceFactory.prototype.dynamicGroupProtectDeleteResolver = function (resource, groupsAttribute) {
        var requestMappingTemplate = resource.Properties.RequestMappingTemplate;
        if (requestMappingTemplate) {
            requestMappingTemplate =
                dynamicGroupUpdateAndDeleteResolverRequestMappingTemplateSnippet(groupsAttribute)
                    + '\n\n'
                    + requestMappingTemplate;
        }
        resource.Properties.RequestMappingTemplate = requestMappingTemplate;
        return resource;
    };
    ResourceFactory.prototype.dynamicGroupProtectGetResolver = function (resource, groupsAttribute) {
        var requestMappingTemplate = resource.Properties.RequestMappingTemplate;
        if (requestMappingTemplate) {
            requestMappingTemplate =
                dynamicGroupGetResolverResponseMappingTemplateSnippet(groupsAttribute)
                    + '\n\n'
                    + requestMappingTemplate;
        }
        resource.Properties.RequestMappingTemplate = requestMappingTemplate;
        return resource;
    };
    ResourceFactory.prototype.dynamicGroupProtectListResolver = function (resource, groupsAttribute) {
        var requestMappingTemplate = resource.Properties.RequestMappingTemplate;
        if (requestMappingTemplate) {
            requestMappingTemplate =
                dynamicGroupListResolverResponseMappingTemplateSnippet(groupsAttribute)
                    + '\n\n'
                    + requestMappingTemplate;
        }
        resource.Properties.RequestMappingTemplate = requestMappingTemplate;
        return resource;
    };
    return ResourceFactory;
}());
exports.ResourceFactory = ResourceFactory;
//# sourceMappingURL=resources.js.map