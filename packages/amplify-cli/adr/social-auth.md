# ADR: Social Auth IDP & Domain Handling During Refactor

> **Created:** 2026-05-07

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
OAuth secrets from SSM Parameter Store at deploy time.

### Why Moving IDPs Through the Holding Stack Fails

Two independent reasons prevent UserPoolDomain and UserPoolIdentityProvider from going
through the holding stack alongside the 4 core resources:

1. **Orphaned Fn::GetAtt references**: IDP resources have `Fn::GetAtt` references to
   `AmplifySecretFetcherResource` (stays in Gen2). Moving IDPs to the holding stack
   breaks these references — `Template error: instance of Fn::GetAtt references
undefined resource`.

2. **StackRefactor API property validation**: Replacing orphaned `Fn::GetAtt` with
   placeholder strings passes structural validation but fails because the StackRefactor
   API validates that template property values match live resource state —
   `Resource does not match the destination resource's properties`.

Note: the IdentityPool (a core resource that MUST go through holding) has the same
`Fn::GetAtt` → `AmplifySecretFetcherResource` issue via its `SupportedLoginProviders`
property. This is solved differently — the generate step removes `SupportedLoginProviders`
entirely via CDK escape hatch (see "SupportedLoginProviders Removal" below).

### Approaches Evaluated

**Case 1 — Do nothing.** The refactor succeeds but the next deploy fails with
`DuplicateProviderException` (IDPs) and `InvalidRequest` (domain). Social login works
immediately after refactor but all future deployments are blocked.

**Case 2 — Override.** Add IDP types to `RESOURCE_TYPES` so they move to the holding
stack. On the next deploy, CDK synthesizes fresh IDP and domain resources. However, the
Gen1 pool already has IDPs and a domain (from LambdaCallout), so CFN CREATE fails. The
user must manually delete Gen1's IDPs and domain via Cognito API before deploying —
causing auth downtime during the gap.

**Case 3 — Orphan + Import.** Orphan IDPs and domain from the source stack with
`DeletionPolicy: Retain` (physical resources survive), then re-import them into the
target stack using CloudFormation's `CreateChangeSet(ChangeSetType=IMPORT)`. No
deletion, no recreation, no downtime.

Why import works: CFN import only uses `ResourceIdentifier` (UserPoolId +
ProviderName/Domain) to adopt physical resources. Template property values are metadata
for future updates — empty/placeholder values are accepted. This is distinct from the
StackRefactor API, which validates property match against live state.

Why import is possible: Gen1's IDPs and domain are created by `Custom::LambdaCallout`.
CFN tracks them as custom resource invocations, not as native Cognito types. They're
physically present on the pool but **CFN-unmanaged as native types**, making them
eligible for import.

## Evidence

### Case 2 failure (override approach)

Experimentally verified against a test UserPool:

| Resource                              | CFN CREATE Result                  |
| ------------------------------------- | ---------------------------------- |
| `UserPoolIdentityProvider` (Google)   | `HandlerErrorCode: AlreadyExists`  |
| `UserPoolIdentityProvider` (Facebook) | `HandlerErrorCode: AlreadyExists`  |
| `UserPoolDomain` (different prefix)   | `HandlerErrorCode: InvalidRequest` |

Both test stacks reached `ROLLBACK_COMPLETE`. Failed CREATE attempts did not damage
existing physical resources.

### Case 3 success (orphan + import approach)

Verified in two phases:

**Raw CFN API import**:

- `CreateChangeSet(ChangeSetType=IMPORT)` succeeded for all three resource types
- Stack reached `IMPORT_COMPLETE`, all resources `UPDATE_COMPLETE`
- Non-destructive: `CreationDate` and `LastModifiedDate` unchanged
- Import identifier for `UserPoolDomain` requires both `{UserPoolId, Domain}`
- Template only needs resource type, identifiers, and `DeletionPolicy` — provider
  details and attribute mappings are not validated

**CDK import + deploy**:

- `cdk import --resource-mapping --force` succeeded (fully non-interactive)
- `cdk deploy` succeeded — only `CDKMetadata` created, imported resources untouched
- `cdk diff` post-deploy: zero differences
- Resource mapping keys must use CFN logical IDs, not CDK construct paths

### Key finding: StackRefactor vs CFN Import

|                     | StackRefactor API                          | CFN Import                              |
| ------------------- | ------------------------------------------ | --------------------------------------- |
| Property validation | Validates template values match live state | Does NOT validate — values are metadata |
| Identity mechanism  | Logical ID matching across stacks          | ResourceIdentifier tuple                |
| Use case            | Moving resources between stacks            | Adopting existing physical resources    |

## Decision

**Case 3 (Orphan + Import)** is the chosen approach.

### Implementation

#### Core Resource Types

Only 4 core types move through the holding stack via the standard refactor flow:

