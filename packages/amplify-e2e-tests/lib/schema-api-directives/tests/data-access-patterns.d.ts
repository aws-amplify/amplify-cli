export declare const schema = "\ntype Order @model\n  @key(name: \"byCustomerByStatusByDate\", fields: [\"customerID\", \"status\", \"date\"])\n  @key(name: \"byCustomerByDate\", fields: [\"customerID\", \"date\"])\n  @key(name: \"byRepresentativebyDate\", fields: [\"accountRepresentativeID\", \"date\"])\n  @key(name: \"byProduct\", fields: [\"productID\", \"id\"])\n{\n  id: ID!\n  customerID: ID!\n  accountRepresentativeID: ID!\n  productID: ID!\n  status: String!\n  amount: Int!\n  date: String!\n}\n\ntype Customer @model\n  @key(name: \"byRepresentative\", fields: [\"accountRepresentativeID\", \"id\"]) {\n  id: ID!\n  name: String!\n  phoneNumber: String\n  accountRepresentativeID: ID!\n  ordersByDate: [Order] @connection(keyName: \"byCustomerByDate\", fields: [\"id\"])\n  ordersByStatusDate: [Order] @connection(keyName: \"byCustomerByStatusByDate\", fields: [\"id\"])\n}\n\ntype Employee @model\n  @key(name: \"newHire\", fields: [\"newHire\", \"id\"], queryField: \"employeesNewHire\")\n  @key(name: \"newHireByStartDate\", fields: [\"newHire\", \"startDate\"], queryField: \"employeesNewHireByStartDate\")\n  @key(name: \"byName\", fields: [\"name\", \"id\"], queryField: \"employeeByName\")\n  @key(name: \"byTitle\", fields: [\"jobTitle\", \"id\"], queryField: \"employeesByJobTitle\")\n  @key(name: \"byWarehouse\", fields: [\"warehouseID\", \"id\"]) {\n  id: ID!\n  name: String!\n  startDate: String!\n  phoneNumber: String!\n  warehouseID: ID!\n  jobTitle: String!\n  newHire: String! # We have to use String type, because Boolean types cannot be sort keys\n}\n\ntype Warehouse @model {\n  id: ID!\n  employees: [Employee] @connection(keyName: \"byWarehouse\", fields: [\"id\"])\n}\n\ntype AccountRepresentative @model\n  @key(name: \"bySalesPeriodByOrderTotal\", fields: [\"salesPeriod\", \"orderTotal\"], queryField: \"repsByPeriodAndTotal\") {\n  id: ID!\n  customers: [Customer] @connection(keyName: \"byRepresentative\", fields: [\"id\"])\n  orders: [Order] @connection(keyName: \"byRepresentativebyDate\", fields: [\"id\"])\n  orderTotal: Int\n  salesPeriod: String\n}\n\ntype Inventory @model\n  @key(name: \"byWarehouseID\", fields: [\"warehouseID\"], queryField: \"itemsByWarehouseID\")\n  @key(fields: [\"productID\", \"warehouseID\"]) {\n  productID: ID!\n  warehouseID: ID!\n  inventoryAmount: Int!\n}\n\ntype Product @model {\n  id: ID!\n  name: String!\n  orders: [Order] @connection(keyName: \"byProduct\", fields: [\"id\"])\n  inventories: [Inventory] @connection(fields: [\"id\"])\n}";
export declare const mutation1 = "\n# first\nmutation createWarehouse {\n  createWarehouse(input: {id: \"1\"}) {\n    id\n  }\n}";
export declare const mutation2 = "\n# second\nmutation createEmployee {\n  createEmployee(input: {\n    id: \"amanda\"\n    name: \"Amanda\",\n    startDate: \"2018-05-22\",\n    phoneNumber: \"6015555555\",\n    warehouseID: \"1\",\n    jobTitle: \"Manager\",\n    newHire: \"true\"}\n  ) {\n    id\n    jobTitle\n    name\n    newHire\n    phoneNumber\n    startDate\n    warehouseID\n  }\n}";
export declare const mutation3 = "\n# third\nmutation createAccountRepresentative {\n  createAccountRepresentative(input: {\n    id: \"dabit\"\n    orderTotal: 400000\n    salesPeriod: \"January 2019\"\n  }) {\n    id\n    orderTotal\n    salesPeriod\n  }\n}";
export declare const mutation4 = "\n# fourth\nmutation createCustomer {\n  createCustomer(input: {\n    id: \"jennifer_thomas\"\n    accountRepresentativeID: \"dabit\"\n    name: \"Jennifer Thomas\"\n    phoneNumber: \"+16015555555\"\n  }) {\n    id\n    name\n    accountRepresentativeID\n    phoneNumber\n  }\n}";
export declare const mutation5 = "\n# fifth\nmutation createProduct {\n  createProduct(input: {\n    id: \"yeezyboost\"\n    name: \"Yeezy Boost\"\n  }) {\n    id\n    name\n  }\n}";
export declare const mutation6 = "\n# sixth\nmutation createInventory {\n  createInventory(input: {\n    productID: \"yeezyboost\"\n    warehouseID: \"1\"\n    inventoryAmount: 300\n  }) {\n    productID\n    inventoryAmount\n    warehouseID\n  }\n}";
export declare const mutation7 = "\n# seventh\nmutation createOrder {\n  createOrder(input: {\n    amount: 300\n    date: \"2018-07-12\"\n    status: \"pending\"\n    accountRepresentativeID: \"dabit\"\n    customerID: \"jennifer_thomas\"\n    productID: \"yeezyboost\"\n  }) {\n    id\n    customerID\n    accountRepresentativeID\n    amount\n    date\n    customerID\n    productID\n  }\n}";
export declare const query1 = "\n##1. Look up employee details by employee ID:\n#This can simply be done by querying the employee model with an employee ID, no @key or @connection is needed to make this work.\n\nquery getEmployee($id: ID!) {\n  getEmployee(id: $id) {\n    id\n    name\n    phoneNumber\n    startDate\n    jobTitle\n  }\n}";
export declare const input_query1: {
    id: string;
};
export declare const expected_result_query1: {
    data: {
        getEmployee: {
            id: string;
            name: string;
            phoneNumber: string;
            startDate: string;
            jobTitle: string;
        };
    };
};
export declare const query2 = "\n## 2. Query employee details by employee name:\n#The '@key' 'byName' on the 'Employee' type makes this access-pattern feasible because under the covers an index is created and a query is used to match against the name field. We can use this query:\n\nquery employeeByName($name: String!) {\n  employeeByName(name: $name) {\n    items {\n      id\n      name\n      phoneNumber\n      startDate\n      jobTitle\n    }\n  }\n}";
export declare const input_query2: {
    name: string;
};
export declare const expected_result_query2: {
    data: {
        employeeByName: {
            items: {
                id: string;
                name: string;
                phoneNumber: string;
                startDate: string;
                jobTitle: string;
            }[];
        };
    };
};
export declare const query3 = "\n## 3. Find an Employee\u2019s phone number:\n#Either one of the previous queries would work to find an employee\u2019s phone number as long as one has their ID or name.\n\nquery employeeByName($name: String!) {\n  employeeByName(name: $name) {\n    items {\n      phoneNumber\n    }\n  }\n}";
export declare const input_query3: {
    name: string;
};
export declare const expected_result_query3: {
    data: {
        employeeByName: {
            items: {
                phoneNumber: string;
            }[];
        };
    };
};
export declare const query4 = "\n## 4. Find a customer\u2019s phone number:\n#A similar query to those given above but on the Customer model would give you a customer\u2019s phone number.\n\nquery getCustomer($customerID: ID!) {\n  getCustomer(id: $customerID) {\n    phoneNumber\n  }\n}";
export declare const input_query4: {
    customerID: string;
};
export declare const expected_result_query4: {
    data: {
        getCustomer: {
            phoneNumber: string;
        };
    };
};
export declare const query5 = "\n## 5. Get orders for a given customer within a given date range:\n#There is a one-to-many relation that lets all the orders of a customer be queried.\n\n#This relationship is created by having the '@key' name 'byCustomerByDate' on the Order model that is queried by the connection on the orders field of the Customer model.\n\n#A sort key with the date is used. What this means is that the GraphQL resolver can use predicates like 'Between' to efficiently search the date range rather than scanning all records in the database and then filtering them out.\n\n#The query one would need to get the orders to a customer within a date range would be:\n\nquery getCustomerWithOrdersByDate($customerID: ID!) {\n  getCustomer(id: $customerID) {\n    ordersByDate(date: {\n      between: [ \"2018-01-22\", \"2020-10-11\" ]\n    }) {\n      items {\n        id\n        amount\n        productID\n      }\n    }\n  }\n}";
export declare const input_query5: {
    customerID: string;
};
export declare const expected_result_query5: {
    data: {
        getCustomer: {
            ordersByDate: {
                items: {
                    amount: number;
                    productID: string;
                }[];
            };
        };
    };
};
export declare const query6 = "\n\n## 6. Show all open orders within a given date range across all customers:\n#The '@key' 'byCustomerByStatusByDate' enables you to run a query that would work for this access pattern.\n\n#In this example, a composite sort key (combination of two or more keys) with the 'status' and 'date' is used. What this means is that the unique identifier of a record in the database is created by concatenating these two fields (status and date) together, and then the GraphQL resolver can use predicates like 'Between' or 'Contains' to efficiently search the unique identifier for matches rather than scanning all records in the database and then filtering them out.\n\nquery getCustomerWithOrdersByStatusDate($customerID: ID!) {\n  getCustomer(id: $customerID) {\n    ordersByStatusDate (statusDate: {\n      between: [\n        { status: \"pending\" date:  \"2018-01-22\" },\n        { status: \"pending\", date: \"2020-10-11\"}\n      ]}) {\n        items {\n            id\n            amount\n            date\n        }\n    }\n  }\n}";
export declare const input_query6: {
    customerID: string;
};
export declare const expected_result_query6: {
    data: {
        getCustomer: {
            ordersByStatusDate: {
                items: {
                    amount: number;
                    date: string;
                }[];
            };
        };
    };
};
export declare const query7 = "\n## 7. See all employees hired recently:\n#Having '@key(name: \"newHire\", fields: [\"newHire\", \"id\"])' on the 'Employee' model allows one to query by whether an employee has been hired recently.\n\nquery employeesNewHire {\n  employeesNewHire(newHire: \"true\") {\n    items {\n      id\n      name\n      phoneNumber\n      startDate\n      jobTitle\n    }\n  }\n}";
export declare const expected_result_query7: {
    data: {
        employeesNewHire: {
            items: {
                id: string;
                name: string;
                phoneNumber: string;
                startDate: string;
                jobTitle: string;
            }[];
        };
    };
};
export declare const query8 = "\n## 8. Find all employees working in a given warehouse:\n#This needs a one to many relationship from warehouses to employees. As can be seen from the @connection in the 'Warehouse' model, this connection uses the 'byWarehouse' key on the 'Employee' model. The relevant query would look like this:\n\nquery getWarehouse($warehouseID: ID!) {\n  getWarehouse(id: $warehouseID) {\n    id\n    employees{\n      items {\n        id\n        name\n        startDate\n        phoneNumber\n        jobTitle\n      }\n    }\n  }\n}";
export declare const input_query8: {
    warehouseID: string;
};
export declare const expected_result_query8: {
    data: {
        getWarehouse: {
            id: string;
            employees: {
                items: {
                    id: string;
                    name: string;
                    startDate: string;
                    phoneNumber: string;
                    jobTitle: string;
                }[];
            };
        };
    };
};
export declare const query9 = "\n## 9. Get all items on order for a given product:\n#This access-pattern would use a one-to-many relation from products to orders. With this query we can get all orders of a given product:\n\nquery getProductOrders($productID: ID!) {\n  getProduct(id: $productID) {\n    id\n    orders {\n      items {\n        id\n        status\n        amount\n        date\n      }\n    }\n  }\n}";
export declare const input_query9: {
    productID: string;
};
export declare const expected_result_query9: {
    data: {
        getProduct: {
            id: string;
            orders: {
                items: {
                    status: string;
                    amount: number;
                    date: string;
                }[];
            };
        };
    };
};
export declare const query10 = "\n## 10. Get current inventories for a product at all warehouses:\n\n#The query needed to get the inventories of a product in all warehouses would be:\n\nquery getProductInventoryInfo($productID: ID!) {\n  getProduct(id: $productID) {\n    id\n    inventories {\n      items {\n        warehouseID\n        inventoryAmount\n      }\n    }\n  }\n}";
export declare const input_query10: {
    productID: string;
};
export declare const expected_result_query10: {
    data: {
        getProduct: {
            id: string;
            inventories: {
                items: {
                    warehouseID: string;
                    inventoryAmount: number;
                }[];
            };
        };
    };
};
export declare const query11 = "\n## 11. Get customers by account representative:\n#This uses a one-to-many connection between account representatives and customers:\n\n#The query needed would look like this:\n\nquery getCustomersForAccountRepresentative($representativeId: ID!) {\n  getAccountRepresentative(id: $representativeId) {\n    customers {\n      items {\n        id\n        name\n        phoneNumber\n      }\n    }\n  }\n}";
export declare const input_query11: {
    representativeId: string;
};
export declare const expected_result_query11: {
    data: {
        getAccountRepresentative: {
            customers: {
                items: {
                    id: string;
                    name: string;
                    phoneNumber: string;
                }[];
            };
        };
    };
};
export declare const query12 = "\n## 12. Get orders by account representative and date:\n\n#As can be seen in the AccountRepresentative model this connection uses the 'byRepresentativebyDate' field on the 'Order' model to create the connection needed. The query needed would look like this:\n\nquery getOrdersForAccountRepresentative($representativeId: ID!) {\n  getAccountRepresentative(id: $representativeId) {\n    id\n    orders(date: {\n      between: [\n         \"2010-01-22\", \"2020-10-11\"\n      ]\n    }) {\n        items {\n          id\n          status\n          amount\n          date\n        }\n    }\n  }\n}";
export declare const input_query12: {
    representativeId: string;
};
export declare const expected_result_query12: {
    data: {
        getAccountRepresentative: {
            id: string;
            orders: {
                items: {
                    status: string;
                    amount: number;
                    date: string;
                }[];
            };
        };
    };
};
export declare const query13 = "\n## 13. Get all items on order for a given product:\n#This is the same as number 9.\n\nquery getProductOrders($productID: ID!) {\n  getProduct(id: $productID) {\n    id\n    orders {\n      items {\n        id\n        status\n        amount\n        date\n      }\n    }\n  }\n}\n";
export declare const input_query13: {
    productID: string;
};
export declare const expected_result_query13: {
    data: {
        getProduct: {
            id: string;
            orders: {
                items: {
                    status: string;
                    amount: number;
                    date: string;
                }[];
            };
        };
    };
};
export declare const query14 = "\n## 14. Get all employees with a given job title:\n#Using the 'byTitle' '@key' makes this access pattern quite easy.\n\nquery employeesByJobTitle {\n  employeesByJobTitle(jobTitle: \"Manager\") {\n    items {\n      id\n      name\n      phoneNumber\n      jobTitle\n    }\n  }\n}";
export declare const expected_result_query14: {
    data: {
        employeesByJobTitle: {
            items: {
                id: string;
                name: string;
                phoneNumber: string;
                jobTitle: string;
            }[];
        };
    };
};
export declare const query15 = "\n## 15. Get inventory by product by warehouse:\n#Here having the inventories be held in a separate model is particularly useful since this model can have its own partition key and sort key such that the inventories themselves can be queried as is needed for this access-pattern.\n\n#A query on this model would look like this:\n\nquery inventoryByProductAndWarehouse($productID: ID!, $warehouseID: ID!) {\n  getInventory(productID: $productID, warehouseID: $warehouseID) {\n    productID\n    warehouseID\n    inventoryAmount\n  }\n}";
export declare const input_query15: {
    productID: string;
    warehouseID: string;
};
export declare const expected_result_query15: {
    data: {
        getInventory: {
            productID: string;
            warehouseID: string;
            inventoryAmount: number;
        };
    };
};
export declare const query16 = "\n## 16. Get total product inventory:\n#How this would be done depends on the use case. If one just wants a list of all inventories in all warehouses, one could just run a list inventories on the Inventory model:\n\nquery listInventorys {\n  listInventorys {\n    items {\n      productID\n      warehouseID\n      inventoryAmount\n    }\n  }\n}";
export declare const expected_result_query16: {
    data: {
        listInventorys: {
            items: {
                productID: string;
                warehouseID: string;
                inventoryAmount: number;
            }[];
        };
    };
};
export declare const query17 = "\n## 17. Get sales representatives ranked by order total and sales period:\n#It's uncertain exactly what this means. My take is that the sales period is either a date range or maybe even a month or week. Therefore we can set the sales period as a string and query using the combination of 'salesPeriod' and 'orderTotal'. We can also set the 'sortDirection' in order to get the return values from largest to smallest:\n\nquery repsByPeriodAndTotal {\n  repsByPeriodAndTotal(\n    sortDirection: DESC,\n    salesPeriod: \"January 2019\",\n    orderTotal: {\n      ge: 1000\n    }) {\n    items {\n      id\n      orderTotal\n    }\n  }\n}";
export declare const expected_result_query17: {
    data: {
        repsByPeriodAndTotal: {
            items: {
                id: string;
                orderTotal: number;
            }[];
        };
    };
};
export declare const query71 = "\n##7. alternative: We can also query and have the results returned by start date by using the 'employeesNewHireByStartDate' query:\n\nquery employeesNewHireByDate {\n  employeesNewHireByStartDate(newHire: \"true\") {\n    items {\n      id\n      name\n      phoneNumber\n      startDate\n      jobTitle\n    }\n  }\n}\n";
export declare const expected_result_query71: {
    data: {
        employeesNewHireByStartDate: {
            items: {
                id: string;
                name: string;
                phoneNumber: string;
                startDate: string;
                jobTitle: string;
            }[];
        };
    };
};
export declare const query151 = "\n## 15. alternative: We can also get all inventory from an individual warehouse by using the 'itemsByWarehouseID' query created by the 'byWarehouseID' key:\n\nquery byWarehouseId($warehouseID: ID!) {\n  itemsByWarehouseID(warehouseID: $warehouseID) {\n    items {\n      inventoryAmount\n      productID\n    }\n  }\n}";
export declare const input_query151: {
    warehouseID: string;
};
export declare const expected_result_query151: {
    data: {
        itemsByWarehouseID: {
            items: {
                inventoryAmount: number;
                productID: string;
            }[];
        };
    };
};
