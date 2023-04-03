"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expected_result_mutation = exports.input_mutation = exports.mutation = exports.schema = void 0;
//schema
exports.schema = "\n# The long form way\ntype Post\n  @model\n  @auth(\n    rules: [\n      {allow: owner, ownerField: \"owner\", operations: [create, update, delete, read]},\n    ])\n{\n  id: ID!\n  title: String!\n  owner: String\n}\n\n##owner2";
//mutations
exports.mutation = "\nmutation CreatePost(\n    $input: CreatePostInput!\n    $condition: ModelPostConditionInput\n  ) {\n    createPost(input: $input, condition: $condition) {\n      id\n      title\n      createdAt\n      updatedAt\n      owner\n    }\n}";
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
            owner: 'user1',
        },
    },
};
//# sourceMappingURL=auth-owner2.js.map