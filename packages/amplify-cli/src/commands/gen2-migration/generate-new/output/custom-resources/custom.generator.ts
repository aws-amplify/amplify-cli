import path from 'node:path';
import fs from 'node:fs/promises';
import ts from 'typescript';
import { pathManager } from '@aws-amplify/amplify-cli-core';
import { Generator } from '../../generator';
import { AmplifyMigrationOperation } from '../../../_operation';
import { BackendGenerator } from '../backend.generator';
import { RootPackageJsonGenerator } from '../root-package-json.generator';
import { Gen1App } from '../../input/gen1-app';
import { AmplifyHelperTransformer } from './amplify-helper-transformer';

const CUSTOM_DIR = 'custom';
const TYPES_DIR = 'types';
const AMPLIFY_DIR = 'amplify';
const BACKEND_DIR = 'backend';
const FILTER_FILES = ['package.json', 'yarn.lock'];
const BUILD_ARTIFACTS = ['build', 'node_modules', '.npmrc', 'yarn.lock', 'tsconfig.json'];

/**
 * Generates custom resource files and contributes to backend.ts.
 *
 * For each custom resource in the Gen1 app:
 * 1. Copies the custom resource directory (excluding package.json, yarn.lock)
 * 2. Transforms cdk-stack.ts using AmplifyHelperTransformer (Gen1 → Gen2 patterns)
 * 3. Renames cdk-stack.ts to resource.ts
 * 4. Removes build artifacts
 * 5. Merges custom resource dependencies into root package.json
 * 6. Contributes custom resource imports and stack creation to backend.ts
 */
export class CustomResourcesGenerator implements Generator {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly packageJsonGenerator: RootPackageJsonGenerator;
  private readonly outputDir: string;

