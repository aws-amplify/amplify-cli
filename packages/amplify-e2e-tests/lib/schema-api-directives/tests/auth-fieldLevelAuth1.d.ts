export declare const schema = "\ntype User @model {\n  id: ID!\n  username: String\n  ssn: String @auth(rules: [{ allow: owner, ownerField: \"username\" }])\n}\n\n##fieldLevelAuth1";
export declare const mutation = "\nmutation CreateUser(\n    $input: CreateUserInput!\n    $condition: ModelUserConditionInput\n  ) {\n    createUser(input: $input, condition: $condition) {\n      id\n      username\n      ssn\n    }\n}";
export declare const input_mutation: {
    input: {
        id: string;
        ssn: string;
    };
};
export declare const expected_result_mutation: {
    data: {
        createUser: {
            id: string;
            username: string;
            ssn: any;
        };
    };
};
export declare const query = "\n query GetUser {\n    getUser(id: \"1\") {\n      id\n      username\n      ssn\n    }\n}";
export declare const expected_result_query: {
    data: {
        getUser: {
            id: string;
            username: string;
            ssn: string;
        };
    };
};
