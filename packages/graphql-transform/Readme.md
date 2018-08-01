# Amplify GraphQL Transform

**What is the Amplify GraphQL Transform** 

The Amplify GraphQL Transform is a set of libraries committed to simplifying the process of developing, deploying, and maintaining APIs on AWS. 
With it, you define your API using the GraphQL Schema Definition Language (SDL) and then pass it to this library where it is expanded and transformed into a fully descriptive cloudformation template that implements your API's data model.

For example, you might define a data model for a blog:

```graphql
type Blog @model @searchable {
    id: ID!
    name: String!
    posts: [Post] @connection
}
type Post @model @searchable {
    id: ID!
    title: String!
    tags: [String]
    comments: [Comment] @connection
    createdAt: String
    updatedAt: String
}
type Comment @model {
    id: ID!
    content: String!
}
```

And then pass the schema to an instance of the `GraphQLTransform` class with the DynamoDB, Elasticsearch, and Connection transformers enabled:

```javascript
// From amplify-graphql-transform-cli/src/commands/create.ts
import GraphQLTransform from 'amplify-graphql-transform'
import AmplifyDynamoDBTransformer, { AmplifyDynamoDBConnectionTransformer } from 'amplify-graphql-dynamodb-transformer'
import AmplifyElasticsearchTransformer from 'amplify-graphql-elasticsearch-transformer'

const transformer = new GraphQLTransform({
    transformers: [
        new AmplifyDynamoDBTransformer(),
        new AmplifyDynamoDBConnectionTransformer(),
        new AmplifyElasticsearchTransformer()
    ]
})
const cfdoc = transformer.transform(schema.readSync());
const out = await createStack(cfdoc, name, region)
console.log('Application creation successfully started. It may take a few minutes to finish.')
```

The `GraphQLTransform` class implements a single `transform()` function that when invoked parses the document, walks the AST, and when a directive such as **@model** is found invokes any relevant transformers. 
In this case the transformers were defined for you but the code is structured to make writing custom transformers as simple as possible. 
The output of the above code is a full CloudFormation document that defines DynamoDB tables, an Elasticsearch cluster, a lambda function to stream from DynamoDB -> Elasticsearch,
an AppSync API, AppSync data sources, CRUD resolvers (create, update, delete, get, list, search), resolvers that implement connections between types stored in different DynamoDB tables, 
a number of minimally scoped IAM roles, 

## GraphQL Transform Libraries

The code is contained in a mono-repo that includes a number of packages that are related to the transform and a number of packages that are not. The related packages are broken up as follows

**amplify-graphql-transform**

The package contains the core of the library and acts as the entry point to the transform. The core class `GraphQLTransform` takes as config a list of transformers and handles the logic that parses the input SDL, walks the AST, and routes directives to transformers.

**amplify-graphql-dynamodb-transformer**

This package implements a number of directives that deal with DynamoDB. Out of the box, this implements the **@model** and **connection** directives.

**amplify-graphql-elasticsearch-transformer**

This package implements any directives that deal with Elasticsearch. Out of the box, this implements the **@searchable** directive.

**amplify-graphql-auth-transformer**

This package implements any directives related to authN or authZ workflows. Out of the box, it configures an *Amazon Cognito UserPool* and implements the **@auth** directive.

**amplify-graphql-transform-cli**

This package implements a bare bones and easy to use CLI for interacting with the model transform. It can be used as an example of how to call into the transform and can also be used for simple debugging.

**amplify-graphql-transformer-e2e-tests**

This pacakge implements end-to-end tests for the transform libraries. It builds an API with the transform, deploys it via CloudFormation, and hits the AppSync data plane to test all generated code paths.

**amplify-graphql-mapping-template**

This package provides a lightweight wrapper around the AppSync Resolver VTL and is used by transformer libraries as a convenience.

### Prerequisites

* You will need to have [nodejs and npm installed](https://nodejs.org/en/download/).
* You will then need to install `lerna` and `yarn` as npm global packages.
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
