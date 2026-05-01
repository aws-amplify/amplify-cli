Solves #14813.

## Issue Summary

Two bugs in the Gen1-to-Gen2 migration `generate` step:

1. **Missing Lambda authorizer import**: When a GraphQL API uses a Lambda authorizer as an additional auth mode, the generated `amplify/data/resource.ts` references the function variable in `lambdaAuthorizationMode` without importing it, causing a build failure.

2. **Hardcoded REGION env var**: The generated `amplify/function/*/resource.ts` files hardcode `REGION` to the literal resolved value (e.g., `'us-east-1'`) from the deployed CloudFormation template, instead of resolving dynamically. This produces incorrect behavior when deployed to a different region.

## Reasoning

**Bug (a):** The `DataRenderer.addLambdaConfig()` method creates `factory.createIdentifier(lambdaFunction)` to reference the function variable in the `lambdaAuthorizationMode` config, but the `render()` method never adds a corresponding import statement. The function is defined in `amplify/function/<name>/resource.ts` and needs to be imported into `data/resource.ts`.

**Bug (b):** The `FunctionRenderer.renderEnvironment()` method handles `ENV` specially (converting it to `${branchName}`) but treats `REGION` as a plain literal string. When the deployed CFN template has `{"Ref": "AWS::Region"}`, the resolved value (e.g., `us-east-1`) gets passed as a literal. Since AWS Lambda automatically provides `process.env.AWS_REGION` in every execution environment, the `REGION` env var should be omitted entirely.

## Solution

**`data.renderer.ts`** — Added `extractLambdaFunctionName()` private method that reads the `authorizationModes` config (both default and additional auth providers) and returns the Lambda function name if a Lambda authorizer is configured. The `render()` method now calls this and emits `import { <funcName> } from '../function/<funcName>/resource'` when present.

**`function.renderer.ts`** — Updated `renderEnvironment()` to skip `REGION` entries entirely. Also added a guard so the `environment` block is omitted when all env vars are filtered out (e.g., when REGION was the only one). Changed from `.map()` to a `for...of` loop with `continue` for cleaner control flow.

**Tests** — Updated the inline snapshot in `data.generator.test.ts` for the "renders Lambda auth mode" test. Added two new tests in `function.generator.test.ts`: one verifying REGION is omitted alongside other env vars, and one verifying the environment block is omitted entirely when REGION is the only env var.

**Golden snapshots** — Updated 18 migration app snapshot files across 9 apps where function `resource.ts` files previously contained `REGION: 'us-east-1'`.

## Example

**Input (Gen 1 / pre-generate):**

`cli-inputs.json`:
```json
{
  "additionalAuthTypes": [
    {
      "mode": "AWS_LAMBDA",
      "lambdaFunction": "graphQlLambdaAuthorizerd351d098",
      "ttlSeconds": "300"
    }
  ]
}
```

Lambda CFN template:
```json
"Environment": {
  "Variables": {
    "ENV": { "Ref": "env" },
    "REGION": { "Ref": "AWS::Region" }
  }
}
```

**Output — before fix (post-generate):**

`data/resource.ts`:
```typescript
import { defineData } from '@aws-amplify/backend';
// ❌ Missing: import { graphQlLambdaAuthorizerd351d098 } from '../function/graphQlLambdaAuthorizerd351d098/resource';

export const data = defineData({
  authorizationModes: {
    lambdaAuthorizationMode: {
      function: graphQlLambdaAuthorizerd351d098, // ❌ undefined
      timeToLiveInSeconds: 300,
    },
  },
  schema,
});
```

`function/graphQlLambdaAuthorizerd351d098/resource.ts`:
```typescript
export const graphQlLambdaAuthorizerd351d098 = defineFunction({
  environment: { ENV: `${branchName}`, REGION: 'us-east-1' }, // ❌ hardcoded
});
```

**Output — after fix (post-generate):**

`data/resource.ts`:
```typescript
import { defineData } from '@aws-amplify/backend';
import { graphQlLambdaAuthorizerd351d098 } from '../function/graphQlLambdaAuthorizerd351d098/resource';

export const data = defineData({
  authorizationModes: {
    lambdaAuthorizationMode: {
      function: graphQlLambdaAuthorizerd351d098, // ✅ imported
      timeToLiveInSeconds: 300,
    },
  },
  schema,
});
```

`function/graphQlLambdaAuthorizerd351d098/resource.ts`:
```typescript
export const graphQlLambdaAuthorizerd351d098 = defineFunction({
  environment: { ENV: `${branchName}` }, // ✅ REGION omitted — AWS_REGION is auto-available
});
```
