import * as fs from 'fs-extra';
import * as path from 'path';
import { CustomResourceScanner } from './scanner/custom-resource-scanner';
import { CdkStackParser } from './parser/cdk-stack-parser';
import { PatternDetector } from './parser/pattern-detector';
import { CodeTransformer } from './transformer/code-transformer';
import { Gen2FileGenerator } from './generator/gen2-file-generator';
import { BackendUpdater } from './generator/backend-updater';

export class CustomResourceMigrator {
  private scanner = new CustomResourceScanner();
  private parser = new CdkStackParser();
  private patternDetector = new PatternDetector();
  private transformer = new CodeTransformer();
  private fileGenerator = new Gen2FileGenerator();
  private backendUpdater = new BackendUpdater();

  async migrateCustomResources(gen1ProjectRoot: string, gen2ProjectRoot: string): Promise<void> {
    // Scan for custom resources
    const resources = await this.scanner.scanCustomResources(gen1ProjectRoot);

    if (resources.length === 0) {
      console.log('No custom resources found to migrate');
      return;
    }

    console.log(`Found ${resources.length} custom resource(s) to migrate`);

    const backendUpdates: Array<{ import: string; stackCreation: string; outputs: string }> = [];

    // Process each custom resource
    for (const resource of resources) {
      console.log(`Migrating custom resource: ${resource.name}`);

      // Parse Gen1 CDK stack
      const parsed = await this.parser.parseStack(resource.cdkStackPath);

      // Detect patterns
      const patterns = this.patternDetector.detectPatterns(parsed.constructorBody);

      // Extract outputs
      const outputs = this.patternDetector.extractCfnOutputs(parsed.constructorBody);
      parsed.outputs = outputs;

      // Transform to Gen2
      const transformed = this.transformer.transform(parsed, resource.name);

      // Generate Gen2 resource file
      const resourceFileContent = this.fileGenerator.generateResourceFile(transformed);
      const resourceFilePath = path.join(gen2ProjectRoot, 'amplify', 'custom', resource.name, 'resource.ts');

      await fs.ensureDir(path.dirname(resourceFilePath));
      await fs.writeFile(resourceFilePath, resourceFileContent, 'utf-8');

      console.log(`  ✓ Generated: ${resourceFilePath}`);

      // Generate backend.ts updates
      const backendCode = this.backendUpdater.generateBackendCode(resource.name, transformed.className, outputs);

      backendUpdates.push(backendCode);
    }

    // Write backend updates to a file for manual integration
    const backendInstructionsPath = path.join(gen2ProjectRoot, 'amplify', 'CUSTOM_RESOURCES_BACKEND_UPDATES.md');
    const instructions = this.generateBackendInstructions(backendUpdates);
    await fs.writeFile(backendInstructionsPath, instructions, 'utf-8');

    console.log(`\n✓ Migration complete!`);
    console.log(`  Generated ${resources.length} custom resource file(s)`);
    console.log(`  See ${backendInstructionsPath} for backend.ts updates`);
  }

  private generateBackendInstructions(updates: Array<{ import: string; stackCreation: string; outputs: string }>): string {
    const imports = updates.map((u) => u.import).join('\n');
    const stackCreations = updates.map((u) => u.stackCreation).join('\n\n');
    const outputs = updates
      .filter((u) => u.outputs)
      .map((u) => u.outputs)
      .join('\n\n');

    return `# Custom Resources Backend Updates

Add the following code to your \`amplify/backend.ts\` file:

## 1. Add imports at the top of the file:

\`\`\`typescript
${imports}
\`\`\`

## 2. After \`defineBackend()\`, add custom resource stacks:

\`\`\`typescript
const backend = defineBackend({
  auth,
  data
});

// Add custom resources
${stackCreations}
\`\`\`

${outputs ? `## 3. Add outputs (if needed):\n\n\`\`\`typescript\n${outputs}\n\`\`\`` : ''}
`;
  }
}
