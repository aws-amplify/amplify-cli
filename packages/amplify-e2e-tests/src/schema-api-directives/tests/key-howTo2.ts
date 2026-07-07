//schema
export const schema = `
type Order @model @key(fields: ["customerEmail", "createdAt"]) {
  customerEmail: String!
  createdAt: String!
  orderId: ID!
}

#key/howTo2`;
//mutations
export const mutation1 = `
mutation CreateOrder(
    $input: CreateOrderInput!
    $condition: ModelOrderConditionInput
  ) {
    createOrder(input: $input, condition: $condition) {
      customerEmail
      createdAt
      orderId
      updatedAt
    }
}`;
export const input_mutation1 = {
  input: {
    customerEmail: 'me@email.com',
    createdAt: '2018',
    orderId: '1',
  },
};

export const mutation2 = `
mutation CreateOrder(
    $input: CreateOrderInput!
    $condition: ModelOrderConditionInput
  ) {
    createOrder(input: $input, condition: $condition) {
      customerEmail
      createdAt
      orderId
      updatedAt
    }
}`;
export const input_mutation2 = {
  input: {
    customerEmail: 'me@email.com',
    createdAt: '2019-2-14',
    orderId: '2',
  },
};

//queries
export const query = `
query ListOrdersForCustomerIn2019 {
  listOrders(customerEmail: "me@email.com", createdAt: { beginsWith: "2019" }) {
    items {
      orderId
      customerEmail
      createdAt
    }
  }
}
`;
export const expected_result_query = {
  data: {
    listOrders: {
      items: [
        {
          orderId: '2',
          customerEmail: 'me@email.com',
          createdAt: '2019-2-14',
        },
      ],
    },
  },
};
