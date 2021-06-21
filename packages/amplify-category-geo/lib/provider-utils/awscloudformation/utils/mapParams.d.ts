import { DataProvider, ResourceParameters } from './resourceParams';
export declare type MapParameters = ResourceParameters & {
    providerContext: ProviderContext;
    mapName: string;
    mapStyleType: MapStyleType;
    dataProvider: DataProvider;
    isDefaultMap: boolean;
    dependsOn?: MapDependency[];
};
export interface ProviderContext {
    provider: string;
    service: string;
    projectName: string;
}
export declare enum EsriMapStyleType {
    Navigation = "Navigation",
    Streets = "Streets",
    Topographic = "Topographic",
    Canvas = "Canvas"
}
export declare enum HereMapStyleType {
    Berlin = "Berlin"
}
export declare type MapStyleType = EsriMapStyleType | HereMapStyleType;
export interface MapDependency {
    category: string;
    resourceName: string;
    attributes: string[];
    attributeEnvMap?: {
        [name: string]: string;
    };
}
export declare function isCompleteMapParams(partial: Partial<MapParameters>): partial is MapParameters;
export declare function convertToCompleteMapParams(partial: Partial<MapParameters>): MapParameters;
export declare function getGeoMapStyle(dataProvider: DataProvider, mapStyleType: MapStyleType): string;
//# sourceMappingURL=mapParams.d.ts.map