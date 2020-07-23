//schema
export const schema = `
type Order @model
  @key(name: "byCustomerByStatusByDate", fields: ["customerID", "status", "date"])
  @key(name: "byCustomerByDate", fields: ["customerID", "date"])
  @key(name: "byRepresentativebyDate", fields: ["accountRepresentativeID", "date"])
  @key(name: "byProduct", fields: ["productID", "id"])
{
  id: ID!
  customerID: ID!
  accountRepresentativeID: ID!
  productID: ID!
  status: String!
  amount: Int!
  date: String!
}

type Customer @model
  @key(name: "byRepresentative", fields: ["accountRepresentativeID", "id"]) {
  id: ID!
  name: String!
  phoneNumber: String
  accountRepresentativeID: ID!
  ordersByDate: [Order] @connection(keyName: "byCustomerByDate", fields: ["id"])
  ordersByStatusDate: [Order] @connection(keyName: "byCustomerByStatusByDate", fields: ["id"])
}

type Employee @model
  @key(name: "newHire", fields: ["newHire", "id"], queryField: "employeesNewHire")
  @key(name: "newHireByStartDate", fields: ["newHire", "startDate"], queryField: "employeesNewHireByStartDate")
  @key(name: "byName", fields: ["name", "id"], queryField: "employeeByName")
  @key(name: "byTitle", fields: ["jobTitle", "id"], queryField: "employeesByJobTitle")
  @key(name: "byWarehouse", fields: ["warehouseID", "id"]) {
  id: ID!
  name: String!
  startDate: String!
  phoneNumber: String!
  warehouseID: ID!
  jobTitle: String!
  newHire: String! # We have to use String type, because Boolean types cannot be sort keys
}

type Warehouse @model {
  id: ID!
  employees: [Employee] @connection(keyName: "byWarehouse", fields: ["id"])
}

type AccountRepresentative @model
  @key(name: "bySalesPeriodByOrderTotal", fields: ["salesPeriod", "orderTotal"], queryField: "repsByPeriodAndTotal") {
  id: ID!
  customers: [Customer] @connection(keyName: "byRepresentative", fields: ["id"])
  orders: [Order] @connection(keyName: "byRepresentativebyDate", fields: ["id"])
  orderTotal: Int
  salesPeriod: String
}

type Inventory @model
  @key(name: "byWarehouseID", fields: ["warehouseID"], queryField: "itemsByWarehouseID")
  @key(fields: ["productID", "warehouseID"]) {
  productID: ID!
  warehouseID: ID!
  inventoryAmount: Int!
}

type Product @model {
  id: ID!
  name: String!
  orders: [Order] @connection(keyName: "byProduct", fields: ["id"])
  inventories: [Inventory] @connection(fields: ["id"])
}`;
//mutations
export const mutation1 = `
# first
mutation createWarehouse {
  createWarehouse(input: {id: "1"}) {
    id
  }
}`;

export const mutation2 = `
# second
mutation createEmployee {
  createEmployee(input: {
    id: "amanda"
    name: "Amanda",
    startDate: "2018-05-22",
    phoneNumber: "6015555555",
    warehouseID: "1",
    jobTitle: "Manager",
    newHire: "true"}
  ) {
    id
    jobTitle
    name
    newHire
    phoneNumber
    startDate
    warehouseID
  }
}`;

export const mutation3 = `
# third
mutation createAccountRepresentative {
  createAccountRepresentative(input: {
    id: "dabit"
    orderTotal: 400000
    salesPeriod: "January 2019"
  }) {
    id
    orderTotal
    salesPeriod
  }
}`;

export const mutation4 = `
# fourth
mutation createCustomer {
  createCustomer(input: {
    id: "jennifer_thomas"
    accountRepresentativeID: "dabit"
    name: "Jennifer Thomas"
    phoneNumber: "+16015555555"
  }) {
    id
    name
    accountRepresentativeID
    phoneNumber
  }
}`;

export const mutation5 = `
# fifth
mutation createProduct {
  createProduct(input: {
    id: "yeezyboost"
    name: "Yeezy Boost"
  }) {
    id
    name
  }
}`;

export const mutation6 = `
# sixth
mutation createInventory {
  createInventory(input: {
    productID: "yeezyboost"
    warehouseID: "1"
    inventoryAmount: 300
  }) {
    productID
    inventoryAmount
    warehouseID
  }
}`;

