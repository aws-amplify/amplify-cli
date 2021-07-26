# GraphQL Transform

# Reference Documentation

### @model

Object types that are annotated with `@model` are top level entities in the
generated API. Objects annotated with `@model` are stored in DynamoDB and are
capable of being protected via `@auth`, related to other objects via `@connection`,
and streamed via `@searchable`.

#### Definition

```graphql
directive @model(queries: ModelQueryMap, mutations: ModelMutationMap) on OBJECT
input ModelMutationMap {
  create: String
  update: String
  delete: String
}
input ModelQueryMap {
  get: String
  list: String
}
```

#### Usage

Define a GraphQL object type and annotate it with the `@model` directive to store
objects of that type in DynamoDB and automatically configure CRUDL queries and
mutations.

```graphql
type Post @model {
  id: ID! # id: ID! is a required attribute.
  title: String!
  tags: [String!]!
}
```

You may also override the names of any generated queries and mutations as well
as remove operations entirely.

```graphql
type Post @model(queries: { get: "post" }, mutations: null) {
  id: ID!
  title: String!
  tags: [String!]!
}
```

This would create and configure a single query field `post(id: ID!): Post` and
no mutation fields.

### @auth

Object types that are annotated with `@auth` are protected by one of the
supported authorization strategies. Types that are annotated with `@auth`
must also be annotated with `@model`.

#### Definition

```graphql
# When applied to a type, augments the application with
# owner and group based authorization rules.
directive @auth(rules: [AuthRule!]!) on OBJECT

input AuthRule {
  allow: AuthStrategy!
  ownerField: String = "owner"
  identityField: String = "username"
  groupsField: String
  groups: [String]
  queries: [ModelQuery]
  mutations: [ModelMutation]
}
enum AuthStrategy {
  owner
  groups
}
enum ModelQuery {
  get
  list
}
enum ModelMutation {
  create
  update
  delete
}
```

#### Authorization Strategies

##### Owner Authorization

```graphql
# The simplest case
type Post @model @auth(rules: [{ allow: owner }]) {
  id: ID!
  title: String!
}

# The long form way
type Post @model @auth(rules: [{ allow: owner, ownerField: "owner", mutations: [create, update, delete], queries: [get, list] }]) {
  id: ID!
  title: String!
  owner: String
}
```

