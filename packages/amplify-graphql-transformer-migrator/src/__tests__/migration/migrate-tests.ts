import { migrateGraphQLSchema } from '../../schema-migrator';
import { parse } from 'graphql';

function migrateAndValidate(inputSchema: string, defaultAuth: string = 'apiKey'): void {
  const docNode = parse(inputSchema);
  const migratedSchema = migrateGraphQLSchema(inputSchema, defaultAuth, docNode);

  parse(migratedSchema);
  expect(migratedSchema).toMatchSnapshot();
}

describe('Schema migration tests', () => {
  it('no amplify directives in schema', () => {
    const schema = `
      type Todo {
        id: ID!
        name: String!
        description: String
      }`;

    migrateAndValidate(schema);
  });

  it('passes built-in directives through', () => {
    const schema = `
      scalar UUID @specifiedBy(url: "https://tools.ietf.org/html/rfc4122")

      type Todo {
        newField: String
        oldField: String @deprecated(reason: "Use newField.")
      }`;

    migrateAndValidate(schema);
  });

  it('basic @model type', () => {
    const schema = `
      type Todo @model {
        id: ID!
        name: String!
        description: String
      }`;

    migrateAndValidate(schema);
  });

  it('multiple @model types', async () => {
    const schema = `
      type Todo @model {
        id: ID!
        name: String!
        description: String
      }

      type Ope @model {
        foo: ID!
        bar: String
      }`;

    migrateAndValidate(schema);
  });

  it('customized creation and update timestamp names', async () => {
    const schema = `
      type Todo @model(timestamps: { createdAt: "createdOn", updatedAt: "updatedOn" }) {
        id: ID!
        str: String
      }`;

    migrateAndValidate(schema);
  });

  it('explicit creation and update timestamps', async () => {
    const schema = `
      type Todo @model {
        id: ID!
        createdAt: AWSTimestamp
        updatedAt: AWSTimestamp
      }`;

    migrateAndValidate(schema);
  });

  it('renamed queries/mutations/subscriptions', () => {
    const schema = `
      type Entity @model(mutations: null, subscriptions: null, queries: { get: "getEntity" }) {
        id: ID!
        str: String
      }`;

    migrateAndValidate(schema);
  });

  it('configure a primary key', () => {
    const schema = `
      type Todo @model
                @key(fields: ["id"]) {
        id: ID!
        name: String!
        description: String
      }`;

    migrateAndValidate(schema);
  });

  it('configure a secondary index', () => {
    const schema = `
      type Todo @model
                @key(name: "nameIndex", fields: ["name"]) {
        id: ID!
        name: String!
        description: String
      }`;

    migrateAndValidate(schema);
  });

  it('configure a secondary index with queryField', () => {
    const schema = `
      type Todo @model
        @key(name: "todosByStatus", fields: ["status"], queryField: "listTodosByStatus") {
        id: ID!
        name: String!
        status: String!
      }`;

    migrateAndValidate(schema);
  });

  it('@connection has one relationship with no fields', () => {
    const schema = `
      type Project @model {
        id: ID!
        name: String
        team: Team @connection
      }

      type Team @model {
        id: ID!
        name: String!
      }`;

    migrateAndValidate(schema);
  });

  it('@connection has one relationship with fields', () => {
    const schema = `
      type Project @model {
        id: ID!
        name: String
        teamID: ID!
        team: Team @connection(fields: ["teamID"])
      }

      type Team @model {
        id: ID!
        name: String!
      }`;

    migrateAndValidate(schema);
  });

  it('@connection has many relationship', () => {
    const schema = `
      type Post @model {
        id: ID!
        title: String!
        comments: [Comment] @connection(keyName: "byPost", fields: ["id"])
      }

      type Comment @model
        @key(name: "byPost", fields: ["postID", "content"]) {
        id: ID!
        postID: ID!
        content: String!
      }`;

    migrateAndValidate(schema);
  });

  it('@connection has many relationship with limit', () => {
    const schema = `
      type Post @model {
        id: ID!
        title: String!
        comments: [Comment] @connection(limit: 50)
      }

      type Comment @model {
        id: ID!
        content: String!
      }`;

    migrateAndValidate(schema);
  });

  it('@connection belongs to relationship', () => {
    const schema = `
      type Post @model {
        id: ID!
        title: String!
        comments: [Comment] @connection(keyName: "byPost", fields: ["id"])
      }

      type Comment @model
        @key(name: "byPost", fields: ["postID", "content"]) {
        id: ID!
        postID: ID!
        content: String!
        post: Post @connection(fields: ["postID"])
      }`;

    migrateAndValidate(schema);
  });

  it('@connection many to many relationship', () => {
    const schema = `
      type Post @model {
        id: ID!
        title: String!
        editors: [PostEditor] @connection(keyName: "byPost", fields: ["id"])
      }

      type PostEditor
        @model(queries: null)
        @key(name: "byPost", fields: ["postID", "editorID"])
        @key(name: "byEditor", fields: ["editorID", "postID"]) {
        id: ID!
        postID: ID!
        editorID: ID!
        post: Post! @connection(fields: ["postID"])
        editor: User! @connection(fields: ["editorID"])
      }

      type User @model {
        id: ID!
        username: String!
        posts: [PostEditor] @connection(keyName: "byEditor", fields: ["id"])
      }`;

    migrateAndValidate(schema);
  });

  it('@function directive is migrated', () => {
    const schema = `
      type Query {
        echo(msg: String!): Context @function(name: "echo")
        echoEnv(msg: String!): Context @function(name: "long-prefix-e2e-test-functions-echo-\${env}-v2")
        duplicate(msg: String!): Context @function(name: "long-prefix-e2e-test-functions-echo-dev-v2")
        pipeline(msg: String!): String @function(name: "echo") @function(name: "hello")
        echoRegion(msg: String!): Context @function(name: "echo-\${env}" region: "us-east-1")
      }

      type Context {
        typeName: String
        fieldName: String
      }`;

    migrateAndValidate(schema);
  });

  it('@searchable directive is migrated', () => {
    const schema = `
      type Book @model @key(fields: ["author", "name"]) @searchable {
        author: String!
        name: String!
        genre: String!
      }

      type Todo @model @searchable {
        id: ID
        name: String!
        createdAt: AWSDateTime
        description: String
      }

      type Comment @model @key(name: "commentByVersion", fields: ["version", "id"]) @searchable {
        id: ID!
        version: Int!
        content: String!
      }`;

    migrateAndValidate(schema);
  });

  it('@http directive is migrated', () => {
    const schema = `
      type Comment @model {
        id: ID!
        title: String
        simpleGet: CompObj @http(method: GET, url: "https://amazon.com/posts/1")
        simpleGet2: CompObj @http(url: "https://amazon.com/posts/2")
        complexPost(
          id: Int,
          title: String!,
          body: String,
          userId: Int
        ): CompObj @http(method: POST, url: "https://amazon.com/posts")
        complexPut(
          id: Int!,
          title: String,
          body: String,
          userId: Int
        ): CompObj @http(method: PUT, url: "https://amazon.com/posts/$\{env}/:id")
        deleter: String @http(method: DELETE, url: "https://amazon.com/posts/4")
        complexGet(
          data: String!,
          userId: Int!,
          _limit: Int
        ): [CompObj] @http(url: "https://amazon.com:data")
      }
      type CompObj {
          userId: Int
          id: Int
          title: String
          body: String
      }`;

    migrateAndValidate(schema);
  });

  it('@predictions directive is migrated', () => {
    const schema = `
      type Query {
        translateImageText: String @predictions(actions: [identifyText])
        translateLabels: String @predictions(actions: [identifyLabels])
        translateThis: String @predictions(actions: [translateText])
        speakTranslatedText: String @predictions(actions: [translateText, convertTextToSpeech])
      }`;

    migrateAndValidate(schema);
  });

  it('Has One @connection without fields always mapped to has one, even in bidirectional', () => {
    const schema = `
    type Coffee @model {
      id: ID!
      energy: Energy @connection # => @hasOne
    }
    
    type Energy @model {
      id: ID!
      coffee: Coffee @connection # => @hasOne
    }`;

    migrateAndValidate(schema);
  }); 

  it('migrates complex schema from documentation', () => {
    const schema = `
      type Order @model
        @key(name: "byCustomerByStatusByDate", fields: ["customerID", "status", "date"])
        @key(name: "byCustomerByDate", fields: ["customerID", "date"])
        @key(name: "byRepresentativebyDate", fields: ["accountRepresentativeID", "date"])
        @key(name: "byProduct", fields: ["productID", "id"]) {
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

    migrateAndValidate(schema);
  });
});
