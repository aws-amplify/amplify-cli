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
