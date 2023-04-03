"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateGeoJSONObj = void 0;
const ajv_1 = __importDefault(require("ajv"));
const GeoJSONSchema_json_1 = __importDefault(require("./schema/GeoJSONSchema.json"));
const uuid_1 = require("uuid");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const importParams_1 = require("./importParams");
const MAX_VERTICES_NUM_PER_POLYGON = 1000;
const validateGeoJSONObj = (data, uniqueIdentifier = 'id', identifierOption = importParams_1.IdentifierOption.RootLevelID) => {
    const ajv = new ajv_1.default();
    const validator = ajv.compile(GeoJSONSchema_json_1.default);
    if (!validator(data)) {
        throw new Error(`The input GeoJSON file failed JSON schema validation. Underlying errors were ${JSON.stringify(validator.errors, undefined, 2)}`);
    }
    const { features } = data;
    const identifierSet = new Set();
    const duplicateValuesSet = new Set();
    features.forEach((feature) => {
        let identifierFieldValue;
        if (identifierOption === importParams_1.IdentifierOption.RootLevelID) {
            if (!feature.id) {
                feature.id = (0, uuid_1.v4)();
                amplify_prompts_1.printer.info(`No root level id found. Auto assigning feature with id ${feature.id}.`);
            }
            identifierFieldValue = feature.id;
        }
        else {
            identifierFieldValue = feature.properties[uniqueIdentifier];
            if (!identifierFieldValue) {
                throw new Error(`Identifier field ${uniqueIdentifier} is missing in the feature property`);
            }
        }
        if (identifierSet.has(identifierFieldValue)) {
            duplicateValuesSet.add(identifierFieldValue);
        }
        identifierSet.add(identifierFieldValue);
        const { coordinates } = feature.geometry;
        let vertexCount = 0;
        coordinates.forEach((linearRing, index) => {
            validateLinearRing(linearRing, index === 0, identifierFieldValue);
            vertexCount += linearRing.length;
        });
        if (vertexCount > MAX_VERTICES_NUM_PER_POLYGON) {
            throw new Error(`Polygon should have at most ${MAX_VERTICES_NUM_PER_POLYGON} vertices.`);
        }
    });
    if (duplicateValuesSet.size > 0) {
        throw new Error(`Identifier field "${uniqueIdentifier}" is not unique in GeoJSON. The following duplicate values are founded: [${Array.from(duplicateValuesSet)
            .map((v) => `"${v}"`)
            .join(', ')}]`);
    }
    return data;
};
exports.validateGeoJSONObj = validateGeoJSONObj;
const validateLinearRing = (linearRing, isFirstRing, featureIdentity) => {
    const numPoint = linearRing.length;
    if (!(linearRing[0][0] === linearRing[numPoint - 1][0] && linearRing[0][1] === linearRing[numPoint - 1][1])) {
        throw new Error(`Linear ring of feature "${featureIdentity}" should have identical values for the first and last position.`);
    }
    const isClockWise = isClockWiseLinearRing(linearRing);
    if (isFirstRing) {
        if (isClockWise) {
            throw new Error('The first linear ring is an exterior ring and should be counter-clockwise.');
        }
    }
    else if (!isClockWise) {
        throw new Error('The interior ring should be clockwise.');
    }
};
const isClockWiseLinearRing = (linearRing) => {
    let result = 0;
    for (let i = 1; i < linearRing.length; i++) {
        result += (linearRing[i][0] - linearRing[i - 1][0]) * (linearRing[i][1] + linearRing[i - 1][1]);
    }
    return result > 0;
};
//# sourceMappingURL=validateGeoJSONObj.js.map