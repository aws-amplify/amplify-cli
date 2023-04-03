"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expected_result_mutation2 = exports.input_mutation2 = exports.mutation2 = exports.expected_result_mutation1 = exports.input_mutation1 = exports.mutation1 = exports.schema = void 0;
//schema
exports.schema = "\ntype Todo @model\n  @auth(rules: [{ allow: owner, operations: [create, delete] }]) {\n  id: ID!\n  updatedAt: AWSDateTime!\n  content: String!\n}\n\n##auth/owner7";
//mutations
exports.mutation1 = "\nmutation CreateTodo(\n    $input: CreateTodoInput!\n    $condition: ModelTodoConditionInput\n  ) {\n    createTodo(input: $input, condition: $condition) {\n      id\n      updatedAt\n      content\n      createdAt\n    }\n}";
exports.input_mutation1 = {
    input: {
        id: '1',
        updatedAt: '2020-05-20T01:05:49.129Z',
        content: 'todo1',
    },
};
exports.expected_result_mutation1 = {
    data: {
        createTodo: {
            id: '1',
            updatedAt: '2020-05-20T01:05:49.129Z',
            content: 'todo1',
            createdAt: '<check-defined>',
        },
    },
};
exports.mutation2 = "\n mutation UpdateTodo(\n    $input: UpdateTodoInput!\n    $condition: ModelTodoConditionInput\n  ) {\n    updateTodo(input: $input, condition: $condition) {\n      id\n      updatedAt\n      content\n      createdAt\n    }\n}";
exports.input_mutation2 = {
    input: {
        id: '1',
        updatedAt: '2020-05-20T01:05:49.129Z',
        content: 'todo1-updated',
    },
};
exports.expected_result_mutation2 = {
    data: {
        updateTodo: {
            id: '1',
            updatedAt: '2020-05-20T01:05:49.129Z',
            content: 'todo1-updated',
            createdAt: '<check-defined>',
        },
    },
};
//# sourceMappingURL=auth-owner7.js.map