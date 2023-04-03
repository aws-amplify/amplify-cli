"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sharedQuestions = void 0;
exports.sharedQuestions = {
    accessLevel: (entity) => ({
        name: 'accessLevel',
        type: 'list',
        message: `Choose the level of access required to access this ${entity}:`,
        required: true,
        choices: ['Public', 'Private', 'Protected', 'None'],
    }),
};
//# sourceMappingURL=shared-questions.js.map