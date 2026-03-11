# auth/auth.renderer.ts — AuthRenderer

Pure renderer that produces TypeScript AST for `auth/resource.ts`.

## How It Works

`render(definition)` accepts an `AuthDefinition` and returns a `ts.NodeArray`. It dispatches to either `renderReferenceAuth()` (for imported user pools) or `renderStandardAuth()` (for Amplify-managed pools). The standard path builds a `defineAuth()` call with:

- Login options (email, phone, username, external providers)
- MFA configuration (SMS, TOTP)
- Lambda triggers (pre-signup, post-confirmation, etc.)
- User attributes (standard + custom)
- Groups
- Function access patterns (manageUsers, manageGroups, etc.)

Secret references for OAuth providers generate `secret('name')` calls and emit TODO comments when the secret value can't be resolved.

## Relationship to Other Components

- Called by `AuthGenerator` — receives typed `AuthDefinition`, returns AST nodes
- Defines the `AuthAccess`, `AuthDefinition`, and `FunctionAuthInfo` interfaces used by the generator
- No dependency on `Gen1App` or any AWS SDK types — purely transforms typed input to AST
