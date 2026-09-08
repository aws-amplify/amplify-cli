import path from 'node:path';
import fs from 'node:fs/promises';
import ts from 'typescript';
import { JSONUtilities } from '@aws-amplify/amplify-cli-core';
import { Planner } from '../../../_common/planner';
import { AmplifyMigrationOperation } from '../../../_common/operation';
import { BackendGenerator } from '../backend.generator';
import { RootPackageJsonGenerator } from '../../package.json.generator';
import { AmplifyHelperTransformer } from './amplify-helper-transformer';
import { SpinningLogger } from '../../../_common/spinning-logger';
import { Gen1App } from '../../../_common/gen1-app';

const CUSTOM_DIR = 'custom';
const TYPES_DIR = 'types';
const AMPLIFY_DIR = 'amplify';
const BACKEND_DIR = 'backend';
const FILTER_FILES = new Set(['package.json', 'yarn.lock']);
const BUILD_ARTIFACTS = ['build', 'node_modules', '.npmrc', 'yarn.lock', 'package-lock.json', 'tsconfig.json'];

/**
 * Packages that should not be merged into the root package.json.
 * CDK v1 scoped packages are subsumed by aws-cdk-lib in v2.
 * Gen2 devDependencies (aws-cdk-lib, constructs, aws-cdk) are already
 * provided by RootPackageJsonGenerator. Gen1-only helpers are unused in Gen2.
 */
const EXCLUDED_DEPENDENCIES = new Set(['aws-cdk-lib', 'constructs', 'aws-cdk', '@aws-amplify/cli-extensibility-helper']);

/** Returns true if the package name should be excluded from the root package.json. */
function isExcludedDependency(name: string): boolean {
  return EXCLUDED_DEPENDENCIES.has(name) || name.startsWith('@aws-cdk/');
}

/** Capitalizes the first letter of a string. */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Generates a single custom resource and contributes to backend.ts.
 *
 * 1. Copies the custom resource directory (excluding package.json, yarn.lock)
 * 2. Transforms cdk-stack.ts using AmplifyHelperTransformer (Gen1 → Gen2)
 * 3. Renames the class to the capitalized resource name
 * 4. Renames cdk-stack.ts to construct.ts
 * 5. Generates a resource.ts wrapper with defineXxx(backend) function
 * 6. Removes build artifacts
 * 7. Merges custom resource dependencies into root package.json
 * 8. Contributes import and defineXxx call to backend.ts
 */
export class CustomResourceGenerator implements Planner {
  private readonly backendGenerator: BackendGenerator;
  private readonly packageJsonGenerator: RootPackageJsonGenerator;
  private readonly outputDir: string;
  private readonly resourceName: string;
  private readonly logger: SpinningLogger;
  private readonly gen1App: Gen1App;

  public constructor(
    gen1App: Gen1App,
    backendGenerator: BackendGenerator,
    packageJsonGenerator: RootPackageJsonGenerator,
    outputDir: string,
    resourceName: string,
    logger: SpinningLogger,
  ) {
    this.backendGenerator = backendGenerator;
    this.packageJsonGenerator = packageJsonGenerator;
    this.outputDir = outputDir;
    this.resourceName = resourceName;
    this.logger = logger;
    this.gen1App = gen1App;
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
        validate: () => undefined,
        describe: async () => [`Migrate amplify/custom/${this.resourceName}/resource.ts`],
        execute: async () => {
          // Copy resource directory (excluding filtered files)
          await fs.mkdir(destResourcePath, { recursive: true });
          await fs.cp(sourceResourcePath, destResourcePath, {
            recursive: true,
            filter: (src) => !FILTER_FILES.has(path.basename(src)),
          });

          // Copy types directory if it exists. Idempotent — harmless if
          // multiple CustomResourceGenerator instances repeat this.
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
          const dependencies = await extractDependencies(sourceResourcePath);
          const constructClassName = capitalize(this.resourceName);

          await transformResource(destResourcePath, projectName, this.resourceName, constructClassName, dependencies);
          await removeBuildArtifacts(destResourcePath);
          await renameCdkStackToConstruct(destResourcePath);
          await generateResourceWrapper(this.gen1App, destResourcePath, this.resourceName, constructClassName, dependencies);

          await this.mergeDependencies(sourceResourcePath);
          this.contributeToBackend(constructClassName);
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
          if (!isExcludedDependency(name)) {
            this.packageJsonGenerator.addDependency(name, version);
          }
        }
      }
      if (pkg?.devDependencies) {
        for (const [name, version] of Object.entries(pkg.devDependencies)) {
          if (!isExcludedDependency(name)) {
            this.packageJsonGenerator.addDevDependency(name, version);
          }
        }
      }
    } catch (e) {
      throw new Error(`Failed to read package.json for custom resource '${this.resourceName}': ${String(e)}`);
    }
  }

  /**
   * Contributes import and defineXxx call for this custom resource to backend.ts.
   */
  private contributeToBackend(constructClassName: string): void {
    const alias = this.resourceName;
    const defineFnName = `define${constructClassName}`;

    this.backendGenerator.addNamespaceImport(alias, `./custom/${this.resourceName}/resource`);
    this.backendGenerator.addPostDefineBackendStatement(`${alias}.${defineFnName}(backend)`);
  }
}

/**
 * Extracts category dependencies from AmplifyHelpers.addResourceDependency calls
 * and amplify-dependent-resources-ref imports.
 */
