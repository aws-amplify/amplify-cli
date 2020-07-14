//schema
export const schema = `
type Customer @model @key(fields: ["email"]) {
  email: String!
  username: String
}

##key/howTo1`;
//mutations
export const mutation = `
mutation CreateCustomer(
    $input: CreateCustomerInput!
    $condition: ModelCustomerConditionInput
  ) {
    createCustomer(input: $input, condition: $condition) {
      email
      username
      createdAt
      updatedAt
    }
}`;
export const input_mutation = {
  input: {
    email: 'me@email.com',
    username: 'myusername',
  },
};
export const expected_result_mutation = {
  data: {
    createCustomer: {
      email: 'me@email.com',
      username: 'myusername',
      createdAt: '<check-defined>',
      updatedAt: '<check-defined>',
    },
  },
};

//queries
export const query = `
query GetCustomerById {
  getCustomer(email: "me@email.com") {
    email
    username
  }
}
`;
export const expected_result_query = {
  data: {
    getCustomer: {
      email: 'me@email.com',
      username: 'myusername',
    },
  },
};
