"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expected_result_query = exports.query = exports.expected_result_mutation2 = exports.input_mutation2 = exports.mutation2 = exports.expected_result_mutation1 = exports.input_mutation1 = exports.mutation1 = exports.schema = void 0;
//schema
exports.schema = "\ntype Post @model {\n  id: ID!\n  title: String\n  metadata: MetaData\n}\ntype MetaData {\n  category: Category\n}\nenum Category {\n  comedy\n  news\n}\n\n##model/genreates\n";
//mutations
exports.mutation1 = "\nmutation CreatePost(\n    $input: CreatePostInput!\n    $condition: ModelPostConditionInput\n  ) {\n    createPost(input: $input, condition: $condition) {\n      id\n      title\n      metadata {\n        category\n      }\n      createdAt\n      updatedAt\n    }\n}";
exports.input_mutation1 = {
    input: {
        id: '1',
        title: 'title1',
        metadata: {
            category: 'comedy',
        },
    },
};
exports.expected_result_mutation1 = {
    data: {
        createPost: {
            id: '1',
            title: 'title1',
            metadata: {
                category: 'comedy',
            },
            createdAt: '<check-defined>',
            updatedAt: '<check-defined>',
        },
    },
};
exports.mutation2 = "\nmutation UpdatePost(\n    $input: UpdatePostInput!\n    $condition: ModelPostConditionInput\n  ) {\n    updatePost(input: $input, condition: $condition) {\n      id\n      title\n      metadata {\n        category\n      }\n      createdAt\n      updatedAt\n    }\n}";
exports.input_mutation2 = {
    input: {
        id: '1',
        title: 'title1-updated',
        metadata: {
            category: 'news',
        },
    },
};
exports.expected_result_mutation2 = {
    data: {
        updatePost: {
            id: '1',
            title: 'title1-updated',
            metadata: {
                category: 'news',
            },
            createdAt: '<check-defined>',
            updatedAt: '<check-defined>',
        },
    },
};
//queries
exports.query = "\nquery GetPost{\n    getPost(id: \"1\") {\n      id\n      title\n      metadata {\n        category\n      }\n      createdAt\n      updatedAt\n    }\n}";
exports.expected_result_query = {
    data: {
        getPost: {
            id: '1',
            title: 'title1-updated',
            metadata: {
                category: 'news',
            },
            createdAt: '<check-defined>',
            updatedAt: '<check-defined>',
        },
    },
};
//# sourceMappingURL=model-generates.js.map