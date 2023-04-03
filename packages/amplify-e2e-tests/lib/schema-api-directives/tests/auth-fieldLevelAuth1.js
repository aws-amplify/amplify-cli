"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expected_result_query = exports.query = exports.expected_result_mutation = exports.input_mutation = exports.mutation = exports.schema = void 0;
//schema
exports.schema = "\ntype User @model {\n  id: ID!\n  username: String\n  ssn: String @auth(rules: [{ allow: owner, ownerField: \"username\" }])\n}\n\n##fieldLevelAuth1";
//mutations
exports.mutation = "\nmutation CreateUser(\n    $input: CreateUserInput!\n    $condition: ModelUserConditionInput\n  ) {\n    createUser(input: $input, condition: $condition) {\n      id\n      username\n      ssn\n    }\n}";
exports.input_mutation = {
    input: {
        id: '1',
        ssn: '888-88-8888',
    },
};
exports.expected_result_mutation = {
    data: {
        createUser: {
            id: '1',
            username: 'user1',
            ssn: null,
        },
    },
};
//queries
exports.query = "\n query GetUser {\n    getUser(id: \"1\") {\n      id\n      username\n      ssn\n    }\n}";
exports.expected_result_query = {
    data: {
        getUser: {
            id: '1',
            username: 'user1',
            ssn: '888-88-8888',
        },
    },
};
//# sourceMappingURL=auth-fieldLevelAuth1.js.map