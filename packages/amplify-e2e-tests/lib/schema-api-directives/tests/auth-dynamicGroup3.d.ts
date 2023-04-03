export declare const schema = "\ntype Draft @model\n  @auth(rules: [\n\n    # Defaults to use the \"owner\" field.\n    { allow: owner },\n\n    # Authorize the update mutation and both queries. Use 'queries: null' to disable auth for queries.\n    { allow: owner, ownerField: \"editors\", operations: [update] },\n\n    # Admin users can access any operation.\n    { allow: groups, groups: [\"Admin\"] }\n\n    # Each record may specify which groups may read them.\n    { allow: groups, groupsField: \"groupsCanAccess\", operations: [read] }\n  ]) {\n  id: ID!\n  title: String!\n  content: String\n  owner: String\n  editors: [String]!\n  groupsCanAccess: [String]!\n}\n\n##dynamicGroup3";
export declare const mutation1 = "\n#change: add id: \"1\" so result can be verified\nmutation CreateDraft {\n  createDraft(input: {\n    id: \"1\",\n    title: \"A new draft\",\n    editors: [],\n    groupsCanAccess: [\"BizDev\"]\n  }) {\n    id\n    groupsCanAccess\n  }\n}";
export declare const expected_result_mutation1: {
    data: {
        createDraft: {
            id: string;
            groupsCanAccess: string[];
        };
    };
};
export declare const mutation2 = "\n#change: add id: \"2\" so result can be verified\nmutation CreateDraft {\n  createDraft(input: {\n    id: \"2\",\n    title: \"Another draft\",\n    editors: [],\n    groupsCanAccess: [\"Marketing\"]\n  }) {\n    id\n    groupsCanAccess\n  }\n}";
export declare const expected_result_mutation2: {
    data: {
        createDraft: {
            id: string;
            groupsCanAccess: string[];
        };
    };
};
