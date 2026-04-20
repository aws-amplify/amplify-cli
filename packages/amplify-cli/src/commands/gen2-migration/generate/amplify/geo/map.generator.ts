import { DiscoveredResource, Gen1App } from '../../_infra/gen1-app';
import type { GeoResourceProps } from './geo.generator';
import { GeoResourceGenerator } from './geo-resource.generator';
import { GeoGenerator } from './geo.generator';

/**
 * Generates a geo Map resource file.
 */
export class GeoMapGenerator extends GeoResourceGenerator {
  public constructor(gen1App: Gen1App, outputDir: string, resource: DiscoveredResource, geoGenerator: GeoGenerator) {
    super(gen1App, outputDir, resource, geoGenerator);
  }

  protected addResource(base: GeoResourceProps, parameters: ReadonlyMap<string, string>): GeoResourceProps {
    const props: GeoResourceProps = {
      ...base,
      needsAuthAndUnauthRoles: true,
      serviceSpecificProps: [
        { key: 'mapName', value: parameters.get('mapName') ?? this.resource.resourceName },
        { key: 'mapStyle', value: parameters.get('mapStyle') ?? '' },
      ],
    };
    this.geoGenerator.addMap(props);
    return props;
  }
}
