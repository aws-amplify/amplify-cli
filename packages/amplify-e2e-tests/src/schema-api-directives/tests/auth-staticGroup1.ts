//schema
export const schema = `
type Salary @model @auth(rules: [{allow: groups, groups: ["Admin"]}]) {
  id: ID!
  wage: Int
  currency: String
}

##staticGroup1`;
//mutations
export const mutation1 = `
 mutation CreateSalary(
    $input: CreateSalaryInput!
    $condition: ModelSalaryConditionInput
  ) {
    createSalary(input: $input, condition: $condition) {
      id
      wage
      currency
      createdAt
      updatedAt
    }
}`;
export const input_mutation1 = {
  input: {
    id: '1',
    wage: 10000,
    currency: 'usd',
  },
};
export const expected_result_mutation1 = {
  data: {
    createSalary: {
      id: '1',
      wage: 10000,
      currency: 'usd',
      createdAt: '<check-defined>',
      updatedAt: '<check-defined>',
    },
  },
};

export const mutation2 = `
mutation UpdateSalary(
    $input: UpdateSalaryInput!
    $condition: ModelSalaryConditionInput
  ) {
    updateSalary(input: $input, condition: $condition) {
      id
      wage
      currency
      createdAt
      updatedAt
    }
}`;
export const input_mutation2 = {
  input: {
    id: '1',
    wage: 12000,
    currency: 'usd',
  },
};
export const expected_result_mutation2 = {
  data: {
    updateSalary: {
      id: '1',
      wage: 12000,
      currency: 'usd',
      createdAt: '<check-defined>',
      updatedAt: '<check-defined>',
    },
  },
};
