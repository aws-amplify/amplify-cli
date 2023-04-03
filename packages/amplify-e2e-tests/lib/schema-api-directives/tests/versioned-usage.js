"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expected_result_mutation3 = exports.input_mutation3 = exports.mutation3 = exports.expected_result_mutation2 = exports.input_mutation2 = exports.mutation2 = exports.expected_result_mutation1 = exports.mutation1 = exports.schema = void 0;
//schema
exports.schema = "\ntype Post @model @versioned {\n  id: ID!\n  title: String!\n  version: Int! # <- If not provided, it is added for you.\n}\n\n##versioned/usage";
//mutations
exports.mutation1 = "\n#change: add id: \"1\" in the input, so update mutation can be carried out\nmutation Create {\n  createPost(input: { \n    id: \"1\"\n    title: \"Conflict detection in the cloud!\" \n  }) {\n    id\n    title\n    version # will be 1\n  }\n}\n";
exports.expected_result_mutation1 = {
    data: {
        createPost: {
            id: '1',
            title: 'Conflict detection in the cloud!',
            version: 1,
        },
    },
};
exports.mutation2 = "\nmutation Update($postId: ID!) {\n  updatePost(input: { id: $postId, title: \"Conflict detection in the cloud is great!\", expectedVersion: 1 }) {\n    id\n    title\n    version # will be 2\n  }\n}\n";
exports.input_mutation2 = {
    postId: '1',
};
exports.expected_result_mutation2 = {
    data: {
        updatePost: {
            id: '1',
            title: 'Conflict detection in the cloud is great!',
            version: 2,
        },
    },
};
exports.mutation3 = "\nmutation Delete($postId: ID!) {\n  deletePost(input: { id: $postId, expectedVersion: 2 }) {\n    id\n    title\n    version\n  }\n}\n";
exports.input_mutation3 = {
    postId: '1',
};
exports.expected_result_mutation3 = {
    data: {
        deletePost: {
            id: '1',
            title: 'Conflict detection in the cloud is great!',
            version: 2,
        },
    },
};
//# sourceMappingURL=versioned-usage.js.map