# ADR-005: Social Auth IDP & Domain Handling During Refactor

## Status

Accepted — revised after integration testing (see Addendum)

## Context

When `amplify gen2-migration refactor` runs on an app with social identity providers
(Google, Facebook), the command must transfer the UserPool from the Gen1 stack to the
Gen2 stack. The UserPool carries associated resources — identity providers (IDPs) and a
UserPool domain — that differ fundamentally between Gen1 and Gen2.

### How IDPs and Domains Differ Between Gen1 and Gen2

In Gen1, the Cognito domain and identity providers are **not native CloudFormation
resources**. They're created by Lambda-backed custom resources:

```
Gen1 auth stack:
  HostedUICustomResourceInputs:              Custom::LambdaCallout  → creates UserPoolDomain
  HostedUIProvidersCustomResourceInputs:     Custom::LambdaCallout  → creates Google/Facebook IDPs
```

CloudFormation doesn't know these are Cognito IDPs or a domain — it just knows it
invoked a Lambda. The physical IDPs and domain exist on the UserPool but are not
tracked as native CFN resources.

In Gen2, the same resources are **native CloudFormation resources**:

```
Gen2 auth stack:
  amplifyAuthUserPoolUserPoolDomain1F688B5B:  AWS::Cognito::UserPoolDomain
  amplifyAuthGoogleIdPA9736819:               AWS::Cognito::UserPoolIdentityProvider
  amplifyAuthFacebookIDP7CB5B5CC:             AWS::Cognito::UserPoolIdentityProvider
```

Gen2 IDP resources reference `AmplifySecretFetcherResource` via `Fn::GetAtt` to fetch
OAuth secrets from SSM Parameter Store at deploy time:

```json
{
  "Type": "AWS::Cognito::UserPoolIdentityProvider",
  "Properties": {
    "ProviderName": "Google",
    "ProviderType": "Google",
    "UserPoolId": { "Ref": "amplifyAuthUserPool4BA7F805" },
    "ProviderDetails": {
      "client_id": { "Fn::GetAtt": ["AmplifySecretFetcherResource", "GOOGLE_CLIENT_ID"] },
      "client_secret": { "Fn::GetAtt": ["AmplifySecretFetcherResource", "GOOGLE_CLIENT_SECRET"] },
      "authorize_scopes": "openid email profile"
    },
    "AttributeMapping": { "email": "email", "username": "sub" }
  }
}
```

### Current Refactor Flow

The auth refactor currently moves only Cognito-typed resources. The `RESOURCE_TYPES`
list determines what gets filtered:

```
Step 1: updateSource — resolve Gen1 template (no-op changeset)
Step 2: updateTarget — resolve Gen2 template (no-op changeset)
Step 3: beforeMove — move Gen2 resources to holding stack (6 resources)
Step 4: move — move Gen1 resources into Gen2 stack (5 resources)
```

**Step 3 detail: Gen2 → holding (6 resources)**

| Gen2 Logical ID | Type |
|---|---|
| `amplifyAuthUserPool4BA7F805` | `AWS::Cognito::UserPool` |
| `amplifyAuthUserPoolUserPoolDomain1F688B5B` | `AWS::Cognito::UserPoolDomain` |
| `amplifyAuthUserPoolNativeAppClient79534448` | `AWS::Cognito::UserPoolClient` |
| `amplifyAuthUserPoolAppClient2626C6F8` | `AWS::Cognito::UserPoolClient` |
| `amplifyAuthIdentityPool3FDE84CC` | `AWS::Cognito::IdentityPool` |
| `amplifyAuthIdentityPoolRoleAttachment045F17C8` | `AWS::Cognito::IdentityPoolRoleAttachment` |

**Step 4 detail: Gen1 → Gen2 (5 resources)**

| Gen1 Logical ID | → Gen2 Logical ID | Type |
|---|---|---|
| `UserPool` | `amplifyAuthUserPool4BA7F805` | UserPool |
| `UserPoolClientWeb` | `amplifyAuthUserPoolAppClient2626C6F8` | UserPoolClient |
| `UserPoolClient` | `amplifyAuthUserPoolNativeAppClient79534448` | UserPoolClient |
| `IdentityPool` | `amplifyAuthIdentityPool3FDE84CC` | IdentityPool |
| `IdentityPoolRoleMap` | `amplifyAuthIdentityPoolRoleAttachment045F17C8` | IdentityPoolRoleAttachment |

