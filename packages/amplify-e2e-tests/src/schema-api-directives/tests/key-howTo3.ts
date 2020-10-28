//schema
export const schema = `
type Item
  @model
  @key(fields: ["orderId", "status", "createdAt"])
  @key(name: "ByStatus", fields: ["status", "createdAt"], queryField: "itemsByStatus") {
  orderId: ID!
  status: Status!
  createdAt: AWSDateTime!
  name: String!
}
enum Status {
  DELIVERED
  IN_TRANSIT
  PENDING
  UNKNOWN
}

##key/howTo3`;
//mutations
export const mutation1 = `
 mutation CreateItem{
    createItem(input: {
        orderId: "order1",
        status: DELIVERED,
        createdAt: "2019-01-01T01:05:49.129Z",
        name: "item1"
  }) {
      orderId
      status
      createdAt
      name
      updatedAt
    }
  }`;

export const mutation2 = `
 mutation CreateItem{
    createItem(input: {
        orderId: "order1",
        status: IN_TRANSIT,
        createdAt: "2019-01-02T01:05:49.129Z",
        name: "item2"
  }) {
      orderId
      status
      createdAt
      name
      updatedAt
    }
  }`;

export const mutation3 = `
 mutation CreateItem{
    createItem(input: {
        orderId: "order1",
        status: PENDING,
        createdAt: "2019-01-03T01:05:49.129Z",
        name: "item3"
  }) {
      orderId
      status
      createdAt
      name
      updatedAt
    }
  }`;

export const mutation4 = `
 mutation CreateItem{
    createItem(input: {
    	orderId: "order1",
        status: UNKNOWN,
        createdAt: "2019-01-04T01:05:49.129Z",
        name: "item4"
  }) {
      orderId
      status
      createdAt
      name
      updatedAt
    }
}`;

//queries
export const query1 = `
query ListInTransitItemsForOrder {
  listItems(orderId: "order1", statusCreatedAt: { beginsWith: { status: IN_TRANSIT, createdAt: "2019" } }) {
    items {
      orderId
      status
      createdAt
      name
    }
  }
}
`;
export const expected_result_query1 = {
  data: {
    listItems: {
      items: [
        {
          orderId: 'order1',
          status: 'IN_TRANSIT',
          createdAt: '2019-01-02T01:05:49.129Z',
          name: 'item2',
        },
      ],
    },
  },
};

export const query2 = `
query ItemsByStatus {
  itemsByStatus(status: PENDING, createdAt: { beginsWith: "2019" }) {
    items {
      orderId
      status
      createdAt
      name
    }
    nextToken
  }
}
`;
export const expected_result_query2 = {
  data: {
    itemsByStatus: {
      items: [
        {
          orderId: 'order1',
          status: 'PENDING',
          createdAt: '2019-01-03T01:05:49.129Z',
          name: 'item3',
        },
      ],
      nextToken: null,
    },
  },
};
