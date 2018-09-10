# GraphQL Operation generator
GraphQL operation generates takes a schema and generates all possible operations on that schema. This can act as a starting point for the users who are new to GraphQL

## Installation and execution
```
$ npm install
$ npm run build
$ ./bin/cli --schema test-data/schema.json --output all-operations.graphql
``` 

## Todo:
- [x] Add support for subscriptions
- [x] Add type information
- [ ] Add unit tests
- [ ] Support generating operation by downloading schema from a GraphQL server
- [ ] Support generation of separate files (queries.graphql, mutations.graphql and subscriptions.graphql)
- [ ] Support de-duping of fragments (non inline fragments)
