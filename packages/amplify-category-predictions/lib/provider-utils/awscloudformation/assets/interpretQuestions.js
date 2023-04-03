"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
function interpretAccess(options) {
    return {
        type: 'list',
        name: 'access',
        message: 'Who should have access?',
        choices: [
            {
                name: 'Auth users only',
                value: 'auth',
            },
            {
                name: 'Auth and Guest users',
                value: 'authAndGuest',
            },
        ],
        default: options.access ? options.access : 'auth',
    };
}
const setup = {
    type() {
        return {
            type: 'list',
            name: 'interpretType',
            message: 'What would you like to interpret?',
            choices: [
                {
                    name: 'Interpret Text',
                    value: 'interpretText',
                },
            ],
        };
    },
    name(defaultName) {
        return {
            name: 'resourceName',
            message: 'Provide a friendly name for your resource',
            validate: (0, amplify_prompts_1.alphanumeric)(),
            default: defaultName,
        };
    },
};
const interpretText = {
    questions(options) {
        return {
            type: 'list',
            name: 'type',
            message: 'What kind of interpretation would you like?',
            choices: [
                {
                    name: 'Language',
                    value: 'LANGUAGE',
                },
                {
                    name: 'Entity',
                    value: 'ENTITIES',
                },
                {
                    name: 'Keyphrase',
                    value: 'KEY_PHRASES',
                },
                {
                    name: 'Sentiment',
                    value: 'SENTIMENT',
                },
                {
                    name: 'Syntax',
                    value: 'SYNTAX',
                },
                {
                    name: 'All',
                    value: 'ALL',
                },
            ],
            default: options.type,
        };
    },
    auth: interpretAccess,
};
exports.default = {
    setup,
    interpretAccess,
    interpretText,
};
//# sourceMappingURL=interpretQuestions.js.map