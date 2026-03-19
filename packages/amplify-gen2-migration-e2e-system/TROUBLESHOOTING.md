# Troubleshooting

Known issues encountered while running the migration system and their solutions.

---

## 1. "Storage buckets must be an array" for DynamoDB storage apps

**Error:**
```
[WARN]  Configuration validation failed for discussions
[WARN]  Storage buckets must be an array
[ERROR] Failed to load configuration for discussions | Error: Failed to load configuration for discussions: App configuration did not pass validation.
```

**Cause:**
The storage validator in `configuration-loader.ts` unconditionally required a `buckets` array, even for apps using DynamoDB storage (`storage.type: "dynamodb"` with a `tables` array). The `discussions` app uses DynamoDB, not S3, so it has no `buckets` field.

**Solution:**
Updated `validateStorageConfiguration` in `src/core/configuration-loader.ts` to branch on `storage.type`:
- When `type === "dynamodb"`, validate the `tables` array (each table must have `name` and `partitionKey`).
- Otherwise, validate the `buckets` array as before.

---

## 2. S3 storage initialization times out when user pool groups are configured

**Error:**
```
Category 'storage' failed: Killed the process as no output receive for 300 Sec.

? Restrict access by? …  (Use arrow keys or type to filter)
❯ Auth/Guest Users
  Individual Groups
  Both
```

**Cause:**
When auth is configured with `userPoolGroups` (e.g., `media-vault` with `["Admin", "Basic"]`), the Amplify CLI prompts "Restrict access by?" instead of the usual "Who should have access:". The `addS3Storage` and `addS3StorageWithAuthOnly` e2e-core helpers don't expect this prompt, so the CLI hangs until the 300-second timeout kills it.

**Solution:**
Updated `initializeStorageCategory` in `src/core/category-initializer.ts` to:
- Accept the auth config and check for `userPoolGroups`.
- When groups are present, use the `addS3WithGroupAccess` e2e-core helper which handles the "Restrict access by?" prompt.
- Fall back to `addS3Storage` / `addS3StorageWithAuthOnly` when no groups exist.

---

## 3. S3 storage with groups times out at "What kind of access do you want for Admins users?"

**Error:**
```
Category 'storage' failed: Killed the process as no output receive for 300 Sec.

✔ Select groups: · Admins, Users

? What kind of access do you want for Admins users? …
❯○ create/update
 ○ read
 ○ delete
```

**Cause:**
`addS3WithGroupAccess` was called with group names from the migration config (`"Admin"`, `"Basic"`), but `addAuthWithGroups` always creates hardcoded groups named `"Admins"` and `"Users"`. The helper uses the group names to match the CLI prompt text (e.g., "What kind of access do you want for Admins users"), so the mismatch caused it to never match the prompt.

**Solution:**
Call `addS3WithGroupAccess(appPath)` without custom group name arguments, letting it use its defaults (`"Admins"` and `"Users"`) which match what `addAuthWithGroups` actually creates.