**Key observation:** 6 resources leave Gen2 but only 5 arrive from Gen1. The
`UserPoolDomain` goes to holding and nothing replaces it — Gen1's domain is managed by
`Custom::LambdaCallout`, not a native CFN resource.

**What is NOT moved — and why it's a problem:**

| Gen2 Logical ID | Type | Problem |
|---|---|---|
| `amplifyAuthGoogleIdPA9736819` | UserPoolIdentityProvider | Physical state: IDP on Gen2 pool. Template ref: now resolves to Gen1 pool. |
| `amplifyAuthFacebookIDP7CB5B5CC` | UserPoolIdentityProvider | Same. |
| `AmplifySecretFetcherResource` | Custom::AmplifySecretFetcherResource | Stays. No issue — fetches from SSM. |

After the refactor, the Gen2 IDP resources' `UserPoolId` ref resolves to the Gen1 pool.
`UserPoolId` is a replacement property on `AWS::Cognito::UserPoolIdentityProvider`.
On the next Gen2 deploy, CFN attempts to CREATE new IDPs on the Gen1 pool, which already
has IDPs from LambdaCallout → `DuplicateProviderException`. The domain has a similar
conflict: CFN attempts to CREATE a new domain, but Cognito allows only one domain per
pool → `InvalidRequest`.

### Approaches Evaluated

**Case 1 — Do nothing.** The refactor succeeds but the next deploy fails with
`DuplicateProviderException` (IDPs) and `InvalidRequest` (domain). Social login works
immediately after refactor but all future deployments are blocked.

**Case 2 — Override.** Add `UserPoolIdentityProvider` to `RESOURCE_TYPES` so Gen2 IDPs
move to the holding stack (8 resources total). On the next deploy, CDK synthesizes fresh
IDP and domain resources. However, the Gen1 pool already has IDPs and a domain (from
LambdaCallout), so CFN CREATE fails. The user must manually delete Gen1's IDPs and domain
via Cognito API before deploying — causing auth downtime during the gap.

User impact of Case 2's manual deletion:
- Existing Cognito tokens (access, ID, refresh) remain valid — tokens are issued by the
  UserPool, not the IDP
- Social login becomes immediately unavailable — no new sign-ins via Google/Facebook
- Refresh tokens that trigger re-authentication via the IDP will fail
- User records are NOT deleted — the identity link is preserved in user attributes
- Gap duration: typically minutes (deploy completion), but extends if deploy fails
- Domain deletion takes the hosted UI down immediately; Gen2 deploy creates a new domain
  with a different prefix, requiring OAuth redirect URI updates in Google/Facebook consoles

**Case 3 — Import.** Same holding stack move as Case 2, but after the Gen1 pool moves in,
use CloudFormation's `CreateChangeSet(ChangeSetType=IMPORT)` to adopt the Gen1 pool's
existing IDPs and domain into the Gen2 stack as native CFN resources. No deletion, no
recreation, no downtime.

Why import is possible: Gen1's IDPs and domain are created by `Custom::LambdaCallout`.
CFN tracks them as custom resource invocations, not as `AWS::Cognito::UserPoolIdentityProvider`
or `AWS::Cognito::UserPoolDomain`. They're physically present on the pool but
**CFN-unmanaged as native types**, making them eligible for import.

## Evidence

### Case 2 failure (override approach)

Experimentally verified using `cfn-import-test/override-test.mjs` against UserPool
`us-east-1_TESTPOOL` (app `mediavault-import-test`, ID `d1exampleappid`):

| Resource | CFN CREATE Result |
|----------|-------------------|
| `UserPoolIdentityProvider` (Google) | `HandlerErrorCode: AlreadyExists` |
| `UserPoolIdentityProvider` (Facebook) | `HandlerErrorCode: AlreadyExists` |
| `UserPoolDomain` (different prefix) | `HandlerErrorCode: InvalidRequest` |

Both test stacks reached `ROLLBACK_COMPLETE`. Failed CREATE attempts did not damage
existing physical resources — domain and IDPs unchanged after test.

