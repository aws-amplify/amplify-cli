export declare function runTest(projectDir: string, testModule: any): Promise<void>;
export declare const schema = "\ntype Post @model @searchable {\n  id: ID!\n  title: String!\n  createdAt: String!\n  updatedAt: String!\n  upvotes: Int\n}";
export declare const mutation = "\nmutation CreatePost {\n  createPost(input: { title: \"Stream me to Elasticsearch!\" }) {\n    id\n    title\n    createdAt\n    updatedAt\n    upvotes\n  }\n}";
export declare const expected_result_mutation: {
    data: {
        createPost: {
            id: string;
            title: string;
            createdAt: string;
            updatedAt: string;
            upvotes: any;
        };
    };
};
export declare const query1 = "\n#error: add \"s\" for searchPosts\nquery SearchPosts {\n  searchPosts(filter: { title: { match: \"Stream\" }}) {\n    items {\n      id\n      title\n    }\n  }\n}";
export declare const expected_result_query1: {
    data: {
        searchPosts: {
            items: {
                id: string;
                title: string;
            }[];
        };
    };
};
export declare const query2 = "\n#error: add \"s\" for searchPosts\nquery SearchPosts {\n  searchPosts(filter: { title: { wildcard: \"S*Elasticsearch!\" }}) {\n    items {\n      id\n      title\n    }\n  }\n}";
export declare const expected_result_query2: {
    data: {
        searchPosts: {
            items: any[];
        };
    };
};
