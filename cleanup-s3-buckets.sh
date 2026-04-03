#!/bin/bash
set -euo pipefail

# Deletes all S3 buckets whose names start with "amplify" or "projectboards".
# WARNING: This is irreversible. All objects (including versions) will be deleted.

PREFIXES=("amplify" "projectboards" "discus")

buckets=$(aws s3api list-buckets --query 'Buckets[].Name' --output text)

for bucket in $buckets; do
  match=false
  for prefix in "${PREFIXES[@]}"; do
    if [[ "$bucket" == "${prefix}"* ]]; then
      match=true
      break
    fi
  done

  if [ "$match" = true ]; then
    echo ">>> Processing bucket: $bucket"

    # Remove all object versions and delete markers (handles versioned buckets)
    echo "  Removing all object versions..."
    aws s3api list-object-versions --bucket "$bucket" --output json \
      | jq -r '{Objects: [.Versions[]?, .DeleteMarkers[]? | {Key: .Key, VersionId: .VersionId}], Quiet: true}' \
      | aws s3api delete-objects --bucket "$bucket" --delete file:///dev/stdin 2>/dev/null || true

    # Remove any remaining objects (non-versioned)
    echo "  Removing remaining objects..."
    aws s3 rm "s3://$bucket" --recursive 2>/dev/null || true

    # Delete the bucket
    echo "  Deleting bucket..."
    aws s3api delete-bucket --bucket "$bucket"
    echo "  Deleted: $bucket"
  fi
done

echo "Done."
