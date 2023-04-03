"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expected_result_query = exports.query = exports.expected_result_mutation2 = exports.input_mutation2 = exports.mutation2 = exports.expected_result_mutation1 = exports.input_mutation1 = exports.mutation1 = exports.schema = void 0;
//schema
exports.schema = "\ntype Post @model {\n  id: ID! # id: ID! is a required attribute.\n  title: String!\n  tags: [String!]!\n}\n\n##model/usage1";
//mutations
exports.mutation1 = "\nmutation CreatePost(\n    $input: CreatePostInput!\n    $condition: ModelPostConditionInput\n  ) {\n    createPost(input: $input, condition: $condition) {\n      id\n      title\n      tags\n      createdAt\n      updatedAt\n    }\n}";
exports.input_mutation1 = {
    input: {
        id: '1',
        title: 'title1',
        tags: ['tag1'],
    },
};
exports.expected_result_mutation1 = {
    data: {
        createPost: {
            id: '1',
            title: 'title1',
            tags: ['tag1'],
            createdAt: '<check-defined>',
            updatedAt: '<check-defined>',
        },
    },
};
exports.mutation2 = "\n  mutation UpdatePost(\n    $input: UpdatePostInput!\n    $condition: ModelPostConditionInput\n  ) {\n    updatePost(input: $input, condition: $condition) {\n      id\n      title\n      tags\n      createdAt\n      updatedAt\n    }\n}";
exports.input_mutation2 = {
    input: {
        id: '1',
        title: 'title1 updated',
        tags: ['tag1', 'new-tag'],
    },
};
exports.expected_result_mutation2 = {
    data: {
        updatePost: {
            id: '1',
            title: 'title1 updated',
            tags: ['tag1', 'new-tag'],
            createdAt: '<check-defined>',
            updatedAt: '<check-defined>',
        },
    },
};
//queries
exports.query = "\nquery GetPost{\n    getPost(id: \"1\") {\n      id\n      title\n      tags\n      createdAt\n      updatedAt\n    }\n}";
exports.expected_result_query = {
    data: {
        getPost: {
            id: '1',
            title: 'title1 updated',
            tags: ['tag1', 'new-tag'],
            createdAt: '<check-defined>',
            updatedAt: '<check-defined>',
        },
    },
};
//# sourceMappingURL=model-usage1.js.map