export const mutation7 = `
# seventh
mutation createOrder {
  createOrder(input: {
    amount: 300
    date: "2018-07-12"
    status: "pending"
    accountRepresentativeID: "dabit"
    customerID: "jennifer_thomas"
    productID: "yeezyboost"
  }) {
    id
    customerID
    accountRepresentativeID
    amount
    date
    customerID
    productID
  }
}`;

//queries
export const query1 = `
##1. Look up employee details by employee ID:
#This can simply be done by querying the employee model with an employee ID, no @key or @connection is needed to make this work.

query getEmployee($id: ID!) {
  getEmployee(id: $id) {
    id
    name
    phoneNumber
    startDate
    jobTitle
  }
}`;
export const input_query1 = {
  id: 'amanda',
};
export const expected_result_query1 = {
  data: {
    getEmployee: {
      id: 'amanda',
      name: 'Amanda',
      phoneNumber: '6015555555',
      startDate: '2018-05-22',
      jobTitle: 'Manager',
    },
  },
};

export const query2 = `
## 2. Query employee details by employee name:
#The '@key' 'byName' on the 'Employee' type makes this access-pattern feasible because under the covers an index is created and a query is used to match against the name field. We can use this query:

query employeeByName($name: String!) {
  employeeByName(name: $name) {
    items {
      id
      name
      phoneNumber
      startDate
      jobTitle
    }
  }
}`;
export const input_query2 = {
  name: 'Amanda',
};
export const expected_result_query2 = {
  data: {
    employeeByName: {
      items: [
        {
          id: 'amanda',
          name: 'Amanda',
          phoneNumber: '6015555555',
          startDate: '2018-05-22',
          jobTitle: 'Manager',
        },
      ],
    },
  },
};

export const query3 = `
## 3. Find an Employee’s phone number:
#Either one of the previous queries would work to find an employee’s phone number as long as one has their ID or name.

query employeeByName($name: String!) {
  employeeByName(name: $name) {
    items {
      phoneNumber
    }
  }
}`;
export const input_query3 = {
  name: 'Amanda',
};
export const expected_result_query3 = {
  data: {
    employeeByName: {
      items: [
        {
          phoneNumber: '6015555555',
        },
      ],
    },
  },
};

export const query4 = `
## 4. Find a customer’s phone number:
#A similar query to those given above but on the Customer model would give you a customer’s phone number.

query getCustomer($customerID: ID!) {
  getCustomer(id: $customerID) {
    phoneNumber
  }
}`;
export const input_query4 = {
  customerID: 'jennifer_thomas',
};
export const expected_result_query4 = {
  data: {
    getCustomer: {
      phoneNumber: '+16015555555',
    },
  },
};

export const query5 = `
## 5. Get orders for a given customer within a given date range:
#There is a one-to-many relation that lets all the orders of a customer be queried.

#This relationship is created by having the '@key' name 'byCustomerByDate' on the Order model that is queried by the connection on the orders field of the Customer model.

#A sort key with the date is used. What this means is that the GraphQL resolver can use predicates like 'Between' to efficiently search the date range rather than scanning all records in the database and then filtering them out.

#The query one would need to get the orders to a customer within a date range would be:

query getCustomerWithOrdersByDate($customerID: ID!) {
  getCustomer(id: $customerID) {
    ordersByDate(date: {
      between: [ "2018-01-22", "2020-10-11" ]
    }) {
      items {
        id
        amount
        productID
      }
    }
  }
}`;
export const input_query5 = {
  customerID: 'jennifer_thomas',
};
export const expected_result_query5 = {
  data: {
    getCustomer: {
      ordersByDate: {
        items: [
          {
            amount: 300,
            productID: 'yeezyboost',
          },
        ],
      },
    },
  },
};

export const query6 = `

## 6. Show all open orders within a given date range across all customers:
#The '@key' 'byCustomerByStatusByDate' enables you to run a query that would work for this access pattern.

#In this example, a composite sort key (combination of two or more keys) with the 'status' and 'date' is used. What this means is that the unique identifier of a record in the database is created by concatenating these two fields (status and date) together, and then the GraphQL resolver can use predicates like 'Between' or 'Contains' to efficiently search the unique identifier for matches rather than scanning all records in the database and then filtering them out.

query getCustomerWithOrdersByStatusDate($customerID: ID!) {
  getCustomer(id: $customerID) {
    ordersByStatusDate (statusDate: {
      between: [
        { status: "pending" date:  "2018-01-22" },
        { status: "pending", date: "2020-10-11"}
      ]}) {
        items {
            id
            amount
            date
        }
    }
  }
}`;
export const input_query6 = {
  customerID: 'jennifer_thomas',
};
export const expected_result_query6 = {
  data: {
    getCustomer: {
      ordersByStatusDate: {
        items: [
          {
            amount: 300,
            date: '2018-07-12',
          },
        ],
      },
    },
  },
};

