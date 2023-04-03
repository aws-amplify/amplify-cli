"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expected_result_mutation2 = exports.mutation2 = exports.mutation1 = exports.schema = void 0;
//schema
exports.schema = "\ntype Project @model {\n  id: ID!\n  name: String\n  team: Team @connection\n}\n\ntype Team @model {\n  id: ID!\n  name: String!\n}\n\n##connection/hasOne1";
//mutations
exports.mutation1 = "\n mutation {\n    createTeam(input: {\n      id: \"1\",\n      name: \"team1\"\n    }) {\n      id\n      name\n      createdAt\n      updatedAt\n    }\n  }";
exports.mutation2 = "\n mutation CreateProject {\n    createProject(input: {\n      id: \"1\",\n      name: \"project1\",\n      projectTeamId: \"1\"\n    }) {\n      id\n      name\n      team {\n        id\n        name\n        createdAt\n        updatedAt\n      }\n      createdAt\n      updatedAt\n    }\n  }";
exports.expected_result_mutation2 = {
    data: {
        createProject: {
            id: '1',
            name: 'project1',
            team: {
                id: '1',
                name: 'team1',
                createdAt: '<check-defined>',
                updatedAt: '<check-defined>',
            },
            createdAt: '<check-defined>',
            updatedAt: '<check-defined>',
        },
    },
};
//# sourceMappingURL=connection-hasOne1.js.map