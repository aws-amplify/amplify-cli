"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expected_result_mutation = exports.mutation = exports.schema = void 0;
//schema
exports.schema = "\ntype Post @model(queries: { get: \"post\" }, mutations: null, subscriptions: null) {\n  id: ID!\n  title: String!\n  tags: [String!]!\n}\n\n##model/usage2";
//mutations
exports.mutation = "\nmutation CreatePost {\n    createPost(input: {\n      id: \"1\",\n      title: \"title1\",\n      tags: [\"tag1\"]\n    }) {\n      id\n      title\n      tags\n      createdAt\n      updatedAt\n    }\n}";
exports.expected_result_mutation = {
    graphQLErrors: [
        {
            message: 'Schema is not configured for mutations.',
        },
    ],
};
//# sourceMappingURL=model-usage2.js.map