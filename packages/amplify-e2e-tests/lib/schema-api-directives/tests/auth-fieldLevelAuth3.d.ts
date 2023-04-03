export declare const schema = "\n#error: there is no \"username\" field, which is required as the ownerfield\n#change: change \"email\" to \"username\"\ntype Employee @model {\n  id: ID!\n  username: String\n\n  # Owners & members of the \"Admin\" group may read employee salaries.\n  # Only members of the \"Admin\" group may create an employee with a salary\n  # or update a salary.\n  salary: String\n    @auth(rules: [\n      { allow: owner, ownerField: \"username\", operations: [read] },\n      { allow: groups, groups: [\"Admin\"], operations: [create, update, read] }\n    ])\n}\n\n##fieldLevelAuth3";
export declare const mutation = "\nmutation CreateEmployee(\n    $input: CreateEmployeeInput!\n    $condition: ModelEmployeeConditionInput\n  ) {\n    createEmployee(input: $input, condition: $condition) {\n      id\n      username\n      salary\n    }\n}";
export declare const input_mutation: {
    input: {
        id: string;
        username: string;
        salary: string;
    };
};
export declare const expected_result_mutation: {
    data: {
        createEmployee: {
            id: string;
            username: string;
            salary: any;
        };
    };
};
export declare const query = "\n query GetEmployee {\n    getEmployee(id: \"1\") {\n      id\n      username\n      salary\n    }\n}";
export declare const expected_result_query: {
    data: {
        getEmployee: {
            id: string;
            username: string;
            salary: string;
        };
    };
};
