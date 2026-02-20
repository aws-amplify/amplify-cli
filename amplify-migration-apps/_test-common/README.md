# _test-common

Shared test utilities for the Amplify migration test apps. These helpers handle Cognito user provisioning, test execution, and common type definitions used across all apps in `amplify-migration-apps/`.

## Files

| File | Description |
|------|-------------|
| `test-apps-test-utils.ts` | Shared type definitions (`AmplifyConfig`, `TestUser`, `TestCredentials`, etc.) and barrel re-exports for backwards compatibility. |
| `signup.ts` | `provisionTestUser` — creates a test user via `AdminCreateUser` and sets a permanent password. Supports email, phone, and username signin patterns. Works even when self-signup is disabled on the user pool. |
| `runner.ts` | `TestRunner` class — runs async test functions, collects failures, and prints a summary. |
| `test-credentials.json` | Static test credentials (email, phone, username, password) consumed by test scripts. |

## Usage

```typescript
import { TestRunner } from '../_test-common/runner';
import { provisionTestUser } from '../_test-common/signup';
import testCredentials from '../_test-common/test-credentials.json';
```

`provisionTestUser` reads the Amplify config to determine the correct Cognito auth flow (which attribute is the signin identifier, which attributes are required at signup) and provisions a confirmed user via admin APIs. It does **not** call `signIn` — the caller handles that in its own module scope so the Amplify auth singleton retains the tokens.
