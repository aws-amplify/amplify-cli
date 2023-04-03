export declare const schema = "\ntype Project @model {\n  id: ID!\n  name: String\n  team: Team @connection\n}\n\ntype Team @model {\n  id: ID!\n  name: String!\n}\n\n##connection/hasOne1";
export declare const mutation1 = "\n mutation {\n    createTeam(input: {\n      id: \"1\",\n      name: \"team1\"\n    }) {\n      id\n      name\n      createdAt\n      updatedAt\n    }\n  }";
export declare const mutation2 = "\n mutation CreateProject {\n    createProject(input: {\n      id: \"1\",\n      name: \"project1\",\n      projectTeamId: \"1\"\n    }) {\n      id\n      name\n      team {\n        id\n        name\n        createdAt\n        updatedAt\n      }\n      createdAt\n      updatedAt\n    }\n  }";
export declare const expected_result_mutation2: {
    data: {
        createProject: {
            id: string;
            name: string;
            team: {
                id: string;
                name: string;
                createdAt: string;
                updatedAt: string;
            };
            createdAt: string;
            updatedAt: string;
        };
    };
};
