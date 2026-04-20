import { DiscoveredResource, Gen1App } from '../../_infra/gen1-app';
import { GeoCodegenResult, GeoCodegenResultBase } from './geo.types';
import { GeoResourceGenerator } from './geo-resource.generator';
import { GeoGenerator } from './geo.generator';

/**
 * Generates a geo Map resource file.
 */
export class GeoMapGenerator extends GeoResourceGenerator {
  public constructor(gen1App: Gen1App, outputDir: string, resource: DiscoveredResource, geoGenerator: GeoGenerator) {
    super(gen1App, outputDir, resource, geoGenerator);
  }

  protected buildCodegenResult(base: GeoCodegenResultBase, paramMap: ReadonlyMap<string, string>): GeoCodegenResult {
    return {
      ...base,
      serviceName: 'Map',
      mapName: paramMap.get('mapName') ?? this.resource.resourceName,
      mapStyle: paramMap.get('mapStyle') ?? '',
    };
  }
}
