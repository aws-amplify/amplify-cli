import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { CustomResourceGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/custom-resources/custom.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { RootPackageJsonGenerator } from '../../../../../../commands/gen2-migration/generate/package.json.generator';
import { SpinningLogger } from '../../../../../../commands/gen2-migration/_common/spinning-logger';
import { DEFAULT_STATEFUL_RESOURCES } from '../../../../../../commands/gen2-migration/_common/resource-types';

/**
 * Verifies that the constructor parameter count in construct.ts always matches
 * the argument count in the `new <Class>(...)` call in resource.ts, even when
 * addResourceDependency uses a variable for category (which the old regex-based
 * extractDependencies would miss).
 */
describe('CustomResourceGenerator dependency consistency', () => {
  let outputDir: string;
  const logger = new SpinningLogger('test');

  beforeEach(async () => {
    outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dep-consistency-'));
  });

  afterEach(async () => {
    await fs.rm(outputDir, { recursive: true, force: true });
  });

  it('construct.ts ctor params == resource.ts new call args when category is a variable', async () => {
    // cdk-stack.ts: addResourceDependency uses a variable for category — regex misses it,
    // but AST detects the addResourceDependency variable statement → hasDependencies=true
    const cdkStackContent = [
      "import * as cdk from 'aws-cdk-lib';",
      "import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';",
      "import { Construct } from 'constructs';",
      '',
      'export class cdkStack extends cdk.Stack {',
      '  constructor(scope: Construct, id: string, props?: cdk.StackProps) {',
      '    super(scope, id, props);',
      '    const categoryName = `auth`;',
      '    const dependencies = AmplifyHelpers.addResourceDependency(this, props, "varDep", [',
      '      { category: categoryName, resourceName: "userPool" }',
      '    ]);',
      '  }',
      '}',
    ].join('\n');

    // Create gen1 project structure
    const amplifyBackendCustomDir = path.join(outputDir, 'amplify', 'backend', 'custom', 'varDep');
    await fs.mkdir(amplifyBackendCustomDir, { recursive: true });
    await fs.writeFile(path.join(amplifyBackendCustomDir, 'cdk-stack.ts'), cdkStackContent, 'utf-8');
    await fs.writeFile(
      path.join(amplifyBackendCustomDir, 'package.json'),
      JSON.stringify({ dependencies: {}, devDependencies: {} }),
      'utf-8',
    );

    await fs.mkdir(path.join(outputDir, 'amplify', 'backend', 'types'), { recursive: true });

    const configDir = path.join(outputDir, 'amplify', '.config');
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(path.join(configDir, 'project-config.json'), JSON.stringify({ projectName: 'testProj' }), 'utf-8');

    const origCwd = process.cwd;
    process.cwd = () => outputDir;

    try {
      const backendGen = new BackendGenerator(outputDir, logger);
      const pkgGen = new RootPackageJsonGenerator(outputDir);
      const gen1App = { statefulResourceTypes: [...DEFAULT_STATEFUL_RESOURCES] } as any;

      const generator = new CustomResourceGenerator(gen1App, backendGen, pkgGen, outputDir, 'varDep', logger);
      const ops = await generator.plan();
      await ops[0].execute();

      const constructPath = path.join(outputDir, 'amplify', 'custom', 'varDep', 'construct.ts');
      const resourcePath = path.join(outputDir, 'amplify', 'custom', 'varDep', 'resource.ts');

      const constructContent = await fs.readFile(constructPath, 'utf-8');
      const resourceContent = await fs.readFile(resourcePath, 'utf-8');

      // Count constructor params in construct.ts
      const ctorMatch = constructContent.match(/constructor\(([\s\S]*?)\)\s*\{/);
      const ctorParams = ctorMatch ? ctorMatch[1].split(',').filter((p: string) => p.trim()).length : 0;

      // Count args in `new VarDep(...)` call in resource.ts (handle nested parens)
      const newCallMatch = resourceContent.match(/new VarDep\(([\s\S]*?)\);/);
      const newCallArgs = newCallMatch ? newCallMatch[1].split(/,(?![^(]*\))/).filter((a: string) => a.trim()).length : 0;

      // Both must agree: 3 params (scope, id, backend) == 3 args
      expect(newCallArgs).toBe(ctorParams);
      expect(ctorParams).toBe(3);
    } finally {
      process.cwd = origCwd;
    }
  });

  it('construct.ts ctor params == resource.ts new call args when no dependencies', async () => {
    const cdkStackContent = [
      "import * as cdk from 'aws-cdk-lib';",
      "import { Construct } from 'constructs';",
      '',
      'export class cdkStack extends cdk.Stack {',
      '  constructor(scope: Construct, id: string, props?: cdk.StackProps) {',
      '    super(scope, id, props);',
      '  }',
      '}',
    ].join('\n');

    const amplifyBackendCustomDir = path.join(outputDir, 'amplify', 'backend', 'custom', 'noDep');
    await fs.mkdir(amplifyBackendCustomDir, { recursive: true });
    await fs.writeFile(path.join(amplifyBackendCustomDir, 'cdk-stack.ts'), cdkStackContent, 'utf-8');
    await fs.writeFile(
      path.join(amplifyBackendCustomDir, 'package.json'),
      JSON.stringify({ dependencies: {}, devDependencies: {} }),
      'utf-8',
    );

    await fs.mkdir(path.join(outputDir, 'amplify', 'backend', 'types'), { recursive: true });

    const configDir = path.join(outputDir, 'amplify', '.config');
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(path.join(configDir, 'project-config.json'), JSON.stringify({ projectName: 'testProj' }), 'utf-8');

    const origCwd = process.cwd;
    process.cwd = () => outputDir;

    try {
      const backendGen = new BackendGenerator(outputDir, logger);
      const pkgGen = new RootPackageJsonGenerator(outputDir);
      const gen1App = { statefulResourceTypes: [...DEFAULT_STATEFUL_RESOURCES] } as any;

      const generator = new CustomResourceGenerator(gen1App, backendGen, pkgGen, outputDir, 'noDep', logger);
      const ops = await generator.plan();
      await ops[0].execute();

      const constructPath = path.join(outputDir, 'amplify', 'custom', 'noDep', 'construct.ts');
      const resourcePath = path.join(outputDir, 'amplify', 'custom', 'noDep', 'resource.ts');

      const constructContent = await fs.readFile(constructPath, 'utf-8');
      const resourceContent = await fs.readFile(resourcePath, 'utf-8');

      const ctorMatch = constructContent.match(/constructor\(([\s\S]*?)\)\s*\{/);
      const ctorParams = ctorMatch ? ctorMatch[1].split(',').filter((p: string) => p.trim()).length : 0;

      const newCallMatch = resourceContent.match(/new NoDep\(([\s\S]*?)\);/);
      const newCallArgs = newCallMatch ? newCallMatch[1].split(/,(?![^(]*\))/).filter((a: string) => a.trim()).length : 0;

      // Both must agree: 2 params (scope, id) == 2 args
      expect(newCallArgs).toBe(ctorParams);
      expect(ctorParams).toBe(2);
    } finally {
      process.cwd = origCwd;
    }
  });
});
