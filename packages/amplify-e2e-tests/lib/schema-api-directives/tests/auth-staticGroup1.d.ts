export declare const schema = "\ntype Salary @model @auth(rules: [{allow: groups, groups: [\"Admin\"]}]) {\n  id: ID!\n  wage: Int\n  currency: String\n}\n\n##staticGroup1";
export declare const mutation1 = "\n mutation CreateSalary(\n    $input: CreateSalaryInput!\n    $condition: ModelSalaryConditionInput\n  ) {\n    createSalary(input: $input, condition: $condition) {\n      id\n      wage\n      currency\n      createdAt\n      updatedAt\n    }\n}";
export declare const input_mutation1: {
    input: {
        id: string;
        wage: number;
        currency: string;
    };
};
export declare const expected_result_mutation1: {
    data: {
        createSalary: {
            id: string;
            wage: number;
            currency: string;
            createdAt: string;
            updatedAt: string;
        };
    };
};
export declare const mutation2 = "\nmutation UpdateSalary(\n    $input: UpdateSalaryInput!\n    $condition: ModelSalaryConditionInput\n  ) {\n    updateSalary(input: $input, condition: $condition) {\n      id\n      wage\n      currency\n      createdAt\n      updatedAt\n    }\n}";
export declare const input_mutation2: {
    input: {
        id: string;
        wage: number;
        currency: string;
    };
};
export declare const expected_result_mutation2: {
    data: {
        updateSalary: {
            id: string;
            wage: number;
            currency: string;
            createdAt: string;
            updatedAt: string;
        };
    };
};