**Conclusion**: Case 2 requires manual IDP/domain deletion before the next deploy,
causing unavoidable auth downtime. Not viable for production apps.

### Case 3 success (import approach)

Experimentally verified in two phases against the same UserPool:

**Phase 2 — Raw CFN API import** (`cfn-import-test/import-test.mjs`):
- `CreateChangeSet(ChangeSetType=IMPORT)` succeeded for all three resource types
- Stack reached `IMPORT_COMPLETE`, all resources `UPDATE_COMPLETE`
- Non-destructive: `CreationDate` and `LastModifiedDate` unchanged
- Import identifier for `UserPoolDomain` requires both `{UserPoolId, Domain}` (not
  just `{Domain}`)
- Template only needs `client_id`, `client_secret`, `authorize_scopes` in
  ProviderDetails — auto-populated URLs (`attributes_url`, `authorize_url`, etc.)
  are NOT needed

**Phase 3 — CDK import + deploy** (`cfn-import-test/cdk-import-test/`):
- `cdk import --resource-mapping --force` succeeded (fully non-interactive)
- `cdk deploy` succeeded — only `CDKMetadata` created, imported resources untouched
- `cdk diff` post-deploy: zero differences
- IDP `LastModifiedDate` unchanged (2026-04-16) — no update API calls made
- Deploy time: ~13 seconds
- Resource mapping keys must use **CFN logical IDs**, not CDK construct paths

**Conclusion**: Case 3 is viable. Import is non-destructive, zero-downtime, and produces
a clean state where subsequent deploys see zero drift.

### Evidence artifacts

| Artifact | Path |
|----------|------|
| Raw CFN import script | `oauth-workspace/cfn-import-test/import-test.mjs` |
| CDK import app | `oauth-workspace/cfn-import-test/cdk-import-test/` |
| CDK resource mapping | `oauth-workspace/cfn-import-test/cdk-import-test/resource-mapping.json` |
| Override failure script | `oauth-workspace/cfn-import-test/override-test.mjs` |
| Full test results | `oauth-workspace/cfn-import-test/full-context.md` |
| Summary | `oauth-workspace/cfn-import-test/summary.md` |
| Gen1 test app | `oauth-workspace/mediavault-import-test/` (App ID `d1exampleappid`, UserPool `us-east-1_TESTPOOL`) |

## Decision

**Case 3 (Import)** is the chosen approach.

### Implementation

#### 1. Add `UserPoolIdentityProvider` to `RESOURCE_TYPES`

```typescript
export const RESOURCE_TYPES = [
  USER_POOL_TYPE,
  USER_POOL_CLIENT_TYPE,
  IDENTITY_POOL_TYPE,
  IDENTITY_POOL_ROLE_ATTACHMENT_TYPE,
  USER_POOL_DOMAIN_TYPE,
  USER_POOL_IDENTITY_PROVIDER_TYPE,   // added
];
```

Gen2 IDP resources now move to the holding stack alongside other Gen2 Cognito resources
during `beforeMove()` (8 resources instead of 6). This clears the Gen2 stack's IDP
logical IDs so the import can target them.

#### 2. Import Gen1 IDPs and domain in `move()` (appended after standard refactor)

`AuthCognitoForwardRefactorer` overrides `move()` to append an import operation after
the standard `CreateStackRefactor`. The import step:

1. Fetches the Gen1 pool's domain and IDP configuration from the Cognito API
   (`DescribeUserPool`, `ListIdentityProviders`, `DescribeIdentityProvider`)
2. Finds the corresponding Gen2 logical IDs in the Gen2 template (matching by
   resource type and `ProviderName`)
3. Builds a CFN import changeset with `DeletionPolicy: Retain` on all imported
   resources
4. Executes the import via `Cfn.importResources()`

If the app has no social auth (no domain, no IDPs), the import step is skipped — non-
social-auth apps are completely unaffected.

**Import identifiers:**

| Resource Type | Identifier Keys | Example Values |
|---------------|-----------------|----------------|
| `AWS::Cognito::UserPoolDomain` | `{UserPoolId, Domain}` | `us-east-1_EXAMPLE`, `myapp-devenv` |
| `AWS::Cognito::UserPoolIdentityProvider` | `{UserPoolId, ProviderName}` | `us-east-1_EXAMPLE`, `Google` |

