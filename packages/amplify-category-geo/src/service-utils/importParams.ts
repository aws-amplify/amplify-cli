export type FeatureCollection = {
  type: "FeatureCollection";
  features: Feature[];
}

export type Feature = {
  type: "Feature";
  properties: Record<string, any>;
  geometry: Geometry;
  id: string;
}

export type Geometry = {
  type: "Polygon";
  coordinates: Array<Array<Array<number>>>;
}

export type GeofenceCollectionParams = {
  CollectionName: string;
  Entries: GeofenceParams[];
}

export type GeofenceParams = {
  GeofenceId: string;
  Geometry: {
    Polygon: Array<Array<Array<number>>>
  }
}

export type ImportParams = {
  collectionToImport: string;
  uniqueIdentifier: string;
  identifierOption: IdentifierOption;
  geoJSONObj: FeatureCollection;
}

export enum IdentifierOption {
  RootLevelID = "RootLevelID",
  CustomProperty = "CustomProperty"
}