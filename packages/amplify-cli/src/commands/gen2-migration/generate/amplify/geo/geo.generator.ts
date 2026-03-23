import path from 'node:path';
import fs from 'node:fs/promises';
import ts from 'typescript';
import { Planner } from '../../../planner';
import { AmplifyMigrationOperation } from '../../../_operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App } from '../../_infra/gen1-app';
import { TS } from '../../_infra/ts';
import { GeoRenderer } from './geo.renderer';
import { GeoCfnConverter, GeoCodegenResult, GeoServiceName, GeoProviderMetadata } from './geo-cfn-converter';

const factory = ts.factory;

/**
 * Metadata for a single Gen1 geo resource from amplify-meta.json.
 */
interface GeoResourceMeta {
  readonly service: string;
  readonly providerMetadata: GeoProviderMetadata;
  readonly isDefault?: boolean;
}

/**
 * Generates geo resource files and contributes to backend.ts.
 *
 * Handles all three geo service types (Map, PlaceIndex, GeofenceCollection).
 * For each resource, generates a CDK construct file via cdk-from-cfn and a
 * per-resource resource.ts. Then generates a top-level geo/resource.ts
 * aggregator that imports all sub-resources and calls backend.addOutput()
 * with geo configuration. Contributes defineGeo import and call to backend.ts.
 */
export class GeoGenerator implements Planner {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly outputDir: string;
  private readonly renderer: GeoRenderer;

  public constructor(gen1App: Gen1App, backendGenerator: BackendGenerator, outputDir: string) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.outputDir = outputDir;
    this.renderer = new GeoRenderer();
  }

  /**
   * Plans geo generation operations for all geo resources.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const geoCategory = this.gen1App.meta('geo');
    if (!geoCategory) return [];

    const geoDir = path.join(this.outputDir, 'amplify', 'geo');
    const allCodegenResults: GeoCodegenResult[] = [];

    const operations: AmplifyMigrationOperation[] = [];

    for (const [resourceName, resourceMeta] of Object.entries(geoCategory)) {
      const meta = resourceMeta as GeoResourceMeta;
      const service = meta.service as GeoServiceName;

      operations.push({
        validate: () => undefined,
        describe: async () => [`Generate amplify/geo/${resourceName}/resource.ts`],
        execute: async () => {
          const fileWriter = async (content: string, filePath: string) => {
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, content, 'utf-8');
          };

          const converter = new GeoCfnConverter(
            this.outputDir,
            fileWriter,
            this.gen1App.clients.s3,
            this.gen1App.clients.cloudFormation,
            this.gen1App.rootStackName,
          );

          const codegenResult = await converter.generateGeoL1Code(resourceName, service, meta.providerMetadata);
          allCodegenResults.push(codegenResult);

          const nodes = this.renderer.renderResource(codegenResult);
          const content = TS.printNodes(nodes);

          const resourceDir = path.join(geoDir, resourceName);
          await fs.mkdir(resourceDir, { recursive: true });
          await fs.writeFile(path.join(resourceDir, 'resource.ts'), content, 'utf-8');
        },
      });
    }

    // Top-level geo/resource.ts aggregator — runs after all per-resource operations
    operations.push({
      validate: () => undefined,
      describe: async () => ['Generate amplify/geo/resource.ts'],
      execute: async () => {
        const nodes = this.renderer.renderAggregator(allCodegenResults);
        const content = TS.printNodes(nodes);

        await fs.mkdir(geoDir, { recursive: true });
        await fs.writeFile(path.join(geoDir, 'resource.ts'), content, 'utf-8');

        // Contribute to backend.ts
        this.backendGenerator.addImport('./geo/resource', ['defineGeo']);
        this.backendGenerator.addEarlyStatement(
          factory.createVariableStatement(
            undefined,
            factory.createVariableDeclarationList(
              [
                factory.createVariableDeclaration(
                  'geo',
                  undefined,
                  undefined,
                  factory.createCallExpression(factory.createIdentifier('defineGeo'), undefined, [factory.createIdentifier('backend')]),
                ),
              ],
              ts.NodeFlags.Const,
            ),
          ),
        );
      },
    });

    return operations;
  }
}
