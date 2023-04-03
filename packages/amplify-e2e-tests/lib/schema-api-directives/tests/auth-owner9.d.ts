export declare function runTest(projectDir: string, testModule: any): Promise<void>;
export declare const schema = "\n# The simplest case\ntype Post @model @auth(rules: [{allow: owner}]) {\n  id: ID!\n  title: String!\n}\n##owner1";
export declare const mutation = "\nmutation CreatePost(\n    $input: CreatePostInput!\n    $condition: ModelPostConditionInput\n  ) {\n    createPost(input: $input, condition: $condition) {\n      id\n      title\n      createdAt\n      updatedAt\n      owner\n    }\n}";
export declare const input_mutation: {
    input: {
        id: string;
        title: string;
    };
};
export declare const expected_result_mutation: {
    data: {
        createPost: {
            id: string;
            title: string;
            createdAt: string;
            updatedAt: string;
            owner: string;
        };
    };
};
export declare const query = "\n query GetPost {\n    getPost(id: \"1\") {\n      id\n      title\n      owner\n    }\n  }";
export declare const expected_result_query: {
    data: {
        getPost: {
            id: string;
            title: string;
            owner: string;
        };
    };
};
