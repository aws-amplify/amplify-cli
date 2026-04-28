# pkg

## Description

This package takes compiled JS and creates a binary that bundles in Node.js.
It copies `yarn.lock` from the monorepo root and uses it to install packages.

## Need to know

The following configuration in `pkg/package.json` prevents later versions of `get-intrinsic`
from being installed. Later versions (at the time of writing, `1.3.1`) pull in dependencies
like `async-function`, which contain module exports with a `module-sync` key.

```json
  "resolutions": {
    "get-intrinsic": "1.3.0"
  },
```

Due to a bug in `@yao-pkg/pkg`, `pkg` errantly uses the `module-sync` key, causing it
to look for a file that does not exist at runtime. Refer to [#189](https://github.com/yao-pkg/pkg/issues/189) for more details.
The resolution above prevents the installation of `get-intrinsic` during runtime,
when the dependencies from `yarn.lock` are installed.

If we ever need to upgrade `get-instrinsic`, the following code may be necessary to patch it:

In `generatePkgCli`, after [package installation](https://github.com/aws-amplify/amplify-cli/blob/e366e6f68ca9be0a83f44236fc8e54bcc632805b/.circleci/local_publish_helpers_codebuild.sh#L65), insert the following code:

```bash
  # Workaround for yao-pkg/pkg#195: pkg's snapshot filesystem can't resolve
  # ESM imports from .mjs files referenced by the "module-sync" export condition.
  # We strip just the "module-sync" line from each affected package.json so pkg
  # falls back to the "default" (CJS) condition instead.
  for esm_pkg in async-function async-generator-function generator-function; do
    pkg_dir="node_modules/$esm_pkg"
    if [ -d "$pkg_dir" ]; then
      sed -i.bak '/"module-sync"/d' "$pkg_dir/package.json" && rm -f "$pkg_dir/package.json.bak"
      echo "Patched $esm_pkg: removed module-sync export (yao-pkg/pkg#195)"
    fi
  done
```

We currently use a resolution instead, as it is easier to maintain and debug.
