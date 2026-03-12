import path from 'node:path';
import fs from 'node:fs/promises';
import ts from 'typescript';
import { JSONUtilities } from '@aws-amplify/amplify-cli-core';
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
const FILTER_FILES = new Set(['package.json', 'yarn.lock']);
const BUILD_ARTIFACTS = ['build', 'node_modules', '.npmrc', 'yarn.lock', 'tsconfig.json'];

/**
 * Generates a single custom resource and contributes to backend.ts.
 *
 * 1. Copies the custom resource directory (excluding package.json, yarn.lock)
 * 2. Transforms cdk-stack.ts using AmplifyHelperTransformer (Gen1 → Gen2)
 * 3. Renames cdk-stack.ts to resource.ts
 * 4. Removes build artifacts
 * 5. Merges custom resource dependencies into root package.json
 * 6. Contributes import and stack creation to backend.ts
 */
export class CustomResourceGenerator implements Generator {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly packageJsonGenerator: RootPackageJsonGenerator;
  private readonly outputDir: string;
  private readonly resourceName: string;

  public constructor(
    gen1App: Gen1App,
    backendGenerator: BackendGenerator,
    packageJsonGenerator: RootPackageJsonGenerator,
    outputDir: string,
    resourceName: string,
  ) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.packageJsonGenerator = packageJsonGenerator;
    this.outputDir = outputDir;
    this.resourceName = resourceName;
  }

  /**
   * Plans the custom resource generation operation.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const rootDir = process.cwd();

    const sourceResourcePath = path.join(rootDir, AMPLIFY_DIR, BACKEND_DIR, CUSTOM_DIR, this.resourceName);
    const destResourcePath = path.join(this.outputDir, AMPLIFY_DIR, CUSTOM_DIR, this.resourceName);

    return [
      {
        describe: async () => [`Migrate amplify/custom/${this.resourceName}/resource.ts`],
        execute: async () => {
          // Copy resource directory (excluding filtered files)
          await fs.mkdir(destResourcePath, { recursive: true });
          await fs.cp(sourceResourcePath, destResourcePath, {
            recursive: true,
            filter: (src) => !FILTER_FILES.has(path.basename(src)),
          });

          // Copy types directory if it exists (idempotent — multiple generators may do this)
          const sourceTypesPath = path.join(rootDir, AMPLIFY_DIR, BACKEND_DIR, TYPES_DIR);
          const destTypesPath = path.join(this.outputDir, AMPLIFY_DIR, TYPES_DIR);
          try {
            await fs.mkdir(destTypesPath, { recursive: true });
            await fs.cp(sourceTypesPath, destTypesPath, { recursive: true });
          } catch (e: unknown) {
            // ENOENT means the types directory doesn't exist — that's fine.
            const isNotFound = e instanceof Error && (e as NodeJS.ErrnoException).code === 'ENOENT';
            if (!isNotFound) {
              throw e;
            }
          }

          const projectName = await readProjectName(rootDir);
          const className = await extractClassName(sourceResourcePath);
          const dependencies = await extractDependencies(sourceResourcePath);

          await transformResource(destResourcePath, projectName);
          await removeBuildArtifacts(destResourcePath);
          await renameCdkStack(destResourcePath);

          await this.mergeDependencies(sourceResourcePath);
          this.contributeToBackend(className, dependencies);
        },
      },
    ];
  }

  /**
   * Merges this resource's package.json dependencies into the root package.json.
   */
  private async mergeDependencies(sourceResourcePath: string): Promise<void> {
    const pkgJsonPath = path.join(sourceResourcePath, 'package.json');
    try {
      const pkg = JSONUtilities.readJson<{ dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>(pkgJsonPath);
      if (pkg?.dependencies) {
        for (const [name, version] of Object.entries(pkg.dependencies)) {
          this.packageJsonGenerator.addDependency(name, version);
        }
      }
      if (pkg?.devDependencies) {
        for (const [name, version] of Object.entries(pkg.devDependencies)) {
          this.packageJsonGenerator.addDevDependency(name, version);
        }
      }
    } catch (e) {
      throw new Error(`Failed to read package.json for custom resource '${this.resourceName}': ${e}`);
    }
  }

  /**
   * Contributes import and instantiation for this custom resource to backend.ts.
   */
  private contributeToBackend(className: string | undefined, dependencies: string[]): void {
    if (!className) return;

    this.backendGenerator.addImport(`./custom/${this.resourceName}/resource`, [className]);

    const args: ts.Expression[] = [
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('backend'), 'createStack'),
        undefined,
        [ts.factory.createStringLiteral(this.resourceName)],
      ),
      ts.factory.createStringLiteral(this.resourceName),
    ];

    // Pass the backend object when the resource has dependencies
    if (dependencies.length > 0) {
      args.push(ts.factory.createIdentifier('backend'));
    }

    this.backendGenerator.addStatement(
      ts.factory.createExpressionStatement(ts.factory.createNewExpression(ts.factory.createIdentifier(className), undefined, args)),
    );
  }
}

