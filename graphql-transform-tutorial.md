# GraphQL Transformer Tutorial

# Getting Started

Take the .tgz file that was provided, upzip it, cd to the root of the new folder, and then run the following:

```
npm run setup-dev # this will take a while
```

Now, the `amplify` command is available on the command line. Run the following:

```
amplify init
# Follow the wizard and create a new app.

# Run
amplify add api

# Select the graphql option.
# When asked if you have a schema, choose **No**.
# Select one of the default samples. You can change it later.
# Choose to edit the schema. It opens the schema.graphql in your editor.
# Make some changes to the schema. For details, see the reference docs at end of this page.
# Save the file and choose Enter on the command line.
# DO NOT CHOOSE ENTER AGAIN! 
# When asked if you want to use your own Amazon DynamoDB tables, choose **No**.
# Run
amplify push

# This deploys your API after it has been transformed. Go to AWS CloudFormation to view it.
# You can find your project assets in the amplify/backend folder under your API.
```

# Examples to Get Started

## The simplest case. Make a Todo model with CRUDL

```graphql
type Todo @model {
  id: ID!
  name: String!
  description: String
}
```

## A blog with related blogs, posts, and comments

```graphql
type Blog @model {
  id: ID!
  name: String!
  posts: [Post] @connection(name: "BlogPosts")
}
type Post @model {
  id: ID!
  title: String!
  blog: Blog @connection(name: "BlogPosts")
  comments: [Comment] @connection(name: "PostComments")
}
type Comment @model {
  id: ID!
  content: String
  post: Post @connection(name: "PostComments")
}
```

### Queries for the blog example

```graphql
# Create a blog. Remember the returned id.
# Provide the returned id as the "blogId" variable.
mutation CreateBlog {
  createBlog(input: {
    name: "My New Blog!"
  }) {
    id
    name
  }
}

# Create a post and associate it with the blog via the "postBlogId" input field.
# Provide the returned id as the "postId" variable.
mutation CreatePost($blogId:ID!) {
  createPost(input:{title:"My Post!", postBlogId: $blogId}) {
    id
    title
    blog {
      id
      name
    }
  }
}

# Create a comment and associate it with the post via the "commentPostId" input field.
mutation CreateComment($postId:ID!) {
  createComment(input:{content:"A comment!", commentPostId:$postId}) {
    id
    content
    post {
      id
      title
      blog {
        id
        name
      }
    }
  }
}

# Get a blog, its posts, and its posts comments.
query GetBlog($blogId:ID!) {
  getBlog(id:$blogId) {
    id
    name
    posts(filter: {
      title: {
        eq: "My Post!"
      }
    }) {
      items {
        id
        title
        comments {
          items {
            id
            content
          }
        }
      }
    }
  }
}

# List all blogs, their posts, and their posts comments.
query ListBlogs {
  listBlog { # Try adding: listBlog(filter: { name: { eq: "My New Blog!" } })
    items {
      id
      name
      posts { # or try adding: posts(filter: { title: { eq: "My Post!" } })
        items {
          id
          title
          comments { # and so on ...
            items {
              id
              content
            }
          }
        }
      }
    }
  }
}
```

## Project management app with owner-based authorization

**Note: To use the @auth directive, the API must be configured to use Amazon Cognito user pools.**

**There is currently a bug with the user pool creation. To make this work you need to have your own user pool and then pass the id via a CloudFormation parameter. The Amplify CLI user pool with the default setting doesn't work (a fix is in the works).**

```graphql
type Task 
  @model 
  @auth(rules: [
      {allow: groups, groups: ["Managers"], mutations: [create, update, delete]},
      {allow: groups, groups: ["Employees"], queries: [get, list]}
    ])
{
  id: ID!
  title: String!
  description: String
  status: String
}
type PrivateNote
  @model
  @auth(rules: [{allow: owner}])
{
  id: ID!
  content: String!
}
```

### Queries for the task example

