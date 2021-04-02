# GraphQL @function Transformer

# Reference Documentation

### @function

The `@function` directive allows you to quickly and easily configure AWS Lambda
resolvers within your AWS AppSync API.

#### Definition

```graphql
directive @function(name: String!, region: String) on FIELD_DEFINITION
```
