# Custom Resource Migration for Gen 2

This migration tool automatically converts Gen 1 AmplifyHelper function calls to Gen 2-compatible CDK code.

## Usage

```bash
# Run the migration command
amplify gen2-migration generate
```

## What it does

### 1. Finds Custom Resources
- Scans `amplify/backend/custom/`
- Scans `amplify/backend/function/`
- Scans `amplify/backend/api/`

### 2. Transforms AmplifyHelper Calls

**Before (Gen 1):**
```typescript
import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';

const projectName = AmplifyHelpers.getProjectInfo().projectName;
const envName = AmplifyHelpers.getProjectInfo().envName;

const retVal = AmplifyHelpers.addResourceDependency(this, 'custom', 'myResource', [
  {category: "api", resourceName: "myApi"}
]);
```

**After (Gen 2):**
```typescript
import { Stack } from 'aws-cdk-lib';

const projectName = Stack.of(this).stackName;
const envName = cdk.Fn.ref('env');

// Resource dependencies are now handled in backend.ts
```

### 3. Updates backend.ts Automatically

The tool automatically updates your `amplify/backend.ts` file:

```typescript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { myResource } from './custom/myResource/resource';

const backend = defineBackend({
  auth,
  data,
  myResource, // Automatically added
});
```

## Supported Transformations

| Gen 1 Function | Gen 2 Equivalent | Description |
|----------------|------------------|-------------|
| `AmplifyHelpers.getProjectInfo().projectName` | `Stack.of(this).stackName` | Gets project name using CDK Stack |
| `AmplifyHelpers.getProjectInfo().envName` | `cdk.Fn.ref('env')` | Gets environment name using CDK reference |
| `AmplifyHelpers.addResourceDependency()` | Handled in `backend.ts` | Dependencies managed by backend definition |

## Migration Report

After running, you'll get a report like:

```
=== CUSTOM RESOURCE MIGRATION REPORT ===

Status: ✅ SUCCESS
Files Transformed: 3

Transformed Files:
  - amplify/backend/custom/myResource/cdk-stack.ts
  - amplify/backend/function/myFunction/src/index.ts
  - amplify/backend/api/myApi/stacks/CustomStack.ts

Resource Dependencies: 2 custom resources with dependencies migrated to backend.ts
```

## Manual Steps After Migration

1. **Review transformed files** - Check that transformations look correct
2. **Test your resources** - Ensure functionality is preserved
3. **Deploy** - Run `npx ampx pipeline-deploy` to deploy Gen 2 resources

## Benefits

- ✅ **Pure CDK code** - Uses standard CDK patterns
- ✅ **Automatic backend.ts updates** - Dependencies handled automatically
- ✅ **No extra files** - Direct transformations without helper files
- ✅ **Type safe** - Full TypeScript support
- ✅ **Future proof** - Standard Gen 2 patterns
