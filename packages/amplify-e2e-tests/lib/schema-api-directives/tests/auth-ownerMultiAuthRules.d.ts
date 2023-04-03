export declare const schema = "\n#error: need to add \"create\" in the editors' operations in order for the mutation #5 to succeed\ntype Draft\n  @model\n  @auth(\n    rules: [\n      # Defaults to use the \"owner\" field.\n      { allow: owner }\n      # Authorize the update mutation and both queries. Use \"queries: null\" to disable auth for queries.\n      { allow: owner, ownerField: \"editors\", operations: [create, update, read] }\n    ]\n  ) {\n  id: ID!\n  title: String!\n  content: String\n  owner: String\n  editors: [String]\n}\n\n##auth/multiAuthRules\n";
export declare const mutation1 = "\n#1\nmutation CreateDraft {\n  createDraft(input: { title: \"A new draft\" }) {\n    id\n    title\n    owner\n    editors\n  }\n}\n";
export declare const expected_result_mutation1: {
    data: {
        createDraft: {
            id: string;
            title: string;
            owner: string;
            editors: string[];
        };
    };
};
export declare const mutation2 = "\n#2\nmutation CreateDraft {\n  createDraft(\n    input: {\n      title: \"A new draft\",\n      editors: []\n    }\n  ) {\n    id\n    title\n    owner\n    editors\n  }\n}\n";
export declare const expected_result_mutation2: {
    data: {
        createDraft: {
            id: string;
            title: string;
            owner: string;
            editors: any[];
        };
    };
};
export declare const mutation3 = "\n#3\nmutation CreateDraft {\n  createDraft(\n    input: {\n      title: \"A new draft\",\n      editors: [\"editor1@my-domain.com\", \"editor2@my-domain.com\"]\n    }\n  ) {\n    id\n    title\n    owner\n    editors\n  }\n}\n";
export declare const expected_result_mutation3: {
    data: {
        createDraft: {
            id: string;
            title: string;
            owner: string;
            editors: string[];
        };
    };
};
export declare const mutation4 = "\n#4\nmutation CreateDraft {\n  createDraft(\n    input: {\n      title: \"A new draft\",\n      editors: [],\n      owner: null\n    }\n  ) {\n    id\n    title\n    owner\n    editors\n  }\n}\n";
export declare const expected_result_mutation4: {
    graphQLErrors: {
        errorType: string;
    }[];
};
export declare const mutation5 = "\n#5\nmutation CreateDraft {\n  createDraft(\n    input: {\n      title: \"A new draft\",\n      editors: [\"user1\"],\n      owner: null\n    }\n  ) {\n    id\n    title\n    owner\n    editors\n  }\n}\n";
export declare const expected_result_mutation5: {
    data: {
        createDraft: {
            id: string;
            title: string;
            owner: any;
            editors: string[];
        };
    };
};
