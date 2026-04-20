import path from 'node:path';
import fs from 'node:fs/promises';
import { Planner } from '../../../_infra/planner';
import { AmplifyMigrationOperation } from '../../../_infra/operation';
import { BackendGenerator } from '../backend.generator';
import { TS } from '../../_infra/ts';
import { GeoAggregatorRenderer } from './geo-aggregator.renderer';
import { GeoCodegenResult } from './geo.types';

/**
 * Generates the top-level geo/resource.ts aggregator.
 * Sub-resource generators (GeoMapGenerator, GeoPlaceIndexGenerator,
 * GeoGeofenceCollectionGenerator) contribute their codegen results
 * via addCodegenResult(). Must be planned after all sub-resource
 * generators have executed.
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
