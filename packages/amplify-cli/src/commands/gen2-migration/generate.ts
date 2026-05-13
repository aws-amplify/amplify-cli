import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { AmplifyMigrationStep } from './_common/step';
import { AmplifyMigrationOperation, ValidationResult } from './_common/operation';
import { Plan } from './_common/plan';
import { Planner } from './_common/planner';
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
import { GeoMapGenerator } from './generate/amplify/geo/map.generator';
import { GeoPlaceIndexGenerator } from './generate/amplify/geo/place-index.generator';
import { GeoGeofenceCollectionGenerator } from './generate/amplify/geo/geofence-collection.generator';
import { CustomResourceGenerator } from './generate/amplify/custom-resources/custom.generator';

const AMPLIFY_DIR = 'amplify';

export class AmplifyMigrationGenerateStep extends AmplifyMigrationStep {
  public async forward(): Promise<Plan> {
    const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'amplify-gen2-'));
    const backendGenerator = new BackendGenerator(outputDir, this.logger);
    const packageJsonGenerator = new RootPackageJsonGenerator(outputDir);

    const generators: Planner[] = [];
    const assessor = new AmplifyMigrationAssessor(this.gen1App, this.logger);
    const assessment = assessor.assess();

    const operations: AmplifyMigrationOperation[] = [
      {
        describe: async () => [],
        validate: () => ({ description: 'Environment Locked', run: () => this.validateLockStatus() }),
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        execute: async () => {},
      },
      {
        describe: async () => [],
        validate: () => ({ description: 'Clean Working Directory', run: () => this.validateWorkingDirectory() }),
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
              const meta = (this.gen1App.categoryMeta('auth') ?? {})[r.resourceName] as Record<string, unknown> | undefined;
              return meta?.serviceType === 'imported';
            });

          if (isReferenceAuth) {
            generators.push(new ReferenceAuthGenerator(this.gen1App, backendGenerator, outputDir, resource, this.logger));
          } else {
            authGenerator = new AuthGenerator(this.gen1App, backendGenerator, outputDir, resource, this.logger);
            generators.push(authGenerator);
          }
          break;
        }
        case 'auth:Cognito-UserPool-Groups':
          // Handled by the AuthGenerator created for the main Cognito resource.
          break;
        case 'storage:S3':
          s3Generator = new S3Generator(this.gen1App, backendGenerator, outputDir, resource, this.logger);
          generators.push(s3Generator);
          break;
        case 'storage:DynamoDB': {
          generators.push(new DynamoDBGenerator(this.gen1App, backendGenerator, outputDir, resource, this.logger));
          break;
        }
        case 'api:AppSync':
          generators.push(new DataGenerator(this.gen1App, backendGenerator, outputDir, resource, this.logger));
          break;
        case 'api:API Gateway':
          generators.push(new RestApiGenerator(this.gen1App, backendGenerator, outputDir, resource, this.logger));
          break;
        case 'analytics:Kinesis':
          generators.push(new AnalyticsKinesisGenerator(this.gen1App, backendGenerator, outputDir, resource, this.logger));
          break;
        case 'geo:Map': {
          if (!geoGenerator) {
            geoGenerator = new GeoGenerator(backendGenerator, outputDir, this.logger);
          }
          generators.push(new GeoMapGenerator(this.gen1App, outputDir, resource, geoGenerator, this.logger));
          break;
        }
        case 'geo:PlaceIndex': {
          if (!geoGenerator) {
            geoGenerator = new GeoGenerator(backendGenerator, outputDir, this.logger);
          }
          generators.push(new GeoPlaceIndexGenerator(this.gen1App, outputDir, resource, geoGenerator, this.logger));
          break;
        }
        case 'geo:GeofenceCollection': {
          if (!geoGenerator) {
            geoGenerator = new GeoGenerator(backendGenerator, outputDir, this.logger);
          }
          generators.push(new GeoGeofenceCollectionGenerator(this.gen1App, outputDir, resource, geoGenerator, this.logger));
          break;
        }
        case 'function:Lambda': {
          const funcGen = new FunctionGenerator({
            gen1App: this.gen1App,
            backendGenerator,
            packageJsonGenerator,
            outputDir,
            resource,
            logger: this.logger,
          });
          generators.push(funcGen);
          functionGenerators.push(funcGen);
          break;
        }

        case 'custom:customCDK':
          generators.push(
            new CustomResourceGenerator(
              this.gen1App,
              backendGenerator,
              packageJsonGenerator,
              outputDir,
              resource.resourceName,
              this.logger,
            ),
          );
          break;

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
    }

    // Geo runs after all per-resource geo generators.
    if (geoGenerator) {
      generators.push(geoGenerator);
    }

    // Infrastructure generators run last — BackendGenerator accumulates
    // contributions from all category generators above.
    generators.push(backendGenerator);
    generators.push(packageJsonGenerator);
    generators.push(new BackendPackageJsonGenerator(outputDir));
    generators.push(new TsConfigGenerator(outputDir));
    generators.push(new AmplifyYmlGenerator(this.gen1App));
    generators.push(new GitIgnoreGenerator());

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

    return new Plan({
      operations,
      logger: this.logger,
      title: 'Execute',
      implications: [
        "Your local 'amplify/' directory will be replaced with Gen2 code",
        "Your root 'package.json' will be updated with Gen2 dependencies",
      ],
    });
  }

  public async rollback(): Promise<Plan> {
    throw new AmplifyError('UnsupportedOperationError', {
      message: 'Rollback is not supported for the generate step.',
      resolution: [
        'To restore your local directory to its previous state, use git to discard the changes.',
        '',
        `Then restore the Amplify configuration by running: 'amplify pull --appId ${this.gen1App.appId} --envName ${this.gen1App.appName}'`,
      ].join('\n'),
    });
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
