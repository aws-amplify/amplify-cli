import { DiscoveredResource, Gen1App } from '../../../_common/gen1-app';
import type { GeoResourceProps } from './geo.generator';
import { GeoResourceGenerator } from './geo-resource.generator';
import { GeoGenerator } from './geo.generator';
import { SpinningLogger } from '../../../_common/spinning-logger';

/**
 * Generates a geo Map resource file.
 */
export class GeoMapGenerator extends GeoResourceGenerator {
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
      serviceName: 'Map',
      serviceSpecificProps: [
        { key: 'mapName', value: parameters.get('mapName') ?? this.resource.resourceName },
        { key: 'mapStyle', value: parameters.get('mapStyle') ?? '' },
      ],
    };
    this.geoGenerator.addMap(props);
    return props;
  }
}
