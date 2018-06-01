# AppSync Model Transform

The AppSync model transform simplifies application development on AWS. With it, you can use the GraphQL Schema Definition Language (SDL) to define the high level data model for an application and the transform handles defining the infrastructure necessary to make it run.

**TLDR** 

It takes a SDL document that defines a data model

```graphql
type Score @table {
    id: ID!
    user: User
    score: Int!
}
type ScoreBoard @table {
    id: ID!
    topScores: [Score] @connection
    game: Game @connection(name: "GameScoreboard")
}
type Game @table {
    id: ID!
    name: String
    scoreBoard: ScoreBoard @connection(name: "GameScoreboard")
}
```

and converts it into a single CloudFormation document that defines the tables and resolvers necessary to implement CRUD operations on the data model.


## Getting Started

This is a mono repo using lerna that includes a number of packages. The packages are broken up as follows

**appsync-cli**

This contains a lightweight CLI to wrap the library. This started simple with `compile` but can grow to include managing S3 uploads and invoking cloudformation directly.

**appsync-mapping-template**

This package contains a TypeScript definition for an AST that lies on top of VTL for AppSync resolvers. This is a work in progress and will continue to evolve with breaking changes.

**cloudform**

This is a fork of this repo https://github.com/bright/cloudform. It has the most recent CloudFormation definitions and will be used until cloudform accepts my PR.

**graphql-transform**

This package contains the core engine implementation. This defines the core interfaces, implements the execution context, and is the entry point for any transform invocation. It takes transformers and handles parsing and walking the GraphQL AST while calling the necessary transformers that managing updating the context.

**simple-appsync-transform**

This package contains a first go transformer. It implements the interface found in graphql-transform and implements a single `@model` directive. 

The application output by this transformer will push all mutations for all types to a single DynamoDB table. It uses a single DynamoDB stream and a single lambda function to stream records to a single index in ElasticSearch. All GraphQL queries read from ElasticSearch and expose powerful full text, geo-location, and analytic capabilities.

```
git clone https://github.com/mikeparisstuff/appsync-model-transform.git .
```


### Prerequisites

You will need to have [nodejs and npm installed](https://nodejs.org/en/download/).

### Installing

Install the dependencies

```
lerna bootstrap
```

And build

```
lerna run build
```

End with an example of getting some data out of the system or using it for a little demo

## Running the tests

Tests are written with [jest](https://facebook.github.io/jest/) and can be run for all packages with 

```
lerna run test
```

## Contributing

TODO

## Versioning

TODO

## Authors

* **Michael Paris** - *Initial work* - [mikeparisstuff](https://github.com/mikeparisstuff)

TODO
See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
