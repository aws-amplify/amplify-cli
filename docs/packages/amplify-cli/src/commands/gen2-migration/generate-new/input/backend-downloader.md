# backend-downloader.ts — BackendDownloader

Downloads and caches the current cloud backend zip from S3.

## How It Works

`getCurrentCloudBackend(bucket)` downloads `#current-cloud-backend.zip` from the deployment bucket, extracts it to a temp directory using `unzipper`, and returns the path. A static class-level cache ensures one download per process — subsequent calls return the cached path.

## Relationship to Other Components

- Owned by `Gen1App` — called internally by `fetchCloudBackendDir()`
- The extracted directory is used by `readCloudBackendJson()`, `readCloudBackendFile()`, and `cloudBackendPathExists()`
- In snapshot tests, `BackendDownloader.ccbDir` is monkey-patched to point at the local test app's `#current-cloud-backend` directory, bypassing S3
