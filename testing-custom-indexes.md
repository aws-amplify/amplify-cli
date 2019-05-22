# Testing Custom Indexes

The `@key` directive makes it simple to configure complex key structures in DynamoDB.
The first thing to do when starting to build an application on top of DynamoDB is to think about access patterns.

DynamoDB is a distributed hash table that can execute efficient range queries on extremely large data sets but to do so comes with a few restrictions. DynamoDB query operations use at most two attributes to efficiently query data. Even more restrictive is that the first argument (the partition key) must use strict equality and the second attribute may use gt, ge, lt, le, eq, beginsWith, and between (there is no 'ne'). DynamoDB provides features and design best-practices to help get around these restrictions. A few features/patterns are:

1. Secondary Indexes - Create new data structures to store information in a different way to enable new access patterns. Incurs extra cost.
1. Composite Keys - Store two logical fields in a single field such that more than two logical fields can be used in a range query.
2. Index overloading - Store more than 1 logical entity in a single index. Different logical entities may contains entirely different types of data. Allows a single index to power more than 1 access patterns for one or more logical entities.

The `@key` directive, in addition to allowing you to define custom primary index structures, helps with parts 1 and 2 above. The `@key` directive does not automatically overload indexes although this may be a possibility going forward. This is the definition of `@key`:

```graphql
# @param name - When provided specifies the name of the secondary index. There may be one @key without a 'name' per @model type.
# @param fields (required) - Specifies the logical fields that should be included in the index's key structure.
# @param queryField - When provided specifies the name of the top level query field that should be created to query the secondary index.
#                     Primary @keys are not allowed to have a queryField because the listX query is already being updated to work with the primary key.
directive @key(name: String, fields: [String!]!, queryField: String) on OBJECT
```

For example, let's say we are building some kind of e-commerce application and need to facilitate these access patterns.

1. Get orders by customer by createdAt.
2. Get customers by email.
3. Get items by order by status by createdAt.
4. Get items by status by createdAt.

When thinking about your access patterns, it is useful to lay them out using the same "by X by Y" structure I have here. 
Once you have them laid out like this you can translate them directily into a `@key` by including the "X" and "Y" values as `fields`.
For example to **Get orders by customer by date**, I would create a `@key`:

```graphql
@key(fields: ["customerEmail", "createdAt"])
```

We can use the `@key` directive to quickly create an API & data model for this application.

1. Clone this repository and checkout the `feature/@key` branch.

```bash
git clone https://github.com/mikeparisstuff/amplify-cli.git
cd amplify-cli
git checkout feature/@key
```

2. Run `npm run setup-dev` from the repo's root directory.

3. Create a new directory somewhere else and init the amplify project.

```bash
mkdir testing-key
cd testing-key
amplify init
# ...
amplify add api
# ...
# Say you don't have a schema, use the guided schema creation, 
# and open the simplest model in your editor. Replace the schema with the one below.
```

```graphql
# A @key without a 'name' specifies the primary key. You may only provide 1 per @model type.
# The @key creates a primary key where the HASHKEY = "customerEmail" and the SORTKEY = "createdAt".
type Order @model @key(fields: ["customerEmail", "createdAt"]) {
    customerEmail: String!
    createdAt: String!
    orderId: ID!
}
# A @key with one field creates a primary key with a HASHKEY = "email"
type Customer @model @key(fields: ["email"]) {
    email: String!
    username: String
}
# The primary @key with 3 fields does something a little special.
# The first field "orderId" will be the HASH KEY as expected BUT the SORT KEY will be
# a new composite key named 'status#createdAt' that is made of the "status" and "createdAt" fields.
# The AppSync resolvers will automatically stitch together the new composite key so the client does not need to worry about that detail.
# The @key with name = "ByStatus" specifies a secondary index where the HASH KEY = "status" (an enum) and the SORT KEY = "createdAt".
# The second @key directive also specifies that a top level query field named "itemsByStatus" should be created to query this index in AppSync.
type Item @model
    @key(fields: ["orderId", "status", "createdAt"])
    @key(name: "ByStatus", fields: ["status", "createdAt"], queryField: "itemsByStatus")
{
    orderId: ID!
    status: Status!
    createdAt: AWSDateTime!
    name: String!
}
enum Status {
    DELIVERED IN_TRANSIT PENDING UNKNOWN
}
```

4. You can test the schema above with these queries/mutations:

```graphql
mutation CreateItem($input: CreateItemInput!) {
    createItem(input: $input) {
        orderId
        status
        createdAt
        name
    }
}

mutation UpdateItem($input: UpdateItemInput!) {
    updateItem(input: $input) {
        orderId
        status
        createdAt
        name
    }
}

mutation DeleteItem($input: DeleteItemInput!) {
    deleteItem(input: $input) {
        orderId
        status
        createdAt
        name
    }
}

# GetItem takes 3 arguments because the primary @key specifies 3 fields.
query GetItem($orderId: ID!, status: Status!, $createdAt: String!) {
    getItem(orderId: $orderId, status: $status, createdAt: $createdAt) {
        orderId
        status
        createdAt
        name
    }
}

# ListItem takes additional arguments because the primary @key specifies 3 fields.
# Note: There is one thing that is likely going to change around the structure of `$createdAt: ModelStringKeyConditionInput`.
query ListItems($orderId: ID, $status: Status, $createdAt: ModelStringKeyConditionInput, $limit: Int, $nextToken: String) {
    listItems(orderId: $orderId, status: $status, createdAt: $createdAt, limit: $limit, nextToken: $nextToken) {
        items {
            orderId
            status
            createdAt
            name
        }
        nextToken
    }
}

# We may use our new top level query field to query secondary @keys.
query ListByStatus($status: Status!, $createdAt: ModelStringKeyConditionInput, $limit: Int, $nextToken: String) {
    itemsByStatus(status: $status, createdAt: $createdAt, limit: $limit, nextToken: $nextToken) {
        items {
            orderId
            status
            createdAt
            name
        }
        nextToken
    }
}
```

5. Provide feedback in the issues tab.
