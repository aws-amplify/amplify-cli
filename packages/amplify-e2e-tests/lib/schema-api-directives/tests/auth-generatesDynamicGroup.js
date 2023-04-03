"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expected_result_mutation2 = exports.input_mutation2 = exports.mutation2 = exports.expected_result_mutation1 = exports.input_mutation1 = exports.mutation1 = exports.schema = void 0;
//schema
exports.schema = "\ntype Post @model @auth(rules: [{ allow: groups, groupsField: \"groups\" }]) {\n  id: ID!\n  title: String!\n  groups: String\n}\n\n##auth generatesDynamicGroup";
//mutations
exports.mutation1 = "\nmutation CreatePost(\n    $input: CreatePostInput!\n    $condition: ModelPostConditionInput\n  ) {\n    createPost(input: $input, condition: $condition) {\n      id\n      title\n      groups\n      createdAt\n      updatedAt\n    }\n}";
exports.input_mutation1 = {
    input: {
        id: '1',
        title: 'title1',
        groups: 'Admin',
    },
};
exports.expected_result_mutation1 = {
    data: {
        createPost: {
            id: '1',
            title: 'title1',
            groups: 'Admin',
            createdAt: '<check-defined>',
            updatedAt: '<check-defined>',
        },
    },
};
exports.mutation2 = "\n mutation UpdatePost(\n    $input: UpdatePostInput!\n    $condition: ModelPostConditionInput\n  ) {\n    updatePost(input: $input, condition: $condition) {\n      id\n      title\n      groups\n      createdAt\n      updatedAt\n    }\n}";
exports.input_mutation2 = {
    input: {
        id: '1',
        title: 'title1-updated',
        groups: 'Admin',
    },
};
exports.expected_result_mutation2 = {
    data: {
        updatePost: {
            id: '1',
            title: 'title1-updated',
            groups: 'Admin',
            createdAt: '<check-defined>',
            updatedAt: '<check-defined>',
        },
    },
};
//# sourceMappingURL=auth-generatesDynamicGroup.js.map