import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { AmplifyMigrationStep } from './_infra/step';
import { AmplifyMigrationOperation, ValidationResult } from './_infra/operation';
import { Plan } from './_infra/plan';
import { Gen1App } from './generate/_infra/gen1-app';
import { Planner } from './_infra/planner';
import { AmplifyMigrationAssessor } from './assess';
import { BackendGenerator } from './generate/amplify/backend.generator';
import { RootPackageJsonGenerator } from './generate/package.json.generator';
import { BackendPackageJsonGenerator } from './generate/amplify/package.json.generator';
import { TsConfigGenerator } from './generate/amplify/tsconfig.generator';
import { AmplifyYmlGenerator } from './generate/amplify.yml.generator';
import { GitIgnoreGenerator } from './generate/gitignore.generator';
import { AuthGenerator } from './generate/amplify/auth/auth.generator';
import { ReferenceAuthGenerator } from './generate/amplify/auth/reference-auth.generator';
import { DataGenerator } from './generate/amplify/data/data.generator';
import { RestApiGenerator } from './generate/amplify/rest-api/rest-api.generator';
import { S3Generator } from './generate/amplify/storage/s3.generator';
import { DynamoDBGenerator } from './generate/amplify/storage/dynamodb.generator';
import { FunctionGenerator } from './generate/amplify/function/function.generator';
import { AnalyticsKinesisGenerator } from './generate/amplify/analytics/kinesis.generator';
import { GeoGenerator } from './generate/amplify/geo/geo.generator';

const AMPLIFY_DIR = 'amplify';

export class AmplifyMigrationGenerateStep extends AmplifyMigrationStep {
  public async forward(): Promise<Plan> {
    const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'amplify-gen2-'));
    const backendGenerator = new BackendGenerator(outputDir);
    const packageJsonGenerator = new RootPackageJsonGenerator(outputDir);

    const generators: Planner[] = [];
    const assessor = new AmplifyMigrationAssessor(this.gen1App);
    const assessment = assessor.assess();

    const operations: AmplifyMigrationOperation[] = [
      {
        describe: async () => [],
        validate: () => ({ description: 'Lock status', run: () => this.validateLockStatus() }),
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        execute: async () => {},
      },
      {
        describe: async () => [],
        validate: () => ({ description: 'Working directory', run: () => this.validateWorkingDirectory() }),
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        execute: async () => {},
      },
      {
        describe: async () => [],
        validate: () => ({
          description: 'Assessment',
          run: async () => {
            const valid = assessment.validFor('generate');
            return { valid, report: valid ? undefined : assessment.render() };
          },
        }),
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        execute: async () => {},
      },
    ];

    // Cross-category state captured during the loop.
    let authGenerator: AuthGenerator | undefined;
    let s3Generator: S3Generator | undefined;
    let geoGenerator: GeoGenerator | undefined;
    const functionGenerators: FunctionGenerator[] = [];
    const dynamoDBGenerators: DynamoDBGenerator[] = [];

    const discovered = this.gen1App.discover();

    for (const resource of discovered) {
      // skip resources the assessment did not mark as supported.
      // these will show up as validation errors the user has to acknowledge.
      if (assessment.of(resource, 'generate').level !== 'supported') {
        continue;
      }

      switch (resource.key) {
        case 'auth:Cognito': {
          const isReferenceAuth = discovered
            .filter((r) => r.category === 'auth')
            .some((r) => {
              const meta = (this.gen1App.meta('auth') ?? {})[r.resourceName] as Record<string, unknown> | undefined;
              return meta?.serviceType === 'imported';
            });

          if (isReferenceAuth) {
            generators.push(new ReferenceAuthGenerator(this.gen1App, backendGenerator, outputDir, resource));
          } else {
            authGenerator = new AuthGenerator(this.gen1App, backendGenerator, outputDir, resource);
            generators.push(authGenerator);
          }
          break;
        }
        case 'auth:Cognito-UserPool-Groups':
          // Handled by the AuthGenerator created for the main Cognito resource.
          break;
        case 'storage:S3':
          s3Generator = new S3Generator(this.gen1App, backendGenerator, outputDir, resource);
          generators.push(s3Generator);
          break;
        case 'storage:DynamoDB': {
          const ddbGen = new DynamoDBGenerator(this.gen1App, backendGenerator, resource);
          generators.push(ddbGen);
          dynamoDBGenerators.push(ddbGen);
          break;
        }
        case 'api:AppSync':
          generators.push(new DataGenerator(this.gen1App, backendGenerator, outputDir, resource));
          break;
        case 'api:API Gateway':
          generators.push(new RestApiGenerator(this.gen1App, backendGenerator, resource));
          break;
        case 'analytics:Kinesis':
          generators.push(new AnalyticsKinesisGenerator(this.gen1App, backendGenerator, outputDir, resource));
          break;
        case 'geo:Map':
        case 'geo:PlaceIndex':
        case 'geo:GeofenceCollection':
          // All geo services share a single GeoGenerator instance.
          if (!geoGenerator) {
            geoGenerator = new GeoGenerator(this.gen1App, backendGenerator, outputDir, resource);
            generators.push(geoGenerator);
          }
          break;
        case 'function:Lambda': {
          const functionCategoryMap = computeFunctionCategories(this.gen1App);
          const funcGen = new FunctionGenerator({
            gen1App: this.gen1App,
            backendGenerator,
            packageJsonGenerator,
            outputDir,
            resource,
            category: functionCategoryMap.get(resource.resourceName) ?? 'function',
          });
          generators.push(funcGen);
          functionGenerators.push(funcGen);
          break;
        }

        // unsupported/unknown resources - skip them.
        // the assessment validation will surface these to the user
        // and require confirmation of missing capabilities.
        case 'UNKNOWN':
          break;
      }
    }

    // Wire cross-category dependencies after all generators are created.
    for (const funcGen of functionGenerators) {
      if (authGenerator) funcGen.setAuthGenerator(authGenerator);
      if (s3Generator) funcGen.setS3Generator(s3Generator);
      for (const ddbGen of dynamoDBGenerators) {
        funcGen.addDynamoDBGenerator(ddbGen);
      }
    }

    // Infrastructure generators run last — BackendGenerator accumulates
    // contributions from all category generators above.
    generators.push(backendGenerator);
    generators.push(packageJsonGenerator);
    generators.push(new BackendPackageJsonGenerator(outputDir));
    generators.push(new TsConfigGenerator(outputDir));
    generators.push(new AmplifyYmlGenerator(this.gen1App));
    generators.push(new GitIgnoreGenerator());

    operations.push({
      validate: () => undefined,
      describe: async () => [`Delete directory: ${path.join(process.cwd(), 'amplify')}`],
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      execute: async () => {},
    });

    // Collect all operations from generators in order.
    for (const generator of generators) {
      operations.push(...(await generator.plan()));
    }

    // Post-generation: replace local amplify folder.
    operations.push({
      validate: () => undefined,
      describe: async () => [],
      execute: async () => {
        const cwd = process.cwd();
        this.logger.info('Deleting amplify/');
        await fs.rm(AMPLIFY_DIR, { recursive: true });
        await fs.rename(path.join(outputDir, 'amplify'), path.join(cwd, 'amplify'));
        await fs.rename(path.join(outputDir, 'package.json'), path.join(cwd, 'package.json'));
        await fs.rm(outputDir, { recursive: true });
      },
    });

    // Post-generation: instruct user to install dependencies.
    operations.push({
      validate: () => undefined,
      describe: async () => ['Instruct user to install Gen2 dependencies'],
      execute: async () => {
        this.logger.info(
          'Run "npm install" to install the new Gen2 dependencies. ' +
            'If you encounter version conflicts, check the npm logs and resolve them manually.',
        );
      },
    });

    return new Plan({
      operations,
      logger: this.logger,
      title: 'Execute',
      implications: ["Your local 'amplify/' directory will be replaced with Gen2 code"],
    });
  }

  public async rollback(): Promise<Plan> {
    throw new Error('Not Implemented');
  }

  private async validateLockStatus(): Promise<ValidationResult> {
    try {
      await this.validations.validateLockStatus();
      return { valid: true };
    } catch (e) {
      return { valid: false, report: e.message };
    }
  }

  private async validateWorkingDirectory(): Promise<ValidationResult> {
    try {
      await this.validations.validateWorkingDirectory();
      return { valid: true };
    } catch (e) {
      return { valid: false, report: e.message };
    }
  }
}

