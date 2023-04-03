"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expected_result_mutation2 = exports.mutation2 = exports.mutation1 = exports.schema = void 0;
//schema
exports.schema = "\ntype Project @model {\n  id: ID!\n  name: String\n  teamID: ID!\n  team: Team @connection(fields: [\"teamID\"])\n}\n\ntype Team @model {\n  id: ID!\n  name: String!\n}\n\n##connection/hasOne2";
//mutations
exports.mutation1 = "\n mutation {\n    createTeam(input: {\n      id: \"a-team-id\",\n      name: \"a-team\"\n    }) {\n      id\n      name\n      createdAt\n      updatedAt\n    }\n}";
exports.mutation2 = "\nmutation CreateProject {\n  createProject(input: { id: \"1\", name: \"New Project\", teamID: \"a-team-id\" }) {\n    id\n    name\n    team {\n      id\n      name\n    }\n  }\n}\n";
exports.expected_result_mutation2 = {
    data: {
        createProject: {
            id: '1',
            name: 'New Project',
            team: {
                id: 'a-team-id',
                name: 'a-team',
            },
        },
    },
};
//# sourceMappingURL=connection-hasOne2.js.map