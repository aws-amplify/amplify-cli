export declare const schema = "\ntype Todo @model\n  @auth(rules: [{ allow: owner, operations: [create, delete, update] }]) {\n  id: ID!\n  updatedAt: AWSDateTime!\n  content: String!\n}\n\n##auth/owner6";
export declare const mutation1 = "\nmutation CreateTodo(\n    $input: CreateTodoInput!\n    $condition: ModelTodoConditionInput\n  ) {\n    createTodo(input: $input, condition: $condition) {\n      id\n      updatedAt\n      content\n      createdAt\n    }\n}";
export declare const input_mutation1: {
    input: {
        id: string;
        updatedAt: string;
        content: string;
    };
};
export declare const expected_result_mutation1: {
    data: {
        createTodo: {
            id: string;
            updatedAt: string;
            content: string;
            createdAt: string;
        };
    };
};
export declare const mutation2 = "\n mutation UpdateTodo(\n    $input: UpdateTodoInput!\n    $condition: ModelTodoConditionInput\n  ) {\n    updateTodo(input: $input, condition: $condition) {\n      id\n      updatedAt\n      content\n      createdAt\n    }\n}";
export declare const input_mutation2: {
    input: {
        id: string;
        updatedAt: string;
        content: string;
    };
};
export declare const expected_result_mutation2: {
    data: {
        updateTodo: {
            id: string;
            updatedAt: string;
            content: string;
            createdAt: string;
        };
    };
};
