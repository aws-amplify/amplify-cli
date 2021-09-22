import { DataProvider, ResourceParameters } from './resourceParams';
import _ from 'lodash';

/**
 * Data structure that represents a Map Resource
 */
export type MapParameters = ResourceParameters & {
  mapStyleType: MapStyleType;
};

/**
 * The type of Map styles for Esri data provider
 */
export enum EsriMapStyleType {
  Navigation = 'Navigation',
  Streets = 'Streets',
  Topographic = 'Topographic',
  DarkGrayCanvas = 'DarkGrayCanvas',
  LightGrayCanvas = 'LightGrayCanvas',
}

/**
 * The type of Map styles for HERE data provider
 */
export enum HereMapStyleType {
  Berlin = 'Berlin',
}

export type MapStyleType = EsriMapStyleType | HereMapStyleType;

/**
 * Supported Geo Map Styles
 */
export enum MapStyle {
  VectorEsriNavigation = 'VectorEsriNavigation',
  VectorEsriStreets = 'VectorEsriStreets',
  VectorEsriTopographic = 'VectorEsriTopographic',
  VectorEsriDarkGrayCanvas = 'VectorEsriDarkGrayCanvas',
  VectorEsriLightGrayCanvas = 'VectorEsriLightGrayCanvas',
  VectorHereBerlin = 'VectorHereBerlin',
}

/**
 * check if all necessary map configuration parameters are available
 */
export const isCompleteMapParams = (partial: Partial<MapParameters>): partial is MapParameters => {
  const requiredFields = ['providerContext', 'name', 'mapStyleType', 'dataProvider', 'accessType', 'isDefault'];
  const missingField = requiredFields.find(field => !_.keys(partial).includes(field));
  return !missingField;
};

export const convertToCompleteMapParams = (partial: Partial<MapParameters>): MapParameters => {
  if (isCompleteMapParams(partial)) {
    return partial as MapParameters;
  }
  throw new Error('Partial<MapParameters> does not satisfy MapParameters');
};

/**
 * Constructs the Amazon Location Map Style from available map parameters
 */
export const getGeoMapStyle = (dataProvider: DataProvider, mapStyleType: MapStyleType) => {
  if (dataProvider === DataProvider.Here && mapStyleType === HereMapStyleType.Berlin) {
    return MapStyle.VectorHereBerlin;
  }
  return `Vector${dataProvider}${mapStyleType}`;
};

/**
 * Constructs the Map parameters from the given Amazon Location Map Style
 */
export const getMapStyleComponents = (mapStyle: string): Pick<MapParameters, 'dataProvider' | 'mapStyleType'> => {
  switch (mapStyle) {
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
};
