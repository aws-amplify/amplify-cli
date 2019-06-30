# GraphQL Docs generator

GraphQL document generator takes a schema and generates all possible statements (queries, mutations and subscription) on that schema. This can act as a starting point for users who are new to GraphQL or want to quickly generate examples on how to use your GraphQL service.

## Installation and execution from the command line

```bash
npm install -g amplify-graphql-docs-generator
amplify-graphql-docs-generator --schema test-data/schema.json --output all-operations.graphql --language graphql
```

## Example usage to generate queries from a schema within an app

```bash
npm install --save amplify-graphql-docs-generator
```

```javascript
import { readFileSync } from 'fs'

import { buildSchema, graphqlSync, introspectionQuery } from 'graphql'
import generateQueries from 'amplify-graphql-docs-generator'

// Read in a schema in GraphQL format
const schema = readFileSync('your-schema.graphql', 'utf8')
const schemaAst = buildSchema(schema)

const schemaIntrospection = graphqlSync(schemaAst, introspectionQuery)
const generatedQueries = generateQueries(schemaIntrospection.data, { maxDepth: 4 })

// Possible queries based on input schema
console.log(generatedQueries)
```

```javascript
import { generateAndSave } from 'amplify-graphql-docs-generator'

// Read in an existing schema.json introspection file and output queries to an all-operations.graphql file
generateAndSave('schema.json', 'all-operations.graphql', {
  separateFiles: false,
  language: 'graphql',
  maxDepth: 2,
})
```

## Todo

- [x] Add support for subscriptions
- [x] Add type information
- [X] Add unit tests
- [ ] Support generating operation by downloading schema from a GraphQL server
- [x] Support generation of separate files (queries.graphql, mutations.graphql and subscriptions.graphql)
- [ ] Support de-duping of fragments (non inline fragments)
