export declare const schema = "\ntype Post @model {\n  id: ID!\n  title: String!\n  comments: [Comment] @connection(keyName: \"byPost\", fields: [\"id\"])\n}\n\ntype Comment @model \n  @key(name: \"byPost\", fields: [\"postID\", \"content\"]) {\n  id: ID!\n  postID: ID!\n  content: String!\n  post: Post @connection(fields: [\"postID\"])\n}\n\n##connection/belongsTo";
export declare const mutation1 = "\nmutation CreatePost {\n  createPost(input: { id: \"a-post-id\", title: \"Post Title\" }) {\n    id\n    title\n  }\n}";
export declare const expected_result_mutation1: {
    data: {
        createPost: {
            id: string;
            title: string;
        };
    };
};
export declare const mutation2 = "\nmutation CreateCommentOnPost1 {\n  createComment(input: { id: \"a-comment-id-1\", content: \"A comment #1\", postID: \"a-post-id\" }) {\n    id\n    content\n  }\n}";
export declare const expected_result_mutation2: {
    data: {
        createComment: {
            id: string;
            content: string;
        };
    };
};
export declare const mutation3 = "\nmutation CreateCommentOnPost2 {\n  createComment(input: { id: \"a-comment-id-2\", content: \"A comment #2\", postID: \"a-post-id\" }) {\n    id\n    content\n  }\n}\n";
export declare const expected_result_mutation3: {
    data: {
        createComment: {
            id: string;
            content: string;
        };
    };
};
export declare const query = "\nquery GetCommentWithPostAndComments {\n  getComment(id: \"a-comment-id-1\") {\n    id\n    content\n    post {\n      id\n      title\n      comments {\n        items {\n          id\n          content\n        }\n      }\n    }\n  }\n}\n";
export declare const expected_result_query: {
    data: {
        getComment: {
            id: string;
            content: string;
            post: {
                id: string;
                title: string;
                comments: {
                    items: {
                        id: string;
                        content: string;
                    }[];
                };
            };
        };
    };
};
