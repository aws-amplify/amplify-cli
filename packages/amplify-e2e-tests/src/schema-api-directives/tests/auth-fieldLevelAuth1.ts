//schema
export const schema = `
type User @model {
  id: ID!
  username: String
  ssn: String @auth(rules: [{ allow: owner, ownerField: "username" }])
}

##fieldLevelAuth1`;
//mutations
export const mutation = `
mutation CreateUser(
    $input: CreateUserInput!
    $condition: ModelUserConditionInput
  ) {
    createUser(input: $input, condition: $condition) {
      id
      username
      ssn
    }
}`;
export const input_mutation = {
  input: {
    id: '1',
    ssn: '888-88-8888',
  },
};
export const expected_result_mutation = {
  data: {
    createUser: {
      id: '1',
      username: 'user1',
      ssn: null,
    },
  },
};

//queries
export const query = `
 query GetUser {
    getUser(id: "1") {
      id
      username
      ssn
    }
}`;
export const expected_result_query = {
  data: {
    getUser: {
      id: '1',
      username: 'user1',
      ssn: '888-88-8888',
    },
  },
};