export const query7 = `
## 7. See all employees hired recently:
#Having '@key(name: "newHire", fields: ["newHire", "id"])' on the 'Employee' model allows one to query by whether an employee has been hired recently. 

query employeesNewHire {
  employeesNewHire(newHire: "true") {
    items {
      id
      name
      phoneNumber
      startDate
      jobTitle
    }
  }
}`;
export const expected_result_query7 = {
  data: {
    employeesNewHire: {
      items: [
        {
          id: 'amanda',
          name: 'Amanda',
          phoneNumber: '6015555555',
          startDate: '2018-05-22',
          jobTitle: 'Manager',
        },
      ],
    },
  },
};

export const query8 = `
## 8. Find all employees working in a given warehouse:
#This needs a one to many relationship from warehouses to employees. As can be seen from the @connection in the 'Warehouse' model, this connection uses the 'byWarehouse' key on the 'Employee' model. The relevant query would look like this:

query getWarehouse($warehouseID: ID!) {
  getWarehouse(id: $warehouseID) {
    id
    employees{
      items {
        id
        name
        startDate
        phoneNumber
        jobTitle
      }
    }
  }
}`;
export const input_query8 = {
  warehouseID: '1',
};
export const expected_result_query8 = {
  data: {
    getWarehouse: {
      id: '1',
      employees: {
        items: [
          {
            id: 'amanda',
            name: 'Amanda',
            startDate: '2018-05-22',
            phoneNumber: '6015555555',
            jobTitle: 'Manager',
          },
        ],
      },
    },
  },
};

export const query9 = `
## 9. Get all items on order for a given product:
#This access-pattern would use a one-to-many relation from products to orders. With this query we can get all orders of a given product:

query getProductOrders($productID: ID!) {
  getProduct(id: $productID) {
    id
    orders {
      items {
        id
        status
        amount
        date
      }
    }
  }
}`;
export const input_query9 = {
  productID: 'yeezyboost',
};
export const expected_result_query9 = {
  data: {
    getProduct: {
      id: 'yeezyboost',
      orders: {
        items: [
          {
            status: 'pending',
            amount: 300,
            date: '2018-07-12',
          },
        ],
      },
    },
  },
};

export const query10 = `
## 10. Get current inventories for a product at all warehouses:

#The query needed to get the inventories of a product in all warehouses would be:

query getProductInventoryInfo($productID: ID!) {
  getProduct(id: $productID) {
    id
    inventories {
      items {
        warehouseID
        inventoryAmount
      }
    }
  }
}`;
export const input_query10 = {
  productID: 'yeezyboost',
};
export const expected_result_query10 = {
  data: {
    getProduct: {
      id: 'yeezyboost',
      inventories: {
        items: [
          {
            warehouseID: '1',
            inventoryAmount: 300,
          },
        ],
      },
    },
  },
};

export const query11 = `
## 11. Get customers by account representative:
#This uses a one-to-many connection between account representatives and customers:

#The query needed would look like this:

query getCustomersForAccountRepresentative($representativeId: ID!) {
  getAccountRepresentative(id: $representativeId) {
    customers {
      items {
        id
        name
        phoneNumber
      }
    }
  }
}`;
export const input_query11 = {
  representativeId: 'dabit',
};
export const expected_result_query11 = {
  data: {
    getAccountRepresentative: {
      customers: {
        items: [
          {
            id: 'jennifer_thomas',
            name: 'Jennifer Thomas',
            phoneNumber: '+16015555555',
          },
        ],
      },
    },
  },
};

export const query12 = `
## 12. Get orders by account representative and date:

#As can be seen in the AccountRepresentative model this connection uses the 'byRepresentativebyDate' field on the 'Order' model to create the connection needed. The query needed would look like this:

query getOrdersForAccountRepresentative($representativeId: ID!) {
  getAccountRepresentative(id: $representativeId) {
    id
    orders(date: {
      between: [
         "2010-01-22", "2020-10-11"
      ]
    }) {
        items {
          id
          status
          amount
          date
        }
    }
  }
}`;
export const input_query12 = {
  representativeId: 'dabit',
};
export const expected_result_query12 = {
  data: {
    getAccountRepresentative: {
      id: 'dabit',
      orders: {
        items: [
          {
            status: 'pending',
            amount: 300,
            date: '2018-07-12',
          },
        ],
      },
    },
  },
};