```graphql
# Create a task. Only allowed if a manager.
mutation M {
  createTask(input:{
    title:"A task",
    description:"A task description",
    status: "pending"
  }) {
    id
    title
    description
  }
}

# Get a task. Allowed if an employee.
query GetTask($taskId:ID!) {
  getTask(id:$taskId) {
    id
    title
    description
  }
}

# Automatically inject the username as owner attribute.
mutation CreatePrivateNote {
  createPrivateNote(input:{content:"A private note of user 1"}) {
    id
    content
  }
}

# Unauthorized error if not owner.
query GetPrivateNote($privateNoteId:ID!) {
  getPrivateNote(id:$privateNoteId) {
    id
    content
  }
}

# Return only my own private notes.
query ListPrivateNote {
  listPrivateNote {
    items {
      id
      content
    }
  }
}
```

## A note taking app with versioned notes and conflict detection

```graphql
type Note @model @versioned {
  id: ID!
  content: String!
  version: Int! # You can leave this out. Validation fails if this is not a int like type (Int/BigInt) and is always coerced to non-null.
}
```

### Queries for the versioned notes example

```graphql
mutation Create {
  createNote(input:{
    content:"A note"
  }) {
    id
    content
    version
  }
}

mutation Update($noteId: ID!) {
  updateNote(input:{
    id: $noteId,
    content:"A second version",
    expectedVersion: 1
  }) {
    id
    content
    version
  }
}

mutation Delete($noteId: ID!) {
  deleteNote(input:{
    id: $noteId,
    expectedVersion: 2
  }) {
    id
    content
    version
  }
}
```

# Reference Documentation

### @model

Object types that are annotated with `@model` are top-level entities in the
generated API. Objects annotated with `@model` are stored in DynamoDB and are
capable of being protected via `@auth`, related to other objects via `@connection`,
and streamed into Elasticsearch via `@searchable`.

#### Definition

```graphql
directive @model(
    queries: ModelQueryMap, 
    mutations: ModelMutationMap
) on OBJECT
input ModelMutationMap { create: String, update: String, delete: String }
input ModelQueryMap { get: String, list: String }
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

You may also override the names of any generated queries and mutations, or remove operations entirely.

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
must also be annotated with `@model`. Currently, Amazon Cognito user pools
is the only supported authorization mode.

#### Definition

```graphql
# When applied to a type, augments the application with
# owner and group-based authorization rules.
directive @auth(rules: [AuthRule!]!) on OBJECT
input AuthRule {
    allow: AuthStrategy!
    ownerField: String # defaults to "owner"
    identityField: String # defaults to "username"
    groupsField: String
    groups: [String]
    queries: [ModelQuery]
    mutations: [ModelMutation]
}
enum AuthStrategy { owner groups }
enum ModelQuery { get list }
enum ModelMutation { create update delete }
```

#### Authorization Strategies

##### Owner Authorization

```graphql
# The simplest case
type Post @model @auth(rules: [{allow: owner}]) {
  id: ID!
  title: String!
}

# The long form way
type Post 
  @model 
  @auth(
    rules: [
      {allow: owner, ownerField: "owner", mutations: [create, update, delete], queries: [get, list]}
    ]) 
{
  id: ID!
  title: String!
  owner: String
}
```

Owner authorization specifies that a user (or set of users) can access an object. To
do so, each object has an *ownerField* (by default "owner") that stores ownership information
and is verified in various ways during resolver execution.

You can use the *queries* and *mutations* arguments to specify which operations are augmented as follows:

**get**: If the record's owner is not the same as the logged in user (via `$ctx.identity.username`), throw `$util.unauthorized()`.
**list**: Filter `$ctx.result.items` for owned items.
**create**: Inject the logged in user's `$ctx.identity.username` as the *ownerField* automatically.
**update**: Add conditional update that checks the stored *ownerField* is the same as `$ctx.identity.username`.
**delete**: Add conditional update that checks the stored *ownerField* is the same as `$ctx.identity.username`.

**IN PROGRESS**

```graphql
# TODO: (WORK IN PROGRESS) Does not yet support multi-owner
type Post @model @auth(rules: [{allow: owner, ownerField: "owners", mutations: [create, update, delete], queries: [get, list]}]) {
  id: ID!
  title: String!
  owners: [String]
}
```

##### Group Authorization

**Static Group Authorization**

```graphql
# Static group auth
type Post @model @auth(rules: [{allow: groups, groups: ["Admin"]}]) {
  id: ID!
  title: String
}
```

If the user credential (as specified by the resolver's `$ctx.identity`) is not
enrolled in the *Admin* group, throw an unauthorized error using `$util.unauthorized()`.

**Dynamic Group Auth**

```graphql
# Dynamic group authorization with multiple groups
type Post @model @auth(rules: [{allow: groups, groupsField: "groups"}]) {
  id: ID!
  title: String
  groups: [String]
}

