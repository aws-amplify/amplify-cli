"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const setup = {
    type() {
        return {
            type: 'list',
            name: 'inferType',
            message: 'What would you like to infer?',
            choices: [
                {
                    name: 'Infer model',
                    value: 'inferModel',
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
exports.default = {
    setup,
};
//# sourceMappingURL=inferQuestions.js.map