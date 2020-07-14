//schema
export const schema = `
type Project @model {
  id: ID!
  name: String
  teamID: ID!
  team: Team @connection(fields: ["teamID"])
}

type Team @model {
  id: ID!
  name: String!
}

##connection/hasOne2`;
//mutations
export const mutation1 = `
 mutation {
    createTeam(input: {
      id: "a-team-id",
      name: "a-team"
    }) {
      id
      name
      createdAt
      updatedAt
    }
}`;

export const mutation2 = `
mutation CreateProject {
  createProject(input: { id: "1", name: "New Project", teamID: "a-team-id" }) {
    id
    name
    team {
      id
      name
    }
  }
}
`;
export const expected_result_mutation2 = {
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
