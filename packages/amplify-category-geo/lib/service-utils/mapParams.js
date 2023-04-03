"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMapStyleComponents = exports.getGeoMapStyle = exports.convertToCompleteMapParams = exports.isCompleteMapParams = exports.MapStyle = exports.OpenDataMapStyleType = exports.HereMapStyleType = exports.EsriMapStyleType = void 0;
const resourceParams_1 = require("./resourceParams");
const lodash_1 = __importDefault(require("lodash"));
var EsriMapStyleType;
(function (EsriMapStyleType) {
    EsriMapStyleType["Navigation"] = "Navigation";
    EsriMapStyleType["Streets"] = "Streets";
    EsriMapStyleType["Topographic"] = "Topographic";
    EsriMapStyleType["DarkGrayCanvas"] = "DarkGrayCanvas";
    EsriMapStyleType["LightGrayCanvas"] = "LightGrayCanvas";
    EsriMapStyleType["Imagery"] = "Imagery";
})(EsriMapStyleType = exports.EsriMapStyleType || (exports.EsriMapStyleType = {}));
var HereMapStyleType;
(function (HereMapStyleType) {
    HereMapStyleType["Berlin"] = "Berlin";
    HereMapStyleType["Explore"] = "Explore";
    HereMapStyleType["ExploreTruck"] = "ExploreTruck";
    HereMapStyleType["RasterSatellite"] = "RasterSatellite";
    HereMapStyleType["HybridSatellite"] = "HybridSatellite";
})(HereMapStyleType = exports.HereMapStyleType || (exports.HereMapStyleType = {}));
var OpenDataMapStyleType;
(function (OpenDataMapStyleType) {
    OpenDataMapStyleType["StandardLight"] = "StandardLight";
})(OpenDataMapStyleType = exports.OpenDataMapStyleType || (exports.OpenDataMapStyleType = {}));
var MapStyle;
(function (MapStyle) {
    MapStyle["VectorEsriNavigation"] = "VectorEsriNavigation";
    MapStyle["VectorEsriStreets"] = "VectorEsriStreets";
    MapStyle["VectorEsriTopographic"] = "VectorEsriTopographic";
    MapStyle["VectorEsriDarkGrayCanvas"] = "VectorEsriDarkGrayCanvas";
    MapStyle["VectorEsriLightGrayCanvas"] = "VectorEsriLightGrayCanvas";
    MapStyle["RasterEsriImagery"] = "RasterEsriImagery";
    MapStyle["VectorHereBerlin"] = "VectorHereBerlin";
    MapStyle["VectorHereExplore"] = "VectorHereExplore";
    MapStyle["VectorHereExploreTruck"] = "VectorHereExploreTruck";
    MapStyle["RasterHereExploreSatellite"] = "RasterHereExploreSatellite";
    MapStyle["HybridHereExploreSatellite"] = "HybridHereExploreSatellite";
    MapStyle["VectorOpenDataStandardLight"] = "VectorOpenDataStandardLight";
})(MapStyle = exports.MapStyle || (exports.MapStyle = {}));
const isCompleteMapParams = (partial) => {
    const requiredFields = ['providerContext', 'name', 'mapStyleType', 'dataProvider', 'accessType', 'isDefault'];
    const missingField = requiredFields.find((field) => !lodash_1.default.keys(partial).includes(field));
    return !missingField;
};
exports.isCompleteMapParams = isCompleteMapParams;
const convertToCompleteMapParams = (partial) => {
    if ((0, exports.isCompleteMapParams)(partial)) {
        return partial;
    }
    throw new Error('Partial<MapParameters> does not satisfy MapParameters');
};
exports.convertToCompleteMapParams = convertToCompleteMapParams;
const getGeoMapStyle = (dataProvider, mapStyleType) => {
    if (dataProvider === resourceParams_1.DataProvider.Here && mapStyleType === HereMapStyleType.RasterSatellite) {
        return MapStyle.RasterHereExploreSatellite;
    }
    else if (dataProvider === resourceParams_1.DataProvider.Here && mapStyleType === HereMapStyleType.HybridSatellite) {
        return MapStyle.HybridHereExploreSatellite;
    }
    else if (dataProvider === resourceParams_1.DataProvider.Here) {
        return `VectorHere${mapStyleType}`;
    }
    else if (dataProvider === resourceParams_1.DataProvider.Esri && mapStyleType === EsriMapStyleType.Imagery) {
        return MapStyle.RasterEsriImagery;
    }
    return `Vector${dataProvider}${mapStyleType}`;
};
exports.getGeoMapStyle = getGeoMapStyle;
const getMapStyleComponents = (mapStyle) => {
    switch (mapStyle) {
        case MapStyle.VectorEsriDarkGrayCanvas:
            return { dataProvider: resourceParams_1.DataProvider.Esri, mapStyleType: EsriMapStyleType.DarkGrayCanvas };
        case MapStyle.VectorEsriLightGrayCanvas:
            return { dataProvider: resourceParams_1.DataProvider.Esri, mapStyleType: EsriMapStyleType.LightGrayCanvas };
        case MapStyle.VectorEsriNavigation:
            return { dataProvider: resourceParams_1.DataProvider.Esri, mapStyleType: EsriMapStyleType.Navigation };
        case MapStyle.VectorEsriStreets:
            return { dataProvider: resourceParams_1.DataProvider.Esri, mapStyleType: EsriMapStyleType.Streets };
        case MapStyle.VectorEsriTopographic:
            return { dataProvider: resourceParams_1.DataProvider.Esri, mapStyleType: EsriMapStyleType.Topographic };
        case MapStyle.RasterEsriImagery:
            return { dataProvider: resourceParams_1.DataProvider.Esri, mapStyleType: EsriMapStyleType.Imagery };
        case MapStyle.VectorHereBerlin:
            return { dataProvider: resourceParams_1.DataProvider.Here, mapStyleType: HereMapStyleType.Berlin };
        case MapStyle.VectorHereExplore:
            return { dataProvider: resourceParams_1.DataProvider.Here, mapStyleType: HereMapStyleType.Explore };
        case MapStyle.VectorHereExploreTruck:
            return { dataProvider: resourceParams_1.DataProvider.Here, mapStyleType: HereMapStyleType.ExploreTruck };
        case MapStyle.RasterHereExploreSatellite:
            return { dataProvider: resourceParams_1.DataProvider.Here, mapStyleType: HereMapStyleType.RasterSatellite };
        case MapStyle.HybridHereExploreSatellite:
            return { dataProvider: resourceParams_1.DataProvider.Here, mapStyleType: HereMapStyleType.HybridSatellite };
        case MapStyle.VectorOpenDataStandardLight:
            return { dataProvider: resourceParams_1.DataProvider.OpenData, mapStyleType: OpenDataMapStyleType.StandardLight };
        default:
            throw new Error(`Invalid map style ${mapStyle}`);
    }
};
exports.getMapStyleComponents = getMapStyleComponents;
//# sourceMappingURL=mapParams.js.map