export type FeatureCollection = {
  type: "FeatureCollection";
  features: Feature[];
}

export type Feature = {
  type: "Feature";
  properties: any;
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

export type FillParams = {
  collectionName: string;
  uniqueIdentifier: string;
  geoJSONObj: FeatureCollection;
}