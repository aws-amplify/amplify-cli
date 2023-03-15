set -eu

cachedir=$HOME/.s3buildcache

# creates directory only if it doesn't exist already
mkdir -p $cachedir

if [[ "/root/myCache/" = "" ]]; then
    exit 0
fi

echo "🧳 Build cache enabled: /root/myCache/"
if ! aws s3 ls /root/myCache/ > /dev/null; then
    echo "🧳⚠️  Cache not found."
    exit 0
fi

if ! (cd $cachedir && aws s3 cp /root/myCache/ . | tar xzv); then
    echo "🧳⚠️  Something went wrong fetching the cache. Continuing anyway."
fi
