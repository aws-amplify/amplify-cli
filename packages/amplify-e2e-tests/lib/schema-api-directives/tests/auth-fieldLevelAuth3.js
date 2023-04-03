"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expected_result_query = exports.query = exports.expected_result_mutation = exports.input_mutation = exports.mutation = exports.schema = void 0;
//schema
exports.schema = "\n#error: there is no \"username\" field, which is required as the ownerfield\n#change: change \"email\" to \"username\"\ntype Employee @model {\n  id: ID!\n  username: String\n\n  # Owners & members of the \"Admin\" group may read employee salaries.\n  # Only members of the \"Admin\" group may create an employee with a salary\n  # or update a salary.\n  salary: String\n    @auth(rules: [\n      { allow: owner, ownerField: \"username\", operations: [read] },\n      { allow: groups, groups: [\"Admin\"], operations: [create, update, read] }\n    ])\n}\n\n##fieldLevelAuth3";
//mutations
exports.mutation = "\nmutation CreateEmployee(\n    $input: CreateEmployeeInput!\n    $condition: ModelEmployeeConditionInput\n  ) {\n    createEmployee(input: $input, condition: $condition) {\n      id\n      username\n      salary\n    }\n}";
exports.input_mutation = {
    input: {
        id: '1',
        username: 'user1',
        salary: '10000',
    },
};
exports.expected_result_mutation = {
    data: {
        createEmployee: {
            id: '1',
            username: 'user1',
            salary: null,
        },
    },
};
//queries
exports.query = "\n query GetEmployee {\n    getEmployee(id: \"1\") {\n      id\n      username\n      salary\n    }\n}";
exports.expected_result_query = {
    data: {
        getEmployee: {
            id: '1',
            username: 'user1',
            salary: '10000',
        },
    },
};
//# sourceMappingURL=auth-fieldLevelAuth3.js.map