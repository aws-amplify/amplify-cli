"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expected_result_mutation2 = exports.input_mutation2 = exports.mutation2 = exports.expected_result_mutation1 = exports.input_mutation1 = exports.mutation1 = exports.schema = void 0;
//schema
exports.schema = "\ntype Salary @model @auth(rules: [{allow: groups, groups: [\"Admin\"]}]) {\n  id: ID!\n  wage: Int\n  currency: String\n}\n\n##staticGroup1";
//mutations
exports.mutation1 = "\n mutation CreateSalary(\n    $input: CreateSalaryInput!\n    $condition: ModelSalaryConditionInput\n  ) {\n    createSalary(input: $input, condition: $condition) {\n      id\n      wage\n      currency\n      createdAt\n      updatedAt\n    }\n}";
exports.input_mutation1 = {
    input: {
        id: '1',
        wage: 10000,
        currency: 'usd',
    },
};
exports.expected_result_mutation1 = {
    data: {
        createSalary: {
            id: '1',
            wage: 10000,
            currency: 'usd',
            createdAt: '<check-defined>',
            updatedAt: '<check-defined>',
        },
    },
};
exports.mutation2 = "\nmutation UpdateSalary(\n    $input: UpdateSalaryInput!\n    $condition: ModelSalaryConditionInput\n  ) {\n    updateSalary(input: $input, condition: $condition) {\n      id\n      wage\n      currency\n      createdAt\n      updatedAt\n    }\n}";
exports.input_mutation2 = {
    input: {
        id: '1',
        wage: 12000,
        currency: 'usd',
    },
};
exports.expected_result_mutation2 = {
    data: {
        updateSalary: {
            id: '1',
            wage: 12000,
            currency: 'usd',
            createdAt: '<check-defined>',
            updatedAt: '<check-defined>',
        },
    },
};
//# sourceMappingURL=auth-staticGroup1.js.map