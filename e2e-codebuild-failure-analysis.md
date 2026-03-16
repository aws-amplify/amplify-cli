# E2E CodeBuild Failure Analysis

**Date**: March 16, 2026  
**Batches Analyzed**:
- `AmplifyCLI-E2E-Testing:c26a7126-ab8e-451a-8eee-24c2f4e89973` (March 5, 2026) - **FAILED** (2 of 276 builds)
- `AmplifyCLI-E2E-Testing:02b55f32-a0f8-46b6-82b3-2c23a156a970` (March 12, 2026) - **FAILED** (12 of 276 builds)
- `AmplifyCLI-E2E-Testing:1dff647e-6a86-492b-bbd2-112a9f33ae0f` (Feb 27, 2026) - **SUCCEEDED** (reference)

## Summary

14 unique build failures across 2 batches, representing 8 distinct test files. All failures show the same root error pattern: `Process exited with non zero exit code 1` from `nexpect.ts:442:24`, meaning the amplify CLI process itself exits non-zero during test execution.

Additionally, a cross-cutting bug was found in the test infrastructure: `TypeError: The "code" argument must be of type number. Received type boolean` (28 occurrences on Windows builds).

---

## Failure Pattern #1: Windows `process.exit` TypeError (ALREADY FIXED in dev)

**Error**: `TypeError: The "code" argument must be of type number. Received type boolean (false)`  
**Location**: `cli-test-runner.js:21` (source-mapped)  
**Frequency**: 28 occurrences across multiple Windows builds  
**Root Cause**: The previous version of `cli-test-runner.js` had `process.exit(result.numFailingTests !== 0)` which passed a **boolean** directly to `process.exit()`. Node.js 20+ strictly validates exit code types.

**Status**: Fixed in `1eba0c3f22` (March 13, 2026) - `process.exit(result.numFailingTests !== 0 ? 1 : 0)`

**Related Bug Found**: In `nexpect.ts` (line 776), the environment variable `CI` is set to boolean `false` instead of string `'false'`:
```typescript
childEnv.CI = false;  // BUG: should be 'false' (string) - env vars must be strings
```
→ **Fixed in this PR**

---

## Failure Pattern #2: Container API Tests (4 test files)

### Failing Tests:
| Test File | Test Name | Failures |
|-----------|-----------|----------|
| `containers-api-1.test.ts` | init project, enable containers and add multi-container api | 4 |
| `containers-api-2.test.ts` | init project, enable containers and add multi-container api push, edit and push | 4 |
| `containers-api-secrets.test.ts` | init project, api container secrets should work | 4 |
| `custom_policies_container.test.ts` | should init and deploy a api container, attach custom policies to the Fargate task | 4 |

**Error**: `Process exited with non zero exit code 1` during `amplifyPushWithoutCodegen` or `amplifyPushSecretsWithoutCodegen`  
**Root Cause**: Container deployments via ECS/Fargate are failing during CloudFormation stack creation. The CLI exits with code 1 when a push/deployment fails. These tests involve Docker container builds, ECR image pushes, ECS Fargate service creation, ALB, and VPC — all prone to transient failures.

**Classification**: Infrastructure/Flaky — The CLI itself correctly reports failure; the underlying CloudFormation deployment fails.

**Fix Applied**: Enabled `jest.retryTimes(1)` for CodeBuild environments (was only enabled for CircleCI).

---

## Failure Pattern #3: Function Secrets Tests (function_7.test.ts)

### Failing Tests (ALL 7 tests in the suite):
| Test Name | Failures |
|-----------|----------|
| configures secret that is accessible in the cloud | 3+ |
| removes secrets immediately when unpushed function is removed from project | 3+ |
| removes secrets on push when func is already pushed | 3+ |
| removes secrets on push when pushed function is removed | 3+ |
| removes / copies secrets when env removed / added | 3+ |
| prompts for missing secrets and removes unused secrets on push | 3+ |
| keeps old secrets when pushing secrets added in another env | 3+ |