**Conceptual CFN API call:**

```typescript
await cfn.send(new CreateChangeSetCommand({
  StackName: gen2AuthStackName,
  ChangeSetName: 'import-social-auth-resources',
  ChangeSetType: 'IMPORT',
  TemplateBody: JSON.stringify(gen2TemplateWithIDPsAndDomain),
  ResourcesToImport: [
    {
      ResourceType: 'AWS::Cognito::UserPoolDomain',
      LogicalResourceId: 'amplifyAuthUserPoolUserPoolDomain1F688B5B',
      ResourceIdentifier: { UserPoolId: 'us-east-1_EXAMPLE', Domain: 'myapp-devenv' },
    },
    {
      ResourceType: 'AWS::Cognito::UserPoolIdentityProvider',
      LogicalResourceId: 'amplifyAuthGoogleIdPA9736819',
      ResourceIdentifier: { UserPoolId: 'us-east-1_EXAMPLE', ProviderName: 'Google' },
    },
    {
      ResourceType: 'AWS::Cognito::UserPoolIdentityProvider',
      LogicalResourceId: 'amplifyAuthFacebookIDP7CB5B5CC',
      ResourceIdentifier: { UserPoolId: 'us-east-1_EXAMPLE', ProviderName: 'Facebook' },
    },
  ],
}));
```

**Template requirements for import:** The template submitted with the import changeset
must include resource definitions with properties matching the physical resource state.
For IDPs, only `client_id`, `client_secret`, and `authorize_scopes` are needed in
`ProviderDetails`. For the domain, the template must use the Gen1 domain prefix (not
Gen2's auto-generated prefix).

#### 3. Decommission safety via `DeletionPolicy: Retain`

After the refactor moves the Gen1 pool to Gen2, Gen1's stack still contains the
LambdaCallout custom resources (`HostedUICustomResourceInputs`,
`HostedUIProvidersCustomResourceInputs`) with `DeletionPolicy: Delete`. These reference
the pool via `{Ref: UserPool}`, which `resolveSource` has already hardcoded to the
literal pool ID. When `decommission` deletes the Gen1 stack, the Lambda delete handlers
fire and call `cognito-idp:DeleteUserPoolDomain` and delete the IDPs from the pool —
which is now in Gen2. This destroys social login.

Two layers of protection:

- **Imported resources in Gen2**: Set `DeletionPolicy: Retain` on all imported IDP and
  domain resources. If rollback removes them from the template, CloudFormation orphans
  them instead of deleting the physical resources.

- **Gen1 LambdaCallout resources**: Set `DeletionPolicy: Retain` on
  `HostedUICustomResourceInputs` and `HostedUIProvidersCustomResourceInputs` in the
  Gen1 stack during `updateSource()`. This prevents the Lambda delete handlers from
  firing when the Gen1 stack is decommissioned. (Implemented in commit `2f725c323d`.)

### Domain handling

The Gen1 domain prefix (e.g., `myapp-devenv`) differs from Gen2's
auto-generated prefix (e.g., `a1b2c3d4e5f6g7h8i9j0`). The import uses the Gen1 domain
value. On the next Gen2 deploy, the domain is a replacement property — if the generated
code specifies a different prefix, CloudFormation would delete and recreate the domain,
which takes the hosted UI down and changes the URL.

The `generate` command should produce a domain override in `backend.ts`:

```typescript
import { CfnUserPoolDomain } from 'aws-cdk-lib/aws-cognito';

const cfnUserPoolDomain = backend.auth.resources.userPool.node
  .findChild('UserPoolDomain')
  .node.defaultChild as CfnUserPoolDomain;
cfnUserPoolDomain.domain = 'myapp-devenv'; // Gen1 domain prefix
```

Implementation note: `auth.generator.ts` `contributeProviderSetup()` already emits a
commented-out `tryRemoveChild("UserPoolDomain")`. This should be replaced with the
domain override escape hatch, using the Gen1 domain value from `DescribeUserPool` or
the `hostedUIDomainName` parameter. This is tracked as an open item in the generate
command.

### Rollback considerations

Rollback (`refactor --rollback`) for Case 3 is more complex than the standard holding
stack swap. The sequence:

1. Remove imported IDP/domain resources from the Gen2 template. With
   `DeletionPolicy: Retain`, CloudFormation orphans them (physical resources survive)
   rather than deleting them.
2. Move the Gen1 pool back to Gen1 (standard rollback via holding stack swap).
3. Restore Gen2's original resources from holding → Gen2 (including Gen2 pool,
   Gen2 IDPs, Gen2 domain).
