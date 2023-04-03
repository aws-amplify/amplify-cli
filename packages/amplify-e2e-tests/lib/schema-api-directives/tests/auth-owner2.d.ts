export declare const schema = "\n# The long form way\ntype Post\n  @model\n  @auth(\n    rules: [\n      {allow: owner, ownerField: \"owner\", operations: [create, update, delete, read]},\n    ])\n{\n  id: ID!\n  title: String!\n  owner: String\n}\n\n##owner2";
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
