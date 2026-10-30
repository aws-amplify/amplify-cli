Solves #14517.

## Issue Summary

When a Gen 1 function has secrets stored as SSM `SecureString` parameters, the `generate` command outputs the raw SSM path as a string literal in the `environment` block instead of using Gen 2's `secret()` API. The fix generalizes the existing `API_KEY`-only secret detection to recognize any env var whose value matches the SSM secret path pattern.

## Reasoning

1. In Gen 1, secrets are stored as SSM SecureString parameters at `/amplify/{appId}/{env}/AMPLIFY_{funcName}_{KEY}`. The path is set as the env var value, and the function fetches it at runtime via `@aws-sdk/client-ssm`.
2. In Gen 2, `secret('KEY')` handles this automatically — the value is fetched at function load time and available via `process.env.KEY`.
3. Read `function.renderer.ts` — found `renderEnvironment()` which already had a special case for `API_KEY` that checked if the value starts with the SSM prefix and emits `secret('API_KEY')`. But it was hardcoded to only match the key `API_KEY`.
4. The fix generalizes the condition: any env var whose value starts with `/amplify/{appId}/{envName}/` is treated as a secret, using the env var's own key name in the `secret()` call.

## Solution

- **`function.renderer.ts`** — Changed the secret detection from `key === 'API_KEY' && value.startsWith(...)` to just `value.startsWith(ssmSecretPrefix)`. The `secret()` call now uses the actual key name instead of hardcoded `'API_KEY'`.
- **`function.generator.test.ts`** — Added test `'renders SSM secret env vars as secret() calls'` that mocks a function with two SSM-path env vars and one regular env var, verifying the output uses `secret('MY_SECRET')` and `secret('ANOTHER_SECRET')` while keeping `DB_HOST: 'localhost'` as a literal.
- **product-catalog snapshot** — Updated `lowstockproducts/resource.ts` golden snapshot (the function had an SSM-path env var that now renders as `secret()`).

## Example

**Input (Gen 1 — deployed function config):**
```json
{
  "Environment": {
    "Variables": {
      "MY_SECRET": "/amplify/d1abc2def3/main/AMPLIFY_myFunc_MY_SECRET",
      "DB_HOST": "localhost"
    }
  }
}
```

**Output — before fix (resource.ts):**
```ts
import { defineFunction } from '@aws-amplify/backend';

export const myFunc = defineFunction({
  environment: {
    MY_SECRET: '/amplify/d1abc2def3/main/AMPLIFY_myFunc_MY_SECRET',
    DB_HOST: 'localhost',
  },
});
```

**Output — after fix (resource.ts):**
```ts
import { defineFunction, secret } from '@aws-amplify/backend';

export const myFunc = defineFunction({
  environment: {
    MY_SECRET: secret('MY_SECRET'),
    DB_HOST: 'localhost',
  },
});
```
