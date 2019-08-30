import Template from 'cloudform-types/types/template'
import GraphQLAPI, { UserPoolConfig } from 'cloudform-types/types/appSync/graphQlApi'
import { AppSync, Fn, StringParameter, Refs } from 'cloudform-types'
import { AuthRule } from './AuthRule'
import {
    str, ref, obj, set, iff, list, raw,
    forEach, compoundExpression, qref, equals, comment,
    or, Expression, SetNode, and, not, parens,
    block, print, ifElse,
} from 'graphql-mapping-template'
import { ResourceConstants, NONE_VALUE } from 'graphql-transformer-common'
import { AppSyncAuthModeModes } from './ModelAuthTransformer';
import { InvalidDirectiveError } from 'graphql-transformer-core';

import {
    DEFAULT_OWNER_FIELD,
    DEFAULT_IDENTITY_FIELD,
    DEFAULT_GROUPS_FIELD
} from './constants'

function replaceIfUsername(identityClaim: string): string {
    return (identityClaim === 'username') ? 'cognito:username' : identityClaim;
}

function isUsername(identityClaim: string): boolean {
    return identityClaim === 'username'
}

export class ResourceFactory {

    public makeParams() {
        return {
            [ResourceConstants.PARAMETERS.AuthCognitoUserPoolId]: new StringParameter({
                Description: 'The id of an existing User Pool to connect. If this is changed, a user pool will not be created for you.',
                Default: ResourceConstants.NONE
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
                [ResourceConstants.RESOURCES.APIKeyLogicalID]: this.makeAppSyncApiKey()
            },
            Outputs: {
                [ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput]: this.makeApiKeyOutput()
            },
            Conditions: {
                [ResourceConstants.CONDITIONS.ShouldCreateAPIKey]:
                    Fn.And([
                        Fn.Not(Fn.Equals(Fn.Ref(ResourceConstants.PARAMETERS.APIKeyExpirationEpoch), -1)),
                        Fn.Equals(Fn.Ref(ResourceConstants.PARAMETERS.AuthCognitoUserPoolId), ResourceConstants.NONE)
                    ]),
                [ResourceConstants.CONDITIONS.APIKeyExpirationEpochIsPositive]:
                    Fn.And([
                        Fn.Not(Fn.Equals(Fn.Ref(ResourceConstants.PARAMETERS.APIKeyExpirationEpoch), -1)),
                        Fn.Not(Fn.Equals(Fn.Ref(ResourceConstants.PARAMETERS.APIKeyExpirationEpoch), 0))
                    ]),
            }
        }
    }

    public makeAppSyncApiKey() {
        const oneWeekFromNowInSeconds = 60 /* s */ * 60 /* m */ * 24 /* h */ * 7 /* d */
        const nowEpochTime = Math.floor(Date.now() / 1000)
        return new AppSync.ApiKey({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            Expires: Fn.If(
                ResourceConstants.CONDITIONS.APIKeyExpirationEpochIsPositive,
                Fn.Ref(ResourceConstants.PARAMETERS.APIKeyExpirationEpoch),
                nowEpochTime + oneWeekFromNowInSeconds
            ),
        }).condition(ResourceConstants.CONDITIONS.ShouldCreateAPIKey)
    }

    /**
     * Outputs
     */
    public makeApiKeyOutput(): any {
        return {
            Description: "Your GraphQL API key. Provide via 'x-api-key' header.",
            Value: Fn.GetAtt(ResourceConstants.RESOURCES.APIKeyLogicalID, 'ApiKey'),
            Export: {
                Name: Fn.Join(':', [Refs.StackName, "GraphQLApiKey"])
            },
            Condition: ResourceConstants.CONDITIONS.ShouldCreateAPIKey
        };
    }

    public updateGraphQLAPIWithAuth(apiRecord: GraphQLAPI, authMode: AppSyncAuthModeModes) {
        return new GraphQLAPI({
            ...apiRecord.Properties,
            Name: apiRecord.Properties.Name,
            AuthenticationType: authMode,
            UserPoolConfig: authMode === 'AMAZON_COGNITO_USER_POOLS' ?
                new UserPoolConfig({
                    UserPoolId: Fn.Ref(ResourceConstants.PARAMETERS.AuthCognitoUserPoolId),
                    AwsRegion: Refs.Region,
                    DefaultAction: 'ALLOW'
                }) :
                undefined
        })
    }

    public blankResolver(type: string, field: string) {
        return new AppSync.Resolver({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: 'NONE',
            FieldName: field,
            TypeName: type,
            RequestMappingTemplate: print(obj({
                "version": str("2017-02-28"),
                "payload": obj({})
            })),
            ResponseMappingTemplate: print(ref(`util.toJson($context.source.${field})`))
        })
    }

    public noneDataSource() {
        return new AppSync.DataSource({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            Name: 'NONE',
            Type: 'NONE'
        })
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
        let customClaim: string;
        for (const rule of rules) {
            const groups = rule.groups;
            for (const group of groups) {
                if (group) {
                    allowedGroups.push(group);
                }
            }
            if (rule.groupClaim) {
                if (customClaim) {
                    throw new InvalidDirectiveError(`@auth directive currently only supports one source for groupClaim.
  - Identified '${customClaim}' and '${rule.groupClaim}'`)
                }
                customClaim = rule.groupClaim;
            }
        }

        return block('Static Group Authorization Checks', [
            comment(`Authorization rule: { allow: groups, groups: "${JSON.stringify(allowedGroups)}" }`),
            this.setUserGroups(customClaim),
            set(ref('allowedGroups'), list(allowedGroups.map(s => str(s)))),
            // tslint:disable-next-line
            raw(`#set($${ResourceConstants.SNIPPETS.IsStaticGroupAuthorizedVariable} = $util.defaultIfNull(
                $${ResourceConstants.SNIPPETS.IsStaticGroupAuthorizedVariable}, false))`),
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
        return block('Dynamic Group Authorization Checks', [
            this.dynamicAuthorizationExpressionForCreate(rules, variableToCheck, variableToSet)
        ])
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
        variableToSet: string = ResourceConstants.SNIPPETS.IsDynamicGroupAuthorizedVariable,
    ): Expression {
        if (!rules || rules.length === 0) {
            return comment(`No dynamic group authorization rules for field "${fieldToCheck}"`);
        }
        let groupAuthorizationExpression: Expression = this.dynamicAuthorizationExpressionForCreate(
            rules, variableToCheck, variableToSet,
            rule => `Authorization rule on field "${fieldToCheck}": { allow: ${rule.allow}, \
groupsField: "${rule.groupsField || DEFAULT_GROUPS_FIELD}" }`
        )
        return block(`Dynamic group authorization rules for field "${fieldToCheck}"`, [
            groupAuthorizationExpression
        ])
    }

    private dynamicAuthorizationExpressionForCreate(
        rules: AuthRule[],
        variableToCheck: string = 'ctx.args.input',
        variableToSet: string = ResourceConstants.SNIPPETS.IsDynamicGroupAuthorizedVariable,
        formatComment?: (rule: AuthRule) => string,
    ) {
        let groupAuthorizationExpressions = []
        let customClaim: string;
        for (const rule of rules) {
            if (rule.groupClaim) {
                if (customClaim) {
                    throw new InvalidDirectiveError('@auth directive currently only supports one source for groupClaim!')
                }
                customClaim = rule.groupClaim;
            }
            // for loop do check of rules here
            const groupsAttribute = rule.groupsField || DEFAULT_GROUPS_FIELD
            groupAuthorizationExpressions = groupAuthorizationExpressions.concat(
                formatComment ?
                    comment(formatComment(rule)) :
                    comment(`Authorization rule: { allow: ${rule.allow}, groupsField: "${groupsAttribute}" }`),
                set(
                    ref(variableToSet),
                    raw(`$util.defaultIfNull($${variableToSet}, false)`)
                ),
                forEach(ref('userGroup'), ref('userGroups'), [
                    iff(
                        raw(`$util.isList($ctx.args.input.${groupsAttribute})`),
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

        // adds group claim
        return compoundExpression([
            this.setUserGroups(customClaim),
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
        return block('Owner Authorization Checks', [
            this.ownershipAuthorizationExpressionForCreate(rules, fieldIsList, variableToCheck, variableToSet)
        ])
    }

    public ownerAuthorizationExpressionForSubscriptions(
        rules: AuthRule[],
        variableToCheck: string = 'ctx.args',
        variableToSet: string = ResourceConstants.SNIPPETS.IsOwnerAuthorizedVariable,
    ): Expression {
        if (!rules || rules.length === 0) {
            return comment(`No Owner Authorization Rules`)
        }
        return block('Owner Authorization Checks', [
            this.ownershipAuthorizationExpressionForSubscriptions(rules, variableToCheck, variableToSet)
        ])
    }
    public ownershipAuthorizationExpressionForSubscriptions(
        rules: AuthRule[],
        variableToCheck: string = 'ctx.args',
        variableToSet: string = ResourceConstants.SNIPPETS.IsOwnerAuthorizedVariable,
        formatComment?: (rule: AuthRule) => string,
    ) {
        let ownershipAuthorizationExpressions = []
        let ruleNumber = 0;
        for (const rule of rules) {
            const ownerAttribute = rule.ownerField || DEFAULT_OWNER_FIELD
            const rawUsername = rule.identityField || rule.identityClaim || DEFAULT_IDENTITY_FIELD
            const isUser = isUsername(rawUsername)
            const identityAttribute = replaceIfUsername(rawUsername)
            const allowedOwnersVariable = `allowedOwners${ruleNumber}`
            ownershipAuthorizationExpressions = ownershipAuthorizationExpressions.concat(
                formatComment ?
                    comment(formatComment(rule)) :
                    comment(`Authorization rule: { allow: ${rule.allow}, ownerField: "${ownerAttribute}", identityClaim: "${identityAttribute}" }`),
                set(ref(allowedOwnersVariable), raw(`$util.defaultIfNull($${variableToCheck}.${ownerAttribute}, null)`)),
                isUser ?
                    // tslint:disable-next-line
                    set(
                        ref('identityValue'),
                        raw(`$util.defaultIfNull($ctx.identity.claims.get("${rawUsername}"),
                        $util.defaultIfNull($ctx.identity.claims.get("${identityAttribute}"), "${NONE_VALUE}"))`)
                        )
                    : set(
                        ref('identityValue'),
                        raw(`$util.defaultIfNull($ctx.identity.claims.get("${identityAttribute}"), "${NONE_VALUE}")`)
                        ),
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
            ruleNumber++
        }
        return compoundExpression([
            set(ref(variableToSet), raw(`false`)),
            ...ownershipAuthorizationExpressions,
        ]);
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
        variableToSet: string = ResourceConstants.SNIPPETS.IsOwnerAuthorizedVariable,
    ): Expression {
        if (!rules || rules.length === 0) {
            return comment(`No Owner Authorization Rules`)
        }
        return block(`Owner authorization rules for field "${fieldToCheck}"`, [
            this.ownershipAuthorizationExpressionForCreate(
                rules, fieldIsList, variableToCheck, variableToSet,
                rule => `Authorization rule: { allow: ${rule.allow}, \
ownerField: "${rule.ownerField || DEFAULT_OWNER_FIELD}", \
identityClaim: "${rule.identityField || rule.identityClaim || DEFAULT_IDENTITY_FIELD}" }`
            )
        ])
    }

    public ownershipAuthorizationExpressionForCreate(
        rules: AuthRule[],
        fieldIsList: (fieldName: string) => boolean,
        variableToCheck: string = 'ctx.args.input',
        variableToSet: string = ResourceConstants.SNIPPETS.IsOwnerAuthorizedVariable,
        formatComment?: (rule: AuthRule) => string,
    ) {
        let ownershipAuthorizationExpressions = []
        let ruleNumber = 0;
        for (const rule of rules) {
            const ownerAttribute = rule.ownerField || DEFAULT_OWNER_FIELD
            const rawUsername = rule.identityField || rule.identityClaim || DEFAULT_IDENTITY_FIELD
            const isUser = isUsername(rawUsername)
            const identityAttribute = replaceIfUsername(rawUsername)
            const ownerFieldIsList = fieldIsList(ownerAttribute)
            const allowedOwnersVariable = `allowedOwners${ruleNumber}`
            ownershipAuthorizationExpressions = ownershipAuthorizationExpressions.concat(
                formatComment ?
                    comment(formatComment(rule)) :
                    comment(`Authorization rule: { allow: ${rule.allow}, ownerField: "${ownerAttribute}", identityClaim: "${identityAttribute}" }`),
                set(ref(allowedOwnersVariable), raw(`$util.defaultIfNull($${variableToCheck}.${ownerAttribute}, null)`)),
                isUser ?
                    // tslint:disable-next-line
                    set(ref('identityValue'), raw(`$util.defaultIfNull($ctx.identity.claims.get("${rawUsername}"), $util.defaultIfNull($ctx.identity.claims.get("${identityAttribute}"), "${NONE_VALUE}"))`)) :
                    set(ref('identityValue'), raw(`$util.defaultIfNull($ctx.identity.claims.get("${identityAttribute}"), "${NONE_VALUE}")`)),
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
                ownershipAuthorizationExpressions.push(
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
                ownershipAuthorizationExpressions.push(
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
        return compoundExpression([
            set(ref(variableToSet), raw(`false`)),
            ...ownershipAuthorizationExpressions,
        ]);
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
        variableToSet: string = ResourceConstants.SNIPPETS.IsDynamicGroupAuthorizedVariable,
    ): Expression {
        const fieldMention = fieldBeingProtected ? ` for field "${fieldBeingProtected}"` : '';
        if (!rules || rules.length === 0) {
            return comment(`No dynamic group authorization rules${fieldMention}`)
        }

        let groupAuthorizationExpressions = []
        let ruleNumber = 0
        let customClaim: string;
        for (const rule of rules) {
            if (rule.groupClaim) {
                if (customClaim) {
                    throw new InvalidDirectiveError('@auth directive currently only supports one source for groupClaim!')
                }
                customClaim = rule.groupClaim;
            }
            const groupsAttribute = rule.groupsField || DEFAULT_GROUPS_FIELD
            const groupsAttributeName = `groupsAttribute${ruleNumber}`
            const groupName = `group${ruleNumber}`
            groupAuthorizationExpressions = groupAuthorizationExpressions.concat(
                comment(`Authorization rule${fieldMention}: { allow: ${rule.allow}, groupsField: "${groupsAttribute}" }`),
                // Add the new auth expression and values
                forEach(ref('userGroup'), ref('userGroups'), [
                    raw(`$util.qr($groupAuthExpressions.add("contains(#${groupsAttributeName}, :${groupName}$foreach.count)"))`),
                    raw(`$util.qr($groupAuthExpressionValues.put(":${groupName}$foreach.count", { "S": $userGroup }))`),
                ]),
                iff(raw('$userGroups.size() > 0'), raw(`$util.qr($groupAuthExpressionNames.put("#${groupsAttributeName}", "${groupsAttribute}"))`)),
            )
            ruleNumber++
        }
        // check for groupclaim here
        return block('Dynamic group authorization checks', [
            this.setUserGroups(customClaim),
            set(ref('groupAuthExpressions'), list([])),
            set(ref('groupAuthExpressionValues'), obj({})),
            set(ref('groupAuthExpressionNames'), obj({})),
            ...groupAuthorizationExpressions,
        ])
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
        variableToSet: string = ResourceConstants.SNIPPETS.IsOwnerAuthorizedVariable,
    ): Expression {
        const fieldMention = fieldBeingProtected ? ` for field "${fieldBeingProtected}"` : '';
        if (!rules || rules.length === 0) {
            return comment(`No owner authorization rules${fieldMention}`)
        }
        let ownerAuthorizationExpressions = []
        let ruleNumber = 0;
        for (const rule of rules) {
            const ownerAttribute = rule.ownerField || DEFAULT_OWNER_FIELD
            const rawUsername = rule.identityField || rule.identityClaim || DEFAULT_IDENTITY_FIELD
            const isUser = isUsername(rawUsername)
            const identityAttribute = replaceIfUsername(rawUsername)
            const ownerFieldIsList = fieldIsList(ownerAttribute)
            const ownerName = `owner${ruleNumber}`
            const identityName = `identity${ruleNumber}`

            ownerAuthorizationExpressions.push(
                // tslint:disable:max-line-length
                comment(`Authorization rule${fieldMention}: { allow: ${rule.allow}, ownerField: "${ownerAttribute}", identityClaim: "${identityAttribute}" }`),
            )
            if (ownerFieldIsList) {
                ownerAuthorizationExpressions.push(
                    raw(`$util.qr($ownerAuthExpressions.add("contains(#${ownerName}, :${identityName})"))`)
                )
            } else {
                ownerAuthorizationExpressions.push(
                    raw(`$util.qr($ownerAuthExpressions.add("#${ownerName} = :${identityName}"))`)
                )
            }
            ownerAuthorizationExpressions = ownerAuthorizationExpressions.concat(
                raw(`$util.qr($ownerAuthExpressionNames.put("#${ownerName}", "${ownerAttribute}"))`),
                // tslint:disable
                isUser ?
                    raw(`$util.qr($ownerAuthExpressionValues.put(":${identityName}", $util.dynamodb.toDynamoDB($util.defaultIfNull($ctx.identity.claims.get("${rawUsername}"), $util.defaultIfNull($ctx.identity.claims.get("${identityAttribute}"), "${NONE_VALUE}")))))`) :
                    raw(`$util.qr($ownerAuthExpressionValues.put(":${identityName}", $util.dynamodb.toDynamoDB($util.defaultIfNull($ctx.identity.claims.get("${identityAttribute}"), "${NONE_VALUE}"))))`)
                // tslint:enable
            )
            ruleNumber++
        }
        return block('Owner Authorization Checks', [
            set(ref('ownerAuthExpressions'), list([])),
            set(ref('ownerAuthExpressionValues'), obj({})),
            set(ref('ownerAuthExpressionNames'), obj({})),
            ...ownerAuthorizationExpressions,
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
        let customClaim: string;
        for (const rule of rules) {
            if (rule.groupClaim) {
                if (customClaim) {
                    throw new InvalidDirectiveError('@auth directive currently only supports one source for groupClaim!')
                }
                customClaim = rule.groupClaim;
            }
            const groupsAttribute = rule.groupsField || DEFAULT_GROUPS_FIELD
            groupAuthorizationExpressions = groupAuthorizationExpressions.concat(
                comment(`Authorization rule: { allow: ${rule.allow}, groupsField: "${groupsAttribute}" }`),
                set(ref('allowedGroups'), ref(`util.defaultIfNull($${variableToCheck}.${groupsAttribute}, [])`)),
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
        // check for group claim here
        return block('Dynamic Group Authorization Checks', [
            this.setUserGroups(customClaim),
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
            const rawUsername = rule.identityField || rule.identityClaim || DEFAULT_IDENTITY_FIELD
            const isUser = isUsername(rawUsername)
            const identityAttribute = replaceIfUsername(rawUsername)
            const allowedOwnersVariable = `allowedOwners${ruleNumber}`
            ownerAuthorizationExpressions = ownerAuthorizationExpressions.concat(
                comment(`Authorization rule: { allow: ${rule.allow}, ownerField: "${ownerAttribute}", identityClaim: "${identityAttribute}" }`),
                set(ref(allowedOwnersVariable), ref(`${variableToCheck}.${ownerAttribute}`)),
                isUser ?
                    // tslint:disable-next-line
                    set(ref('identityValue'), raw(`$util.defaultIfNull($ctx.identity.claims.get("${rawUsername}"), $util.defaultIfNull($ctx.identity.claims.get("${identityAttribute}"), "${NONE_VALUE}"))`)) :
                    set(ref('identityValue'), raw(`$util.defaultIfNull($ctx.identity.claims.get("${identityAttribute}"), "${NONE_VALUE}")`)),
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

    public throwIfSubscriptionUnauthorized(): Expression {
        const ifUnauthThrow = iff(
            not(parens(
                or([
                    equals(ref(ResourceConstants.SNIPPETS.IsStaticGroupAuthorizedVariable), raw('true')),
                    equals(ref(ResourceConstants.SNIPPETS.IsOwnerAuthorizedVariable), raw('true'))
                ])
            )), raw('$util.unauthorized()')
        )
        return block('Throw if unauthorized', [
            ifUnauthThrow,
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

    // A = IsStaticallyAuthed
    // B = AuthConditionIsNotNull
    // ! (A OR B) == (!A AND !B)
    public throwIfNotStaticGroupAuthorizedOrAuthConditionIsEmpty(): Expression {
        const ifUnauthThrow = iff(
            not(parens(
                or([
                    equals(ref(ResourceConstants.SNIPPETS.IsStaticGroupAuthorizedVariable), raw('true')),
                    parens(raw('$authCondition && $authCondition.expression != ""'))
                ])
            )), raw('$util.unauthorized()')
        )
        return block('Throw if unauthorized', [
            ifUnauthThrow,
        ])
    }

    public collectAuthCondition(): Expression {
        return block('Collect Auth Condition', [
            set(
                ref(ResourceConstants.SNIPPETS.AuthCondition),
                obj({
                    expression: str(""),
                    expressionNames: obj({}),
                    expressionValues: obj({})
                })
            ),
            set(ref('totalAuthExpression'), str('')),
            comment('Add dynamic group auth conditions if they exist'),
            iff(
                ref('groupAuthExpressions'),
                forEach(ref('authExpr'), ref('groupAuthExpressions'), [
                    set(ref('totalAuthExpression'), str(`$totalAuthExpression $authExpr`)),
                    iff(ref('foreach.hasNext'), set(ref('totalAuthExpression'), str(`$totalAuthExpression OR`)))
                ])
            ),
            iff(
                ref('groupAuthExpressionNames'),
                raw(`$util.qr($${ResourceConstants.SNIPPETS.AuthCondition}.expressionNames.putAll($groupAuthExpressionNames))`)),
            iff(
                ref('groupAuthExpressionValues'),
                raw(`$util.qr($${ResourceConstants.SNIPPETS.AuthCondition}.expressionValues.putAll($groupAuthExpressionValues))`)),

            comment('Add owner auth conditions if they exist'),
            iff(
                raw(`$totalAuthExpression != "" && $ownerAuthExpressions && $ownerAuthExpressions.size() > 0`),
                set(ref('totalAuthExpression'), str(`$totalAuthExpression OR`))
            ),
            iff(
                ref('ownerAuthExpressions'),
                forEach(ref('authExpr'), ref('ownerAuthExpressions'), [
                    set(ref('totalAuthExpression'), str(`$totalAuthExpression $authExpr`)),
                    iff(ref('foreach.hasNext'), set(ref('totalAuthExpression'), str(`$totalAuthExpression OR`)))
                ])),
            iff(
                ref('ownerAuthExpressionNames'),
                raw(`$util.qr($${ResourceConstants.SNIPPETS.AuthCondition}.expressionNames.putAll($ownerAuthExpressionNames))`)),

            iff(
                ref('ownerAuthExpressionValues'),
                raw(`$util.qr($${ResourceConstants.SNIPPETS.AuthCondition}.expressionValues.putAll($ownerAuthExpressionValues))`)),

            comment('Set final expression if it has changed.'),
            iff(
                raw(`$totalAuthExpression != ""`),
                set(ref(`${ResourceConstants.SNIPPETS.AuthCondition}.expression`), str('($totalAuthExpression)'))
            )
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

    public setUserGroups(customGroup?: string): Expression {
        if (customGroup) {
            return block( `Using groupClaim: ${customGroup} as source for userGroup`, [
                set(ref('userGroup'), raw(`$util.defaultIfNull($ctx.identity.claims.get("${customGroup}"), [])`)),
                iff(
                    raw('$util.isString($userGroup)'),
                    set(ref('userGroup'), raw('[$userGroup]')),
                ),
            ]);
        }
        return set(ref('userGroups'), raw('$util.defaultIfNull($ctx.identity.claims.get("cognito:groups"), [])'));
    }

    public generateSubscriptionResolver(fieldName: string, subscriptionTypeName: string = 'Subscription') {
        return new AppSync.Resolver({
            ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
            DataSourceName: "NONE",
            FieldName: fieldName,
            TypeName: subscriptionTypeName,
            RequestMappingTemplate: print(
                raw(`{
    "version": "2018-05-29",
    "payload": {}
}`)
            ),
            ResponseMappingTemplate: print(
                raw(`$util.toJson(null)`)
            )
        });
    }

    public operationCheckExpression(operation: string, field: string) {
        return block('Checking for allowed operations which can return this field', [
            set(ref('operation'), raw('$util.defaultIfNull($context.source.operation, "null")')),
            ifElse(
                raw(`$operation == "${operation}"`),
                ref('util.toJson(null)'),
                ref(`util.toJson($context.source.${field})`),
            )
        ])
    }

    public setOperationExpression(operation: string) {
        return block('Setting the operation', [
            set(ref('context.result.operation'), str(operation))
        ])
    }
}