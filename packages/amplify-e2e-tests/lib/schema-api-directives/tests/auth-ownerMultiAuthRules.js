"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expected_result_mutation5 = exports.mutation5 = exports.expected_result_mutation4 = exports.mutation4 = exports.expected_result_mutation3 = exports.mutation3 = exports.expected_result_mutation2 = exports.mutation2 = exports.expected_result_mutation1 = exports.mutation1 = exports.schema = void 0;
//schema
exports.schema = "\n#error: need to add \"create\" in the editors' operations in order for the mutation #5 to succeed\ntype Draft\n  @model\n  @auth(\n    rules: [\n      # Defaults to use the \"owner\" field.\n      { allow: owner }\n      # Authorize the update mutation and both queries. Use \"queries: null\" to disable auth for queries.\n      { allow: owner, ownerField: \"editors\", operations: [create, update, read] }\n    ]\n  ) {\n  id: ID!\n  title: String!\n  content: String\n  owner: String\n  editors: [String]\n}\n\n##auth/multiAuthRules\n";
//mutations
exports.mutation1 = "\n#1\nmutation CreateDraft {\n  createDraft(input: { title: \"A new draft\" }) {\n    id\n    title\n    owner\n    editors\n  }\n}\n";
//#change: for the id field, changed "..." to "<check-defined>"
//so the test bench will check it is defined instead of checking for a particular id
//the same change is applied to the following mutation results
//#change: change the owner from "someone@my-domain.com" to "user1" as it is the user setup by the test bench
//the same change is applied to the following mutaiton results
exports.expected_result_mutation1 = {
    data: {
        createDraft: {
            id: '<check-defined>',
            title: 'A new draft',
            owner: 'user1',
            editors: ['user1'],
        },
    },
};
exports.mutation2 = "\n#2\nmutation CreateDraft {\n  createDraft(\n    input: {\n      title: \"A new draft\",\n      editors: []\n    }\n  ) {\n    id\n    title\n    owner\n    editors\n  }\n}\n";
exports.expected_result_mutation2 = {
    data: {
        createDraft: {
            id: '<check-defined>',
            title: 'A new draft',
            owner: 'user1',
            editors: [],
        },
    },
};
exports.mutation3 = "\n#3\nmutation CreateDraft {\n  createDraft(\n    input: {\n      title: \"A new draft\",\n      editors: [\"editor1@my-domain.com\", \"editor2@my-domain.com\"]\n    }\n  ) {\n    id\n    title\n    owner\n    editors\n  }\n}\n";
exports.expected_result_mutation3 = {
    data: {
        createDraft: {
            id: '<check-defined>',
            title: 'A new draft',
            owner: 'user1',
            editors: ['editor1@my-domain.com', 'editor2@my-domain.com'],
        },
    },
};
exports.mutation4 = "\n#4\nmutation CreateDraft {\n  createDraft(\n    input: {\n      title: \"A new draft\",\n      editors: [],\n      owner: null\n    }\n  ) {\n    id\n    title\n    owner\n    editors\n  }\n}\n";
exports.expected_result_mutation4 = {
    graphQLErrors: [
        {
            errorType: 'Unauthorized',
        },
    ],
};
exports.mutation5 = "\n#5\nmutation CreateDraft {\n  createDraft(\n    input: {\n      title: \"A new draft\",\n      editors: [\"user1\"],\n      owner: null\n    }\n  ) {\n    id\n    title\n    owner\n    editors\n  }\n}\n";
exports.expected_result_mutation5 = {
    data: {
        createDraft: {
            id: '<check-defined>',
            title: 'A new draft',
            owner: null,
            editors: ['user1'],
        },
    },
};
//# sourceMappingURL=auth-ownerMultiAuthRules.js.map