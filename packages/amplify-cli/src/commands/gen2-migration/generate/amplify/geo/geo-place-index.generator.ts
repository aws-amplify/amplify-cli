import { DiscoveredResource, Gen1App } from '../../_infra/gen1-app';
import { GeoCodegenResult, GeoCodegenResultBase } from './geo.types';
import { GeoResourceGenerator } from './geo-resource.generator';
import { GeoGenerator } from './geo.generator';

/**
 * Generates a geo PlaceIndex resource file.
 */
export class GeoPlaceIndexGenerator extends GeoResourceGenerator {
  public constructor(gen1App: Gen1App, outputDir: string, resource: DiscoveredResource, geoGenerator: GeoGenerator) {
    super(gen1App, outputDir, resource, geoGenerator);
  }

  protected buildCodegenResult(base: GeoCodegenResultBase, paramMap: ReadonlyMap<string, string>): GeoCodegenResult {
    return {
      ...base,
      serviceName: 'PlaceIndex',
      indexName: paramMap.get('indexName') ?? this.resource.resourceName,
      dataProvider: paramMap.get('dataProvider') ?? '',
      dataSourceIntendedUse: paramMap.get('dataSourceIntendedUse') ?? '',
    };
  }
}
