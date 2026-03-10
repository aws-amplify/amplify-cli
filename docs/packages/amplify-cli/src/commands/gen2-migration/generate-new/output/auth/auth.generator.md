# auth/auth.generator.ts — AuthGenerator

Generates the auth category resource and contributes overrides to backend.ts.

## How It Works

One per project (not per-resource). In `plan()`, it fetches the full Cognito configuration via `Gen1App`: user pool, MFA config, web client, identity providers, groups, identity pool, and auth trigger connections. It builds an `AuthDefinition` from the raw SDK types, then branches:

- **Reference auth** — When the user pool was imported (not created by Amplify), generates `referenceAuth()` with the pool ID and client IDs.
- **Standard auth** — Generates `defineAuth()` with login options, MFA, external providers, user attributes, groups, and triggers.

Both paths render `auth/resource.ts` via `AuthRenderer`, then call `contributeToBackend()` which adds user pool overrides (password policy, username attributes), identity pool overrides, user pool client overrides (token validity, OAuth settings), and provider setup (Google, Facebook, Apple, OIDC, SAML) to `BackendGenerator`.

## Relationship to Other Components

- Receives `Gen1App`, `BackendGenerator`, and `outputDir`
- Uses `AuthRenderer` (pure) for resource.ts AST construction
- Uses `parseAuthAccessFromTemplate()` from `auth-access-analyzer.ts` to detect function auth access
- `DataGenerator` checks for auth existence to decide whether to add additional auth provider overrides
