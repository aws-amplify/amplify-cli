export declare const schema = "\n#error: missing the owner field, \n#change: added the missign owner field\ntype Todo @model\n{\n  id: ID! \n  owner: String\n  updatedAt: AWSDateTime! \n  content: String! @auth(rules: [{ allow: owner, operations: [update] }])\n}\n\n##fieldLevelAuth4";
export declare const mutation1 = "\nmutation CreateTodo {\n    createTodo(input: {\n      id: \"1\",\n      owner: \"user1\",\n      updatedAt: \"2020-01-01T01:05:49.129Z\"\n      content: \"todo1 content\"\n    }) {\n      id\n      owner\n      updatedAt\n      content\n    }\n}";
export declare const expected_result_mutation1: {
    data: {
        createTodo: {
            id: string;
            owner: string;
            updatedAt: string;
            content: string;
        };
    };
};
export declare const mutation2 = "\nmutation UpdateTodo {\n    updateTodo(input: {\n      id: \"1\",\n      owner: \"user1\",\n      updatedAt: \"2020-05-20T01:05:49.129Z\"\n      content: \"todo1 content updated\"\n    }) {\n      id\n      owner\n      updatedAt\n      content\n    }\n}";
export declare const expected_result_mutation2: {
    data: {
        updateTodo: {
            id: string;
            owner: string;
            updatedAt: string;
            content: string;
        };
    };
};