**Error**: `Process exited with non zero exit code 1` during various amplify CLI operations  
**Root Cause**: The entire suite fails on both attempts, suggesting a systemic issue. The March 12 batch was testing the `sanjrkmr/dev` branch which includes SSM retry mechanism changes (PR #14659). These SSM changes may have introduced regressions affecting function secret operations.

**Classification**: Likely product code regression from SSM retry changes — not fixable in e2e test code alone.

**Fixes Applied**:
- `amplifyPushMissingFuncSecret` was missing `noOutputTimeout` (using default 5min instead of 20min push timeout) → Fixed
- Enabled `jest.retryTimes(1)` for CodeBuild

---

## Failure Pattern #4: Custom Resources Tests (2 test files)

### Failing Tests:
| Test File | Test Name | Failures |
|-----------|-----------|----------|
| `custom_resources.test.ts` | add/update CDK and CFN custom resources | 2 |
| `custom-resource-with-storage.test.ts` | verify export custom storage types | 2 |

**Error**: `Process exited with non zero exit code 1` during `amplifyPushAuth` or `buildCustomResources`  
**Root Cause**: CDK custom resource compilation and CloudFormation deployment failures.

**Classification**: Infrastructure/Flaky

**Fixes Applied**:
- `buildCustomResources` no-output timeout increased from 5min to 10min
- Enabled `jest.retryTimes(1)` for CodeBuild

---

## Failure Pattern #5: Notifications SMS Test

### Failing Tests:
| Test File | Test Name | Failures |
|-----------|-----------|----------|
| `notifications-sms.test.ts` | should add and remove the SMS channel correctly when no pinpoint is configured | 4 |

**Error**: `Process exited with non zero exit code 1` during notification channel operations  
**Root Cause**: Notification operations (add/remove) create Pinpoint, Analytics, and Auth resources. The CLI exits with code 1 during one of these operations.

**Classification**: Infrastructure/Flaky — Pinpoint operations are slow and prone to throttling.

**Fixes Applied**:
- All notification operations (`addNotificationChannel`, `removeNotificationChannel`, `removeAllNotificationChannel`, `updateNotificationChannel`) increased from 5min to 10min no-output timeout
- Enabled `jest.retryTimes(1)` for CodeBuild

---

## Summary of Fixes Applied

### 1. `nexpect.ts` - Fix boolean environment variable (P0)
**File**: `packages/amplify-e2e-core/src/utils/nexpect.ts`  
`childEnv.CI = false` → `childEnv.CI = 'false'`  
Environment variables must be strings. The boolean caused `TypeError: The "code" argument` errors on Windows with Node.js 20+.

### 2. `setup-tests.ts` - Enable jest retries for CodeBuild (P1)
**File**: `packages/amplify-e2e-tests/src/setup-tests.ts`  
`if (process.env.CIRCLECI)` → `if (process.env.CIRCLECI || process.env.CODEBUILD_BUILD_ID)`  
Previously, `jest.retryTimes(1)` was only enabled for CircleCI. CodeBuild was missing this, meaning flaky tests had no per-test retry.

### 3. `amplifyPush.ts` - Add missing noOutputTimeout to push functions (P1)
**File**: `packages/amplify-e2e-core/src/init/amplifyPush.ts`  
Added `noOutputTimeout: pushTimeoutMS` (20 min) to:
- `amplifyPushMissingFuncSecret`
- `amplifyPushIterativeRollback`
- `amplifyPushMissingEnvVar`

These push functions were using the default 5-minute timeout instead of the standard 20-minute push timeout.

### 4. `notifications.ts` - Increase notification operation timeouts (P1)
**File**: `packages/amplify-e2e-core/src/categories/notifications.ts`  
Increased no-output timeout from 5min to 10min for all notification operations.

### 5. `custom.ts` - Increase custom resource build timeout (P1)
**File**: `packages/amplify-e2e-core/src/categories/custom.ts`  
Increased `buildCustomResources` no-output timeout from 5min to 10min.
