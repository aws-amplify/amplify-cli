"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expected_result_query = exports.query = exports.expected_result_mutation2 = exports.mutation2 = exports.expected_result_mutation1 = exports.mutation1 = exports.schema = void 0;
//schema
exports.schema = "\ntype Post @model {\n  id: ID!\n  title: String!\n  comments: [Comment] @connection(keyName: \"byPost\", fields: [\"id\"])\n}\n\ntype Comment @model @key(name: \"byPost\", fields: [\"postID\", \"content\"]) {\n  id: ID!\n  postID: ID!\n  content: String!\n}\n\n##connection/hasMany";
//mutations
exports.mutation1 = "\nmutation CreatePost {\n  createPost(input: { id: \"a-post-id\", title: \"Post Title\" }) {\n    id\n    title\n  }\n}";
exports.expected_result_mutation1 = {
    data: {
        createPost: {
            id: 'a-post-id',
            title: 'Post Title',
        },
    },
};
exports.mutation2 = "\nmutation CreateCommentOnPost {\n  createComment(input: { id: \"a-comment-id\", content: \"A comment\", postID: \"a-post-id\" }) {\n    id\n    content\n  }\n}\n";
exports.expected_result_mutation2 = {
    data: {
        createComment: {
            id: 'a-comment-id',
            content: 'A comment',
        },
    },
};
//queries
exports.query = "\nquery getPost {\n  getPost(id: \"a-post-id\") {\n    id\n    title\n    comments {\n      items {\n        id\n        content\n      }\n    }\n  }\n}\n";
exports.expected_result_query = {
    data: {
        getPost: {
            id: 'a-post-id',
            title: 'Post Title',
            comments: {
                items: [
                    {
                        id: 'a-comment-id',
                        content: 'A comment',
                    },
                ],
            },
        },
    },
};
//# sourceMappingURL=connection-hasMany.js.map