4. Gen1's LambdaCallout recreates IDPs/domain on the Gen1 pool on the next Gen1
   deploy (or they may already exist if the Gen1 stack still has the custom resources).

With `DeletionPolicy: Retain`, step 1 does not delete the physical IDPs/domain from
the pool. They become orphaned from CFN but remain functional. Social login continues
working through the rollback. This is a significant improvement over the original
design which assumed the imported resources would be deleted during rollback.

## Consequences

### What changes

- `auth-cognito-forward.ts`: `RESOURCE_TYPES` includes `UserPoolIdentityProvider`.
  `move()` is overridden to append the import operation after the standard refactor.
  New private methods: `buildImportSocialAuthOperation()`, `fetchSocialAuthConfig()`,
  `buildImportSpec()`.
- `cfn.ts`: New `importResources()` method wrapping `CreateChangeSet(IMPORT)` +
  `ExecuteChangeSet` + wait.
- Rollback is more complex — see rollback considerations above.

### What stays the same

- The core refactor workflow phases (`resolveSource` → `updateSource` → `beforeMove` →
  `move` → `afterMove`) are preserved. The import is appended to the `move()` phase,
  not added as a new phase.
- Non-social-auth apps are completely unaffected — `fetchSocialAuthConfig()` returns
  `undefined` and the import step is skipped.
- The holding stack pattern is preserved. Gen2's original IDPs go to holding along with
  other Gen2 resources and remain available for rollback.

### Comparison

| | Case 1: Do Nothing | Case 2: Override | Case 3: Import |
|---|---|---|---|
| Code complexity | None | Minimal (1 line) | High (new move extension, Cognito APIs, import API) |
| Refactor succeeds | Yes | Yes | Yes |
| Auth works post-refactor | Yes | Yes | Yes |
| Next deploy succeeds | **No** | **No** (without manual IDP/domain deletion) | **Yes** (if domain/secrets match Gen1) |
| Auth downtime | None during refactor, blocked on deploy | Gap during IDP deletion/recreation (minutes) | **None** |
| Domain handling | Orphaned | Changed to Gen2 prefix (breaks redirect URIs) | Preserved (Gen1 prefix imported) |
| Rollback complexity | Simple | Simple | Higher (import reversal, mitigated by Retain) |
| Manual steps for user | None (but next deploy fails) | Delete IDPs/domain, update OAuth URIs | Override domain in generated code |

### Risks

- **Domain mismatch on next deploy**: If the generated `backend.ts` does not override
  the domain to match Gen1's prefix, the next deploy triggers a domain replacement.
  This changes the hosted UI URL, requiring updates to OAuth redirect URIs in
  Google/Facebook developer consoles.

- **Secret mismatch**: If SSM secrets at `/amplify/shared/{appId}/` contain different
  credentials than what Gen1's IDPs use, the next deploy updates the IDP credentials.
  The migration guide instructs users to configure SSM secrets matching their Gen1
  credentials.

- **IdentityPool `SupportedLoginProviders`**: Removed from the Gen2 template by the
  generate step. Gen1 does not set this property. Amplify's social login flow uses
  `CognitoIdentityProviders` (UserPool-to-IdentityPool mapping), not direct federation
  via `SupportedLoginProviders`. No impact on social login functionality.

### Open questions (from original analysis)

1. **Does `UserPoolIdentityProvider` support CFN IMPORT?** YES — verified (Phase 2).
2. **Does `UserPoolDomain` support CFN IMPORT?** YES — verified. Requires both
   `{UserPoolId, Domain}` (Phase 2).
3. **Can `CreateStackRefactor` move `UserPoolIdentityProvider` resources?** Not directly
   tested. The implementation avoids this by using the existing `RESOURCE_TYPES` filter
   in `beforeMove()`, which only moves resources that are already in the Gen2 template.
