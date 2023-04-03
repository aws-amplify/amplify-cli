export declare const schema = "\ntype Post @model {\n  id: ID!\n  title: String!\n  editors: [PostEditor] @connection(keyName: \"byPost\", fields: [\"id\"])\n}\n\n# Create a join model and disable queries as you don't need them\n# and can query through Post.editors and User.posts\ntype PostEditor\n  @model(queries: null)\n  @key(name: \"byPost\", fields: [\"postID\", \"editorID\"])\n  @key(name: \"byEditor\", fields: [\"editorID\", \"postID\"]) {\n  id: ID!\n  postID: ID!\n  editorID: ID!\n  post: Post! @connection(fields: [\"postID\"])\n  editor: User! @connection(fields: [\"editorID\"])\n}\n\ntype User @model {\n  id: ID!\n  username: String!\n  posts: [PostEditor] @connection(keyName: \"byEditor\", fields: [\"id\"])\n}\n\n##connection/manyToMany";
export declare const mutation1 = "\nmutation CreateData {\n  p1: createPost(input: { id: \"P1\", title: \"Post 1\" }) {\n    id\n  }\n  p2: createPost(input: { id: \"P2\", title: \"Post 2\" }) {\n    id\n  }\n  u1: createUser(input: { id: \"U1\", username: \"user1\" }) {\n    id\n  }\n  u2: createUser(input: { id: \"U2\", username: \"user2\" }) {\n    id\n  }\n}\n";
export declare const mutation2 = "\nmutation CreateLinks {\n  p1u1: createPostEditor(input: { id: \"P1U1\", postID: \"P1\", editorID: \"U1\" }) {\n    id\n  }\n  p1u2: createPostEditor(input: { id: \"P1U2\", postID: \"P1\", editorID: \"U2\" }) {\n    id\n  }\n  p2u1: createPostEditor(input: { id: \"P2U1\", postID: \"P2\", editorID: \"U1\" }) {\n    id\n  }\n}\n";
export declare const query1 = "\nquery GetUserWithPosts {\n  getUser(id: \"U1\") {\n    id\n    username\n    posts {\n      items {\n        post {\n          title\n        }\n      }\n    }\n  }\n}\n";
export declare const expected_result_query1: {
    data: {
        getUser: {
            id: string;
            username: string;
            posts: {
                items: {
                    post: {
                        title: string;
                    };
                }[];
            };
        };
    };
};
export declare const query2 = "\nquery GetPostWithEditorsWithPosts {\n  getPost(id: \"P1\") {\n    id\n    title\n    editors {\n      items {\n        editor {\n          username\n          posts {\n            items {\n              post {\n                title\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n}\n";
export declare const expected_result_query2: {
    data: {
        getPost: {
            id: string;
            title: string;
            editors: {
                items: {
                    editor: {
                        username: string;
                        posts: {
                            items: {
                                post: {
                                    title: string;
                                };
                            }[];
                        };
                    };
                }[];
            };
        };
    };
};
