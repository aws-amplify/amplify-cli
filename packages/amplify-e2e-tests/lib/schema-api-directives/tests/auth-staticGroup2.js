"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expected_result_mutation2 = exports.input_mutation2 = exports.mutation2 = exports.expected_result_mutation1 = exports.input_mutation1 = exports.mutation1 = exports.schema = void 0;
//schema
exports.schema = "\ntype Draft @model\n  @auth(rules: [\n\n    # Defaults to use the \"owner\" field.\n    { allow: owner },\n\n    # Authorize the update mutation and both queries. Use 'queries: null' to disable auth for queries.\n    { allow: owner, ownerField: \"editors\", operations: [update] },\n\n    # Admin users can access any operation.\n    { allow: groups, groups: [\"Admin\"] }\n  ]) {\n  id: ID!\n  title: String!\n  content: String\n  owner: String\n  editors: [String]!\n}\n\n#staticGroup2";
//mutations
exports.mutation1 = "\nmutation CreateDraft(\n    $input: CreateDraftInput!\n    $condition: ModelDraftConditionInput\n  ) {\n    createDraft(input: $input, condition: $condition) {\n      id\n      title\n      content\n      owner\n      editors\n      createdAt\n      updatedAt\n    }\n}";
exports.input_mutation1 = {
    input: {
        id: '1',
        title: 'title1',
        content: 'content1',
        owner: 'user1',
        editors: ['user1'],
    },
};
exports.expected_result_mutation1 = {
    data: {
        createDraft: {
            id: '1',
            title: 'title1',
            content: 'content1',
            owner: 'user1',
            editors: ['user1'],
            createdAt: '<check-defined>',
            updatedAt: '<check-defined>',
        },
    },
};
exports.mutation2 = "\n mutation UpdateDraft(\n    $input: UpdateDraftInput!\n    $condition: ModelDraftConditionInput\n  ) {\n    updateDraft(input: $input, condition: $condition) {\n      id\n      title\n      content\n      owner\n      editors\n      createdAt\n      updatedAt\n    }\n  }";
exports.input_mutation2 = {
    input: {
        id: '1',
        title: 'title1-updated',
        content: 'content1-updated',
        owner: 'user1',
        editors: ['user1'],
    },
};
exports.expected_result_mutation2 = {
    data: {
        updateDraft: {
            id: '1',
            title: 'title1-updated',
            content: 'content1-updated',
            owner: 'user1',
            editors: ['user1'],
            createdAt: '<check-defined>',
            updatedAt: '<check-defined>',
        },
    },
};
//# sourceMappingURL=auth-staticGroup2.js.map