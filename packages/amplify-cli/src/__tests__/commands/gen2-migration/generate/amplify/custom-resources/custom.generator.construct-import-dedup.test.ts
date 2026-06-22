import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { CustomResourceGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/custom-resources/custom.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { RootPackageJsonGenerator } from '../../../../../../commands/gen2-migration/generate/package.json.generator';
import { SpinningLogger } from '../../../../../../commands/gen2-migration/_common/spinning-logger';
import { DEFAULT_STATEFUL_RESOURCES } from '../../../../../../commands/gen2-migration/_common/resource-types';

describe('CustomResourceGenerator - Construct import deduplication', () => {
  let outputDir: string;
  let origCwd: () => string;
  const logger = new SpinningLogger('test');

  beforeEach(async () => {
    outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'construct-import-dedup-'));
    origCwd = process.cwd;
  });

  afterEach(async () => {
    process.cwd = origCwd;
    await fs.rm(outputDir, { recursive: true, force: true });
  });

  it('does not inject duplicate Construct import when source uses double quotes', async () => {
    // cdk-stack.ts with double-quote Construct import already present
    const cdkStackContent = [
      'import * as cdk from "aws-cdk-lib";',
      'import { Construct } from "constructs";',
      '',
      'export class cdkStack extends cdk.Stack {',
      '  constructor(scope: Construct, id: string, props?: cdk.StackProps) {',
      '    super(scope, id, props);',
      '  }',
      '}',
      '',
    ].join('\n');

    // Set up gen1 project structure
    const customDir = path.join(outputDir, 'amplify', 'backend', 'custom', 'myRes');
    await fs.mkdir(customDir, { recursive: true });
    await fs.writeFile(path.join(customDir, 'cdk-stack.ts'), cdkStackContent, 'utf-8');
    await fs.writeFile(path.join(customDir, 'package.json'), JSON.stringify({ dependencies: {}, devDependencies: {} }), 'utf-8');

    await fs.mkdir(path.join(outputDir, 'amplify', 'backend', 'types'), { recursive: true });
    const configDir = path.join(outputDir, 'amplify', '.config');
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(path.join(configDir, 'project-config.json'), JSON.stringify({ projectName: 'testProj' }), 'utf-8');

    process.cwd = () => outputDir;

    const backendGen = new BackendGenerator(outputDir, logger);
    const pkgGen = new RootPackageJsonGenerator(outputDir);
    const gen1App = { statefulResourceTypes: [...DEFAULT_STATEFUL_RESOURCES] } as unknown as { statefulResourceTypes: string[] };

    const generator = new CustomResourceGenerator(gen1App as any, backendGen, pkgGen, outputDir, 'myRes', logger);
    const ops = await generator.plan();
    await ops[0].execute();

    const constructContent = await fs.readFile(path.join(outputDir, 'amplify', 'custom', 'myRes', 'construct.ts'), 'utf-8');

    // There must be exactly ONE import from 'constructs' or "constructs"
    const constructsImports = (constructContent.match(/from ['"]constructs['"]/g) || []).length;
    expect(constructsImports).toBe(1);
  });
});
