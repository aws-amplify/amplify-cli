set -e

cachedir = $HOME/.s3buildcache

# creates directory only if it doesn't exist already
mkdir -p $cachedir

if [[ "${S3_BUILD_CACHE:-}" = "" ]]; then
    exit 0
fi

echo "🧳 Build cache enabled: ${S3_BUILD_CACHE}"
if ! aws s3 ls ${S3_BUILD_CACHE} > /dev/null; then
    echo "🧳⚠️  Cache not found."
    exit 0
fi

if ! (cd $cachedir && aws s3 cp ${S3_BUILD_CACHE} - | tar xzv); then
    echo "🧳⚠️  Something went wrong fetching the cache. Continuing anyway."
fi
