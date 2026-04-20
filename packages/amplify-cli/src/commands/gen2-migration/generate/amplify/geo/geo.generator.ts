import path from 'node:path';
import fs from 'node:fs/promises';
import { Planner } from '../../../_infra/planner';
import { AmplifyMigrationOperation } from '../../../_infra/operation';
import { BackendGenerator } from '../backend.generator';
import { DiscoveredResource, Gen1App } from '../../_infra/gen1-app';
import { TS } from '../../_infra/ts';
import { GeoResourceRenderer } from './geo-resource.renderer';
import { GeoAggregatorRenderer } from './geo-aggregator.renderer';
import { GeoCfnConverter, GeoCodegenResult, GeoServiceName, GeoProviderMetadata } from './geo-cfn-converter';

/**
 * Generates a single geo sub-resource file (Map, PlaceIndex, or GeofenceCollection).
 * Contributes its codegen result to the GeoGenerator (aggregator).
 */
export class GeoMapGenerator implements Planner {
  private readonly gen1App: Gen1App;
  private readonly outputDir: string;
  private readonly resource: DiscoveredResource;
  private readonly geoGenerator: GeoGenerator;
  private readonly renderer = new GeoResourceRenderer();

  public constructor(gen1App: Gen1App, outputDir: string, resource: DiscoveredResource, geoGenerator: GeoGenerator) {
    this.gen1App = gen1App;
    this.outputDir = outputDir;
    this.resource = resource;
    this.geoGenerator = geoGenerator;
  }

  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const resourceName = this.resource.resourceName;
    const geoCategory = this.gen1App.meta('geo');
    if (!geoCategory || !geoCategory[resourceName]) return [];

    const meta = geoCategory[resourceName] as { providerMetadata: GeoProviderMetadata };
    const service = this.resource.service as GeoServiceName;
    const geoDir = path.join(this.outputDir, 'amplify', 'geo');

    return [
      {
        resource: this.resource,
        validate: () => undefined,
        describe: async () => [`Generate amplify/geo/${resourceName}/resource.ts`],
        execute: async () => {
          const converter = new GeoCfnConverter(
            this.outputDir,
            async (content, filePath) => {
              await fs.mkdir(path.dirname(filePath), { recursive: true });
              await fs.writeFile(filePath, content, 'utf-8');
            },
            this.gen1App.clients.s3,
            this.gen1App.clients.cloudFormation,
            this.gen1App.rootStackName,
          );

          const codegenResult = await converter.generateGeoL1Code(resourceName, service, meta.providerMetadata);
          this.geoGenerator.addCodegenResult(codegenResult);

          const nodes = this.renderer.render(codegenResult);
          const content = TS.printNodes(nodes);

          const resourceDir = path.join(geoDir, resourceName);
          await fs.mkdir(resourceDir, { recursive: true });
          await fs.writeFile(path.join(resourceDir, 'resource.ts'), content, 'utf-8');
        },
      },
    ];
  }
}

/** Alias — all geo sub-resource types use the same generator logic. */
export const GeoPlaceIndexGenerator = GeoMapGenerator;
export const GeoGeofenceCollectionGenerator = GeoMapGenerator;

/**
 * Generates the top-level geo/resource.ts aggregator.
 * Sub-resource generators contribute their codegen results via addCodegenResult().
 * Must be planned after all sub-resource generators have executed.
 */
export class GeoGenerator implements Planner {
  private readonly backendGenerator: BackendGenerator;
  private readonly outputDir: string;
  private readonly codegenResults: GeoCodegenResult[] = [];
  private readonly renderer = new GeoAggregatorRenderer();

  public constructor(backendGenerator: BackendGenerator, outputDir: string) {
    this.backendGenerator = backendGenerator;
    this.outputDir = outputDir;
  }

  /** Called by sub-resource generators to contribute their results. */
  public addCodegenResult(result: GeoCodegenResult): void {
    this.codegenResults.push(result);
  }

  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const geoDir = path.join(this.outputDir, 'amplify', 'geo');

    return [
      {
        validate: () => undefined,
        describe: async () => ['Generate amplify/geo/resource.ts'],
        execute: async () => {
          const nodes = this.renderer.render(this.codegenResults);
          const content = TS.printNodes(nodes);

          await fs.mkdir(geoDir, { recursive: true });
          await fs.writeFile(path.join(geoDir, 'resource.ts'), content, 'utf-8');

          this.backendGenerator.addNamespaceImport('geo', './geo/resource');
          this.backendGenerator.addPostDefineStatement(`geo.defineGeo(backend)`);
        },
      },
    ];
  }
}
