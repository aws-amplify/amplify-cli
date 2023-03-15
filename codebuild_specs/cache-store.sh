set -eu

cachedir=$HOME/.s3buildcache
mkdir -p $cachedir

if [[ "${S3_BUILD_CACHE:-}" = "" ]]; then
    echo "Something failed, S3_BUILD_CACHE PHASE"
    exit 0
fi

echo "🧳 Storing build cache at: /root/myCache/}"

if ! (cd $cachedir && tar czv . | aws s3 cp - /root/myCache/}); then
    echo "🧳⚠️  Something went wrong storing the cache."
fi

echo "🧳 Finished."
