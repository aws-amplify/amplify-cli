# Issues Found During Test Restructuring

## auth.renderer.ts — deriveMfaConfig hardcodes sms: true

`deriveMfaConfig` always sets `sms: true` when MfaConfiguration is ON or OPTIONAL.
It should check `mfa.SmsMfaConfiguration` to determine whether SMS MFA is actually
enabled. A user pool could have MFA ON with only TOTP and no SMS.

File: `amplify/auth/auth.renderer.ts`, method `deriveMfaConfig`

## auth.renderer.ts — deriveStandardUserAttributes only includes Required attributes

`deriveStandardUserAttributes` filters with `attribute.Required`, so non-required
standard attributes (e.g. `given_name` with `Required: false`) are silently dropped.
If a Gen1 app has optional standard attributes configured, they won't appear in the
Gen2 output. This may be intentional (Gen2 only supports required attributes) but
should be documented or warned about.

File: `amplify/auth/auth.renderer.ts`, method `deriveStandardUserAttributes`

## auth.renderer.ts — buildUserPoolClientStatements always emits addClient

When `options.userPoolClient` is present (non-undefined), `buildUserPoolClientStatements`
always emits a `userPool.addClient('NativeAppClient', ...)` call. This happens even for
the webClient path — the generator passes both `webClient` and `userPoolClient` from
two separate `fetchUserPoolClient` calls (one for AppClientIDWeb, one for AppClientID).
If both are the same client (some Gen1 apps only have one), the generated code would
create a duplicate client.

File: `amplify/auth/auth.renderer.ts`, method `buildUserPoolClientStatements`

## auth.renderer.ts — buildProviderSetupStatements emits commented-out code

`buildProviderSetupStatements` emits a commented-out `tryRemoveChild('UserPoolDomain')`
line using AST nodes that produce invalid syntax (`// backend.auth.resources.userPool.node.tryRemoveChild`
as a property access chain starting with a comment). This works because the printer
happens to format it as a comment, but it's fragile — it relies on the TS printer's
behavior with identifiers that start with `//`.

File: `amplify/auth/auth.renderer.ts`, method `buildProviderSetupStatements`

## auth.renderer.ts — SAML only supports one provider

`deriveExternalProviders` overwrites `samlProvider` on each iteration, so if there
are multiple SAML providers, only the last one is kept. The code should either
support an array of SAML providers or throw an error if more than one is found.

File: `amplify/auth/auth.renderer.ts`, method `deriveExternalProviders`

## rest-api.renderer.ts — extractMethods falls through to GET for unknown permissions

`extractMethods` maps `read`→`GET`, `create`→`POST`, `update`→`PUT`, `delete`→`DELETE`.
Any permission string not in this map is silently dropped. If all permissions are
unknown, the method falls back to `['GET']`. This means a typo in the Gen1 config
(e.g. `'Read'` instead of `'read'`) would silently produce a GET-only policy instead
of failing.

File: `amplify/rest-api/rest-api.renderer.ts`, method `mapPermissionsToMethods`

## rest-api.renderer.ts — gen1Policy uses wildcard path regardless of actual paths

`renderGen1Policy` always generates `arnForExecuteApi(method, '/*')` for the gen1 API
reference, granting access to all paths on the gen1 API. The per-path policies
(`renderAuthPathPolicy`, `renderGroupPathPolicy`) correctly scope to specific paths,
but the gen1 policy is a blanket wildcard. This is overly permissive — it should
scope to the same paths as the new API policies.

File: `amplify/rest-api/rest-api.renderer.ts`, method `renderGen1Policy`

## data.renderer.ts — renderLogging has unreachable branches

`extractLoggingConfig` returns either `undefined` (when no log config or level is NONE)
or an object with `fieldLogLevel` and optionally `excludeVerboseContent`. It never
returns `true` or a non-object value. But `renderLogging` checks `logging === true`
and `typeof logging !== 'object'` — these branches are dead code that can never execute
given the current `extractLoggingConfig` implementation.

File: `amplify/data/data.renderer.ts`, methods `renderLogging` and `extractLoggingConfig`

## data.renderer.ts — extractAdditionalAuthProviders renames openIDConnectConfig

`extractAdditionalAuthProviders` reads `provider.openIDConnectConfig` (uppercase `D`)
from the SDK type but writes it as `openIdConnectConfig` (lowercase `d`) in the
output object. This renamed property is only used in `buildAdditionalAuthProviderStatements`
for the escape hatch, where it's iterated generically — so the rename doesn't cause
a runtime bug. But it's inconsistent with the SDK naming and could confuse readers
or break if the escape hatch code ever accesses the property by name.

File: `amplify/data/data.renderer.ts`, method `extractAdditionalAuthProviders`

## function.renderer.ts — classifyEnvVars STORAGE\_ suffix ordering causes misclassification

`classifyEnvVars` iterates suffix groups in order. For `STORAGE_` prefixed vars, the
suffixes are `_STREAMARN`, `_BUCKETNAME`, `_ARN`, `_NAME`. Since `_ARN` is a suffix
of `_STREAMARN`, a variable like `STORAGE_MYTABLE_STREAMARN` could match `_ARN` first
if the iteration order changes. Currently the order is correct (`_STREAMARN` before
`_ARN`), but this is fragile — there's no guard ensuring longer suffixes are checked
first.

File: `amplify/function/function.renderer.ts`, function `classifyEnvVars`

## function.renderer.ts — convertScheduleExpression silently drops unsupported units

`convertScheduleExpression` maps `minute(s)`→`m`, `hour(s)`→`h`, `day(s)`→`d` for
rate expressions. But `week(s)`, `month(s)`, and `year(s)` are valid CloudWatch rate
units that are silently dropped (returns `undefined`). The caller doesn't warn about
the dropped schedule.

File: `amplify/function/function.renderer.ts`, function `convertScheduleExpression`

## Duplicated import-splicing pattern across renderers

`auth.renderer.ts`, `function.renderer.ts`, and `data.renderer.ts` all contain the
same pattern for splicing additional imports between base imports and non-import nodes:
iterate base nodes, detect first non-import, insert additional imports before it, handle
the edge case where all nodes are imports. This is duplicated logic with the same
`foundFirstNonImport` flag pattern. The fallback branch (all nodes are imports) is
untested in all three files.

Files: `auth.renderer.ts` (lines 188-212), `function.renderer.ts` (lines 126-146),
`data.renderer.ts` (render method)
