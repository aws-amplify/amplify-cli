"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expected_result_query2 = exports.query2 = exports.expected_result_query1 = exports.query1 = exports.mutation4 = exports.mutation3 = exports.mutation2 = exports.mutation1 = exports.schema = void 0;
//schema
exports.schema = "\ntype Item\n  @model\n  @key(fields: [\"orderId\", \"status\", \"createdAt\"])\n  @key(name: \"ByStatus\", fields: [\"status\", \"createdAt\"], queryField: \"itemsByStatus\") {\n  orderId: ID!\n  status: Status!\n  createdAt: AWSDateTime!\n  name: String!\n}\nenum Status {\n  DELIVERED\n  IN_TRANSIT\n  PENDING\n  UNKNOWN\n}\n\n##key/howTo3";
//mutations
exports.mutation1 = "\n mutation CreateItem{\n    createItem(input: {\n        orderId: \"order1\",\n        status: DELIVERED,\n        createdAt: \"2019-01-01T01:05:49.129Z\",\n        name: \"item1\"\n  }) {\n      orderId\n      status\n      createdAt\n      name\n      updatedAt\n    }\n  }";
exports.mutation2 = "\n mutation CreateItem{\n    createItem(input: {\n        orderId: \"order1\",\n        status: IN_TRANSIT,\n        createdAt: \"2019-01-02T01:05:49.129Z\",\n        name: \"item2\"\n  }) {\n      orderId\n      status\n      createdAt\n      name\n      updatedAt\n    }\n  }";
exports.mutation3 = "\n mutation CreateItem{\n    createItem(input: {\n        orderId: \"order1\",\n        status: PENDING,\n        createdAt: \"2019-01-03T01:05:49.129Z\",\n        name: \"item3\"\n  }) {\n      orderId\n      status\n      createdAt\n      name\n      updatedAt\n    }\n  }";
exports.mutation4 = "\n mutation CreateItem{\n    createItem(input: {\n    \torderId: \"order1\",\n        status: UNKNOWN,\n        createdAt: \"2019-01-04T01:05:49.129Z\",\n        name: \"item4\"\n  }) {\n      orderId\n      status\n      createdAt\n      name\n      updatedAt\n    }\n}";
//queries
exports.query1 = "\nquery ListInTransitItemsForOrder {\n  listItems(orderId: \"order1\", statusCreatedAt: { beginsWith: { status: IN_TRANSIT, createdAt: \"2019\" } }) {\n    items {\n      orderId\n      status\n      createdAt\n      name\n    }\n  }\n}\n";
exports.expected_result_query1 = {
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
exports.query2 = "\nquery ItemsByStatus {\n  itemsByStatus(status: PENDING, createdAt: { beginsWith: \"2019\" }) {\n    items {\n      orderId\n      status\n      createdAt\n      name\n    }\n    nextToken\n  }\n}\n";
exports.expected_result_query2 = {
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
//# sourceMappingURL=key-howTo3.js.map