```typescript
export const RESOURCE_TYPES = [
  USER_POOL_TYPE, // AWS::Cognito::UserPool
  USER_POOL_CLIENT_TYPE, // AWS::Cognito::UserPoolClient
  IDENTITY_POOL_TYPE, // AWS::Cognito::IdentityPool
  IDENTITY_POOL_ROLE_ATTACHMENT_TYPE, // AWS::Cognito::IdentityPoolRoleAttachment
];
```

UserPoolDomain and UserPoolIdentityProvider are handled via the orphan + import path.

#### Forward Flow

```
updateSource()      → resolves Gen1 template (no-op changeset)
updateTarget()      → resolves Gen2 template (no-op changeset)
beforeMove()        → super.beforeMove() moves 4 core resources to holding
                    → Orphan IDPs + domain from Gen2 (Retain keeps physical resources)
move()              → super.move() moves Gen1 core resources into Gen2
                    → Import Gen1 IDPs + domain into Gen2 under the Gen2-original logical IDs
afterMove()         → empty (not overridden)
```

#### Rollback Flow

```
updateSource()      → resolves Gen2 template (no-op changeset)
updateTarget()      → resolves Gen1 template (no-op changeset)
beforeMove()        → empty (not overridden)
move()              → super.move() moves core resources Gen2 → Gen1
                    → Orphan IDPs + domain from Gen2 (imported during forward)
afterMove()         → super.afterMove() restores P2 core resources from holding → Gen2
                    → Import Gen2's original IDPs + domain back into Gen2
```

#### Import Mechanics

The import step uses `Cfn.importResources()` which wraps `CreateChangeSet(IMPORT)` +
`ExecuteChangeSet` + wait. Template additions use empty `ProviderDetails: {}` and
`AttributeMapping: {}` — CFN import does not validate these values. The next Gen2
deploy regenerates real values from `AmplifySecretFetcherResource`.

**Import identifiers:**

| Resource Type                            | Identifier Keys              |
| ---------------------------------------- | ---------------------------- |
| `AWS::Cognito::UserPoolDomain`           | `{UserPoolId, Domain}`       |
| `AWS::Cognito::UserPoolIdentityProvider` | `{UserPoolId, ProviderName}` |

#### Orphan Mechanics

The orphan step uses `Cfn.orphan()` which re-fetches the template at execute time,
verifies `DeletionPolicy: Retain` on every target resource (throws if missing), removes
the resources, and runs an UpdateStack. Because Retain is present, CloudFormation
disassociates the logical IDs from the physical resources without deleting them.

#### Pool Discovery

The import step needs the UserPool physical ID to build resource identifiers. Discovery
uses `StackFacade.fetchUserPoolId()` — `DescribeStackResources` filtered by
`ResourceType: AWS::Cognito::UserPool` → `PhysicalResourceId`.

- Forward `move()`: reads UserPoolId from Gen1 `amplify-meta.json` output.
- Rollback `afterMove()`: the Gen2-original pool sits in the holding stack at plan
  time (super.afterMove restores it only at execute time), so the pool ID is read from
  the holding stack.

#### SupportedLoginProviders Removal

Gen2's `defineAuth` with `externalProviders` generates `SupportedLoginProviders` on the
IdentityPool, mapping social provider domains to client IDs via `Fn::GetAtt` →
`AmplifySecretFetcherResource`. This property enables direct federation (signing in to
the IdentityPool directly with a social provider token, bypassing the UserPool).

Amplify's social login flow does not use direct federation — it routes through the
UserPool's Hosted UI → UserPoolIdentityProvider → UserPool tokens → IdentityPool via
`CognitoIdentityProviders`. Gen1 never sets `SupportedLoginProviders`. The `generate`
command removes it via a CDK escape hatch:

```typescript
cfnIdentityPool.addPropertyDeletionOverride('SupportedLoginProviders');
```

This eliminates the `Fn::GetAtt` → `AmplifySecretFetcherResource` reference on the
IdentityPool, so the IdentityPool can move through the holding stack without broken
references and `updateTarget()` produces an empty changeset.

#### DeletionPolicy: Retain

Retain is set at three points to ensure physical resources survive both the orphan
operations and eventual Gen1 decommission:

1. **Lock step** — sets Retain on Gen1's `HostedUICustomResourceInputs` and
   `HostedUIProvidersCustomResourceInputs` (Lambda-backed custom resources). Matched by
   logical ID rather than type to avoid retaining unrelated `Custom::LambdaCallout`
   resources. Prevents Lambda delete handlers from destroying IDPs/domain during Gen1
   stack teardown.

2. **Generate step** — emits CDK escape hatches that set Retain on Gen2's
   `UserPoolDomain` and `UserPoolIdentityProvider` resources. Ensures every deploy
   preserves Retain so the forward orphan step's safety check passes.

3. **Import step** — sets Retain and UpdateReplacePolicy inline on all imported resource
   definitions. Ensures the rollback orphan step's safety check passes.

The orphan operation validates Retain at execute time (not plan time) as defense-in-
depth — if a manual template edit removed Retain between plan and execute, the operation
aborts before any destructive mutation.

#### NoEcho Parameter Handling

