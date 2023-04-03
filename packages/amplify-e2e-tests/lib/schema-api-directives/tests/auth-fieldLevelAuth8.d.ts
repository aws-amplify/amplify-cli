export declare function runTest(projectDir: string, testModule: any): Promise<void>;
export declare const schema = "\ntype Employee @model\n  @auth(rules: [\n\t  { allow: owner },\n\t  { allow: groups, groups: [\"Admin\"] }\n  ]) {\n\tid: ID!\n\tname: String!\n\taddress: String!\n\tssn: String @auth(rules: [{allow: owner}])\n}\n\n##fieldLevelAuth8";
export declare const mutation = "\n#error: title and content are not in the Employee type\n#change: changed them to name and address\n#change: add id in the input so test can query employee by the id\nmutation {\n  createEmployee(input: {\n    id: \"1\"\n    name: \"Nadia\"\n    address: \"123 First Ave\"\n    ssn: \"392-95-2716\"\n  }){\n    id\n    name\n    address\n    ssn\n  }\n}";
export declare const expected_result_mutation: {
    data: {
        createEmployee: {
            id: string;
            name: string;
            address: string;
            ssn: any;
        };
    };
};
export declare const query = "\n query GetEmployee {\n    getEmployee(id: \"1\") {\n      id\n      name\n      address\n      ssn\n      owner\n    }\n}";
export declare const expected_result_query: {
    data: {
        getEmployee: {
            id: string;
            name: string;
            address: string;
            ssn: string;
            owner: string;
        };
    };
};
