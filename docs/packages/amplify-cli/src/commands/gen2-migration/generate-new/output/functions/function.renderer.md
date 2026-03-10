# functions/function.renderer.ts — FunctionRenderer

Pure renderer that produces TypeScript AST for a function's `resource.ts`.

## How It Works

`render(opts)` accepts a `RenderDefineFunctionOptions` and builds a `defineFunction()` call with:

- `entry` — handler file path (e.g., `./index.js`)
- `name` — template literal with branch name (e.g., `myFunc-${branchName}`)
- `timeoutSeconds`, `memoryMB` — from deployed Lambda config
- `environment` — retained env vars; `ENV` becomes a branch name template, `API_KEY` matching the SSM pattern becomes `secret('API_KEY')`
- `runtime` — parsed from nodejs runtime string (e.g., `nodejs18.x` → `18`)
- `schedule` — converted from CloudWatch expressions (`rate(5 minutes)` → `every 5m`, `cron(...)` → raw cron)

Constructed with `appId` and `backendEnvironmentName` for SSM secret pattern matching.

## Relationship to Other Components

- Called by `FunctionGenerator` — receives typed options, returns AST nodes
- No dependency on `Gen1App` — purely transforms input to AST
- Uses `renderResourceTsFile()` from `resource.ts` for the standard resource file structure
