"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expected_result_mutation2 = exports.mutation2 = exports.expected_result_mutation1 = exports.mutation1 = exports.schema = void 0;
//schema
exports.schema = "\n#error: missing the closing ) in the model level @auth annotation\n#error: missing the owner field, \n#change: added the missign owner field\n\ntype Todo\n  @model @auth(rules: [{allow: groups, groups: [\"Admin\"], operations:[update] }])\n{\n  id: ID! \n  owner: String\n  updatedAt: AWSDateTime! \n  content: String! @auth(rules: [{ allow: owner, operations: [update] }])\n}\n\n##fieldLevelAuth7";
//mutations
exports.mutation1 = "\nmutation CreateTodo {\n    createTodo(input: {\n      id: \"1\",\n      owner: \"user1\",\n      updatedAt: \"2020-01-01T01:05:49.129Z\"\n      content: \"todo1 content\"\n    }) {\n      id\n      owner\n      updatedAt\n      content\n    }\n}";
exports.expected_result_mutation1 = {
    data: {
        createTodo: {
            id: '1',
            owner: 'user1',
            updatedAt: '2020-01-01T01:05:49.129Z',
            content: 'todo1 content',
        },
    },
};
exports.mutation2 = "\nmutation UpdateTodo {\n    updateTodo(input: {\n      id: \"1\",\n      owner: \"user1\",\n      updatedAt: \"2020-05-20T01:05:49.129Z\"\n      content: \"todo1 content updated\"\n    }) {\n      id\n      owner\n      updatedAt\n      content\n    }\n}";
exports.expected_result_mutation2 = {
    data: {
        updateTodo: {
            id: '1',
            owner: 'user1',
            updatedAt: '2020-05-20T01:05:49.129Z',
            content: 'todo1 content updated',
        },
    },
};
//# sourceMappingURL=auth-fieldLevelAuth7.js.map