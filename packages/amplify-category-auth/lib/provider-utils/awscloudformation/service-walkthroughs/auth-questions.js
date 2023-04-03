"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIAMPolicies = exports.parseOAuthCreds = exports.structureOAuthMetadata = exports.userPoolProviders = exports.identityPoolProviders = exports.serviceWalkthrough = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const lodash_1 = __importStar(require("lodash"));
const path_1 = __importDefault(require("path"));
const enquirer_1 = require("enquirer");
const extract_apple_private_key_1 = require("../utils/extract-apple-private-key");
const string_maps_1 = require("../assets/string-maps");
const category = 'auth';
const serviceWalkthrough = async (context, defaultValuesFilename, stringMapsFilename, serviceMetadata, coreAnswers = {}) => {
    var _a, _b;
    var _c, _d;
    const { inputs } = serviceMetadata;
    const { amplify } = context;
    const { parseInputs } = await (_a = `${__dirname}/../question-factories/core-questions.js`, Promise.resolve().then(() => __importStar(require(_a))));
    const projectType = amplify.getProjectConfig().frontend;
    const defaultValuesSrc = `${__dirname}/../assets/${defaultValuesFilename}`;
    const { getAllDefaults } = await (_b = defaultValuesSrc, Promise.resolve().then(() => __importStar(require(_b))));
    let userPoolGroupList = context.amplify.getUserPoolGroupList(context);
    let adminQueryGroup;
    handleUpdates(context, coreAnswers);
    let j = 0;
    while (j < inputs.length) {
        const questionObj = inputs[j];
        const question = await parseInputs(questionObj, amplify, defaultValuesFilename, stringMapsFilename, coreAnswers, context);
        const answer = await inquirer_1.default.prompt(question);
        if ('signinwithapplePrivateKeyUserPool' in answer) {
            answer.signinwithapplePrivateKeyUserPool = (0, extract_apple_private_key_1.extractApplePrivateKey)(answer.signinwithapplePrivateKeyUserPool);
        }
        if (answer.userPoolGroups === true) {
            userPoolGroupList = await updateUserPoolGroups(context);
        }
        if (answer.adminQueries === true) {
            adminQueryGroup = await updateAdminQuery(context, userPoolGroupList);
        }
        if (answer.triggers && answer.triggers !== '{}') {
            const tempTriggers = context.updatingAuth && context.updatingAuth.triggers ? JSON.parse(context.updatingAuth.triggers) : {};
            const selectionMetadata = string_maps_1.capabilities;
            selectionMetadata.forEach((selection) => {
                Object.keys(selection.triggers).forEach((t) => {
                    if (!tempTriggers[t] && answer.triggers.includes(selection.value)) {
                        tempTriggers[t] = selection.triggers[t];
                    }
                    else if (tempTriggers[t] && answer.triggers.includes(selection.value)) {
                        tempTriggers[t] = (0, lodash_1.uniq)(tempTriggers[t].concat(selection.triggers[t]));
                    }
                    else if (tempTriggers[t] && !answer.triggers.includes(selection.value)) {
                        const tempForDiff = Object.assign([], tempTriggers[t]);
                        const remainder = (0, lodash_1.pullAll)(tempForDiff, selection.triggers[t]);
                        if (remainder && remainder.length > 0) {
                            tempTriggers[t] = remainder;
                        }
                        else {
                            delete tempTriggers[t];
                        }
                    }
                });
            });
            answer.triggers = tempTriggers;
        }
        if (new RegExp(/learn/i).test(answer[questionObj.key]) && questionObj.learnMore) {
            const helpText = `\n${questionObj.learnMore.replace(new RegExp('[\\n]', 'g'), '\n\n')}\n\n`;
            questionObj.prefix = chalk_1.default.green(helpText);
        }
        else if (questionObj.iterator &&
            answer[questionObj.key] &&
            answer[questionObj.key].length > 0) {
            const replacementArray = (_d = (_c = context.updatingAuth) === null || _c === void 0 ? void 0 : _c[questionObj.iterator]) !== null && _d !== void 0 ? _d : [];
            for (let t = 0; t < answer[questionObj.key].length; t += 1) {
                questionObj.validation = questionObj.iteratorValidation;
                const newValue = await inquirer_1.default.prompt({
                    name: 'updated',
                    message: `Update ${answer[questionObj.key][t]}`,
                    validate: amplify.inputValidation(questionObj),
                });
                replacementArray.splice(replacementArray.indexOf(answer[questionObj.key][t]), 1, newValue.updated);
            }
            j += 1;
        }
        else if (questionObj.addAnotherLoop && Object.keys(answer).length > 0) {
            if (!coreAnswers[questionObj.key]) {
                answer[questionObj.key] = [answer[questionObj.key]];
                coreAnswers = { ...coreAnswers, ...answer };
            }
            else {
                coreAnswers[questionObj.key].push(answer[questionObj.key]);
            }
            const addAnother = await inquirer_1.default.prompt({
                name: 'repeater',
                type: 'confirm',
                default: false,
                message: `Do you want to add another ${questionObj.addAnotherLoop}`,
            });
            if (!addAnother.repeater) {
                j += 1;
            }
        }
        else if (questionObj.key === 'updateFlow') {
            if (answer.updateFlow === 'updateUserPoolGroups') {
                userPoolGroupList = await updateUserPoolGroups(context);
            }
            else if (answer.updateFlow === 'updateAdminQueries') {
                adminQueryGroup = await updateAdminQuery(context, userPoolGroupList);
            }
            else if (['manual', 'defaultSocial', 'default'].includes(answer.updateFlow)) {
                answer.useDefault = answer.updateFlow;
                if (answer.useDefault === 'defaultSocial') {
                    coreAnswers.hostedUI = true;
                }
                if (answer.useDefault === 'default') {
                    coreAnswers.hostedUI = false;
                }
                delete answer.updateFlow;
            }
            coreAnswers = { ...coreAnswers, ...answer };
            j += 1;
        }
        else if (!context.updatingAuth && answer.useDefault && ['default', 'defaultSocial'].includes(answer.useDefault)) {
            coreAnswers = { ...coreAnswers, ...answer };
            coreAnswers.authSelections = 'identityPoolAndUserPool';
            if (coreAnswers.useDefault === 'defaultSocial') {
                coreAnswers.hostedUI = true;
            }
            j += 1;
        }
        else {
            coreAnswers = { ...coreAnswers, ...answer };
            j += 1;
        }
    }
    if (coreAnswers.authSelections === 'userPoolOnly' && context.updatingAuth) {
        context.print.warning(`Warning! Your existing IdentityPool: ${context.updatingAuth.identityPoolName} will be deleted upon the next “amplify push”!`);
        delete context.updatingAuth.identityPoolName;
        delete context.updatingAuth.allowUnauthenticatedIdentities;
        delete context.updatingAuth.thirdPartyAuth;
        delete context.updatingAuth.authProviders;
        delete context.updatingAuth.facebookAppId;
        delete context.updatingAuth.googleClientId;
        delete context.updatingAuth.googleIos;
        delete context.updatingAuth.googleAndroid;
        delete context.updatingAuth.amazonAppId;
        delete context.updatingAuth.appleAppId;
    }
    if (coreAnswers.thirdPartyAuth) {
        (0, exports.identityPoolProviders)(coreAnswers, projectType);
    }
    const isPullOrEnvCommand = context.input.command === 'pull' || context.input.command === 'env';
    if (coreAnswers.authSelections !== 'identityPoolOnly' && context.input.command !== 'init' && !isPullOrEnvCommand) {
        if (coreAnswers.useDefault === 'manual') {
            coreAnswers.triggers = await lambdaFlow(context, coreAnswers.triggers);
        }
    }
    if (coreAnswers.authProvidersUserPool) {
        coreAnswers = Object.assign(coreAnswers, (0, exports.userPoolProviders)(coreAnswers.authProvidersUserPool, coreAnswers, context.updatingAuth));
    }
    (0, exports.structureOAuthMetadata)(coreAnswers, context, getAllDefaults, amplify);
    if (coreAnswers.usernameAttributes && !Array.isArray(coreAnswers.usernameAttributes)) {
        if (coreAnswers.usernameAttributes === 'username') {
            delete coreAnswers.usernameAttributes;
        }
        else {
            coreAnswers.usernameAttributes = coreAnswers.usernameAttributes.split();
        }
    }
    return {
        ...coreAnswers,
        userPoolGroupList,
        adminQueryGroup,
        serviceName: 'Cognito',
    };
};
exports.serviceWalkthrough = serviceWalkthrough;
const updateUserPoolGroups = async (context) => {
    let userPoolGroupList = [];
    let existingGroups;
    const userGroupParamsPath = path_1.default.join(context.amplify.pathManager.getBackendDirPath(), 'auth', 'userPoolGroups', 'user-pool-group-precedence.json');
    try {
        existingGroups = context.amplify.readJsonFile(userGroupParamsPath);
        userPoolGroupList = existingGroups.map((e) => e.groupName);
    }
    catch (e) {
        existingGroups = null;
    }
    if (existingGroups) {
        const deletionChoices = existingGroups.map((e) => {
            return { name: e.groupName, value: e.groupName };
        });
        const deletionAnswer = await inquirer_1.default.prompt([
            {
                name: 'groups2BeDeleted',
                type: 'checkbox',
                message: 'Select any user pool groups you want to delete:',
                choices: deletionChoices,
            },
        ]);
        userPoolGroupList = userPoolGroupList.filter((i) => !deletionAnswer.groups2BeDeleted.includes(i));
    }
    let answer;
    if (userPoolGroupList.length < 1) {
        answer = await inquirer_1.default.prompt([
            {
                name: 'userPoolGroupName',
                type: 'input',
                message: 'Provide a name for your user pool group:',
                validate: context.amplify.inputValidation({
                    validation: {
                        operator: 'regex',
                        value: '^[a-zA-Z0-9]+$',
                        onErrorMsg: 'Resource name should be alphanumeric',
                    },
                    required: true,
                }),
            },
        ]);
        userPoolGroupList.push(answer.userPoolGroupName);
    }
    let addAnother = await inquirer_1.default.prompt({
        name: 'repeater',
        type: 'confirm',
        default: false,
        message: 'Do you want to add another User Pool Group',
    });
    while (addAnother.repeater === true) {
        answer = await inquirer_1.default.prompt([
            {
                name: 'userPoolGroupName',
                type: 'input',
                message: 'Provide a name for your user pool group:',
                validate: context.amplify.inputValidation({
                    validation: {
                        operator: 'regex',
                        value: '^[a-zA-Z0-9]+$',
                        onErrorMsg: 'Resource name should be alphanumeric',
                    },
                    required: true,
                }),
            },
        ]);
        userPoolGroupList.push(answer.userPoolGroupName);
        addAnother = await inquirer_1.default.prompt({
            name: 'repeater',
            type: 'confirm',
            default: false,
            message: 'Do you want to add another User Pool Group',
        });
    }
    const distinctSet = new Set(userPoolGroupList);
    userPoolGroupList = Array.from(distinctSet);
    let sortedUserPoolGroupList = [];
    if (userPoolGroupList && userPoolGroupList.length > 0) {
        const sortPrompt = new enquirer_1.Sort({
            name: 'sortUserPools',
            hint: `(Use ${chalk_1.default.green.bold('<shift>+<right/left>')} to change the order)`,
            message: 'Sort the user pool groups in order of preference',
            choices: userPoolGroupList,
            shiftLeft(...args) {
                return this.shiftUp(...args);
            },
            shiftRight(...args) {
                return this.shiftDown(...args);
            },
        });
        sortedUserPoolGroupList = await sortPrompt.run();
    }
    return sortedUserPoolGroupList;
};
const updateAdminQuery = async (context, userPoolGroupList) => {
    let adminGroup;
    const userPoolGroupListClone = userPoolGroupList.slice(0);
    if (await context.amplify.confirmPrompt('Do you want to restrict access to the admin queries API to a specific Group')) {
        userPoolGroupListClone.push('Enter a custom group');
        const adminGroupAnswer = await inquirer_1.default.prompt([
            {
                name: 'adminGroup',
                type: 'list',
                message: 'Select the group to restrict access with:',
                choices: userPoolGroupListClone,
            },
        ]);
        if (adminGroupAnswer.adminGroup === 'Enter a custom group') {
            const temp = await inquirer_1.default.prompt([
                {
                    name: 'userPoolGroupName',
                    type: 'input',
                    message: 'Provide a group name:',
                    validate: context.amplify.inputValidation({
                        validation: {
                            operator: 'regex',
                            value: '^[a-zA-Z0-9]+$',
                            onErrorMsg: 'Resource name should be alphanumeric',
                        },
                        required: true,
                    }),
                },
            ]);
            adminGroup = temp.userPoolGroupName;
        }
        else {
            ({ adminGroup } = adminGroupAnswer);
        }
    }
    return adminGroup;
};
const identityPoolProviders = (coreAnswers, projectType) => {
    coreAnswers.selectedParties = {};
    string_maps_1.authProviders.forEach((provider) => {
        if (projectType === 'javascript' || provider.answerHashKey !== 'googleClientId') {
            if (coreAnswers[provider.answerHashKey]) {
                coreAnswers.selectedParties[provider.value] = coreAnswers[provider.answerHashKey];
            }
            if (coreAnswers[provider.answerHashKey] && provider.concatKeys) {
                provider.concatKeys.forEach((i) => {
                    coreAnswers.selectedParties[provider.value] = coreAnswers.selectedParties[provider.value].concat(';', coreAnswers[i]);
                });
            }
        }
    });
    if (projectType !== 'javascript' && coreAnswers.authProviders.includes('accounts.google.com')) {
        coreAnswers.audiences = [coreAnswers.googleClientId];
        if (projectType === 'ios') {
            coreAnswers.audiences.push(coreAnswers.googleIos);
        }
        else if (projectType === 'android') {
            coreAnswers.audiences.push(coreAnswers.googleAndroid);
        }
    }
    coreAnswers.selectedParties = JSON.stringify(coreAnswers.selectedParties);
};
exports.identityPoolProviders = identityPoolProviders;
const userPoolProviders = (oAuthProviders, coreAnswers, prevAnswers) => {
    if (coreAnswers.useDefault === 'default') {
        return null;
    }
    const answers = Object.assign(prevAnswers || {}, coreAnswers);
    const attributesForMapping = answers.requiredAttributes
        ? JSON.parse(JSON.stringify(answers.requiredAttributes)).concat('username')
        : ['email', 'username'];
    const res = {};
    if (answers.hostedUI) {
        res.hostedUIProviderMeta = JSON.stringify(oAuthProviders.map((providerName) => {
            const lowerCaseEl = providerName.toLowerCase();
            const delimiter = providerName === 'Facebook' ? ',' : ' ';
            const scopes = [];
            const maps = {};
            attributesForMapping.forEach((attribute) => {
                const attributeKey = string_maps_1.attributeProviderMap[attribute];
                if (attributeKey && attributeKey[`${lowerCaseEl}`] && attributeKey[`${lowerCaseEl}`].scope) {
                    if (scopes.indexOf(attributeKey[`${lowerCaseEl}`].scope) === -1) {
                        scopes.push(attributeKey[`${lowerCaseEl}`].scope);
                    }
                }
                if (providerName === 'Google' && !scopes.includes('openid')) {
                    scopes.unshift('openid');
                }
                if (attributeKey && attributeKey[`${lowerCaseEl}`] && attributeKey[`${lowerCaseEl}`].attr) {
                    maps[attribute] = attributeKey[`${lowerCaseEl}`].attr;
                }
            });
            return {
                ProviderName: providerName,
                authorize_scopes: scopes.join(delimiter),
                AttributeMapping: maps,
            };
        }));
        res.hostedUIProviderCreds = JSON.stringify(oAuthProviders.map((el) => {
            const lowerCaseEl = el.toLowerCase();
            if (el === 'SignInWithApple') {
                return {
                    ProviderName: el,
                    client_id: coreAnswers[`${lowerCaseEl}ClientIdUserPool`],
                    team_id: coreAnswers[`${lowerCaseEl}TeamIdUserPool`],
                    key_id: coreAnswers[`${lowerCaseEl}KeyIdUserPool`],
                    private_key: coreAnswers[`${lowerCaseEl}PrivateKeyUserPool`],
                };
            }
            return {
                ProviderName: el,
                client_id: coreAnswers[`${lowerCaseEl}AppIdUserPool`],
                client_secret: coreAnswers[`${lowerCaseEl}AppSecretUserPool`],
            };
        }));
    }
    return res;
};
exports.userPoolProviders = userPoolProviders;
const structureOAuthMetadata = (coreAnswers, context, defaults, amplify) => {
    if (coreAnswers.useDefault === 'default' && context.updatingAuth) {
        delete context.updatingAuth.oAuthMetadata;
        return null;
    }
    const answers = { ...context.updatingAuth, ...coreAnswers };
    let { AllowedOAuthFlows, AllowedOAuthScopes, CallbackURLs, LogoutURLs } = answers;
    if (CallbackURLs && coreAnswers.newCallbackURLs) {
        CallbackURLs = CallbackURLs.concat(coreAnswers.newCallbackURLs);
    }
    else if (coreAnswers.newCallbackURLs) {
        CallbackURLs = coreAnswers.newCallbackURLs;
    }
    if (LogoutURLs && coreAnswers.newLogoutURLs) {
        LogoutURLs = LogoutURLs.concat(coreAnswers.newLogoutURLs);
    }
    else if (coreAnswers.newLogoutURLs) {
        LogoutURLs = coreAnswers.newLogoutURLs;
    }
    if (CallbackURLs && LogoutURLs) {
        if (!answers.AllowedOAuthScopes) {
            AllowedOAuthScopes = defaults(amplify.getProjectDetails(amplify)).AllowedOAuthScopes;
        }
        if (!answers.AllowedOAuthFlows) {
            AllowedOAuthFlows = defaults(amplify.getProjectDetails(amplify)).AllowedOAuthFlows;
        }
        else {
            AllowedOAuthFlows = Array.isArray(AllowedOAuthFlows) ? AllowedOAuthFlows : [AllowedOAuthFlows];
        }
    }
    if (AllowedOAuthFlows && AllowedOAuthScopes && CallbackURLs && LogoutURLs) {
        coreAnswers.oAuthMetadata = JSON.stringify({
            AllowedOAuthFlows,
            AllowedOAuthScopes,
            CallbackURLs,
            LogoutURLs,
        });
    }
    return coreAnswers;
};
exports.structureOAuthMetadata = structureOAuthMetadata;
const parseOAuthMetaData = (previousAnswers) => {
    if (previousAnswers && previousAnswers.oAuthMetadata) {
        previousAnswers = Object.assign(previousAnswers, JSON.parse(previousAnswers.oAuthMetadata));
        delete previousAnswers.oAuthMetadata;
    }
};
const parseOAuthCreds = (providers, metadata, envCreds) => {
    const providerKeys = {};
    try {
        const parsedMetaData = JSON.parse(metadata);
        const parsedCreds = JSON.parse(envCreds);
        providers
            .map((providerName) => providerName.toLowerCase())
            .forEach((providerName) => {
            var _a, _b;
            const provider = parsedMetaData.find((currentProvider) => currentProvider.ProviderName === providerName);
            const creds = parsedCreds.find((currentProvider) => currentProvider.ProviderName === providerName);
            if (providerName === 'SignInWithApple') {
                providerKeys[`${providerName}ClientIdUserPool`] = creds === null || creds === void 0 ? void 0 : creds.client_id;
                providerKeys[`${providerName}TeamIdUserPool`] = creds === null || creds === void 0 ? void 0 : creds.team_id;
                providerKeys[`${providerName}KeyIdUserPool`] = creds === null || creds === void 0 ? void 0 : creds.key_id;
                providerKeys[`${providerName}PrivateKeyUserPool`] = creds === null || creds === void 0 ? void 0 : creds.private_key;
            }
            else {
                providerKeys[`${providerName}AppIdUserPool`] = creds === null || creds === void 0 ? void 0 : creds.client_id;
                providerKeys[`${providerName}AppSecretUserPool`] = creds === null || creds === void 0 ? void 0 : creds.client_secret;
            }
            providerKeys[`${providerName}AuthorizeScopes`] = (_b = (_a = provider === null || provider === void 0 ? void 0 : provider.authorize_scopes) === null || _a === void 0 ? void 0 : _a.split) === null || _b === void 0 ? void 0 : _b.call(_a, ',');
        });
    }
    catch (e) {
        return {};
    }
    return providerKeys;
};
exports.parseOAuthCreds = parseOAuthCreds;
const handleUpdates = (context, coreAnswers) => {
    if (context.updatingAuth && context.updatingAuth.triggers) {
        coreAnswers.triggers = {};
        coreAnswers.triggers = context.updatingAuth.triggers;
    }
    if (context.updatingAuth && context.updatingAuth.oAuthMetadata) {
        parseOAuthMetaData(context.updatingAuth);
    }
    if (context.updatingAuth && context.updatingAuth.authProvidersUserPool) {
        const { resourceName, authProvidersUserPool, hostedUIProviderMeta } = context.updatingAuth;
        const { hostedUIProviderCreds } = context.amplify.loadEnvResourceParameters(context, 'auth', resourceName);
        const oAuthCreds = (0, exports.parseOAuthCreds)(authProvidersUserPool, hostedUIProviderMeta, hostedUIProviderCreds);
        context.updatingAuth = Object.assign(context.updatingAuth, oAuthCreds);
    }
    if (context.updatingAuth && context.updatingAuth.authSelections === 'identityPoolOnly') {
        coreAnswers.authSelections = 'identityPoolAndUserPool';
    }
};
const lambdaFlow = async (context, answers) => {
    const triggers = await context.amplify.triggerFlow(context, 'cognito', 'auth', answers);
    return triggers || answers;
};
const getIAMPolicies = (context, resourceName, crudOptions) => {
    let policy = {};
    const actions = [];
    crudOptions.forEach((crudOption) => {
        switch (crudOption) {
            case 'create':
                actions.push('cognito-idp:ConfirmSignUp', 'cognito-idp:AdminCreateUser', 'cognito-idp:CreateUserImportJob', 'cognito-idp:AdminSetUserSettings', 'cognito-idp:AdminLinkProviderForUser', 'cognito-idp:CreateIdentityProvider', 'cognito-idp:AdminConfirmSignUp', 'cognito-idp:AdminDisableUser', 'cognito-idp:AdminRemoveUserFromGroup', 'cognito-idp:SetUserMFAPreference', 'cognito-idp:SetUICustomization', 'cognito-idp:SignUp', 'cognito-idp:VerifyUserAttribute', 'cognito-idp:SetRiskConfiguration', 'cognito-idp:StartUserImportJob', 'cognito-idp:AdminSetUserPassword', 'cognito-idp:AssociateSoftwareToken', 'cognito-idp:CreateResourceServer', 'cognito-idp:RespondToAuthChallenge', 'cognito-idp:CreateUserPoolClient', 'cognito-idp:AdminUserGlobalSignOut', 'cognito-idp:GlobalSignOut', 'cognito-idp:AddCustomAttributes', 'cognito-idp:CreateGroup', 'cognito-idp:CreateUserPool', 'cognito-idp:AdminForgetDevice', 'cognito-idp:AdminAddUserToGroup', 'cognito-idp:AdminRespondToAuthChallenge', 'cognito-idp:ForgetDevice', 'cognito-idp:CreateUserPoolDomain', 'cognito-idp:AdminEnableUser', 'cognito-idp:AdminUpdateDeviceStatus', 'cognito-idp:StopUserImportJob', 'cognito-idp:InitiateAuth', 'cognito-idp:AdminInitiateAuth', 'cognito-idp:AdminSetUserMFAPreference', 'cognito-idp:ConfirmForgotPassword', 'cognito-idp:SetUserSettings', 'cognito-idp:VerifySoftwareToken', 'cognito-idp:AdminDisableProviderForUser', 'cognito-idp:SetUserPoolMfaConfig', 'cognito-idp:ChangePassword', 'cognito-idp:ConfirmDevice', 'cognito-idp:AdminResetUserPassword', 'cognito-idp:ResendConfirmationCode');
                break;
            case 'update':
                actions.push('cognito-idp:ForgotPassword', 'cognito-idp:UpdateAuthEventFeedback', 'cognito-idp:UpdateResourceServer', 'cognito-idp:UpdateUserPoolClient', 'cognito-idp:AdminUpdateUserAttributes', 'cognito-idp:UpdateUserAttributes', 'cognito-idp:UpdateUserPoolDomain', 'cognito-idp:UpdateIdentityProvider', 'cognito-idp:UpdateGroup', 'cognito-idp:AdminUpdateAuthEventFeedback', 'cognito-idp:UpdateDeviceStatus', 'cognito-idp:UpdateUserPool');
                break;
            case 'read':
                actions.push('cognito-identity:Describe*', 'cognito-identity:Get*', 'cognito-identity:List*', 'cognito-idp:Describe*', 'cognito-idp:AdminGetDevice', 'cognito-idp:AdminGetUser', 'cognito-idp:AdminList*', 'cognito-idp:List*', 'cognito-sync:Describe*', 'cognito-sync:Get*', 'cognito-sync:List*', 'iam:ListOpenIdConnectProviders', 'iam:ListRoles', 'sns:ListPlatformApplications');
                break;
            case 'delete':
                actions.push('cognito-idp:DeleteUserPoolDomain', 'cognito-idp:DeleteResourceServer', 'cognito-idp:DeleteGroup', 'cognito-idp:AdminDeleteUserAttributes', 'cognito-idp:DeleteUserPoolClient', 'cognito-idp:DeleteUserAttributes', 'cognito-idp:DeleteUserPool', 'cognito-idp:AdminDeleteUser', 'cognito-idp:DeleteIdentityProvider', 'cognito-idp:DeleteUser');
                break;
            default:
                console.log(`${crudOption} not supported`);
        }
    });
    let userPoolReference;
    const { amplifyMeta } = context.amplify.getProjectDetails();
    const authResource = lodash_1.default.get(amplifyMeta, [category, resourceName], undefined);
    if (!authResource) {
        throw new Error(`Cannot get resource: ${resourceName} from '${category}' category.`);
    }
    if (authResource.serviceType === 'imported') {
        const userPoolId = lodash_1.default.get(authResource, ['output', 'UserPoolId'], undefined);
        if (!userPoolId) {
            throw new Error(`Cannot read the UserPoolId attribute value from the output section of resource: '${resourceName}'.`);
        }
        userPoolReference = userPoolId;
    }
    else {
        userPoolReference = {
            Ref: `${category}${resourceName}UserPoolId`,
        };
    }
    policy = {
        Effect: 'Allow',
        Action: actions,
        Resource: [
            {
                'Fn::Join': ['', ['arn:aws:cognito-idp:', { Ref: 'AWS::Region' }, ':', { Ref: 'AWS::AccountId' }, ':userpool/', userPoolReference]],
            },
        ],
    };
    const attributes = ['UserPoolId'];
    return { policy, attributes };
};
exports.getIAMPolicies = getIAMPolicies;
//# sourceMappingURL=auth-questions.js.map