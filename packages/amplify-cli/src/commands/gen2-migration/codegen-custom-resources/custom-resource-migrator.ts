import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { AmplifyHelperTransformer } from './amplify-helper-transformer';

export interface MigrationResult {
  success: boolean;
  transformedFiles: string[];
  errors: string[];
  resourceDependencies: ResourceDependency[];
}

export interface ResourceDependency {
  customResource: string;
  dependencies: Array<{ category: string; resourceName: string }>;
}

export class CustomResourceMigrator {
  static async migrateProject(projectPath: string): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      transformedFiles: [],
      errors: [],
      resourceDependencies: [],
    };

    try {
      const customResourceFiles = this.findCustomResourceFiles(projectPath);

      for (const filePath of customResourceFiles) {
        try {
          const dependencies = this.extractResourceDependencies(filePath);
          if (dependencies.length > 0) {
            const resourceName = this.getResourceNameFromPath(filePath);
            result.resourceDependencies.push({
              customResource: resourceName,
              dependencies,
            });
          }

          const transformed = await this.transformFile(filePath);
          if (transformed) {
            result.transformedFiles.push(filePath);
          }
        } catch (error) {
          result.errors.push(`Error transforming ${filePath}: ${error.message}`);
          result.success = false;
        }
      }

      // Generate backend.ts instructions and modify the file
      if (result.resourceDependencies.length > 0) {
        this.generateBackendInstructions(projectPath, result.resourceDependencies);
        await this.updateBackendFile(projectPath, result.resourceDependencies);
      }
    } catch (error) {
      result.errors.push(`Migration failed: ${error.message}`);
      result.success = false;
    }

    return result;
  }

  private static extractResourceDependencies(filePath: string): Array<{ category: string; resourceName: string }> {
    const content = fs.readFileSync(filePath, 'utf8');
    const dependencies: Array<{ category: string; resourceName: string }> = [];

    // Match addResourceDependency calls and extract dependency arrays
    const addResourceDependencyRegex = /AmplifyHelpers\.addResourceDependency\([^,]+,[^,]+,[^,]+,\s*(\[[^\]]+\])/g;

    let match;
    while ((match = addResourceDependencyRegex.exec(content)) !== null) {
      try {
        // Parse the dependency array
        const dependencyArrayStr = match[1];
        // Simple regex to extract category and resourceName
        const depRegex = /\{\s*category:\s*["']([^"']+)["'],\s*resourceName:\s*["']([^"']+)["']\s*\}/g;

        let depMatch;
        while ((depMatch = depRegex.exec(dependencyArrayStr)) !== null) {
          dependencies.push({
            category: depMatch[1],
            resourceName: depMatch[2],
          });
        }
      } catch (error) {
        // Skip malformed dependency declarations
      }
    }

    return dependencies;
  }

  private static getResourceNameFromPath(filePath: string): string {
    // Extract resource name from path like: amplify/backend/custom/myResource/cdk-stack.ts
    const pathParts = filePath.split(path.sep);
    const customIndex = pathParts.findIndex((part) => part === 'custom');
    return customIndex !== -1 && pathParts[customIndex + 1] ? pathParts[customIndex + 1] : 'unknown';
  }

  private static async updateBackendFile(projectPath: string, dependencies: ResourceDependency[]): Promise<void> {
    const backendPath = path.join(projectPath, 'amplify', 'backend.ts');

    // Check if backend.ts exists
    if (!fs.existsSync(backendPath)) {
      // Create a basic backend.ts if it doesn't exist
      this.createBackendFile(backendPath, dependencies);
      return;
    }

    let backendContent = fs.readFileSync(backendPath, 'utf8');

    // Add imports for custom resources
    const customResources = [...new Set(dependencies.map((d) => d.customResource))];

    for (const resource of customResources) {
      const importStatement = `import { ${resource} } from './custom/${resource}/resource';`;

      // Check if import already exists
      if (!backendContent.includes(importStatement)) {
        // Add import after existing imports
        const importRegex = /(import.*from.*['"];?\s*\n)/g;
        let lastImportMatch;
        let match;

        while ((match = importRegex.exec(backendContent)) !== null) {
          lastImportMatch = match;
        }

        if (lastImportMatch) {
          const insertIndex = lastImportMatch.index + lastImportMatch[0].length;
          backendContent = backendContent.slice(0, insertIndex) + importStatement + '\n' + backendContent.slice(insertIndex);
        } else {
          // No imports found, add at the beginning
          backendContent = importStatement + '\n\n' + backendContent;
        }
      }
    }

    // Add custom resources to defineBackend call
    const defineBackendRegex = /(defineBackend\s*\(\s*\{[^}]*)(}\s*\))/;
    const match = defineBackendRegex.exec(backendContent);

    if (match) {
      let backendConfig = match[1];

      // Add custom resources to the config
      for (const resource of customResources) {
        if (!backendConfig.includes(resource)) {
          // Add comma if needed
          if (!backendConfig.trim().endsWith('{') && !backendConfig.trim().endsWith(',')) {
            backendConfig += ',';
          }
          backendConfig += `\n  ${resource}`;
        }
      }

      backendContent = backendContent.replace(defineBackendRegex, backendConfig + ',\n' + match[2]);
    }

    fs.writeFileSync(backendPath, backendContent);
  }

  private static createBackendFile(backendPath: string, dependencies: ResourceDependency[]): void {
    const customResources = [...new Set(dependencies.map((d) => d.customResource))];

    let backendContent = `import { defineBackend } from '@aws-amplify/backend';\n`;

    // Add imports for custom resources
    customResources.forEach((resource) => {
      backendContent += `import { ${resource} } from './custom/${resource}/resource';\n`;
    });

    backendContent += `\nconst backend = defineBackend({\n`;

    // Add custom resources
    customResources.forEach((resource) => {
      backendContent += `  ${resource},\n`;
    });

    backendContent += `});\n`;

    // Ensure directory exists
    fs.mkdirSync(path.dirname(backendPath), { recursive: true });
    fs.writeFileSync(backendPath, backendContent);
  }

  private static generateBackendInstructions(projectPath: string, dependencies: ResourceDependency[]): void {
    const instructionsPath = path.join(projectPath, 'RESOURCE_DEPENDENCIES_MIGRATION.md');

    let instructions = `# Resource Dependencies Migration Guide

Your custom resources had dependencies that need to be configured in your Gen2 backend.ts file.

## Dependencies Found:

`;

    dependencies.forEach((dep) => {
      instructions += `### ${dep.customResource}\nDepends on:\n`;
      dep.dependencies.forEach((d) => {
        instructions += `- ${d.category}/${d.resourceName}\n`;
      });
      instructions += '\n';
    });

    instructions += `## How to Configure in Gen2:

1. In your \`amplify/backend.ts\` file, ensure all dependent resources are defined:

\`\`\`typescript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
// Import your custom resources
`;

    dependencies.forEach((dep) => {
      instructions += `import { ${dep.customResource} } from './custom/${dep.customResource}/resource';\n`;
    });

    instructions += `
const backend = defineBackend({
  auth,
  data,
`;

    dependencies.forEach((dep) => {
      instructions += `  ${dep.customResource},\n`;
    });

    instructions += `});
\`\`\`

2. Dependencies are automatically handled by the backend definition order.

3. Remove the \`AmplifyHelpers.addResourceDependency\` calls from your custom resource files.

## Resources:
- [Gen2 Custom Resources Guide](https://docs.amplify.aws/react/build-a-backend/add-aws-services/custom-resources/)
`;

    fs.writeFileSync(instructionsPath, instructions);
  }

  private static findCustomResourceFiles(projectPath: string): string[] {
    const files: string[] = [];

    const customResourcePaths = [
      path.join(projectPath, 'amplify', 'backend', 'custom'),
      path.join(projectPath, 'amplify', 'backend', 'function'),
      path.join(projectPath, 'amplify', 'backend', 'api'),
    ];

    for (const customPath of customResourcePaths) {
      if (fs.existsSync(customPath)) {
        this.walkDirectory(customPath, files);
      }
    }

    return files.filter((file) => (file.endsWith('.ts') || file.endsWith('.js')) && this.containsAmplifyHelpers(file));
  }

  private static walkDirectory(dir: string, files: string[]): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        this.walkDirectory(fullPath, files);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  private static containsAmplifyHelpers(filePath: string): boolean {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return content.includes('AmplifyHelpers') || content.includes('@aws-amplify/cli-extensibility-helper');
    } catch {
      return false;
    }
  }

  private static async transformFile(filePath: string): Promise<boolean> {
    const content = fs.readFileSync(filePath, 'utf8');

    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

    const transformed = AmplifyHelperTransformer.transform(sourceFile);
    const finalTransformed = AmplifyHelperTransformer.addRequiredImports(transformed);

    const printer = ts.createPrinter();
    let newContent = printer.printFile(finalTransformed);

    // Handle addResourceDependency calls with string replacement
    newContent = this.handleResourceDependencies(newContent, content);

    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent);
      return true;
    }

    return false;
  }

  private static handleResourceDependencies(newContent: string, originalContent: string): string {
    // Simply remove addResourceDependency calls since we've extracted the info
    const addResourceDependencyRegex =
      /const\s+\w+:\s*AmplifyDependentResourcesAttributes\s*=\s*AmplifyHelpers\.addResourceDependency\([^;]*\);?\s*/g;

    // Also remove standalone calls
    const standaloneRegex = /AmplifyHelpers\.addResourceDependency\([^;]*\);?\s*/g;

    newContent = newContent.replace(addResourceDependencyRegex, '// Resource dependencies are now handled in backend.ts\n');
    newContent = newContent.replace(standaloneRegex, '// Resource dependencies are now handled in backend.ts\n');

    return newContent;
  }

  static generateReport(result: MigrationResult): string {
    let report = '=== CUSTOM RESOURCE MIGRATION REPORT ===\n\n';

    report += `Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}\n`;
    report += `Files Transformed: ${result.transformedFiles.length}\n\n`;

    if (result.transformedFiles.length > 0) {
      report += 'Transformed Files:\n';
      result.transformedFiles.forEach((file) => {
        report += `  - ${file}\n`;
      });
      report += '\n';
    }

    if (result.errors.length > 0) {
      report += 'Errors:\n';
      result.errors.forEach((error) => {
        report += `  - ${error}\n`;
      });
    }

    return report;
  }
}