# Dynamic group authorization with a single group
type Post @model @auth(rules: [{allow: groups, groupsField: "group"}]) {
  id: ID!
  title: String
  group: String
}
```

With dynamic group authorization, each record contains an attribute specifying
what groups should be able to access it. Use the *groupsField* argument to
specify which attribute in the underlying data store holds this group
information. To specify that a single group should have access, use a field of
type `String`. To specify that multiple groups should have access, use a field of
type `[String]`.

### @connection

The `@connection` directive enables you to specify relationships between `@model` object types.
Currently, this supports one-to-one, one-to-many, and many-to-one relationships. An error
is thrown if you try to configure a many-to-many relationship.

#### Definition

```graphql
directive @connection(name: String) on FIELD_DEFINITION
```

#### Usage

Relationships are specified by annotating fields on an `@model` object type with
the `@connection` directive. 

##### Unnamed Connections

In the simplest case, you can define a one-to-one connection:

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

After it's transformed, you can create projects with a team as follows:

```graphql
mutation CreateProject {
    createProject(input: { name: "New Project", projectTeamId: "a-team-id"}) {
        id
        name
        team {
            id
            name
        }
    }
}
```

> **Note** The **Project.team** resolver is preconfigured to work with the defined connection.

Likewise, you can make a simple one-to-many connection as follows:

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

After it's transformed, you can create comments with a post as follows:

```graphql
mutation CreateCommentOnPost {
    createComment(input: { content: "A comment", postCommentsId: "a-post-id"}) {
        id
        content
    }
}
```

> **Note** The postCommentsId field on the input may seem unusual. In the one-to-many case without a provided `name` argument there is only partial information to work with, which results in the unusual name. To fix this, provide a value for the @connection's *name* argument and complete the bi-directional relationship by adding a corresponding @connection field to the **Comment** type.

##### Named Connections

The **name** argument specifies a name for the
connection and it's used to create bi-directional relationships that reference
the same underlying foreign key. 

For example, if you wanted your `Post.comments`
and `Comment.post` fields to refer to opposite sides of the same relationship,
you need to provide a name.

```graphql
type Post {
    id: ID!
    title: String!
    comments: [Comment] @connection(name: "PostComments")
}
type Comment {
    id: ID!
    content: String!
    post: Post @connection(name: "PostComments")
}
```

After it's transformed, create comments with a post as follows:

```graphql
mutation CreateCommentOnPost {
    createComment(input: { content: "A comment", commentPostId: "a-post-id"}) {
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

In order to keep connection queries fast and efficient, the GraphQL transform manages
global secondary indexes (GSIs) on the generated tables on your behalf. We use best practices to keep
your queries efficient, but this also can affect performance.

### @versioned

The `@versioned` directive adds object versioning and conflict resolution to a type.

#### Definition

```graphql
directive @versioned(versionField: String = "version", versionInput: String = "expectedVersion") on OBJECT
```

#### Usage

Annotate a `@model` type with the `@versioned` directive to add object versioning and conflict detection to a type.

```graphql
type Post @model @versioned {
  id: ID!
  title: String!
  version: Int!   # <- If not provided, it is added for you.
}
```

**Creating a Post automatically sets the version to 1**

```graphql
mutation Create {
  createPost(input:{
    title:"Conflict detection in the cloud!"
  }) {
    id
    title
    version  # will be 1
  }
}
```

**Updating a Post requires passing the "expectedVersion" which is the object's last saved version**

> Note: When updating an object, the version number will automatically increment.

```graphql
mutation Update($postId: ID!) {
  updatePost(
    input:{
      id: $postId,
      title: "Conflict detection in the cloud is great!",
      expectedVersion: 1
    }
  ) {
    id
    title
    version # will be 2
  }
}
```

**Deleting a Post requires passing the "expectedVersion" which is the object's last saved version**

```graphql
mutation Delete($postId: ID!) {
  deletePost(
    input: {
      id: $postId,
      expectedVersion: 2
    }
  ) {
    id
    title
    version
  }
}
```

Update and delete operations will fail if the **expectedVersion** does not match the version
stored in DynamoDB. You may change the default name of the version field on the type as well as the name
of the input field via the **versionField** and **versionInput** arguments on the `@versioned` directive.


### @searchable

The `@searchable` directive handles streaming the data of an `@model` object type to
Amazon Elasticsearch Service and configures search resolvers that search that information.

#### Definition

```graphql
# Streams data from DynamoDB to Elasticsearch and exposes search capabilities.
directive @searchable(queries: SearchableQueryMap) on OBJECT
input SearchableQueryMap { search: String }
```

#### Usage

Store posts in DynamoDB and automatically stream them to ElasticSearch
via lambda and connect a searchQueryField resolver.

```graphql
type Post @model @searchable {
  id: ID!
  title: String!
  createdAt: String!
  updatedAt: String!
}
```

You may then create objects in DynamoDB that will automatically streamed to lambda
using the normal `createPost` mutation.

```graphql
mutation CreatePost {
  createPost(input: { title: "Stream me to Elasticsearch!" }) {
    id
    title
    createdAt
    updatedAt
  }
}
```

And then search for posts

```graphql
query SearchPosts {
  searchPost(filter: { title: { term: "Stream" }}) {
    items {
      id
      title
    }
  }
}
```

**What is the GraphQL Transform** 

The Amplify GraphQL Transform is a set of libraries designed to simplify the process of developing, deploying, and maintaining APIs on AWS. 
With it, you define your API using the GraphQL Schema Definition Language (SDL) and then pass it to this library where it is expanded and transformed into a fully descriptive CloudFormation template that implements your API's data model.

For example, you might define the data model for an app as follows:

```graphql
type Blog @model {
    id: ID!
    name: String!
    posts: [Post] @connection(name: "BlogPosts")
}
type Post @model {
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

And then you pass the schema to an instance of the `GraphQLTransform` class with the Amazon DynamoDB, Amazon Elasticsearch Service, and AWS AppSync connection transformers enabled as follows:

```javascript
// From graphql-transform-cli/src/commands/create.ts
import GraphQLTransform from 'graphql-transform'
import DynamoDBModelTransformer from 'graphql-dynamodb-transformer'
import ModelConnectionTransformer from 'graphql-connection-transformer'
import ModelAuthTransformer from 'graphql-auth-transformer'
import AppSyncTransformer from 'graphql-appsync-transformer'

const transformer = new GraphQLTransform({
    transformers: [
        new AppSyncTransformer(),
        new DynamoDBModelTransformer(),
        new ModelAuthTransformer(),
        new ModelConnectionTransformer()
    ]
})
const cfdoc = transformer.transform(schema.readSync());
const out = await createStack(cfdoc, name, region)
console.log('Application creation successfully started. It may take a few minutes to finish.')
```

The `GraphQLTransform` class implements a single `transform()` function that when invoked parses the document and walks the AST. When a directive such as **@model** is found, it invokes any relevant transformers. 
In this case the transformers were defined for you, but the code is structured to make writing custom transformers as simple as possible. 
The output of the previous code is a full CloudFormation document that defines DynamoDB tables, an Elasticsearch cluster, a Lambda function to stream from DynamoDB to Amazon Elasticsearch Service,
an AppSync API, AppSync data sources, CRUD resolvers (create, update, delete, get, list, search), resolvers that implement connections between types stored in different DynamoDB tables, and a number of minimally scoped IAM roles. 
