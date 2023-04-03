"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertExternalLayersToProjectLayers = exports.convertProjectLayersToExternalLayers = void 0;
const layerArnConverter_1 = require("./layerArnConverter");
const externalLayer = 'ExternalLayer';
const projectLayer = 'ProjectLayer';
const LAYER_ARN_KEY = 'Fn::Sub';
const convertProjectLayersToExternalLayers = (lambdaLayers, envName) => {
    const modifiedLambdaLayers = [];
    lambdaLayers.forEach((layer) => {
        if (layer.type === projectLayer) {
            if (layer.env !== envName && !layer.isLatestVersionSelected) {
                const convertLayer = {
                    type: externalLayer,
                    arn: (0, layerArnConverter_1.convertProjectLayer)(layer, layer.env),
                };
                modifiedLambdaLayers.push(convertLayer);
            }
            else {
                const typedProjectLayer = layer;
                const convertLayer = {
                    type: projectLayer,
                    resourceName: typedProjectLayer.resourceName,
                    version: typedProjectLayer.version,
                    isLatestVersionSelected: true,
                    env: envName,
                };
                modifiedLambdaLayers.push(convertLayer);
            }
        }
    });
    return modifiedLambdaLayers;
};
exports.convertProjectLayersToExternalLayers = convertProjectLayersToExternalLayers;
const convertExternalLayersToProjectLayers = (lambdaLayers, envName) => {
    const modifiedLambdaLayers = [];
    lambdaLayers.forEach((layer) => {
        if (layer.type === externalLayer && Object.prototype.hasOwnProperty.call(layer.arn, LAYER_ARN_KEY)) {
            const layerArn = layer.arn[LAYER_ARN_KEY];
            const layerArnSplit = layerArn.split(':');
            const layerNameWithEnv = layerArnSplit[layerArnSplit.length - 2];
            const layerVersion = parseInt(layerArnSplit[layerArnSplit.length - 1], 10);
            const [layerName, layerEnv] = layerNameWithEnv.split('-');
            if (envName !== layerEnv) {
                modifiedLambdaLayers.push(layer);
            }
            else {
                modifiedLambdaLayers.push({
                    type: projectLayer,
                    resourceName: layerName,
                    version: layerVersion,
                    isLatestVersionSelected: false,
                    env: layerEnv,
                });
            }
        }
    });
    return modifiedLambdaLayers;
};
exports.convertExternalLayersToProjectLayers = convertExternalLayersToProjectLayers;
//# sourceMappingURL=convertLayersTypes.js.map