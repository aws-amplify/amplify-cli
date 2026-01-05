# Implementation Plan: CloudFormation Custom Resource Syntax Migration

## Feature Type: MIGRATION

## What I Found in Documentation

### Gen1 Custom Resource Types

#### Type 1: CDK Custom Resources (Already Implemented ✅)
- Service: `customCDK`
- File: `amplify/backend/custom/<resourceName>/cdk-stack.ts`
- Handled by: `AmplifyHelperTransformer` + `command-handlers.ts`

#### Type 2: Raw CloudFormation Templates (Needs Implementation ❌)
- Service: `customCloudformation`
- File: `amplify/backend/custom/<resourceName>/<resourceName>-cloudformation-template.json`
- Needs: `CfnInclude` wrapper generation

### Gen1 CloudFormation Template Structure
```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Parameters": {
    "env": { "Type": "String" },
    "storagemyTableArn": { "Type": "String" }
  },
  "Resources": {
    "MyQueue": {
      "Type": "AWS::SQS::Queue",
      "Properties": {
        "QueueName": { "Fn::Join": ["-", ["my-queue", {"Ref": "env"}]] }
      }
    }
  },
  "Outputs": {
    "QueueArn": { "Value": {"Fn::GetAtt": ["MyQueue", "Arn"]} }
  }
}
```

### Gen2 Target: CfnInclude Wrapper
```typescript
// amplify/custom/<resourceName>/resource.ts
import { Construct } from 'constructs';
import { CfnInclude } from 'aws-cdk-lib/cloudformation-include';
import * as path from 'path';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export class MyCustomResource extends Construct {
  public readonly template: CfnInclude;

  constructor(scope: Construct, id: string, storage?: any) {
    super(scope, id);

    this.template = new CfnInclude(this, 'Template', {
      templateFile: path.join(__dirname, 'template.json'),
      parameters: {
        env: branchName,
        storagemyTableArn: storage?.resources?.bucket?.bucketArn,
      },
    });
  }
}
```

## What Exists in Current Codebase

### Existing Code That Can Be Reused

| File | What It Does | Reusable For CFN? |
|------|--------------|-------------------|
| `command-handlers.ts` | Orchestrates custom resource migration | ✅ Add CFN detection |
| `AmplifyHelperTransformer` | Transforms CDK TypeScript | ❌ Not applicable |
| `DependencyMerger` | Merges package.json dependencies | ✅ Reuse directly |
| `FileConverter` | Converts cdk-stack.ts → resource.ts | ⚠️ Extend for CFN |
| `BackendUpdater` | Updates backend.ts registrations | ✅ Reuse directly |
| `extractResourceDependencies()` | Extracts dependencies from CDK | ⚠️ Need CFN version |

### Key Detection Point
In `amplify-meta.json`:
```json
{
  "custom": {
    "myCdkResource": { "service": "customCDK" },
    "myCfnResource": { "service": "customCloudformation" }
  }
}
```

## Task List

### Task 0: Add service type detection in `updateCustomResources()`
**What needs to change**: Check `amplify-meta.json` for `service` field to distinguish `customCDK` vs `customCloudformation`
**Why**: Different migration paths for CDK vs CloudFormation resources
**Current state**: `getCustomResources()` returns all custom resources without service type

```typescript
// command-handlers.ts
const getCustomResourcesWithType = (): Map<string, 'customCDK' | 'customCloudformation'> => {
  const meta = stateManager.getMeta();
  const customCategory = meta?.custom;
  const resourceMap = new Map<string, 'customCDK' | 'customCloudformation'>();
  
  if (customCategory) {
    Object.entries(customCategory).forEach(([name, config]) => {
      resourceMap.set(name, config.service);
    });
  }
  return resourceMap;
};
```

### Task 1: Extract dependencies from CloudFormation Parameters
**What needs to change**: Parse CFN template `Parameters` section to find Amplify resource dependencies (pattern: `<category><resourceName><attribute>`)
**Why**: Need to pass these as `CfnInclude` parameters in Gen2
**Current state**: `extractResourceDependencies()` only parses TypeScript for `AmplifyHelpers.addResourceDependency()`

```typescript
// New function in command-handlers.ts
const extractCfnDependencies = async (templatePath: string): Promise<string[]> => {
  const template = JSON.parse(await fs.readFile(templatePath, 'utf-8'));
  const params = Object.keys(template.Parameters || {});
  
  // Filter out 'env' and extract category from param names like 'storagemyTableArn'
  const categories = new Set<string>();
  const categoryPattern = /^(auth|storage|api|function)/;
  
  params.filter(p => p !== 'env').forEach(param => {
    const match = param.match(categoryPattern);
    if (match) categories.add(match[1]);
  });
  
  return Array.from(categories);
};
```