/**
 * Derives a function-to-category map from dependsOn relationships
 * in amplify-meta.json. A function's category is determined by which
 * other category depends on it (auth → 'auth', storage → 'storage')
 * or which category it depends on (function → storage = 'storage').
 * Functions with no cross-category dependencies default to 'function'.
 */
function computeFunctionCategories(gen1App: Gen1App): ReadonlyMap<string, string> {
  const categoryMap = new Map<string, string>();
  const auth = gen1App.meta('auth') as Record<string, Record<string, unknown>> | undefined;
  const storage = gen1App.meta('storage') as Record<string, Record<string, unknown>> | undefined;
  const functions = gen1App.meta('function') as Record<string, Record<string, unknown>> | undefined;

  if (auth) {
    for (const authResource of Object.values(auth)) {
      if (authResource.dependsOn) {
        for (const dep of authResource.dependsOn as Array<{ category: string; resourceName: string }>) {
          if (dep.category === 'function') {
            categoryMap.set(dep.resourceName, 'auth');
          }
        }
      }
    }
  }

  if (storage) {
    for (const storageResource of Object.values(storage)) {
      if (storageResource.dependsOn) {
        for (const dep of storageResource.dependsOn as Array<{ category: string; resourceName: string }>) {
          if (dep.category === 'function') {
            categoryMap.set(dep.resourceName, 'storage');
          }
        }
      }
    }
  }

  if (functions) {
    for (const [funcName, funcResource] of Object.entries(functions)) {
      if (funcResource.dependsOn) {
        for (const dep of funcResource.dependsOn as Array<{ category: string; resourceName: string }>) {
          if (dep.category === 'storage') {
            categoryMap.set(funcName, 'storage');
          }
        }
      }
    }
  }

  return categoryMap;
}
