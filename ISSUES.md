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
