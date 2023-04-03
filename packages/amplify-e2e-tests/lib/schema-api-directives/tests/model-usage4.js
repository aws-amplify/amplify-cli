"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expected_result_query = exports.query = exports.expected_result_mutation2 = exports.input_mutation2 = exports.mutation2 = exports.expected_result_mutation1 = exports.input_mutation1 = exports.mutation1 = exports.schema = void 0;
//schema
exports.schema = "\ntype Post @model {\n  id: ID!\n  title: String!\n  tags: [String!]!\n  createdAt: AWSDateTime!\n  updatedAt: AWSDateTime!\n}\n\n##model/usage4";
//mutations
exports.mutation1 = "\nmutation CreatePost(\n    $input: CreatePostInput!\n    $condition: ModelPostConditionInput\n  ) {\n    createPost(input: $input, condition: $condition) {\n      id\n      title\n      tags\n      createdAt\n      updatedAt\n    }\n}";
exports.input_mutation1 = {
    input: {
        id: '1',
        title: 'title1',
        tags: ['tag1'],
        createdAt: '2020-05-27T01:05:49.129Z',
        updatedAt: '2020-05-28T01:05:49.129Z',
    },
};
exports.expected_result_mutation1 = {
    data: {
        createPost: {
            id: '1',
            title: 'title1',
            tags: ['tag1'],
            createdAt: '2020-05-27T01:05:49.129Z',
            updatedAt: '2020-05-28T01:05:49.129Z',
        },
    },
};
exports.mutation2 = "\nmutation UpdatePost(\n    $input: UpdatePostInput!\n    $condition: ModelPostConditionInput\n  ) {\n    updatePost(input: $input, condition: $condition) {\n      id\n      title\n      tags\n      createdAt\n      updatedAt\n    }\n}";
exports.input_mutation2 = {
    input: {
        id: '1',
        title: 'title1-updated',
        tags: ['tag1-updated'],
        createdAt: '2020-05-27T01:05:49.129Z',
        updatedAt: '2020-05-29T01:05:49.129Z',
    },
};
exports.expected_result_mutation2 = {
    data: {
        updatePost: {
            id: '1',
            title: 'title1-updated',
            tags: ['tag1-updated'],
            createdAt: '2020-05-27T01:05:49.129Z',
            updatedAt: '2020-05-29T01:05:49.129Z',
        },
    },
};
//queries
exports.query = "\n query GetPost {\n    getPost(id: \"1\") {\n      id\n      title\n      tags\n      createdAt\n      updatedAt\n    }\n}";
exports.expected_result_query = {
    data: {
        getPost: {
            id: '1',
            title: 'title1-updated',
            tags: ['tag1-updated'],
            createdAt: '2020-05-27T01:05:49.129Z',
            updatedAt: '2020-05-29T01:05:49.129Z',
        },
    },
};
//# sourceMappingURL=model-usage4.js.map