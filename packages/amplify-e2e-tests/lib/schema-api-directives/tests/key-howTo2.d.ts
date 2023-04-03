export declare const schema = "\ntype Order @model @key(fields: [\"customerEmail\", \"createdAt\"]) {\n  customerEmail: String!\n  createdAt: String!\n  orderId: ID!\n}\n\n#key/howTo2";
export declare const mutation1 = "\nmutation CreateOrder(\n    $input: CreateOrderInput!\n    $condition: ModelOrderConditionInput\n  ) {\n    createOrder(input: $input, condition: $condition) {\n      customerEmail\n      createdAt\n      orderId\n      updatedAt\n    }\n}";
export declare const input_mutation1: {
    input: {
        customerEmail: string;
        createdAt: string;
        orderId: string;
    };
};
export declare const mutation2 = "\nmutation CreateOrder(\n    $input: CreateOrderInput!\n    $condition: ModelOrderConditionInput\n  ) {\n    createOrder(input: $input, condition: $condition) {\n      customerEmail\n      createdAt\n      orderId\n      updatedAt\n    }\n}";
export declare const input_mutation2: {
    input: {
        customerEmail: string;
        createdAt: string;
        orderId: string;
    };
};
export declare const query = "\nquery ListOrdersForCustomerIn2019 {\n  listOrders(customerEmail: \"me@email.com\", createdAt: { beginsWith: \"2019\" }) {\n    items {\n      orderId\n      customerEmail\n      createdAt\n    }\n  }\n}\n";
export declare const expected_result_query: {
    data: {
        listOrders: {
            items: {
                orderId: string;
                customerEmail: string;
                createdAt: string;
            }[];
        };
    };
};
