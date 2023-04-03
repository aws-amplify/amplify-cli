export declare function runTest(projectDir: string, testModule: any): Promise<void>;
export declare const schema = "\n# public authorization with provider override\ntype Post @model @auth(rules: [{allow: public, provider: iam}]) {\n  id: ID!\n  title: String!\n}\n\n##public2";
export declare const mutation1 = "\nmutation CreatePost(\n    $input: CreatePostInput!\n    $condition: ModelPostConditionInput\n  ) {\n    createPost(input: $input, condition: $condition) {\n      id\n      title\n      createdAt\n      updatedAt\n    }\n}";
export declare const input_mutation1: {
    input: {
        id: string;
        title: string;
    };
};
export declare const expected_result_mutation1: {
    data: {
        createPost: {
            id: string;
            title: string;
            createdAt: string;
            updatedAt: string;
        };
    };
};
export declare const mutation2 = "\nmutation UpdatePost(\n    $input: UpdatePostInput!\n    $condition: ModelPostConditionInput\n  ) {\n    updatePost(input: $input, condition: $condition) {\n      id\n      title\n      createdAt\n      updatedAt\n    }\n}";
export declare const input_mutation2: {
    input: {
        id: string;
        title: string;
    };
};
export declare const expected_result_mutation2: {
    data: {
        updatePost: {
            id: string;
            title: string;
            createdAt: string;
            updatedAt: string;
        };
    };
};
