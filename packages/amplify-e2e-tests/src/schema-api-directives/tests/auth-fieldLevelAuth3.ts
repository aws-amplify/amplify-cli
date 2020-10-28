//schema
export const schema = `
#error: there is no "username" field, which is required as the ownerfield
#change: change "email" to "username"
type Employee @model {
  id: ID!
  username: String

  # Owners & members of the "Admin" group may read employee salaries.
  # Only members of the "Admin" group may create an employee with a salary
  # or update a salary.
  salary: String
    @auth(rules: [
      { allow: owner, ownerField: "username", operations: [read] },
      { allow: groups, groups: ["Admin"], operations: [create, update, read] }
    ])
}

##fieldLevelAuth3`;
//mutations
export const mutation = `
mutation CreateEmployee(
    $input: CreateEmployeeInput!
    $condition: ModelEmployeeConditionInput
  ) {
    createEmployee(input: $input, condition: $condition) {
      id
      username
      salary
    }
}`;
export const input_mutation = {
  input: {
    id: '1',
    username: 'user1',
    salary: '10000',
  },
};
export const expected_result_mutation = {
  data: {
    createEmployee: {
      id: '1',
      username: 'user1',
      salary: null,
    },
  },
};

//queries
export const query = `
 query GetEmployee {
    getEmployee(id: "1") {
      id
      username
      salary
    }
}`;
export const expected_result_query = {
  data: {
    getEmployee: {
      id: '1',
      username: 'user1',
      salary: '10000',
    },
  },
};
