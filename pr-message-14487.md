Solves #14487.

## Issue Summary

The `generate` command sometimes omits `migratedAmplifyGen1DynamoDbTableMappings` from the data resource. This is caused by the model-detection regex `type\s+(\w+)\s+@model` failing when `@model` is not the first directive on a type (e.g., `type Todo @auth(...) @model`).

## Reasoning

1. The issue describes the bug as "sporadic," but investigation revealed it's actually deterministic based on directive ordering in the GraphQL schema.
2. Read `data.generator.ts` — found `createTableMappings()` which uses `type\s+(\w+)\s+@model` to find model types. This regex requires `@model` to immediately follow the type name, so `type Todo @auth(...) @model` doesn't match.
3. The compiled `build/schema.graphql` (produced by the Amplify transformer) is more reliable — it expands each `@model` type into a `Model<Name>Connection` type. Matching `type Model(\w+)Connection` against the build schema is directive-order-independent.
4. The fix reads `build/schema.graphql` when available and falls back to the raw schema regex when it's not.

## Solution

- **`data.generator.ts`** — `createTableMappings()` now first checks for `build/schema.graphql` in the API resource directory. If present, it extracts model names by matching `type Model(\w+)Connection` patterns. Falls back to the original `@model` regex when the build schema is absent.
- **`data.generator.test.ts`** — Added test `'renders table mappings when @model is not the first directive'` with a schema where `@auth` and `@key` precede `@model`, verifying both types are correctly mapped.

## Example

**Input (Gen 1 — schema.graphql):**
```graphql
type Todo @auth(rules: [{ allow: public }]) @model {
  id: ID!
}
type Post @key(name: "byUser") @model {
  id: ID!
}
```

**Output — before fix (resource.ts):**
```ts
export const data = defineData({
  // migratedAmplifyGen1DynamoDbTableMappings is MISSING
  schema,
});
```

**Output — after fix (resource.ts):**
```ts
export const data = defineData({
  migratedAmplifyGen1DynamoDbTableMappings: [
    {
      branchName: 'main',
      modelNameToTableNameMapping: {
        Todo: 'Todo-abc-main',
        Post: 'Post-abc-main',
      },
    },
  ],
  schema,
});
```
