export declare const schema = "\ntype Post @model {\n  id: ID!\n  title: String\n  metadata: MetaData\n}\ntype MetaData {\n  category: Category\n}\nenum Category {\n  comedy\n  news\n}\n\n##model/genreates\n";
export declare const mutation1 = "\nmutation CreatePost(\n    $input: CreatePostInput!\n    $condition: ModelPostConditionInput\n  ) {\n    createPost(input: $input, condition: $condition) {\n      id\n      title\n      metadata {\n        category\n      }\n      createdAt\n      updatedAt\n    }\n}";
export declare const input_mutation1: {
    input: {
        id: string;
        title: string;
        metadata: {
            category: string;
        };
    };
};
export declare const expected_result_mutation1: {
    data: {
        createPost: {
            id: string;
            title: string;
            metadata: {
                category: string;
            };
            createdAt: string;
            updatedAt: string;
        };
    };
};
export declare const mutation2 = "\nmutation UpdatePost(\n    $input: UpdatePostInput!\n    $condition: ModelPostConditionInput\n  ) {\n    updatePost(input: $input, condition: $condition) {\n      id\n      title\n      metadata {\n        category\n      }\n      createdAt\n      updatedAt\n    }\n}";
export declare const input_mutation2: {
    input: {
        id: string;
        title: string;
        metadata: {
            category: string;
        };
    };
};
export declare const expected_result_mutation2: {
    data: {
        updatePost: {
            id: string;
            title: string;
            metadata: {
                category: string;
            };
            createdAt: string;
            updatedAt: string;
        };
    };
};
export declare const query = "\nquery GetPost{\n    getPost(id: \"1\") {\n      id\n      title\n      metadata {\n        category\n      }\n      createdAt\n      updatedAt\n    }\n}";
export declare const expected_result_query: {
    data: {
        getPost: {
            id: string;
            title: string;
            metadata: {
                category: string;
            };
            createdAt: string;
            updatedAt: string;
        };
    };
};