/**
 * Extracts the exported class name from a cdk-stack.ts file.
 */
async function extractClassName(sourceResourcePath: string): Promise<string | undefined> {
  const cdkStackFilePath = path.join(sourceResourcePath, 'cdk-stack.ts');
  try {
    const content = await fs.readFile(cdkStackFilePath, { encoding: 'utf-8' });
    return content.match(/export class (\w+)/)?.[1];
  } catch (e) {
    throw new Error(`Failed to read cdk-stack.ts for custom resource '${sourceResourcePath}': ${e}`);
  }
}

/**
 * Extracts category dependencies from AmplifyHelpers.addResourceDependency calls.
 */
async function extractDependencies(sourceResourcePath: string): Promise<string[]> {
  const cdkStackFilePath = path.join(sourceResourcePath, 'cdk-stack.ts');
  try {
    const content = await fs.readFile(cdkStackFilePath, { encoding: 'utf-8' });
    const dependencies: string[] = [];

    const dependencyRegex = /AmplifyHelpers\.addResourceDependency\s*\([^,]+,[^,]+,[^,]+,\s*\[([^\]]+)\]/g;
    let match: RegExpExecArray | null;
    while ((match = dependencyRegex.exec(content)) !== null) {
      const categoryRegex = /category:\s*['"]([^'"]+)['"]/g;
      let categoryMatch: RegExpExecArray | null;
      while ((categoryMatch = categoryRegex.exec(match[1])) !== null) {
        if (!dependencies.includes(categoryMatch[1])) {
          dependencies.push(categoryMatch[1]);
        }
      }
    }

    return dependencies;
  } catch (e) {
    throw new Error(`Failed to read dependencies for custom resource '${sourceResourcePath}': ${e}`);
  }
}

/**
 * Transforms a single custom resource's cdk-stack.ts (Gen1 → Gen2 patterns).
 */
async function transformResource(destResourcePath: string, projectName: string | undefined): Promise<void> {
  const cdkStackFilePath = path.join(destResourcePath, 'cdk-stack.ts');
  let content = await fs.readFile(cdkStackFilePath, { encoding: 'utf-8' });

  // Add Construct import if not present
  if (!content.includes("from 'constructs'")) {
    const importRegex = /(import.*from.*['"]; ?\s*\n)/g;
    let lastImportMatch: RegExpExecArray | null = null;
    let regexMatch: RegExpExecArray | null;
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
}

/**
 * Removes build artifacts from a custom resource directory.
 */
async function removeBuildArtifacts(destResourcePath: string): Promise<void> {
  for (const artifact of BUILD_ARTIFACTS) {
    try {
      await fs.rm(path.join(destResourcePath, artifact), { recursive: true, force: true });
    } catch {
      // Artifact doesn't exist
    }
  }
}

/**
 * Renames cdk-stack.ts to resource.ts.
 */
async function renameCdkStack(destResourcePath: string): Promise<void> {
  const cdkStackPath = path.join(destResourcePath, 'cdk-stack.ts');
  const resourceFilePath = path.join(destResourcePath, 'resource.ts');
  try {
    await fs.rename(cdkStackPath, resourceFilePath);
  } catch (e) {
    throw new Error(`Failed to rename cdk-stack.ts to resource.ts for custom resource: ${e}`);
  }
}

/**
 * Reads the project name from amplify/.config/project-config.json.
 */
async function readProjectName(rootDir: string): Promise<string | undefined> {
  try {
    const projectConfigPath = path.join(rootDir, AMPLIFY_DIR, '.config', 'project-config.json');
    const projectConfig = JSONUtilities.readJson<{ projectName?: string }>(projectConfigPath);
    return projectConfig?.projectName;
  } catch (e) {
    throw new Error(`Failed to read project config: ${e}`);
  }
}
