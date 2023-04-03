export declare const schema = "\n#error: though harmless, groups is probably unintentionally put here, and it's misleading, for static group auth, it does not need such field.\ntype Post @model @auth(rules: [{allow: groups, groups: [\"Admin\"]}]) {\n  id: ID!\n  title: String!\n  groups: String\n}\n\n##generatesStaticGroup";
export declare const mutation1 = "\nmutation CreatePost(\n    $input: CreatePostInput!\n    $condition: ModelPostConditionInput\n  ) {\n    createPost(input: $input, condition: $condition) {\n      id\n      title\n      groups\n      createdAt\n      updatedAt\n    }\n}";
export declare const input_mutation1: {
    input: {
        id: string;
        title: string;
        groups: string;
    };
};
export declare const expected_result_mutation1: {
    data: {
        createPost: {
            id: string;
            title: string;
            groups: string;
            createdAt: string;
            updatedAt: string;
        };
    };
};
export declare const mutation2 = "\n mutation UpdatePost(\n    $input: UpdatePostInput!\n    $condition: ModelPostConditionInput\n  ) {\n    updatePost(input: $input, condition: $condition) {\n      id\n      title\n      groups\n      createdAt\n      updatedAt\n    }\n}";
export declare const input_mutation2: {
    input: {
        id: string;
        title: string;
        groups: string;
    };
};
export declare const expected_result_mutation2: {
    data: {
        updatePost: {
            id: string;
            title: string;
            groups: string;
            createdAt: string;
            updatedAt: string;
        };
    };
};
