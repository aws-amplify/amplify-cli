import { DataProvider, ResourceParameters } from './resourceParams';

/**
 * Data structure that represents a Map Resource
 */
export type PlaceIndexParameters = ResourceParameters & {
    providerContext: ProviderContext; // higher level context around the function
    indexName: string; // name of the place index
    indexPolicyName: string;
    dataProvider: DataProvider;
    dataSourceIntendedUse: DataSourceIntendedUse;
    isDefaultPlaceIndex: boolean;
};

export enum DataSourceIntendedUse {
  SingleUse = "SingleUse",
  Storage = "Storage"
}

export interface ProviderContext {
  provider: string;
  service: string;
  projectName: string;
}