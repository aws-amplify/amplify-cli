export declare const schema = "\ntype Draft @model\n  @auth(rules: [\n\n    # Defaults to use the \"owner\" field.\n    { allow: owner },\n\n    # Authorize the update mutation and both queries. Use 'queries: null' to disable auth for queries.\n    { allow: owner, ownerField: \"editors\", operations: [update] },\n\n    # Admin users can access any operation.\n    { allow: groups, groups: [\"Admin\"] }\n  ]) {\n  id: ID!\n  title: String!\n  content: String\n  owner: String\n  editors: [String]!\n}\n\n#staticGroup2";
export declare const mutation1 = "\nmutation CreateDraft(\n    $input: CreateDraftInput!\n    $condition: ModelDraftConditionInput\n  ) {\n    createDraft(input: $input, condition: $condition) {\n      id\n      title\n      content\n      owner\n      editors\n      createdAt\n      updatedAt\n    }\n}";
export declare const input_mutation1: {
    input: {
        id: string;
        title: string;
        content: string;
        owner: string;
        editors: string[];
    };
};
export declare const expected_result_mutation1: {
    data: {
        createDraft: {
            id: string;
            title: string;
            content: string;
            owner: string;
            editors: string[];
            createdAt: string;
            updatedAt: string;
        };
    };
};
export declare const mutation2 = "\n mutation UpdateDraft(\n    $input: UpdateDraftInput!\n    $condition: ModelDraftConditionInput\n  ) {\n    updateDraft(input: $input, condition: $condition) {\n      id\n      title\n      content\n      owner\n      editors\n      createdAt\n      updatedAt\n    }\n  }";
export declare const input_mutation2: {
    input: {
        id: string;
        title: string;
        content: string;
        owner: string;
        editors: string[];
    };
};
export declare const expected_result_mutation2: {
    data: {
        updateDraft: {
            id: string;
            title: string;
            content: string;
            owner: string;
            editors: string[];
            createdAt: string;
            updatedAt: string;
        };
    };
};
