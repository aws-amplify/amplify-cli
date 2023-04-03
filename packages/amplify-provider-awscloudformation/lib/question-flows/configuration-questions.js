"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryAuthConfig = exports.updateOrRemoveQuestion = exports.removeProjectConfirmQuestion = exports.createConfirmQuestion = exports.accessKeysQuestion = exports.profileNameQuestion = exports.authTypeQuestion = void 0;
const aws_regions_1 = __importDefault(require("../aws-regions"));
function authTypeQuestion(choices) {
    return {
        type: 'list',
        name: 'authChoice',
        message: 'Select the authentication method you want to use:',
        choices,
    };
}
exports.authTypeQuestion = authTypeQuestion;
function profileNameQuestion(profiles, defaultProfile) {
    return {
        type: 'list',
        name: 'profileName',
        message: 'Please choose the profile you want to use',
        choices: profiles,
        default: defaultProfile,
    };
}
exports.profileNameQuestion = profileNameQuestion;
function accessKeysQuestion(accessKeyDefault, secretAccessKeyDefault, defaultRegion, accessKeyValidator, secretAccessKeyValidator, transformer) {
    return [
        {
            type: 'password',
            mask: '*',
            name: 'accessKeyId',
            message: 'accessKeyId: ',
            default: accessKeyDefault,
            validate: accessKeyValidator,
            transformer,
        },
        {
            type: 'password',
            mask: '*',
            name: 'secretAccessKey',
            message: 'secretAccessKey: ',
            default: secretAccessKeyDefault,
            validate: secretAccessKeyValidator,
            transformer,
        },
        {
            type: 'list',
            name: 'region',
            message: 'region: ',
            choices: aws_regions_1.default.regions,
            default: defaultRegion,
        },
    ];
}
exports.accessKeysQuestion = accessKeysQuestion;
exports.createConfirmQuestion = {
    type: 'confirm',
    name: 'setProjectLevelConfig',
    message: 'Do you want to set the project level configuration',
    default: true,
};
exports.removeProjectConfirmQuestion = {
    type: 'confirm',
    name: 'removeProjectConfig',
    message: 'Remove project level configuration',
    default: false,
};
exports.updateOrRemoveQuestion = {
    type: 'list',
    name: 'action',
    message: 'Do you want to update or remove the project level AWS profile?',
    choices: [
        { name: 'No', value: 'cancel' },
        { name: 'Update AWS Profile', value: 'update' },
        { name: 'Remove AWS Profile', value: 'remove' },
    ],
    default: 'cancel',
};
exports.retryAuthConfig = {
    type: 'confirm',
    name: 'retryConfirmation',
    message: 'Do you want to retry configuration?',
    default: false,
};
//# sourceMappingURL=configuration-questions.js.map