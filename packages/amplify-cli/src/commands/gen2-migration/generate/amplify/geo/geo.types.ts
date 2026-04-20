/**
 * Provider metadata for a Gen1 geo resource.
 */
export interface GeoProviderMetadata {
  readonly s3TemplateURL: string;
  readonly logicalId: string;
}

/**
 * Base fields common to all geo codegen results.
 */
export interface GeoCodegenResultBase {
  readonly constructClassName: string;
  readonly constructFileName: string;
  readonly resourceName: string;
  readonly userPoolIdParamName: string;
  readonly groupRoles: ReadonlyArray<{ readonly paramName: string; readonly groupName: string }>;
  readonly isDefault: string;
}

export interface MapCodegenResult extends GeoCodegenResultBase {
  readonly serviceName: 'Map';
  readonly mapName: string;
  readonly mapStyle: string;
}

export interface PlaceIndexCodegenResult extends GeoCodegenResultBase {
  readonly serviceName: 'PlaceIndex';
  readonly indexName: string;
  readonly dataProvider: string;
  readonly dataSourceIntendedUse: string;
}

export interface GeofenceCollectionCodegenResult extends GeoCodegenResultBase {
  readonly serviceName: 'GeofenceCollection';
  readonly collectionName: string;
}

export type GeoCodegenResult = MapCodegenResult | PlaceIndexCodegenResult | GeofenceCollectionCodegenResult;
