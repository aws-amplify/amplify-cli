"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expected_result_query = exports.query = exports.input_mutation2 = exports.mutation2 = exports.input_mutation1 = exports.mutation1 = exports.schema = void 0;
//schema
exports.schema = "\ntype Order @model @key(fields: [\"customerEmail\", \"createdAt\"]) {\n  customerEmail: String!\n  createdAt: String!\n  orderId: ID!\n}\n\n#key/howTo2";
//mutations
exports.mutation1 = "\nmutation CreateOrder(\n    $input: CreateOrderInput!\n    $condition: ModelOrderConditionInput\n  ) {\n    createOrder(input: $input, condition: $condition) {\n      customerEmail\n      createdAt\n      orderId\n      updatedAt\n    }\n}";
exports.input_mutation1 = {
    input: {
        customerEmail: 'me@email.com',
        createdAt: '2018',
        orderId: '1',
    },
};
exports.mutation2 = "\nmutation CreateOrder(\n    $input: CreateOrderInput!\n    $condition: ModelOrderConditionInput\n  ) {\n    createOrder(input: $input, condition: $condition) {\n      customerEmail\n      createdAt\n      orderId\n      updatedAt\n    }\n}";
exports.input_mutation2 = {
    input: {
        customerEmail: 'me@email.com',
        createdAt: '2019-2-14',
        orderId: '2',
    },
};
//queries
exports.query = "\nquery ListOrdersForCustomerIn2019 {\n  listOrders(customerEmail: \"me@email.com\", createdAt: { beginsWith: \"2019\" }) {\n    items {\n      orderId\n      customerEmail\n      createdAt\n    }\n  }\n}\n";
exports.expected_result_query = {
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
//# sourceMappingURL=key-howTo2.js.map