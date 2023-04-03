"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expected_result_query = exports.query = exports.expected_result_mutation3 = exports.mutation3 = exports.expected_result_mutation2 = exports.mutation2 = exports.expected_result_mutation1 = exports.mutation1 = exports.schema = void 0;
//schema
exports.schema = "\ntype Post @model {\n  id: ID!\n  title: String!\n  comments: [Comment] @connection(keyName: \"byPost\", fields: [\"id\"])\n}\n\ntype Comment @model \n  @key(name: \"byPost\", fields: [\"postID\", \"content\"]) {\n  id: ID!\n  postID: ID!\n  content: String!\n  post: Post @connection(fields: [\"postID\"])\n}\n\n##connection/belongsTo";
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
exports.mutation2 = "\nmutation CreateCommentOnPost1 {\n  createComment(input: { id: \"a-comment-id-1\", content: \"A comment #1\", postID: \"a-post-id\" }) {\n    id\n    content\n  }\n}";
exports.expected_result_mutation2 = {
    data: {
        createComment: {
            id: 'a-comment-id-1',
            content: 'A comment #1',
        },
    },
};
exports.mutation3 = "\nmutation CreateCommentOnPost2 {\n  createComment(input: { id: \"a-comment-id-2\", content: \"A comment #2\", postID: \"a-post-id\" }) {\n    id\n    content\n  }\n}\n";
exports.expected_result_mutation3 = {
    data: {
        createComment: {
            id: 'a-comment-id-2',
            content: 'A comment #2',
        },
    },
};
//queries
exports.query = "\nquery GetCommentWithPostAndComments {\n  getComment(id: \"a-comment-id-1\") {\n    id\n    content\n    post {\n      id\n      title\n      comments {\n        items {\n          id\n          content\n        }\n      }\n    }\n  }\n}\n";
exports.expected_result_query = {
    data: {
        getComment: {
            id: 'a-comment-id-1',
            content: 'A comment #1',
            post: {
                id: 'a-post-id',
                title: 'Post Title',
                comments: {
                    items: [
                        {
                            id: 'a-comment-id-1',
                            content: 'A comment #1',
                        },
                        {
                            id: 'a-comment-id-2',
                            content: 'A comment #2',
                        },
                    ],
                },
            },
        },
    },
};
//# sourceMappingURL=connection-belongsTo.js.map