### Task 2: Create CfnInclude wrapper generator
**What needs to change**: Generate `resource.ts` that wraps the CloudFormation template with `CfnInclude`
**Why**: Gen2 requires Construct classes, not raw CloudFormation
**Current state**: `FileConverter` only handles CDK TypeScript conversion

```typescript
// New class: cfn-include-generator.ts
export class CfnIncludeGenerator {
  async generateWrapper(
    resourceName: string,
    className: string,
    dependencies: string[],
    outputPath: string
  ): Promise<void> {
    const constructorParams = dependencies.map(cat => 
      `${AmplifyHelperTransformer.CATEGORY_MAP[cat] || cat}?: any`
    ).join(', ');
    
    const parameterMappings = this.generateParameterMappings(dependencies);
    
    const code = `import { Construct } from 'constructs';
import { CfnInclude } from 'aws-cdk-lib/cloudformation-include';
import * as path from 'path';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export class ${className} extends Construct {
  public readonly template: CfnInclude;

  constructor(scope: Construct, id: string${constructorParams ? ', ' + constructorParams : ''}) {
    super(scope, id);

    this.template = new CfnInclude(this, 'Template', {
      templateFile: path.join(__dirname, 'template.json'),
      parameters: {
        env: branchName,
${parameterMappings}
      },
    });
  }
}
`;
    await fs.writeFile(path.join(outputPath, 'resource.ts'), code);
  }
}
```

### Task 3: Copy and rename CloudFormation template
**What needs to change**: Copy `<resourceName>-cloudformation-template.json` → `template.json` in Gen2 location
**Why**: Simpler naming, `CfnInclude` references it by path
**Current state**: Template stays in Gen1 location with original name

```typescript
// In updateCustomResources()
if (serviceType === 'customCloudformation') {
  const srcTemplate = path.join(sourceDir, resource, `${resource}-cloudformation-template.json`);
  const destTemplate = path.join(destDir, resource, 'template.json');
  await fs.copyFile(srcTemplate, destTemplate);
}
```

### Task 4: Update `updateCustomResources()` to handle both types
**What needs to change**: Branch logic based on service type - use existing transformer for CDK, new generator for CFN
**Why**: Single entry point for all custom resource migration
**Current state**: Only handles CDK resources

```typescript
// Modified updateCustomResources() in command-handlers.ts
export async function updateCustomResources() {
  const resourcesWithType = getCustomResourcesWithType();
  
  for (const [resource, serviceType] of resourcesWithType) {
    if (serviceType === 'customCDK') {
      // Existing CDK migration logic
      await updateCdkStackFile([resource], destinationPath, rootDir);
    } else if (serviceType === 'customCloudformation') {
      // New CFN migration logic
      const templatePath = path.join(sourceDir, resource, `${resource}-cloudformation-template.json`);
      const dependencies = await extractCfnDependencies(templatePath);
      
      await fs.copyFile(templatePath, path.join(destDir, resource, 'template.json'));
      
      const generator = new CfnIncludeGenerator();
      await generator.generateWrapper(resource, `${resource}CustomResource`, dependencies, path.join(destDir, resource));
    }
  }
  
  // BackendUpdater handles both types (already works)
  await backendUpdater.updateBackendFile(backendFilePath, customResourceMap, resourceDependencies);
}
```

### Task 5: Update `getCustomResourceMap()` to handle CFN resources
**What needs to change**: Generate class names for CFN resources (they don't have existing class names in source)
**Why**: `BackendUpdater` needs class names for imports
**Current state**: Extracts class name from `cdk-stack.ts` via regex

```typescript
// Modified getCustomResourceMap()
const getCustomResourceMap = async (): Promise<Map<string, string>> => {
  const resourcesWithType = getCustomResourcesWithType();
  const customResourceMap = new Map<string, string>();

  for (const [resource, serviceType] of resourcesWithType) {
    if (serviceType === 'customCDK') {
      // Existing: extract from cdk-stack.ts
      const cdkStackContent = await fs.readFile(cdkStackFilePath, 'utf-8');
      const className = cdkStackContent.match(/export class (\w+)/)?.[1];
      if (className) customResourceMap.set(resource, className);
    } else {
      // New: generate class name for CFN resources
      const className = `${pascalCase(resource)}CustomResource`;
      customResourceMap.set(resource, className);
    }
  }
  return customResourceMap;
};
```

### Task 6: Add `aws-cdk-lib/cloudformation-include` to dependencies
**What needs to change**: Ensure `DependencyMerger` includes `aws-cdk-lib` (which contains `cloudformation-include`)
**Why**: `CfnInclude` is part of `aws-cdk-lib`
**Current state**: May already be included for CDK resources, verify it's present
