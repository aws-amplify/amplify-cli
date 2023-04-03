export declare const schema = "\ntype Item\n  @model\n  @key(fields: [\"orderId\", \"status\", \"createdAt\"])\n  @key(name: \"ByStatus\", fields: [\"status\", \"createdAt\"], queryField: \"itemsByStatus\") {\n  orderId: ID!\n  status: Status!\n  createdAt: AWSDateTime!\n  name: String!\n}\nenum Status {\n  DELIVERED\n  IN_TRANSIT\n  PENDING\n  UNKNOWN\n}\n\n##key/howTo3";
export declare const mutation1 = "\n mutation CreateItem{\n    createItem(input: {\n        orderId: \"order1\",\n        status: DELIVERED,\n        createdAt: \"2019-01-01T01:05:49.129Z\",\n        name: \"item1\"\n  }) {\n      orderId\n      status\n      createdAt\n      name\n      updatedAt\n    }\n  }";
export declare const mutation2 = "\n mutation CreateItem{\n    createItem(input: {\n        orderId: \"order1\",\n        status: IN_TRANSIT,\n        createdAt: \"2019-01-02T01:05:49.129Z\",\n        name: \"item2\"\n  }) {\n      orderId\n      status\n      createdAt\n      name\n      updatedAt\n    }\n  }";
export declare const mutation3 = "\n mutation CreateItem{\n    createItem(input: {\n        orderId: \"order1\",\n        status: PENDING,\n        createdAt: \"2019-01-03T01:05:49.129Z\",\n        name: \"item3\"\n  }) {\n      orderId\n      status\n      createdAt\n      name\n      updatedAt\n    }\n  }";
export declare const mutation4 = "\n mutation CreateItem{\n    createItem(input: {\n    \torderId: \"order1\",\n        status: UNKNOWN,\n        createdAt: \"2019-01-04T01:05:49.129Z\",\n        name: \"item4\"\n  }) {\n      orderId\n      status\n      createdAt\n      name\n      updatedAt\n    }\n}";
export declare const query1 = "\nquery ListInTransitItemsForOrder {\n  listItems(orderId: \"order1\", statusCreatedAt: { beginsWith: { status: IN_TRANSIT, createdAt: \"2019\" } }) {\n    items {\n      orderId\n      status\n      createdAt\n      name\n    }\n  }\n}\n";
export declare const expected_result_query1: {
    data: {
        listItems: {
            items: {
                orderId: string;
                status: string;
                createdAt: string;
                name: string;
            }[];
        };
    };
};
export declare const query2 = "\nquery ItemsByStatus {\n  itemsByStatus(status: PENDING, createdAt: { beginsWith: \"2019\" }) {\n    items {\n      orderId\n      status\n      createdAt\n      name\n    }\n    nextToken\n  }\n}\n";
export declare const expected_result_query2: {
    data: {
        itemsByStatus: {
            items: {
                orderId: string;
                status: string;
                createdAt: string;
                name: string;
            }[];
            nextToken: any;
        };
    };
};
