import { DataProvider, ResourceParameters } from './resourceParams';
import _ from 'lodash';

/**
 * Data structure that represents a Map Resource
 */
export type MapParameters = ResourceParameters & {
    providerContext: ProviderContext; // higher level context around the function
    mapName: string; // name of the map
    mapStyleType: MapStyleType;
    dataProvider: DataProvider;
    isDefaultMap: boolean;
    dependsOn?: MapDependency[]; // resources this map depends on
};

export interface ProviderContext {
    provider: string;
    service: string;
    projectName: string;
}

/**
 * The type of Map styles for Esri data provider
 */
export enum EsriMapStyleType {
    Navigation = "Navigation",
    Streets = "Streets",
    Topographic = "Topographic",
    DarkGrayCanvas = "DarkGrayCanvas",
    LightGrayCanvas = "LightGrayCanvas"
}

/**
 * The type of Map styles for Here data provider
 */
 export enum HereMapStyleType {
    Berlin = "Berlin"
}

export type MapStyleType = EsriMapStyleType | HereMapStyleType;

/**
 * Supported Geo Map Styles
 */
export enum MapStyle {
    VectorEsriNavigation = "VectorEsriNavigation",
    VectorEsriStreets = "VectorEsriStreets",
    VectorEsriTopographic = "VectorEsriTopographic",
    VectorEsriDarkGrayCanvas = "VectorEsriDarkGrayCanvas",
    VectorEsriLightGrayCanvas = "VectorEsriLightGrayCanvas",
    VectorHereBerlin = "VectorHereBerlin",
}

export interface MapDependency {
    category: string; // resource category of the dependency
    resourceName: string; // name of the dependency
    attributes: string[]; // attributes that this resource depends on (must be outputs of the dependencies CFN template)
}

/**
 * check if all necessary map configuration parameters are available
 */
export function isCompleteMapParams(partial: Partial<MapParameters>): partial is MapParameters {
    const requiredFields = ['providerContext', 'mapName', 'mapStyleType', 'dataProvider', 'accessType', 'isDefaultMap'];
    const missingField = requiredFields.find(field => !_.keys(partial).includes(field));
    return !missingField;
}

export function convertToCompleteMapParams(partial: Partial<MapParameters>): MapParameters {
    if (isCompleteMapParams(partial)) {
        return partial as MapParameters;
    }
    throw new Error('Partial<MapParameters> does not satisfy MapParameters');
}

/**
 * Constructs the Amazon Location Map Style from available map parameters
 */
export function getGeoMapStyle(dataProvider: DataProvider, mapStyleType: MapStyleType) {
    return `Vector${dataProvider}${mapStyleType}`;
}

/**
 * Constructs the Map parameters from the given Amazon Location Map Style
 */
export function getMapStyleComponents(mapStyle: string): Pick<MapParameters, 'dataProvider' | 'mapStyleType'> {
    switch(mapStyle) {
        case MapStyle.VectorEsriDarkGrayCanvas:
            return { dataProvider: DataProvider.Esri, mapStyleType: EsriMapStyleType.DarkGrayCanvas };
        case MapStyle.VectorEsriLightGrayCanvas:
            return { dataProvider: DataProvider.Esri, mapStyleType: EsriMapStyleType.LightGrayCanvas };
        case MapStyle.VectorEsriNavigation:
            return { dataProvider: DataProvider.Esri, mapStyleType: EsriMapStyleType.Navigation };
        case MapStyle.VectorEsriStreets:
            return { dataProvider: DataProvider.Esri, mapStyleType: EsriMapStyleType.Streets };
        case MapStyle.VectorEsriTopographic:
            return { dataProvider: DataProvider.Esri, mapStyleType: EsriMapStyleType.Topographic };
        case MapStyle.VectorHereBerlin:
            return { dataProvider: DataProvider.Here, mapStyleType: HereMapStyleType.Berlin };
        default:
            throw new Error(`Invalid map style ${mapStyle}`);
    }
}

