"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expected_result_query = exports.query = exports.expected_result_mutation = exports.input_mutation = exports.mutation = exports.schema = void 0;
//schema
exports.schema = "\ntype Customer @model @key(fields: [\"email\"]) {\n  email: String!\n  username: String\n}\n\n##key/howTo1";
//mutations
exports.mutation = "\nmutation CreateCustomer(\n    $input: CreateCustomerInput!\n    $condition: ModelCustomerConditionInput\n  ) {\n    createCustomer(input: $input, condition: $condition) {\n      email\n      username\n      createdAt\n      updatedAt\n    }\n}";
exports.input_mutation = {
    input: {
        email: 'me@email.com',
        username: 'myusername',
    },
};
exports.expected_result_mutation = {
    data: {
        createCustomer: {
            email: 'me@email.com',
            username: 'myusername',
            createdAt: '<check-defined>',
            updatedAt: '<check-defined>',
        },
    },
};
//queries
exports.query = "\nquery GetCustomerById {\n  getCustomer(email: \"me@email.com\") {\n    email\n    username\n  }\n}\n";
exports.expected_result_query = {
    data: {
        getCustomer: {
            email: 'me@email.com',
            username: 'myusername',
        },
    },
};
//# sourceMappingURL=key-howTo1.js.map