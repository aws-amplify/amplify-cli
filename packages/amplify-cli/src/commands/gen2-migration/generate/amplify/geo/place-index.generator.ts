import { DiscoveredResource, Gen1App } from '../../_infra/gen1-app';
import { GeoResourceGenerator } from './geo-resource.generator';
import { GeoGenerator, GeoResourceProps } from './geo.generator';

/**
 * Generates a geo PlaceIndex resource file.
 */
export class GeoPlaceIndexGenerator extends GeoResourceGenerator {
  public constructor(gen1App: Gen1App, outputDir: string, resource: DiscoveredResource, geoGenerator: GeoGenerator) {
    super(gen1App, outputDir, resource, geoGenerator);
  }

  protected addResource(base: GeoResourceProps, parameters: ReadonlyMap<string, string>): GeoResourceProps {
    const props: GeoResourceProps = {
      ...base,
      needsAuthAndUnauthRoles: true,
      serviceSpecificProps: [
        { key: 'indexName', value: parameters.get('indexName') ?? this.resource.resourceName },
        { key: 'dataProvider', value: parameters.get('dataProvider') ?? '' },
        { key: 'dataSourceIntendedUse', value: parameters.get('dataSourceIntendedUse') ?? '' },
      ],
    };
    this.geoGenerator.addPlaceIndex(props);
    return props;
  }
}
