export declare const schema = "\ntype Post @model {\n  id: ID!\n  title: String!\n  comments: [Comment] @connection(keyName: \"byPost\", fields: [\"id\"])\n}\n\ntype Comment @model @key(name: \"byPost\", fields: [\"postID\", \"content\"]) {\n  id: ID!\n  postID: ID!\n  content: String!\n}\n\n##connection/hasMany";
export declare const mutation1 = "\nmutation CreatePost {\n  createPost(input: { id: \"a-post-id\", title: \"Post Title\" }) {\n    id\n    title\n  }\n}";
export declare const expected_result_mutation1: {
    data: {
        createPost: {
            id: string;
            title: string;
        };
    };
};
export declare const mutation2 = "\nmutation CreateCommentOnPost {\n  createComment(input: { id: \"a-comment-id\", content: \"A comment\", postID: \"a-post-id\" }) {\n    id\n    content\n  }\n}\n";
export declare const expected_result_mutation2: {
    data: {
        createComment: {
            id: string;
            content: string;
        };
    };
};
export declare const query = "\nquery getPost {\n  getPost(id: \"a-post-id\") {\n    id\n    title\n    comments {\n      items {\n        id\n        content\n      }\n    }\n  }\n}\n";
export declare const expected_result_query: {
    data: {
        getPost: {
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
