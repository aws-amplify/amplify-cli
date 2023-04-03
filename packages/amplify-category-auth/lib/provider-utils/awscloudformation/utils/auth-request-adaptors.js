"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUpdateAuthRequestAdaptor = exports.getAddAuthRequestAdaptor = void 0;
const amplify_headless_interface_1 = require("amplify-headless-interface");
const lodash_1 = require("lodash");
const change_case_1 = require("change-case");
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const auth_questions_1 = require("../service-walkthroughs/auth-questions");
const string_maps_1 = require("../assets/string-maps");
const cognito_user_input_types_1 = require("../service-walkthrough-types/cognito-user-input-types");
const getAddAuthRequestAdaptor = (projectType) => ({ serviceConfiguration: cognitoConfig, resourceName }) => {
    const userPoolConfig = cognitoConfig.userPoolConfiguration;
    const identityPoolConfig = cognitoConfig.includeIdentityPool ? cognitoConfig.identityPoolConfiguration : undefined;
    const requiredAttributes = userPoolConfig.requiredSignupAttributes.map((att) => att.toLowerCase());
    return {
        serviceName: cognitoConfig.serviceName,
        resourceName,
        requiredAttributes,
        ...immutableAttributeAdaptor(userPoolConfig, identityPoolConfig),
        ...mutableAttributeAdaptor(projectType, requiredAttributes, userPoolConfig, cognitoConfig.includeIdentityPool, identityPoolConfig),
    };
};
exports.getAddAuthRequestAdaptor = getAddAuthRequestAdaptor;
const getUpdateAuthRequestAdaptor = (projectType, requiredAttributes) => ({ serviceModification }) => {
    const idPoolModification = serviceModification.includeIdentityPool ? serviceModification.identityPoolModification : undefined;
    return {
        serviceName: serviceModification.serviceName,
        requiredAttributes,
        ...mutableAttributeAdaptor(projectType, requiredAttributes, serviceModification.userPoolModification, serviceModification.includeIdentityPool, idPoolModification),
    };
};
exports.getUpdateAuthRequestAdaptor = getUpdateAuthRequestAdaptor;
const immutableAttributeAdaptor = (userPoolConfig, identityPoolConfig) => {
    var _a, _b;
    return ({
        userPoolName: userPoolConfig.userPoolName,
        usernameAttributes: signinAttributeMap[userPoolConfig.signinMethod],
        aliasAttributes: amplify_cli_core_1.FeatureFlags.getBoolean('auth.forceAliasAttributes')
            ? (_b = (_a = userPoolConfig.aliasAttributes) === null || _a === void 0 ? void 0 : _a.map((attr) => aliasAttributeMap[attr])) !== null && _b !== void 0 ? _b : []
            : [],
        ...immutableIdentityPoolMap(identityPoolConfig),
    });
};
const mutableAttributeAdaptor = (projectType, requiredAttributes, userPoolConfig, includeIdentityPool, identityPoolConfig) => {
    var _a;
    return ({
        useDefault: 'manual',
        updateFlow: 'manual',
        authSelections: includeIdentityPool ? 'identityPoolAndUserPool' : 'userPoolOnly',
        userPoolGroups: (((_a = userPoolConfig.userPoolGroups) === null || _a === void 0 ? void 0 : _a.length) || 0) > 0,
        userPoolGroupList: (userPoolConfig.userPoolGroups || []).map((group) => group.groupName),
        userpoolClientRefreshTokenValidity: userPoolConfig.refreshTokenPeriod,
        userpoolClientReadAttributes: (userPoolConfig.readAttributes || []).map((att) => att.toLowerCase()),
        userpoolClientWriteAttributes: (userPoolConfig.writeAttributes || []).map((att) => att.toLowerCase()),
        ...adminQueriesMap(userPoolConfig.adminQueries),
        ...mfaMap(userPoolConfig.mfa),
        ...autoVerifiedAttributesMap(userPoolConfig.autoVerifiedAttributes),
        ...passwordPolicyMap(userPoolConfig.passwordPolicy),
        ...mutableIdentityPoolMap(projectType, identityPoolConfig),
        ...oauthMap(userPoolConfig.oAuth, requiredAttributes),
    });
};
const oauthMap = (oauthConfig, requiredAttributes = []) => {
    var _a, _b;
    if (!oauthConfig)
        return {};
    if ((0, lodash_1.isEmpty)(oauthConfig)) {
        return {
            hostedUI: false,
        };
    }
    return {
        hostedUI: true,
        hostedUIDomainName: oauthConfig.domainPrefix,
        newCallbackURLs: oauthConfig.redirectSigninURIs,
        newLogoutURLs: oauthConfig.redirectSignoutURIs,
        AllowedOAuthFlows: (_a = oauthConfig === null || oauthConfig === void 0 ? void 0 : oauthConfig.oAuthGrantType) === null || _a === void 0 ? void 0 : _a.toLowerCase(),
        AllowedOAuthScopes: (_b = oauthConfig === null || oauthConfig === void 0 ? void 0 : oauthConfig.oAuthScopes) === null || _b === void 0 ? void 0 : _b.map((scope) => scope.toLowerCase()),
        ...socialProviderMap(oauthConfig.socialProviderConfigurations, requiredAttributes),
    };
};
const socialProviderMap = (socialConfig = [], requiredAttributes = []) => {
    const authProvidersUserPool = socialConfig.map((sc) => sc.provider).map((provider) => (0, change_case_1.pascalCase)(provider));
    const socialConfigMap = socialConfig.reduce((acc, it) => {
        switch (it.provider) {
            case 'FACEBOOK':
                acc.facebookAppIdUserPool = it.clientId;
                acc.facebookAppSecretUserPool = it.clientSecret;
                break;
            case 'GOOGLE':
                acc.googleAppIdUserPool = it.clientId;
                acc.googleAppSecretUserPool = it.clientSecret;
                break;
            case 'LOGIN_WITH_AMAZON':
                acc.loginwithamazonAppIdUserPool = it.clientId;
                acc.loginwithamazonAppSecretUserPool = it.clientSecret;
                break;
            case 'SIGN_IN_WITH_APPLE':
                acc.signinwithappleClientIdUserPool = it.clientId;
                acc.signinwithappleTeamIdUserPool = it.teamId;
                acc.signinwithappleKeyIdUserPool = it.keyId;
                acc.signinwithapplePrivateKeyUserPool = it.privateKey;
                break;
        }
        return acc;
    }, {});
    const result = {
        authProvidersUserPool,
        ...socialConfigMap,
        ...(0, auth_questions_1.userPoolProviders)(authProvidersUserPool, { requiredAttributes, ...socialConfigMap, hostedUI: true }),
    };
    return result;
};
const mutableIdentityPoolMap = (projectType, idPoolConfig) => {
    if (!idPoolConfig) {
        return {
            thirdPartyAuth: false,
            authProviders: [],
        };
    }
    const result = {
        allowUnauthenticatedIdentities: idPoolConfig.unauthenticatedLogin,
        thirdPartyAuth: !!idPoolConfig.identitySocialFederation,
        authProviders: (idPoolConfig.identitySocialFederation || [])
            .map((socialFed) => socialFed.provider)
            .map((provider) => (0, change_case_1.pascalCase)(provider))
            .map((provider) => string_maps_1.authProviders.find((ap) => ap.name === provider))
            .map((ap) => ap.value),
        ...((idPoolConfig === null || idPoolConfig === void 0 ? void 0 : idPoolConfig.identitySocialFederation) || []).reduce((acc, it) => (0, lodash_1.merge)(acc, { [socialFederationKeyMap(it.provider, projectType)]: it.clientId }), {}),
    };
    (0, auth_questions_1.identityPoolProviders)(result, projectType);
    return result;
};
const immutableIdentityPoolMap = (idPoolConfig) => ({
    identityPoolName: idPoolConfig === null || idPoolConfig === void 0 ? void 0 : idPoolConfig.identityPoolName,
});
const passwordPolicyMap = (pwPolicy) => {
    if (!pwPolicy)
        return {};
    return {
        passwordPolicyMinLength: pwPolicy.minimumLength,
        passwordPolicyCharacters: (pwPolicy.additionalConstraints || []).map((constraint) => passwordConstraintMap[constraint]),
    };
};
const adminQueriesMap = (adminQueries) => ({
    adminQueries: !!adminQueries,
    adminQueryGroup: adminQueries === null || adminQueries === void 0 ? void 0 : adminQueries.permissions.groupName,
});
const mfaMap = (mfaConfig = { mode: 'OFF' }) => {
    if (mfaConfig.mode === 'OFF') {
        return {
            mfaConfiguration: 'OFF',
        };
    }
    return {
        mfaConfiguration: mfaConfig.mode,
        mfaTypes: mfaConfig.mfaTypes.map((type) => mfaTypeMap[type]),
        smsAuthenticationMessage: mfaConfig.smsMessage,
    };
};
const autoVerifiedAttributesMap = (autoVerifiedAttrConfig) => {
    const result = {
        autoVerifiedAttributes: [],
    };
    if (!Array.isArray(autoVerifiedAttrConfig)) {
        return result;
    }
    return autoVerifiedAttrConfig.reduce((result, config) => {
        switch (config.type) {
            case 'EMAIL':
                result.autoVerifiedAttributes.push('email');
                result.emailVerificationMessage = config.verificationMessage;
                result.emailVerificationSubject = config.verificationSubject;
                break;
            case 'PHONE_NUMBER':
                result.autoVerifiedAttributes.push('phone_number');
                result.smsVerificationMessage = config.verificationMessage;
        }
        return result;
    }, result);
};
const passwordConstraintMap = {
    [amplify_headless_interface_1.CognitoPasswordConstraint.REQUIRE_LOWERCASE]: 'Requires Lowercase',
    [amplify_headless_interface_1.CognitoPasswordConstraint.REQUIRE_DIGIT]: 'Requires Numbers',
    [amplify_headless_interface_1.CognitoPasswordConstraint.REQUIRE_SYMBOL]: 'Requires Symbols',
    [amplify_headless_interface_1.CognitoPasswordConstraint.REQUIRE_UPPERCASE]: 'Requires Uppercase',
};
const mfaTypeMap = {
    SMS: 'SMS Text Message',
    TOTP: 'TOTP',
};
const signinAttributeMap = {
    [amplify_headless_interface_1.CognitoUserPoolSigninMethod.USERNAME]: undefined,
    [amplify_headless_interface_1.CognitoUserPoolSigninMethod.EMAIL]: [cognito_user_input_types_1.AttributeType.EMAIL],
    [amplify_headless_interface_1.CognitoUserPoolSigninMethod.PHONE_NUMBER]: [cognito_user_input_types_1.AttributeType.PHONE_NUMBER],
    [amplify_headless_interface_1.CognitoUserPoolSigninMethod.EMAIL_AND_PHONE_NUMBER]: [cognito_user_input_types_1.AttributeType.EMAIL, cognito_user_input_types_1.AttributeType.PHONE_NUMBER],
};
const aliasAttributeMap = {
    [amplify_headless_interface_1.CognitoUserAliasAttributes.PREFERRED_USERNAME]: cognito_user_input_types_1.AttributeType.PREFERRED_USERNAME,
    [amplify_headless_interface_1.CognitoUserAliasAttributes.EMAIL]: cognito_user_input_types_1.AttributeType.EMAIL,
    [amplify_headless_interface_1.CognitoUserAliasAttributes.PHONE_NUMBER]: cognito_user_input_types_1.AttributeType.PHONE_NUMBER,
};
const socialFederationKeyMap = (provider, projectType) => {
    switch (provider) {
        case 'FACEBOOK':
            return 'facebookAppId';
        case 'AMAZON':
            return 'amazonAppId';
        case 'GOOGLE':
            switch (projectType) {
                case 'ios':
                    return 'googleIos';
                case 'android':
                    return 'googleAndroid';
                case 'javascript':
                    return 'googleClientId';
                default:
                    throw new Error(`Unknown project type [${projectType}] when mapping federation type`);
            }
        case 'APPLE':
            return 'appleAppId';
        default:
            throw new Error(`Unknown social federation provider [${provider}]`);
    }
};
//# sourceMappingURL=auth-request-adaptors.js.map