`DescribeStacks` masks NoEcho parameter values as `"****"`. Passing that back to
UpdateStack/CreateChangeSet would re-resolve Refs to the literal `"****"`, crashing
Lambda-backed custom resources that `JSON.parse` the value (e.g., `hostedUIProviderCreds`
in Gen1 auth stacks). `resolveNoEchoParameters()` sends `UsePreviousValue: true` for
NoEcho params so CloudFormation uses the real stored value. Applied in all four resolve
paths (forward/rollback resolveSource/resolveTarget).

#### Domain Handling

The Gen1 domain prefix (e.g., `myapp-devenv`) differs from Gen2's auto-generated prefix
(e.g., `a1b2c3d4e5f6g7h8i9j0`). The import uses the Gen1 domain value. On the next Gen2
deploy, `domain` is a replacement property — if the template specifies a different
prefix, CloudFormation would delete and recreate the domain (changing the hosted UI URL
and breaking OAuth redirect URIs).

The `generate` command emits a domain override escape hatch:

```typescript
cfnUserPoolDomain.domain = '<gen1-domain-prefix>';
```

This preserves the Gen1 domain prefix after import, so subsequent deploys see zero drift.

### Additional Fixes

#### Output resolver (`cfn-output-resolver.ts`)

- **Ref fallback to PhysicalResourceId**: Intra-stack Refs not exposed as stack Outputs
  now resolve via `DescribeStackResources`
- **Skip Custom:: resources in GetAtt**: Custom resource GetAtt attributes come from
  Lambda response data, not the physical resource ID — left unresolved to prevent
  incorrect substitution
- **ARN double-nesting prevention**: When a runtime output value is already a full ARN,
  returned directly instead of being wrapped

#### Generate fixes (`auth.renderer.ts`)

- Fixed `authorized_scopes` → `authorize_scopes` (Cognito API field name)
- Stopped filtering provider scopes against a hardcoded allowlist
- Preserves custom attribute mappings alongside standard ones
- Emits `SupportedLoginProviders` deletion override on IdentityPool
- Emits domain override with Gen1 prefix
- Fixed cfnIdentityPool to declare exactly once

#### Dead code removal

- Deleted `oauth-values-retriever.ts` — real OAuth secrets are not needed during refactor
- Removed `resolveOAuthParameters` hook from `ForwardCategoryRefactorer`

## Consequences

### What changes

- `auth-cognito-forward.ts`: Overrides `beforeMove()` (orphan) and `move()` (import).
  Exports shared pure functions: `buildImportSpec`, `extractSocialAuthLogicalIds`,
  `extractImportLogicalIds`, `renderImportTable`.
- `auth-cognito-rollback.ts`: Overrides `move()` (orphan) and `afterMove()` (import).
- `cfn.ts`: New `orphan()` method (remove + update with Retain check) and
  `importResources()` method (CreateChangeSet IMPORT + execute + wait).
- `resource-types.ts`: `AUTH_IMPORT_RESOURCES_TO_RETAIN` and
  `AUTH_HOSTED_UI_RESOURCES_TO_RETAIN` constants.
- `lock.ts`: Retains Gen1 HostedUI custom resources by logical ID.
- `cfn-parameter-resolver.ts`: New `resolveNoEchoParameters()` function.
- `cfn-output-resolver.ts`: Ref fallback, Custom:: skip, ARN de-duplication.

### What stays the same

- The core refactor workflow phases (`resolveSource` → `updateSource` → `resolveTarget`
  → `updateTarget` → `beforeMove` → `move` → `afterMove`) are preserved.
- Non-social-auth apps are completely unaffected — orphan/import steps check for
  UserPoolDomain/UserPoolIdentityProvider resources and skip when absent.
- The holding stack pattern is preserved for core resources.

### Risks

- **Domain mismatch on next deploy**: If the generated code does not override the domain
  to match Gen1's prefix, the next deploy triggers a domain replacement, changing the
  hosted UI URL and requiring OAuth redirect URI updates in provider consoles.

- **Secret mismatch**: If SSM secrets at `/amplify/shared/{appId}/` contain different
  credentials than what Gen1's IDPs use, the next deploy updates the IDP credentials.
  The migration guide instructs users to configure SSM secrets matching their Gen1
  credentials.

### Comparison

|                          | Case 1: Do Nothing                      | Case 2: Override                 | Case 3: Orphan + Import      |
| ------------------------ | --------------------------------------- | -------------------------------- | ---------------------------- |
| Code complexity          | None                                    | Minimal                          | High                         |
| Refactor succeeds        | Yes                                     | Yes                              | Yes                          |
| Auth works post-refactor | Yes                                     | Yes                              | Yes                          |
| Next deploy succeeds     | **No**                                  | **No** (without manual deletion) | **Yes**                      |
| Auth downtime            | None during refactor, blocked on deploy | Minutes (IDP deletion gap)       | **None**                     |
| Domain preserved         | Orphaned                                | Changed (breaks redirect URIs)   | **Yes**                      |
| Rollback complexity      | Simple                                  | Simple                           | Higher (mitigated by Retain) |
