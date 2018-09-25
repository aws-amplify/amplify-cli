# GraphQL Docs generator
GraphQL document generator takes a schema and generates all possible statements(queries, mutations and subscription) on that schema. This can act as a starting point for the users who are new to GraphQL

## Installation and execution
```
$ npm install -g amplify-graphql-docs-generator
$ amplify-graphql-docs-generator --schema test-data/schema.json --output all-operations.graphql --language graphql
``` 

## Todo:
- [x] Add support for subscriptions
- [x] Add type information
- [X] Add unit tests
- [ ] Support generating operation by downloading schema from a GraphQL server
- [x] Support generation of separate files (queries.graphql, mutations.graphql and subscriptions.graphql)
- [ ] Support de-duping of fragments (non inline fragments)
