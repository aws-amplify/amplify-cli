"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expected_result_mutation = exports.input_mutation = exports.mutation = exports.schema = void 0;
//schema
exports.schema = "\n# owner identity specified explicitly on every object\ntype Post @model @auth(rules: [{ allow: owner, operations: [create] }]) {\n  id: ID!\n  title: String!\n}\n\n##auth/owner3";
//mutations
exports.mutation = "\nmutation CreatePost(\n    $input: CreatePostInput!\n    $condition: ModelPostConditionInput\n  ) {\n    createPost(input: $input, condition: $condition) {\n      id\n      title\n      createdAt\n      updatedAt\n    }\n}";
exports.input_mutation = {
    input: {
        id: '1',
        title: 'title1',
    },
};
exports.expected_result_mutation = {
    data: {
        createPost: {
            id: '1',
            title: 'title1',
            createdAt: '<check-defined>',
            updatedAt: '<check-defined>',
        },
    },
};
//# sourceMappingURL=auth-owner3.js.map