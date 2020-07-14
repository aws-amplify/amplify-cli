//handle subscription from another user
import { runAutTest } from '../common';

export async function runTest(projectDir: string, testModule: any) {
  //test owner
  await runAutTest(projectDir, testModule);
  //todo: test other user's ability to subscribe
}

//schema
export const schema = `
type Employee @model
  @auth(rules: [
	  { allow: owner },
	  { allow: groups, groups: ["Admin"] }
  ]) {
	id: ID!
	name: String!
	address: String!
	ssn: String @auth(rules: [{allow: owner}])
}

##fieldLevelAuth8`;

//mutations
export const mutation = `
#error: title and content are not in the Employee type
#change: changed them to name and address
#change: add id in the input so test can query employee by the id
mutation {
  createEmployee(input: {
    id: "1"
    name: "Nadia"
    address: "123 First Ave"
    ssn: "392-95-2716"
  }){
    id
    name
    address
    ssn
  }
}`;
export const expected_result_mutation = {
  data: {
    createEmployee: {
      id: '1',
      name: 'Nadia',
      address: '123 First Ave',
      ssn: null,
    },
  },
};

//queries
export const query = `
 query GetEmployee {
    getEmployee(id: "1") {
      id
      name
      address
      ssn
      owner
    }
}`;
export const expected_result_query = {
  data: {
    getEmployee: {
      id: '1',
      name: 'Nadia',
      address: '123 First Ave',
      ssn: '392-95-2716',
      owner: 'user1',
    },
  },
};