async function extractDependencies(sourceResourcePath: string): Promise<string[]> {
  const cdkStackFilePath = path.join(sourceResourcePath, 'cdk-stack.ts');
  try {
    const content = await fs.readFile(cdkStackFilePath, { encoding: 'utf-8' });
    const dependencies: string[] = [];

    // Detect AmplifyHelpers.addResourceDependency calls
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

    // Detect amplify-dependent-resources-ref imports as a dependency signal.
    if (dependencies.length === 0 && content.includes('amplify-dependent-resources-ref')) {
      const categoryAccessRegex = /\.\s*(auth|api|storage|function|analytics)\s*\./g;
      let catMatch: RegExpExecArray | null;
      while ((catMatch = categoryAccessRegex.exec(content)) !== null) {
        if (!dependencies.includes(catMatch[1])) {
          dependencies.push(catMatch[1]);
        }
      }
      if (dependencies.length === 0) {
        dependencies.push('unknown');
      }
    }

    return dependencies;
  } catch (e) {
    throw new Error(`Failed to read dependencies for custom resource '${sourceResourcePath}': ${String(e)}`);
  }
}

/**
 * Transforms cdk-stack.ts: applies AST transformations, renames the class,
 * and adds the Backend type import.
 */
async function transformResource(
  destResourcePath: string,
  projectName: string | undefined,
  resourceName: string,
  constructClassName: string,
  dependencies: string[],
): Promise<void> {
  const cdkStackFilePath = path.join(destResourcePath, 'cdk-stack.ts');
  let content = await fs.readFile(cdkStackFilePath, { encoding: 'utf-8' });

  // Add Construct import if not present
  if (!/import\s*\{[^}]*\bConstruct\b[^}]*\}\s*from\s*['"]constructs['"]/.test(content)) {
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

  // Apply AST-based transformations (handles CfnParameter removal, dependency rewrites, etc.)
  const sourceFile = ts.createSourceFile(cdkStackFilePath, content, ts.ScriptTarget.Latest, true);
  const transformedFile = AmplifyHelperTransformer.transform(sourceFile, projectName);
  const transformedWithBranchName = AmplifyHelperTransformer.addBranchNameVariable(transformedFile, projectName);
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  content = printer.printFile(transformedWithBranchName);

  // Rename the exported class from its original name to the capitalized resource name
  content = content.replace(/export class \w+/, `export class ${constructClassName}`);

  // Add Backend type import only when the construct has dependencies
  // (i.e., when the transformer added a `backend` parameter).
  // Place it after other imports to match expected output.
  if (dependencies.length > 0) {
    const importRegex2 = /(import.*from.*['"].*['"];?\s*\n)/g;
    let lastImportMatch2: RegExpExecArray | null = null;
    let regexMatch2: RegExpExecArray | null;
    while ((regexMatch2 = importRegex2.exec(content)) !== null) {
      lastImportMatch2 = regexMatch2;
    }
    if (lastImportMatch2) {
      const insertIndex = lastImportMatch2.index + lastImportMatch2[0].length;
      content = content.slice(0, insertIndex) + "import type { Backend } from '../../backend';\n" + content.slice(insertIndex);
    }
  }

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
 * Renames cdk-stack.ts to construct.ts.
 */
async function renameCdkStackToConstruct(destResourcePath: string): Promise<void> {
  const cdkStackPath = path.join(destResourcePath, 'cdk-stack.ts');
  const constructPath = path.join(destResourcePath, 'construct.ts');
  try {
    await fs.rename(cdkStackPath, constructPath);
  } catch (e) {
    throw new Error(`Failed to rename cdk-stack.ts to construct.ts for custom resource: ${String(e)}`);
  }
}

/**
 * Generates a resource.ts wrapper that exports a defineXxx(backend) function
 * with stateful resource retention policies.
 */
async function generateResourceWrapper(
  gen1App: Gen1App,
  destResourcePath: string,
  resourceName: string,
  constructClassName: string,
  dependencies: string[],
): Promise<void> {
  const defineFnName = `define${constructClassName}`;
  const stackName = `custom${resourceName}`;
  const args = [`backend.createStack('${stackName}')`, `'${resourceName}'`];

  // Pass backend when the resource has dependencies on other categories
  if (dependencies.length > 0) {
    args.push('backend');
  }

  const statefulResourcesArray = gen1App.statefulResourceTypes.map((r) => `  '${r}',`).join('\n');

  const content = [
    "import { CfnResource } from 'aws-cdk-lib';",
    "import type { Backend } from '../../backend';",
    `import { ${constructClassName} } from './construct';`,
    '',
    'export const STATEFUL_RESOURCES = [',
    statefulResourcesArray,
    '];',
    '',
    `export function ${defineFnName}(backend: Backend) {`,
    `  const construct = new ${constructClassName}(${args.join(', ')});`,
    '',
    '  for (const cfnResource of construct.node',
    '    .findAll()',
    '    .filter(',
    '      (c) =>',
    '        CfnResource.isCfnResource(c) &&',
    '        STATEFUL_RESOURCES.includes(',
    '          c.cfnResourceType',
    '        )',
    '    )) {',
    "    (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');",
    "    (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');",
    '  }',
    '',
    '  return construct;',
    '}',
    '',
  ].join('\n');

  const resourceTsPath = path.join(destResourcePath, 'resource.ts');
  await fs.writeFile(resourceTsPath, content, 'utf-8');
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
    throw new Error(`Failed to read project config: ${String(e)}`);
  }
}