4. **Should `decommission` handle IDP/domain cleanup?** Addressed by `DeletionPolicy:
   Retain` on Gen1 LambdaCallout resources — prevents delete handlers from firing.

## Addendum: Revised Approach (Orphan + Import)

### Problem with Original Case 3 Implementation

The original implementation added `UserPoolIdentityProvider` and `UserPoolDomain` to `RESOURCE_TYPES`, causing them to move to the holding stack during `beforeMove()`. This failed because:

1. **Orphaned Fn::GetAtt references**: IDP resources have `Fn::GetAtt` references to `AmplifySecretFetcherResource` (a `Custom::AmplifySecretFetcherResource` that fetches OAuth secrets from SSM). When IDPs move to the holding stack, `AmplifySecretFetcherResource` stays in Gen2 — broken references — `Template error: instance of Fn::GetAtt references undefined resource`.

2. **StackRefactor API property validation**: Attempted fix of replacing orphaned `Fn::GetAtt` with `"PLACEHOLDER"` strings at refactor time passed structural validation but failed because the StackRefactor API (`CreateStackRefactor` + `ExecuteStackRefactor`) validates that template property values match live resource state. `"PLACEHOLDER"` doesn't match real OAuth secrets — `Resource does not match the destination resource's properties`.

3. **IdentityPool also affected**: The IdentityPool (a core resource that MUST go through the holding stack) has `Fn::GetAtt` to `AmplifySecretFetcherResource` in its `SupportedLoginProviders` property.

### Key Findings

**StackRefactor API validates property match**: Contrary to initial assumption, the StackRefactor API does NOT just perform structural template validation. It checks that template resource properties match live resource state. Dummy/placeholder values are rejected.

**CFN Import does NOT validate property match**: CloudFormation's import (`ChangeSetType: IMPORT`) only uses `ResourceIdentifier` to adopt physical resources. Template property values are metadata for future updates — dummy values are accepted.

**CloudFormation accepts PLACEHOLDER for IdentityPool SupportedLoginProviders**: Verified via changeset experiment. A template update replacing `Fn::GetAtt` with `"PLACEHOLDER"` in `SupportedLoginProviders` is accepted (CREATE_COMPLETE, Replacement: False). This allows resolving the IdentityPool's references before it enters the holding stack.

**NoEcho parameter handling is unnecessary**: The Gen1 `hostedUIProviderCreds` NoEcho parameter feeds only into `Custom::LambdaCallout` (stays in Gen1, not refactored). `resolveParameters()` already skips NoEcho params. `updateSource()` produces an empty changeset — the masked `"****"` value never reaches CloudFormation.

### Revised Approach: Orphan + Import

Instead of moving IDPs and domain through the holding stack, **orphan them from the source stack and re-import them into the target stack**. This avoids the `Fn::GetAtt` problem entirely.

**Changes from original Case 3**:

1. **Remove `UserPoolIdentityProvider` and `UserPoolDomain` from `RESOURCE_TYPES`**: Only 4 core types move through the holding stack: UserPool, UserPoolClient, IdentityPool, IdentityPoolRoleAttachment.

2. **Remove `SupportedLoginProviders` from the Gen2 IdentityPool via generate**: The
   CDK `defineAuth` construct with `externalProviders` generates `SupportedLoginProviders`
   on the IdentityPool, mapping social provider domains to client IDs via `Fn::GetAtt` →
   `AmplifySecretFetcherResource`. This property enables **direct federation** — signing
   in to the IdentityPool directly with a social provider token, bypassing the UserPool.
   Amplify's social login flow does not use direct federation; it routes through the
   UserPool's Hosted UI → UserPoolIdentityProvider → UserPool tokens → IdentityPool via
   `CognitoIdentityProviders`. Gen1 never sets `SupportedLoginProviders` on the
   IdentityPool, and social login works correctly without it. The `generate` command
   removes it via a CDK escape hatch:

   ```typescript
   const cfnIdentityPool = backend.auth.resources.cfnResources.cfnIdentityPool;
   cfnIdentityPool.addPropertyDeletionOverride('SupportedLoginProviders');
   ```

   This eliminates the `Fn::GetAtt` → `AmplifySecretFetcherResource` reference on the
   IdentityPool entirely. No PLACEHOLDER substitution is needed in `resolveTarget()`
   (forward) or `resolveSource()` (rollback), and no `expectedTargetChanges()` override
   is needed. Both `updateTarget()` and `updateSource()` produce empty changesets for
   the auth stack.

   An earlier iteration used a PLACEHOLDER approach: `resolveTarget()` replaced the
   `Fn::GetAtt` with `"PLACEHOLDER"` before `updateTarget()` pushed the template. This
   worked for the forward path but caused problems on rollback — the IdentityPool would
   arrive in Gen1 with PLACEHOLDER in `SupportedLoginProviders`, and Gen1's template
   does not declare this property nor do Gen1's LambdaCallouts manage it, so PLACEHOLDER
   would persist permanently.

3. **Orphan IDPs + domain from Gen2 after `super.beforeMove()`**: Remove them from the Gen2 template. Physical resources survive via `DeletionPolicy: Retain`.

4. **Import IDPs + domain into Gen2 in `move()` after `super.move()`**: Simplified `fetchSocialAuthConfig()` — only `ListIdentityProvidersCommand` (ProviderName, ProviderType) and `DescribeUserPoolCommand` (Domain) are needed. Dummy values for ProviderDetails (`client_id: "PLACEHOLDER"`, etc.) and AttributeMapping. CFN import doesn't validate these.

5. **Rollback**: After `super.move()` (Gen2 → Gen1), orphan the imported IDPs + domain from Gen2. After `super.afterMove()` restores holding stack resources (P2) to Gen2, import Gen2's original IDPs + domain back into Gen2.

6. **`DeletionPolicy: Retain` on social auth resources**: Retain is set at two
   points to cover both Gen1 and Gen2:
   - **Gen1 (lock step)**: `lock` sets Retain on `Custom::LambdaCallout` resources
     (`HostedUICustomResourceInputs`, `HostedUIProvidersCustomResourceInputs`) via
     the `retainResource()` framework. This prevents Lambda delete handlers from
     destroying IDPs/domain during decommission.
   - **Gen2 (generate step)**: `generate` emits CDK escape hatches that set Retain
     on `UserPoolDomain` and `UserPoolIdentityProvider` resources. This ensures
     every deploy preserves Retain so the orphan safety check in refactor passes.

### Forward Flow

```
updateTarget()      → empty changeset (no SupportedLoginProviders to resolve)
beforeMove()        → super.beforeMove() moves 4 core resources to holding
                    → Orphan IDPs + domain from Gen2