  public constructor(
    gen1App: Gen1App,
    backendGenerator: BackendGenerator,
    packageJsonGenerator: RootPackageJsonGenerator,
    outputDir: string,
  ) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.packageJsonGenerator = packageJsonGenerator;
    this.outputDir = outputDir;
  }

  /**
   * Plans the custom resource generation operations.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const customCategory = await this.gen1App.fetchMetaCategory(CUSTOM_DIR);
    if (!customCategory) {
      return [];
    }

    const customResourceNames = Object.keys(customCategory);
    if (customResourceNames.length === 0) {
      return [];
    }

    const rootDir = pathManager.findProjectRoot();
    if (!rootDir) {
      throw new Error('Could not find Amplify project root');
    }

    const sourceCustomPath = path.join(rootDir, AMPLIFY_DIR, BACKEND_DIR, CUSTOM_DIR);
    const destCustomPath = path.join(this.outputDir, AMPLIFY_DIR, CUSTOM_DIR);

    return [
      {
        describe: async () => [`Migrate ${customResourceNames.length} custom resource(s)`],
        execute: async () => {
          await fs.mkdir(destCustomPath, { recursive: true });

          // Copy custom resources (excluding filtered files)
          await fs.cp(sourceCustomPath, destCustomPath, {
            recursive: true,
            filter: (src) => !FILTER_FILES.includes(path.basename(src)),
          });

          // Copy types directory if it exists
          const sourceTypesPath = path.join(rootDir, AMPLIFY_DIR, BACKEND_DIR, TYPES_DIR);
          const destTypesPath = path.join(this.outputDir, AMPLIFY_DIR, TYPES_DIR);
          try {
            await fs.mkdir(destTypesPath, { recursive: true });
            await fs.cp(sourceTypesPath, destTypesPath, { recursive: true });
          } catch {
            // Types directory may not exist
          }

          // Extract dependencies before transformation
          const resourceDependencies = await extractResourceDependencies(customResourceNames, sourceCustomPath);

          // Read project name for transformer
          const projectName = await readProjectName(rootDir);

          // Build custom resource map (name → className)
          const customResourceMap = await buildCustomResourceMap(customResourceNames, sourceCustomPath);

          // Transform each custom resource
          await transformCustomResources(customResourceNames, destCustomPath, projectName);

          // Remove build artifacts
          await removeBuildArtifacts(customResourceNames, destCustomPath);

          // Rename cdk-stack.ts → resource.ts
          await renameCdkStackFiles(customResourceNames, destCustomPath);

          // Merge dependencies from custom resources into root package.json
          await this.mergeCustomDependencies(customResourceNames, sourceCustomPath);

          // Contribute to backend.ts
          this.contributeToBackend(customResourceMap, resourceDependencies);
        },
      },
    ];
  }

  private async mergeCustomDependencies(resourceNames: string[], sourceCustomPath: string): Promise<void> {
    for (const resourceName of resourceNames) {
      const pkgJsonPath = path.join(sourceCustomPath, resourceName, 'package.json');
      try {
        const content = await fs.readFile(pkgJsonPath, 'utf-8');
        const pkg = JSON.parse(content) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
        if (pkg.dependencies) {
          for (const [name, version] of Object.entries(pkg.dependencies)) {
            this.packageJsonGenerator.addDependency(name, version);
          }
        }
        if (pkg.devDependencies) {
          for (const [name, version] of Object.entries(pkg.devDependencies)) {
            this.packageJsonGenerator.addDevDependency(name, version);
          }
        }
      } catch {
        // package.json may not exist for this resource
      }
    }
  }

  private contributeToBackend(customResourceMap: Map<string, string>, resourceDependencies: Map<string, string[]>): void {
    const categoryMap: Record<string, string> = {
      function: 'functions',
      api: 'data',
      storage: 'storage',
      auth: 'auth',
    };

    for (const [resourceName, className] of customResourceMap) {
      // Import: import { ClassName as resourceName } from './custom/resourceName/resource';
      this.backendGenerator.addImport(`./custom/${resourceName}/resource`, [className]);

      // Instantiation: new ClassName(backend.createStack('resourceName'), 'resourceName', ...deps)
      const deps = resourceDependencies.get(resourceName) || [];
      const args: ts.Expression[] = [
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('backend'), 'createStack'),
          undefined,
          [ts.factory.createStringLiteral(resourceName)],
        ),
        ts.factory.createStringLiteral(resourceName),
      ];

      for (const dep of deps) {
        const gen2Name = categoryMap[dep] || dep;
        args.push(ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('backend'), gen2Name));
      }

      this.backendGenerator.addStatement(
        ts.factory.createExpressionStatement(ts.factory.createNewExpression(ts.factory.createIdentifier(className), undefined, args)),
      );
    }
  }
}

async function extractResourceDependencies(resourceNames: string[], sourceCustomPath: string): Promise<Map<string, string[]>> {
  const resourceDependencies = new Map<string, string[]>();

  for (const resource of resourceNames) {
    const cdkStackFilePath = path.join(sourceCustomPath, resource, 'cdk-stack.ts');
    try {
      const content = await fs.readFile(cdkStackFilePath, { encoding: 'utf-8' });
      const dependencies: string[] = [];

      const dependencyRegex = /AmplifyHelpers\.addResourceDependency\s*\([^,]+,[^,]+,[^,]+,\s*\[([^\]]+)\]/g;
      let match;
      while ((match = dependencyRegex.exec(content)) !== null) {
        const categoryRegex = /category:\s*['"]([^'"]+)['"]/g;
        let categoryMatch;
        while ((categoryMatch = categoryRegex.exec(match[1])) !== null) {
          if (!dependencies.includes(categoryMatch[1])) {
            dependencies.push(categoryMatch[1]);
          }
        }
      }

      if (dependencies.length > 0) {
        resourceDependencies.set(resource, dependencies);
      }
    } catch {
      // Skip if file can't be read
    }
  }

  return resourceDependencies;
}

async function buildCustomResourceMap(resourceNames: string[], sourceCustomPath: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  for (const resource of resourceNames) {
    const cdkStackFilePath = path.join(sourceCustomPath, resource, 'cdk-stack.ts');
    try {
      const content = await fs.readFile(cdkStackFilePath, { encoding: 'utf-8' });
      const className = content.match(/export class (\w+)/)?.[1];
      if (className) {
        map.set(resource, className);
      }
    } catch {
      // Skip if file can't be read
    }
  }

  return map;
}

async function transformCustomResources(resourceNames: string[], destCustomPath: string, projectName: string | undefined): Promise<void> {
  for (const resource of resourceNames) {
    const cdkStackFilePath = path.join(destCustomPath, resource, 'cdk-stack.ts');
    try {
      let content = await fs.readFile(cdkStackFilePath, { encoding: 'utf-8' });

      // Add Construct import if not present
      if (!content.includes("from 'constructs'")) {
        const importRegex = /(import.*from.*['"]; ?\s*\n)/g;
        let lastImportMatch: RegExpExecArray | null = null;
        let regexMatch;
        while ((regexMatch = importRegex.exec(content)) !== null) {
          lastImportMatch = regexMatch;
        }

        if (lastImportMatch) {
          const insertIndex = lastImportMatch.index + lastImportMatch[0].length;
          content = content.slice(0, insertIndex) + "import { Construct } from 'constructs';\n" + content.slice(insertIndex);
        } else {
          content = "import { Construct } from 'constructs';\n" + content;
        }
      }

      // Replace CfnParameter for env with default value
      content = content.replace(
        /new cdk\.CfnParameter\(this, ['"]env['"], {[\s\S]*?}\);/,
        `new cdk.CfnParameter(this, "env", {
                type: "String",
                description: "Current Amplify CLI env name",
                default: \`\${branchName}\`
              });`,
      );

      // Apply AST-based transformations
      const sourceFile = ts.createSourceFile(cdkStackFilePath, content, ts.ScriptTarget.Latest, true);
      const transformedFile = AmplifyHelperTransformer.transform(sourceFile, projectName);
      const transformedWithBranchName = AmplifyHelperTransformer.addBranchNameVariable(transformedFile, projectName);
      const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
      content = printer.printFile(transformedWithBranchName);

      await fs.writeFile(cdkStackFilePath, content, { encoding: 'utf-8' });
    } catch (error) {
      throw new Error(`Error transforming custom resource ${resource}`, { cause: error });
    }
  }
}

async function removeBuildArtifacts(resourceNames: string[], destCustomPath: string): Promise<void> {
  for (const resource of resourceNames) {
    const resourceDir = path.join(destCustomPath, resource);
    for (const artifact of BUILD_ARTIFACTS) {
      try {
        await fs.rm(path.join(resourceDir, artifact), { recursive: true, force: true });
      } catch {
        // Artifact doesn't exist
      }
    }
  }
}

async function renameCdkStackFiles(resourceNames: string[], destCustomPath: string): Promise<void> {
  for (const resource of resourceNames) {
    const cdkStackPath = path.join(destCustomPath, resource, 'cdk-stack.ts');
    const resourceFilePath = path.join(destCustomPath, resource, 'resource.ts');
    try {
      await fs.rename(cdkStackPath, resourceFilePath);
    } catch {
      // cdk-stack.ts doesn't exist
    }
  }
}

async function readProjectName(rootDir: string): Promise<string | undefined> {
  try {
    const projectConfigPath = path.join(rootDir, AMPLIFY_DIR, '.config', 'project-config.json');
    const projectConfig = JSON.parse(await fs.readFile(projectConfigPath, { encoding: 'utf-8' }));
    return projectConfig.projectName;
  } catch {
    return undefined;
  }
}
