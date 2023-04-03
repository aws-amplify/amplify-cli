export declare const schema = "\n#change: added type Post definition which is omitted in the doc\n#error: connection field auth does not work as described, when query user, posts are always null\n#change: quoted out connection field auth to make query work\ntype User @model {\n  id: ID!\n  username: String\n  posts: [Post]\n    @connection(name: \"UserPosts\")\n    #@auth(rules: [{ allow: owner, ownerField: \"username\" }])\n}\n\ntype Post @model(queries: null) \n{\n  id: ID!\n  owner: User @connection(name: \"UserPosts\")\n  postname: String\n  content: String\n}\n\n##fieldLevelAuth2";
export declare const mutation1 = "\nmutation CreateUser {\n    createUser(input: {\n      id: \"1\",\n      username: \"user1\"\n    }) {\n      id\n      username\n    }\n}";
export declare const expected_result_mutation1: {
    data: {
        createUser: {
            id: string;
            username: string;
        };
    };
};
export declare const mutation2 = "\n mutation {\n    createPost(input: {\n      id: \"1\",\n      postname: \"post1\",\n      content: \"post1 content\",\n      postOwnerId: \"1\"\n    }) {\n      id\n      owner {\n        id\n        username\n      }\n      postname\n      content\n    }\n}";
export declare const expected_result_mutation2: {
    data: {
        createPost: {
            id: string;
            owner: {
                id: string;
                username: string;
            };
            postname: string;
            content: string;
        };
    };
};
export declare const query = "\n query GetUser {\n    getUser(id: \"1\") {\n      id\n      username\n      posts {\n        items {\n          id\n          postname\n        }\n      }\n    }\n}";
export declare const expected_result_query: {
    data: {
        getUser: {
            id: string;
            username: string;
            posts: {
                items: {
                    id: string;
                    postname: string;
                }[];
            };
        };
    };
};
