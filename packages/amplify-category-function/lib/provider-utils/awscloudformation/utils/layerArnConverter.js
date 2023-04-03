"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertProjectLayer = exports.convertLambdaLayerMetaToLayerCFNArray = void 0;
const layerHelpers_1 = require("./layerHelpers");
const convertLambdaLayerMetaToLayerCFNArray = (input, env) => {
    return input.map((layer) => {
        if (layer.type === 'ProjectLayer') {
            if ((0, layerHelpers_1.isMultiEnvLayer)(layer.resourceName)) {
                return (0, exports.convertProjectLayer)(layer, env);
            }
            return (0, exports.convertProjectLayer)(layer);
        }
        return layer.arn;
    });
};
exports.convertLambdaLayerMetaToLayerCFNArray = convertLambdaLayerMetaToLayerCFNArray;
const convertProjectLayer = (layer, env) => {
    if (!layer.isLatestVersionSelected) {
        if (env) {
            return {
                'Fn::Sub': `arn:aws:lambda:\${AWS::Region}:\${AWS::AccountId}:layer:${layer.resourceName}-${env}:${layer.version}`,
            };
        }
        return {
            'Fn::Sub': `arn:aws:lambda:\${AWS::Region}:\${AWS::AccountId}:layer:${layer.resourceName}:${layer.version}`,
        };
    }
    return {
        Ref: `function${layer.resourceName}Arn`,
    };
};
exports.convertProjectLayer = convertProjectLayer;
//# sourceMappingURL=layerArnConverter.js.map