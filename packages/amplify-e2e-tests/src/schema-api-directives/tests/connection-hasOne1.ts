//schema
export const schema = `
type Project @model {
  id: ID!
  name: String
  team: Team @connection
}

type Team @model {
  id: ID!
  name: String!
}

##connection/hasOne1`;
//mutations
export const mutation1 = `
 mutation {
    createTeam(input: {
      id: "1",
      name: "team1"
    }) {
      id
      name
      createdAt
      updatedAt
    }
  }`;

export const mutation2 = `
 mutation CreateProject {
    createProject(input: {
      id: "1",
      name: "project1",
      projectTeamId: "1"
    }) {
      id
      name
      team {
        id
        name
        createdAt
        updatedAt
      }
      createdAt
      updatedAt
    }
  }`;
export const expected_result_mutation2 = {
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