export const query13 = `
## 13. Get all items on order for a given product:
#This is the same as number 9.

query getProductOrders($productID: ID!) {
  getProduct(id: $productID) {
    id
    orders {
      items {
        id
        status
        amount
        date
      }
    }
  }
}
`;
export const input_query13 = {
  productID: 'yeezyboost',
};
export const expected_result_query13 = {
  data: {
    getProduct: {
      id: 'yeezyboost',
      orders: {
        items: [
          {
            status: 'pending',
            amount: 300,
            date: '2018-07-12',
          },
        ],
      },
    },
  },
};

export const query14 = `
## 14. Get all employees with a given job title:
#Using the 'byTitle' '@key' makes this access pattern quite easy.

query employeesByJobTitle {
  employeesByJobTitle(jobTitle: "Manager") {
    items {
      id
      name
      phoneNumber
      jobTitle
    }
  }
}`;
export const expected_result_query14 = {
  data: {
    employeesByJobTitle: {
      items: [
        {
          id: 'amanda',
          name: 'Amanda',
          phoneNumber: '6015555555',
          jobTitle: 'Manager',
        },
      ],
    },
  },
};

export const query15 = `
## 15. Get inventory by product by warehouse:
#Here having the inventories be held in a separate model is particularly useful since this model can have its own partition key and sort key such that the inventories themselves can be queried as is needed for this access-pattern.

#A query on this model would look like this:

query inventoryByProductAndWarehouse($productID: ID!, $warehouseID: ID!) {
  getInventory(productID: $productID, warehouseID: $warehouseID) {
    productID
    warehouseID
    inventoryAmount
  }
}`;
export const input_query15 = {
  productID: 'yeezyboost',
  warehouseID: '1',
};
export const expected_result_query15 = {
  data: {
    getInventory: {
      productID: 'yeezyboost',
      warehouseID: '1',
      inventoryAmount: 300,
    },
  },
};

export const query16 = `
## 16. Get total product inventory:
#How this would be done depends on the use case. If one just wants a list of all inventories in all warehouses, one could just run a list inventories on the Inventory model:

query listInventorys {
  listInventorys {
    items {
      productID
      warehouseID
      inventoryAmount
    }
  }
}`;
export const expected_result_query16 = {
  data: {
    listInventorys: {
      items: [
        {
          productID: 'yeezyboost',
          warehouseID: '1',
          inventoryAmount: 300,
        },
      ],
    },
  },
};

export const query17 = `
## 17. Get sales representatives ranked by order total and sales period:
#It's uncertain exactly what this means. My take is that the sales period is either a date range or maybe even a month or week. Therefore we can set the sales period as a string and query using the combination of 'salesPeriod' and 'orderTotal'. We can also set the 'sortDirection' in order to get the return values from largest to smallest:

query repsByPeriodAndTotal {
  repsByPeriodAndTotal(
    sortDirection: DESC,
    salesPeriod: "January 2019",
    orderTotal: {
      ge: 1000
    }) {
    items {
      id
      orderTotal
    }
  }
}`;
export const expected_result_query17 = {
  data: {
    repsByPeriodAndTotal: {
      items: [
        {
          id: 'dabit',
          orderTotal: 400000,
        },
      ],
    },
  },
};

export const query71 = `
##7. alternative: We can also query and have the results returned by start date by using the 'employeesNewHireByStartDate' query:

query employeesNewHireByDate {
  employeesNewHireByStartDate(newHire: "true") {
    items {
      id
      name
      phoneNumber
      startDate
      jobTitle
    }
  }
}
`;
export const expected_result_query71 = {
  data: {
    employeesNewHireByStartDate: {
      items: [
        {
          id: 'amanda',
          name: 'Amanda',
          phoneNumber: '6015555555',
          startDate: '2018-05-22',
          jobTitle: 'Manager',
        },
      ],
    },
  },
};

export const query151 = `
## 15. alternative: We can also get all inventory from an individual warehouse by using the 'itemsByWarehouseID' query created by the 'byWarehouseID' key:

query byWarehouseId($warehouseID: ID!) {
  itemsByWarehouseID(warehouseID: $warehouseID) {
    items {
      inventoryAmount
      productID
    }
  }
}`;
export const input_query151 = {
  warehouseID: '1',
};
export const expected_result_query151 = {
  data: {
    itemsByWarehouseID: {
      items: [
        {
          inventoryAmount: 300,
          productID: 'yeezyboost',
        },
      ],
    },
  },
};
