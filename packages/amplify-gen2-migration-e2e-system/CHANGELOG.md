# Changelog

## Analytics category support

Added end-to-end support for the Amplify analytics category (Kinesis Data Streams).

### e2e-core: `addKinesisStream` helper

`packages/amplify-e2e-core/src/categories/analytics.ts`

Added a new `addKinesisStream(cwd, { name, shards? })` helper. The existing `addKinesis` helper requires a `wrongName`/`rightName` pair for input validation testing, which doesn't fit the migration system's use case. The new helper takes a stream name and optional shard count directly.

### Type: `AnalyticsConfiguration`

`packages/amplify-gen2-migration-e2e-system/src/types/index.ts`

- Added `AnalyticsConfiguration` interface with `type` (`kinesis` | `pinpoint`), `name`, and optional `shards`.
- Added `analytics?` field to `CategoryConfiguration`.

### Validation

`packages/amplify-gen2-migration-e2e-system/src/core/configuration-loader.ts`

Added `validateAnalyticsConfiguration` — requires `type` to be `kinesis` or `pinpoint`, and `name` to be present.

### Category initialization

`packages/amplify-gen2-migration-e2e-system/src/core/category-initializer.ts`

- Added `initializeAnalyticsCategory` method with Kinesis stream support. Pinpoint is recognized but not yet implemented.
- Analytics is initialized after auth but before functions, since functions like `moodboardKinesisReader` may reference analytics resources.

### Config docs

`packages/amplify-gen2-migration-e2e-system/MIGRATION_CONFIG.md`

Documented the analytics category schema, fields, and validation rules.

### mood-board migration config

`amplify-migration-apps/mood-board/migration-config.json`

Created the migration config for the mood-board app with all its categories: auth (email), api (GraphQL with API_KEY + COGNITO_USER_POOLS, custom queries), storage (S3 with auth + guest), function (two Lambda functions), hosting, and analytics (Kinesis stream `moodboardKinesis` with 1 shard).

---

## S3 storage with user pool groups

Fixed S3 storage initialization failing with a 300-second timeout when auth has user pool groups configured.

### Root cause

When user pool groups exist, the Amplify CLI prompts "Restrict access by?" instead of "Who should have access:". The `addS3Storage` and `addS3StorageWithAuthOnly` helpers don't handle that prompt.

### Fix

`packages/amplify-gen2-migration-e2e-system/src/core/category-initializer.ts`

- `initializeStorageCategory` now accepts the auth config and checks for `userPoolGroups`.
- When groups are present, uses `addS3WithGroupAccess` from e2e-core.
- `addS3WithGroupAccess` is called without custom group name arguments because `addAuthWithGroups` always creates hardcoded `Admins` and `Users` groups regardless of config values.

---

## DynamoDB storage validation

Fixed config validation rejecting DynamoDB storage apps (e.g., `discussions`) because the validator unconditionally required a `buckets` array.

### Fix

`packages/amplify-gen2-migration-e2e-system/src/core/configuration-loader.ts`

`validateStorageConfiguration` now branches on `storage.type`:
- `type === "dynamodb"` — validates `tables` array (each table needs `name` and `partitionKey`).
- Otherwise — validates `buckets` array as before.
