export declare const schema = "\ntype Post @model(queries: { get: \"post\" }, mutations: null, subscriptions: null) {\n  id: ID!\n  title: String!\n  tags: [String!]!\n}\n\n##model/usage2";
export declare const mutation = "\nmutation CreatePost {\n    createPost(input: {\n      id: \"1\",\n      title: \"title1\",\n      tags: [\"tag1\"]\n    }) {\n      id\n      title\n      tags\n      createdAt\n      updatedAt\n    }\n}";
export declare const expected_result_mutation: {
    graphQLErrors: {
        message: string;
    }[];
};
