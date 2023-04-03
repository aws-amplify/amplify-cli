export declare const schema = "\ntype Customer @model @key(fields: [\"email\"]) {\n  email: String!\n  username: String\n}\n\n##key/howTo1";
export declare const mutation = "\nmutation CreateCustomer(\n    $input: CreateCustomerInput!\n    $condition: ModelCustomerConditionInput\n  ) {\n    createCustomer(input: $input, condition: $condition) {\n      email\n      username\n      createdAt\n      updatedAt\n    }\n}";
export declare const input_mutation: {
    input: {
        email: string;
        username: string;
    };
};
export declare const expected_result_mutation: {
    data: {
        createCustomer: {
            email: string;
            username: string;
            createdAt: string;
            updatedAt: string;
        };
    };
};
export declare const query = "\nquery GetCustomerById {\n  getCustomer(email: \"me@email.com\") {\n    email\n    username\n  }\n}\n";
export declare const expected_result_query: {
    data: {
        getCustomer: {
            email: string;
            username: string;
        };
    };
};
