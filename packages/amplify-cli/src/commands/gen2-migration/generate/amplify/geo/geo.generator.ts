import path from 'node:path';
import fs from 'node:fs/promises';
import { Planner } from '../../../_common/planner';
import { AmplifyMigrationOperation } from '../../../_common/operation';
import { BackendGenerator } from '../backend.generator';
import { TS } from '../../ts';
import { GeoRenderer } from './geo.renderer';
import { SpinningLogger } from '../../../_common/spinning-logger';

/**
 * Base fields common to all geo resource props.
 * Service-specific construct props are carried as plain key/value
 * pairs so the renderer stays generic.
 */
export interface GeoResourceProps {
  readonly constructClassName: string;
  readonly constructFileName: string;
  readonly resourceName: string;
  readonly userPoolIdParamName: string;
  readonly groupRoles: ReadonlyArray<{ readonly paramName: string; readonly groupName: string }>;
  readonly isDefault: string;
  /** Whether the construct needs authRoleName / unauthRoleName props. */
  readonly needsAuthAndUnauthRoles: boolean;
  /** Service-specific construct props (e.g. mapName, indexName). */
  readonly serviceSpecificProps: ReadonlyArray<{ readonly key: string; readonly value: string }>;
  /** Gen1 resource name including env suffix (e.g. `storeLocatorMap-dev`). */
  readonly gen1ResourceName: string;
  /** IAM actions from the Gen1 CFN template for the user-facing policy. */
  readonly gen1Actions: readonly string[];
  /** Geo service type — determines ARN resource type and role attachment pattern. */
  readonly serviceName: 'Map' | 'PlaceIndex' | 'GeofenceCollection';
}

/**
 * Generates the top-level geo/resource.ts.
 * Sub-resource generators contribute their props via the typed
 * add methods. Must be planned after all sub-resource generators
 * have executed.
 */
export class GeoGenerator implements Planner {
  private readonly backendGenerator: BackendGenerator;
  private readonly outputDir: string;
  private readonly renderer = new GeoRenderer();
  private readonly logger: SpinningLogger;

  private readonly maps: GeoResourceProps[] = [];
  private readonly placeIndices: GeoResourceProps[] = [];
  private readonly geofenceCollections: GeoResourceProps[] = [];

  public constructor(backendGenerator: BackendGenerator, outputDir: string, logger: SpinningLogger) {
    this.backendGenerator = backendGenerator;
    this.outputDir = outputDir;
    this.logger = logger;
  }

  /** Register a Map resource. */
  public addMap(props: GeoResourceProps): void {
    this.maps.push(props);
  }

  /** Register a PlaceIndex resource. */
  public addPlaceIndex(props: GeoResourceProps): void {
    this.placeIndices.push(props);
  }

  /** Register a GeofenceCollection resource. */
  public addGeofenceCollection(props: GeoResourceProps): void {
    this.geofenceCollections.push(props);
  }

  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const geoDir = path.join(this.outputDir, 'amplify', 'geo');

    return [
      {
        validate: () => undefined,
        describe: async () => ['Generate amplify/geo/resource.ts'],
        execute: async () => {
          this.logger.info('Rendering geo/resource.ts');
          const nodes = this.renderer.render(this.maps, this.placeIndices, this.geofenceCollections);
          const content = TS.printNodes(nodes);

          await fs.mkdir(geoDir, { recursive: true });
          await fs.writeFile(path.join(geoDir, 'resource.ts'), content, 'utf-8');

          const alias = this.backendGenerator.reserveAlias('geo', 'geo');
          this.backendGenerator.addNamespaceImport(alias, './geo/resource');
          this.backendGenerator.addPostDefineBackendStatement(`${alias}.defineGeo(backend)`);
        },
      },
    ];
  }
}
