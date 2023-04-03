export declare const schema = "\ntype Project @model {\n  id: ID!\n  name: String\n  teamID: ID!\n  team: Team @connection(fields: [\"teamID\"])\n}\n\ntype Team @model {\n  id: ID!\n  name: String!\n}\n\n##connection/hasOne2";
export declare const mutation1 = "\n mutation {\n    createTeam(input: {\n      id: \"a-team-id\",\n      name: \"a-team\"\n    }) {\n      id\n      name\n      createdAt\n      updatedAt\n    }\n}";
export declare const mutation2 = "\nmutation CreateProject {\n  createProject(input: { id: \"1\", name: \"New Project\", teamID: \"a-team-id\" }) {\n    id\n    name\n    team {\n      id\n      name\n    }\n  }\n}\n";
export declare const expected_result_mutation2: {
    data: {
        createProject: {
            id: string;
            name: string;
            team: {
                id: string;
                name: string;
            };
        };
    };
};
