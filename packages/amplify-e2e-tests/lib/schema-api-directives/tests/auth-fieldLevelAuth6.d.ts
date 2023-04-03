export declare const schema = "\n#error: missing the owner field, \n#change: added the missign owner field\n#error: Per-field auth on the required field updatedAt is not supported with subscriptions.\n#Either make the field optional, set auth on the object and not the field, \n#or disable subscriptions for the object (setting level to off or public)\n#change: made the updatedAt field optional\n#error: updatedAt field caused Unauthorized error in CreateTodo due a recent change in @auth \n#change: changed updatedAt to updatedOn\n\n\ntype Todo @model\n{\n  id: ID! \n  owner: String\n  updatedOn: AWSDateTime @auth(rules: [{ allow: groups, groups: [\"ForbiddenGroup\"] }])\n  content: String! @auth(rules: [{ allow: owner, operations: [update] }])\n}\n\n##fieldLevelAuth6";
export declare const mutation1 = "\nmutation CreateTodo {\n    createTodo(input: {\n      id: \"1\",\n      owner: \"user1\",\n      content: \"todo1 content\"\n    }) {\n      id\n      owner\n      content\n    }\n}";
export declare const expected_result_mutation1: {
    data: {
        createTodo: {
            id: string;
            owner: string;
            content: string;
        };
    };
};
export declare const mutation2 = "\nmutation UpdateTodo {\n    updateTodo(input: {\n      id: \"1\",\n      owner: \"user1\",\n      content: \"todo1 content updated\"\n    }) {\n      id\n      owner\n      content\n    }\n}";
export declare const expected_result_mutation2: {
    data: {
        updateTodo: {
            id: string;
            owner: string;
            content: string;
        };
    };
};
