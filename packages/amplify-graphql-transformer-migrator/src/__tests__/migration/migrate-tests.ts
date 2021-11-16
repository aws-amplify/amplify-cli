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

  it('@connection has one relationship', () => {
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
});
