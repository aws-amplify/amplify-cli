import { DiscoveredResource, Gen1App } from '../../../_common/gen1-app';
import { GeoResourceGenerator } from './geo-resource.generator';
import { GeoGenerator, GeoResourceProps } from './geo.generator';
import { SpinningLogger } from '../../../_common/spinning-logger';

/**
 * Generates a geo GeofenceCollection resource file.
 */
export class GeoGeofenceCollectionGenerator extends GeoResourceGenerator {
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
      needsAuthAndUnauthRoles: false,
      serviceName: 'GeofenceCollection',
      serviceSpecificProps: [{ key: 'collectionName', value: parameters.get('collectionName') ?? this.resource.resourceName }],
    };
    this.geoGenerator.addGeofenceCollection(props);
    return props;
  }
}