move()              → super.move() moves Gen1 core resources into Gen2
                    → Import Gen1 IDPs + domain into Gen2 (dummy ProviderDetails)
afterMove()         → empty (not overridden)
```

### Rollback Flow

```
updateSource()      → empty changeset
move()              → super.move() moves core resources Gen2 → Gen1
                    → Orphan IDPs + domain from Gen2 (imported during forward move)
afterMove()         → super.afterMove() restores holding stack resources (P2) to Gen2
                    → Import Gen2 IDPs + domain back into Gen2 (dummy ProviderDetails)
```

### Pool Discovery

Gen2 auth nested stack does not expose a `UserPoolId` output key with a stable CDK-generated name. Pool discovery uses `DescribeStackResources(gen2StackId)` filtered by `ResourceType: AWS::Cognito::UserPool` → `PhysicalResourceId`. Exactly one UserPool exists in Gen2 at each import point:

- Forward `move()` after `super.move()` finds P1 (just moved in from Gen1).
- Rollback `afterMove()` after `super.afterMove()` finds P2 (just restored from holding).

Same call, same filter, for both directions.

### Describe Strategy

Each import/orphan operation reads the Gen2 template at plan time and captures `{providerName → logicalId}` + domain logical ID into its closure — used for the describe() table and for the execute-time import spec. Execute-time work is limited to `DescribeStackResources` (pool discovery) and Cognito API calls (`DescribeUserPool`, `ListIdentityProviders`). No snapshot files are needed: the Gen2-original logical IDs are preserved through the lifecycle because forward's import re-imports Gen1 physical resources *under* the Gen2 original logical IDs.