Owner authorization specifies that a user (or set of user's) can access an object. To
do so, each object has an _ownerField_ (by default "owner") that stores ownership information
and is verified in various ways during resolver execution.

You may use the _queries_ and _mutations_ arguments to specify which operations are augmented:

**get**: If the record's owner is not the same as the logged in user (via `$ctx.identity.username`), throw `$util.unauthorized()`.
**list**: Filter `$ctx.result.items` for owned items.
**create**: Inject the logged in user's `$ctx.identity.username` as the _ownerField_ automatically.
**update**: Add conditional update that checks the stored _ownerField_ is the same as `$ctx.identity.username`.
**delete**: Add conditional update that checks the stored _ownerField_ is the same as `$ctx.identity.username`.

**IN PROGRESS**

```graphql
# TODO: (WORK IN PROGRESS) Does not yet support multi-owner
type Post @model @auth(rules: [{ allow: owner, ownerField: "owners", mutations: [create, update, delete], queries: [get, list] }]) {
  id: ID!
  title: String!
  owners: [String]
}
```

##### Group Authorization

**Static Group Auth**

```graphql
# Static group auth
type Post @model @auth(rules: [{ allow: groups, groups: ["Admin"] }]) {
  id: ID!
  title: String
}
```

If the user credential (as specified by the resolver's `$ctx.identity`) is not
enrolled in the _Admin_ group, throw an unauthorized error via `$util.unauthorized()`.

**Dynamic Group Auth**

```graphql
# Dynamic group auth with multiple groups
type Post @model @auth(rules: [{ allow: groups, groupsField: "groups" }]) {
  id: ID!
  title: String
  groups: [String]
}

# Dynamic group auth with a single group
type Post @model @auth(rules: [{ allow: groups, groupsField: "group" }]) {
  id: ID!
  title: String
  group: String
}
```

With dynamic group authorization, each record contains an attribute specifying
what groups should be able to access it. Use the _groupsField_ argument to
specify which attribute in the underlying data store holds this group
information. To specify that a single group should have access use a field of
type `String`. To specify that multiple groups should have access use a field of
type `[String]`.

### @connection

The `@connection` directive allows you to specify relationships between `@model` object types.
Currently this supports one-to-one, one-to-many, and many-to-one relationships. An error
will be thrown when trying to configure a many-to-many relationship.

#### Definition

```graphql
directive @connection(name: String) on FIELD_DEFINITION
```

#### Usage

Relationships are specified by annotating fields on an `@model` object type with
the `@connection` directive.

##### Unnamed Connections

In the simplest case, you may define a one-to-one connection:

```graphql
type Project @model {
  id: ID!
  name: String
  team: Team @connection
}
type Team @model {
  id: ID!
  name: String!
}
```

Once transformed you would then be able to create projects with a team via:

```graphql
mutation CreateProject {
  createProject(input: { name: "New Project", projectTeamId: "a-team-id" }) {
    id
    name
    team {
      id
      name
    }
  }
}
```

> Note: The **Project.team** resolver will be preconfigured to work with the defined connection.

Likewise you may make a simple one-to-many connection:

```graphql
type Post {
  id: ID!
  title: String!
  comments: [Comment] @connection
}
type Comment {
  id: ID!
  content: String!
}
```

One transformed, you would create comments with a post via:

```graphql
mutation CreateCommentOnPost {
  createComment(input: { content: "A comment", postCommentsId: "a-post-id" }) {
    id
    content
  }
}
```

> Note: The "postCommentsId" field on the input may seem like a strange name and it is. In the one-to-many case without a provided "name" argument there is only partial information to work with resulting in the strange name. To fix this, provide a value for the @connection's _name_ argument and complete the bi-directional relationship by adding a corresponding @connection field to the **Comment** type.

##### Named Connections

The **name** arguments specifies a name for the
connection and is used to create bi-directional relationships that reference
the same underlying foreign key.

For example, if you wanted your `Post.comments`
and `Comment.post` fields to refer to opposite sides of the same relationship
you would provide a name.

```graphql
type Post @model {
  id: ID!
  title: String!
  comments: [Comment] @connection(name: "PostComments")
}
type Comment @model {
  id: ID!
  content: String!
  post: Post @connection(name: "PostComments")
}
```

One transformed, you would create comments with a post via:

```graphql
mutation CreateCommentOnPost {
  createComment(input: { content: "A comment", commentPostId: "a-post-id" }) {
    id
    content
    post {
      id
      title
      comments {
        id
        # and so on...
      }
    }
  }
}
```

#### Performance

In order to keep connection queries fast and efficient, the graphql transform manages
GSIs on the generated tables on your behalf. We bake in best practices to keep
your queries efficient but this also comes with additional cost.

### @searchable

The `@searchable` directive handles streaming the data of an `@model` object type
and configures search resolvers that search that information.

#### Definition

```graphql
# Streams data from dynamodb into opensearch and exposes search capabilities.
directive @searchable(queries: SearchableQueryMap) on OBJECT
input SearchableQueryMap {
  search: String
}
```

**What is the Amplify GraphQL Transform**

The Amplify GraphQL Transform is a set of libraries committed to simplifying the process of developing, deploying, and maintaining APIs on AWS.
With it, you define your API using the GraphQL Schema Definition Language (SDL) and then pass it to this library where it is expanded and transformed into a fully descriptive cloudformation template that implements your API's data model.

For example, you might define the data model for an app like this:

```graphql
type Blog @model @searchable {
  id: ID!
  name: String!
  posts: [Post] @connection(name: "BlogPosts")
}
type Post @model @searchable {
  id: ID!
  title: String!
  tags: [String]
  blog: Blog @connection(name: "BlogPosts")
  comments: [Comment] @connection
  createdAt: String
  updatedAt: String
}
type Comment @model {
  id: ID!
  content: String!
}
```

And then pass the schema to an instance of the `GraphQLTransform` class with the DynamoDB, `@searchable`, and Connection transformers enabled:

```javascript
import GraphQLTransform from 'graphql-transformer-core';
import AppSyncDynamoDBTransformer from 'graphql-dynamodb-transformer';
import SearchableModelTransformer from 'amplify-graphql-searchable-transformer';
import AppSyncConnectionTransformer from 'graphql-connection-transformer';
import AppSyncAuthTransformer from 'graphql-auth-transformer';

const transformer = new GraphQLTransform({
  transformers: [
    new AppSyncDynamoDBTransformer(),
    new SearchableModelTransformer(),
    new AppSyncAuthTransformer(),
    new AppSyncConnectionTransformer(),
  ],
});
const cfdoc = transformer.transform(schema.readSync());
const out = await createStack(cfdoc, name, region);
console.log('Application creation successfully started. It may take a few minutes to finish.');
```

The `GraphQLTransform` class implements a single `transform()` function that when invoked parses the document, walks the AST, and when a directive such as **@model** is found invokes any relevant transformers.
In this case the transformers were defined for you but the code is structured to make writing custom transformers as simple as possible.
The output of the above code is a full CloudFormation document that defines DynamoDB tables, an OpenSearch cluster, a lambda function to stream from DynamoDB -> OpenSearch,
an AppSync API, AppSync data sources, CRUD resolvers (create, update, delete, get, list, search), resolvers that implement connections between types stored in different DynamoDB tables,
a number of minimally scoped IAM roles,

## GraphQL Transform Libraries

The code is contained in a mono-repo that includes a number of packages that are related to the transform and a number of packages that are not. The related packages are broken up as follows

**graphql-transform**

The package contains the core of the library and acts as the entry point to the transform. The core class `GraphQLTransform` takes as config a list of transformers and handles the logic that parses the input SDL, walks the AST, and routes directives to transformers.

**graphql-dynamodb-transformer**

This package implements a number of directives that deal with DynamoDB. Out of the box, this implements the **@model** and **connection** directives.

**amplify-graphql-searchable-transformer**

This package implements any directives that deal with a searchable data source. Out of the box, this implements the **@searchable** directive.

**graphql-auth-transformer**

This package implements any directives related to authN or authZ workflows. Out of the box, it configures an _Amazon Cognito UserPool_ and implements the **@auth** directive.

**graphql-transformer-e2e-tests**

This pacakge implements end-to-end tests for the transform libraries. It builds an API with the transform, deploys it via CloudFormation, and hits the AppSync data plane to test all generated code paths.

**graphql-mapping-template**

This package provides a lightweight wrapper around the AppSync Resolver VTL and is used by transformer libraries as a convenience.

### Prerequisites

- You will need to have [nodejs and npm installed](https://nodejs.org/en/download/).
- You will then need to install `lerna` and `yarn` as npm global packages.

```
npm install -g lerna
npm install -g yarn
```

### Installing

Install the dependencies

```
lerna bootstrap
```

And build

```
lerna run build
```

## Running the tests

Tests are written with [jest](https://facebook.github.io/jest/) and can be run for all packages with

```
lerna run test
```

Alternatively, there are some debug configurations defined in [.vscode/launch.json](./.vscode/launch.json) you can use Visual Studio code to add debug breakpoints to debug the code.

## Contributing

TODO

## Versioning

TODO

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
