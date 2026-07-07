import { DiscoveredResource, Gen1App } from '../../../_common/gen1-app';
import { GeoResourceGenerator } from './geo-resource.generator';
import { GeoGenerator, GeoResourceProps } from './geo.generator';
import { SpinningLogger } from '../../../_common/spinning-logger';

/**
 * Generates a geo PlaceIndex resource file.
 */
export class GeoPlaceIndexGenerator extends GeoResourceGenerator {
  public constructor(
    gen1App: Gen1App,
    outputDir: string,
    resource: DiscoveredResource,
    geoGenerator: GeoGenerator,
    logger: SpinningLogger,
  ) {
    super(gen1App, outputDir, resource, geoGenerator, logger);
  }

  protected addResource(base: GeoResourceProps, parameters: ReadonlyMap<string, string>): GeoResourceProps {
    const props: GeoResourceProps = {
      ...base,
      needsAuthAndUnauthRoles: true,
      serviceName: 'PlaceIndex',
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
